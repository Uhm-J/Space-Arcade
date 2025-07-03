export interface GameMessage {
  type: 'JOIN' | 'INPUT' | 'STATE' | 'ROLE_SELECT' | 'LOBBY_UPDATE'
  [key: string]: any
}

export interface LobbyInfo {
  code: string
  players: Player[]
  maxPlayers: number
  status: 'waiting' | 'playing' | 'full'
}

export interface Player {
  id: number
  name: string
  role: 'shooter' | 'hauler' | null
  connected: boolean
}

export class NetworkManager {
  private ws: WebSocket | null = null
  private reconnectInterval: number = 5000
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  
  public currentLobby: LobbyInfo | null = null
  public playerId: number | null = null
  public playerRole: 'shooter' | 'hauler' | null = null
  public isConnected: boolean = false
  
  // Event handlers
  private onStateUpdate: ((entities: any[]) => void) | null = null
  private onLobbyUpdate: ((lobby: LobbyInfo) => void) | null = null
  private onPlayerJoin: ((player: Player) => void) | null = null
  private onPlayerLeave: ((playerId: number) => void) | null = null
  private onError: ((error: string) => void) | null = null

  constructor(serverUrl: string = 'ws://localhost:8080/ws') {
    this.connect(serverUrl)
  }

  private connect(url: string) {
    try {
      this.ws = new WebSocket(url)
      
      this.ws.onopen = () => {
        console.log('🚀 Connected to Space Arcade server')
        this.isConnected = true
        this.reconnectAttempts = 0
      }
      
      this.ws.onmessage = (event) => {
        try {
          const message: GameMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Failed to parse message:', error)
        }
      }
      
      this.ws.onclose = () => {
        console.log('🔌 Disconnected from server')
        this.isConnected = false
        this.attemptReconnect(url)
      }
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.onError?.('Connection failed. Please check if the server is running.')
      }
    } catch (error) {
      console.error('Failed to connect:', error)
      this.onError?.('Could not connect to server')
    }
  }

  private attemptReconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      setTimeout(() => this.connect(url), this.reconnectInterval)
    } else {
      this.onError?.('Failed to reconnect. Please refresh the page.')
    }
  }

  private handleMessage(message: GameMessage) {
    switch (message.type) {
      case 'STATE':
        this.onStateUpdate?.(message.entities || [])
        break
        
      case 'LOBBY_UPDATE':
        this.currentLobby = message.lobby
        this.onLobbyUpdate?.(message.lobby)
        break
        
      default:
        console.log('📨 Received message:', message)
    }
  }

  // Join or create a lobby with a room code
  joinLobby(roomCode: string, playerName: string): boolean {
    if (!this.isConnected || !this.ws) {
      this.onError?.('Not connected to server')
      return false
    }

    const message: GameMessage = {
      type: 'JOIN',
      lobby: roomCode,
      playerName: playerName
    }

    this.ws.send(JSON.stringify(message))
    return true
  }

  // Select player role (shooter or hauler)
  selectRole(role: 'shooter' | 'hauler'): boolean {
    if (!this.isConnected || !this.ws) {
      this.onError?.('Not connected to server')
      return false
    }

    const message: GameMessage = {
      type: 'ROLE_SELECT',
      role: role
    }

    this.ws.send(JSON.stringify(message))
    this.playerRole = role
    return true
  }

  // Send input to server
  sendInput(inputData: {
    throttle: number
    pitch: number
    yaw: number
    fire: boolean
    tractor?: boolean // For hauler ships
  }) {
    if (!this.isConnected || !this.ws) return

    const message: GameMessage = {
      type: 'INPUT',
      seq: Date.now(),
      ...inputData
    }

    this.ws.send(JSON.stringify(message))
  }

  // Generate a random room code
  static generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Event handler setters
  setOnStateUpdate(handler: (entities: any[]) => void) {
    this.onStateUpdate = handler
  }

  setOnLobbyUpdate(handler: (lobby: LobbyInfo) => void) {
    this.onLobbyUpdate = handler
  }

  setOnPlayerJoin(handler: (player: Player) => void) {
    this.onPlayerJoin = handler
  }

  setOnPlayerLeave(handler: (playerId: number) => void) {
    this.onPlayerLeave = handler
  }

  setOnError(handler: (error: string) => void) {
    this.onError = handler
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
  }
}