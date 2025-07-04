package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/gorilla/websocket"
)

// Message types as defined in README
type MessageType string

const (
	MsgJoin  MessageType = "JOIN"
	MsgInput MessageType = "INPUT"
	MsgState MessageType = "STATE"
)

// Client messages (Client → Server)
type JoinMessage struct {
	Type  MessageType `json:"type"`
	Lobby string      `json:"lobby"`
}

type InputMessage struct {
	Type     MessageType `json:"type"`
	Seq      int         `json:"seq"`
	Throttle float64     `json:"throttle"`
	Pitch    float64     `json:"pitch"`
	Fire     bool        `json:"fire"`
}

// Server messages (Server → Client)
type StateMessage struct {
	Type     MessageType `json:"type"`
	Seq      int         `json:"seq"`
	Entities []Entity    `json:"entities"`
}

type Entity struct {
	ID   int     `json:"id"`
	Type string  `json:"type,omitempty"`
	X    float64 `json:"x"`
	Y    float64 `json:"y"`
	Z    float64 `json:"z"`
	VX   float64 `json:"vx"`
	VY   float64 `json:"vy"`
	VZ   float64 `json:"vz"`
	HP   int     `json:"hp,omitempty"`
}

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

// Client represents a connected player
type Client struct {
	conn   *websocket.Conn
	lobby  string
	send   chan []byte
	hub    *Hub
	id     int
	lastSeq int
}

// Hub maintains active clients and broadcasts messages
type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	lobbies    map[string][]*Client
	nextID     int
	gameState  map[string][]Entity // lobby -> entities
}

func newHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		lobbies:    make(map[string][]*Client),
		gameState:  make(map[string][]Entity),
		nextID:     1,
	}
}

func (h *Hub) run() {
	ticker := time.NewTicker(66 * time.Millisecond) // ~15 Hz state updates
	defer ticker.Stop()

	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			client.id = h.nextID
			h.nextID++
			log.Printf("Client %d registered", client.id)

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				h.removeFromLobby(client)
				log.Printf("Client %d unregistered", client.id)
			}

		case message := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
					h.removeFromLobby(client)
				}
			}

		case <-ticker.C:
			// Send state updates to all lobbies
			h.broadcastGameState()
		}
	}
}

func (h *Hub) addToLobby(client *Client, lobby string) {
	client.lobby = lobby
	h.lobbies[lobby] = append(h.lobbies[lobby], client)
	
	// Initialize lobby state if needed
	if _, exists := h.gameState[lobby]; !exists {
		h.gameState[lobby] = h.createInitialGameState()
	}
	
	log.Printf("Client %d joined lobby %s", client.id, lobby)
}

func (h *Hub) removeFromLobby(client *Client) {
	if client.lobby == "" {
		return
	}
	
	clients := h.lobbies[client.lobby]
	for i, c := range clients {
		if c == client {
			h.lobbies[client.lobby] = append(clients[:i], clients[i+1:]...)
			break
		}
	}
	
	// Clean up empty lobbies
	if len(h.lobbies[client.lobby]) == 0 {
		delete(h.lobbies, client.lobby)
		delete(h.gameState, client.lobby)
	}
}

func (h *Hub) createInitialGameState() []Entity {
	entities := []Entity{}
	
	// Add some asteroids
	for i := 0; i < 20; i++ {
		entities = append(entities, Entity{
			ID:   100 + i,
			Type: "asteroid",
			X:    (float64(i%5) - 2) * 20,
			Y:    0,
			Z:    (float64(i/5) - 2) * 20,
			VX:   0,
			VY:   0,
			VZ:   0,
			HP:   50,
		})
	}
	
	return entities
}

func (h *Hub) broadcastGameState() {
	for lobby, clients := range h.lobbies {
		if len(clients) == 0 {
			continue
		}
		
		state := StateMessage{
			Type:     MsgState,
			Seq:      int(time.Now().Unix()),
			Entities: h.gameState[lobby],
		}
		
		data, err := json.Marshal(state)
		if err != nil {
			log.Printf("Error marshaling state: %v", err)
			continue
		}
		
		// Send to all clients in this lobby
		for _, client := range clients {
			select {
			case client.send <- data:
			default:
				// Client send channel is full, skip
			}
		}
	}
}

// WebSocket handler
func wsHandler(hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Websocket upgrade error:", err)
			return
		}
		
		client := &Client{
			conn: conn,
			send: make(chan []byte, 256),
			hub:  hub,
		}
		
		hub.register <- client
		
		// Start goroutines for reading and writing
		go client.writePump()
		go client.readPump()
	}
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	
	c.conn.SetReadLimit(512)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})
	
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
		
		c.handleMessage(message)
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			
			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}
			
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) handleMessage(data []byte) {
	var baseMsg struct {
		Type MessageType `json:"type"`
	}
	
	if err := json.Unmarshal(data, &baseMsg); err != nil {
		log.Printf("Error parsing message: %v", err)
		return
	}
	
	switch baseMsg.Type {
	case MsgJoin:
		var msg JoinMessage
		if err := json.Unmarshal(data, &msg); err != nil {
			log.Printf("Error parsing JOIN message: %v", err)
			return
		}
		c.hub.addToLobby(c, msg.Lobby)
		
	case MsgInput:
		var msg InputMessage
		if err := json.Unmarshal(data, &msg); err != nil {
			log.Printf("Error parsing INPUT message: %v", err)
			return
		}
		c.lastSeq = msg.Seq
		// TODO: Process input (Milestone 4)
		log.Printf("Client %d input: throttle=%.2f, pitch=%.2f, fire=%v", 
			c.id, msg.Throttle, msg.Pitch, msg.Fire)
	}
}

func main() {
	hub := newHub()
	go hub.run()
	
	r := chi.NewRouter()
	
	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	
	// Routes
	r.Get("/ws", wsHandler(hub))
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("🚀 Space Arcade Server is running"))
	})
	
	port := ":8080"
	fmt.Printf("🚀 Space Arcade Server starting on port %s\n", port)
	fmt.Println("WebSocket endpoint: ws://localhost:8080/ws")
	fmt.Println("Health check: http://localhost:8080/health")
	
	log.Fatal(http.ListenAndServe(port, r))
}