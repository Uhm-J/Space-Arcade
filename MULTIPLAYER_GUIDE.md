# 🚀 Space Arcade Multiplayer Guide

Welcome to the cooperative multiplayer mode of Space Arcade! This guide explains how to safely connect with friends and work together as Shooter and Hauler teams.

## 🎯 Quick Start

### 1. Start the Game
```bash
# Terminal 1: Start the server
cd server && go run ./cmd/spacehub

# Terminal 2: Start the client  
cd client && npm run dev
```

### 2. Open the Game
- Navigate to `http://localhost:5173`
- You'll see the lobby menu automatically

### 3. Create or Join a Room
**Option A: Create a Room**
1. Enter your name (2+ characters)
2. Click "🎯 Create Room" 
3. Share the 6-character room code with your friend

**Option B: Join a Room**
1. Enter your name
2. Click "🚪 Join Room"
3. Enter the 6-character room code from your friend
4. Click "Connect to Room"

### 4. Choose Your Ship Role
Each player must pick a different role:

**🎯 SHOOTER** - Fast & Agile
- **Role**: Break asteroids into ore chunks
- **Controls**: 
  - `WASD` - Movement
  - `Space` - Up
  - `Ctrl` - Down
  - `Mouse` - Look around
  - `Left Click` - Fire laser
- **Ship**: Red fighter with rapid weapons

**🚛 HAULER** - Strong & Steady  
- **Role**: Collect ore chunks and deliver to station
- **Controls**:
  - `WASD` - Movement  
  - `Space` - Up
  - `Ctrl` - Down
  - `Mouse` - Look around
  - `F` - Tractor beam (hold to collect ore)
- **Ship**: Blue cargo vessel with tractor beam

### 5. Start Playing
- Once both players have selected different roles, the "🚀 START GAME" button appears
- Click to begin your cooperative space adventure!

## 🔧 Game Features

### ✅ Safe Multiplayer
- **Room Codes**: 6-character codes prevent random players from joining
- **Max 2 Players**: Lobbies automatically limit to 2 players
- **Role Validation**: System ensures one Shooter and one Hauler per game
- **Auto-Reconnect**: Clients automatically reconnect if connection drops

### ✅ Cooperative Gameplay
1. **Shooter**: Flies fast, targets asteroids, breaks them into collectible chunks
2. **Hauler**: Follows behind, uses tractor beam to collect chunks, delivers to station
3. **Teamwork**: Both players share the same score and objectives

### ✅ Real-time Sync
- Player positions and actions sync at 15Hz
- Input sent to server at 60Hz for responsive controls
- Client-side prediction for smooth movement

## 🎮 Controls Reference

### Universal Controls
- `W/A/S/D` - Move ship
- `Space` - Thrust up
- `Ctrl` - Thrust down  
- `Mouse` - Look around
- `Esc` - Release mouse cursor

### Shooter-Specific
- `Left Click` - Fire laser to break asteroids

### Hauler-Specific  
- `F` - Activate tractor beam (hold near ore chunks)

## 🛡️ Safety Features

### Room Security
- **Private Rooms**: Only players with the exact room code can join
- **No Public Lobbies**: All games are private by default
- **Automatic Cleanup**: Empty rooms are deleted automatically

### Connection Safety
- **Graceful Disconnects**: Players can leave without crashing the game
- **Error Handling**: Clear error messages for connection issues
- **Timeout Protection**: Inactive connections are cleaned up

### Input Validation
- **Server Authority**: All game logic runs on the server
- **Role Enforcement**: Players can't change roles mid-game
- **Name Validation**: Player names must be 2+ characters

## 🔧 Troubleshooting

### Connection Issues
**"Connection failed"**
- Make sure the server is running (`go run ./cmd/spacehub`)
- Check that port 8080 is not blocked by firewall
- Verify the server shows "🚀 Space Arcade Server starting on port :8080"

**"Lobby is full"**
- Each room supports exactly 2 players
- Create a new room or wait for a spot to open

**"Role already taken"**
- Each game needs exactly one Shooter and one Hauler
- Choose the available role or wait for other player to switch

### Game Issues
**"Can't see other player"**
- This is expected in the current version - multiplayer ship rendering is planned for the next update
- Players share the same game world and can see each other's effects (shot asteroids, collected ore)

**"Ship feels different"**
- Each ship role has different speed, acceleration, and handling
- Shooter: Fast and agile (acceleration: 80, max speed: 25)
- Hauler: Steady and strong (acceleration: 40, max speed: 15)

## 🚀 Technical Details

### Architecture
```
Client (Three.js) ←→ WebSocket ←→ Go Server
     ↓                              ↓
Browser Renderer              Game State Manager
```

### Message Types
- `JOIN` - Join a lobby with room code and player name
- `ROLE_SELECT` - Choose Shooter or Hauler role
- `INPUT` - Send movement and action inputs
- `STATE` - Receive game world updates
- `LOBBY_UPDATE` - Receive lobby status changes

### Performance
- **Client FPS**: 60 FPS rendering
- **Server Tick**: 60 Hz game logic
- **Network Updates**: 15 Hz state broadcasts
- **Input Rate**: 60 Hz input transmission

## 🎯 Game Strategy

### Effective Teamwork
1. **Communication**: Coordinate who targets which asteroids
2. **Positioning**: Hauler should follow Shooter's path
3. **Efficiency**: Shooter breaks, Hauler collects immediately
4. **Station Runs**: Plan regular trips to the central station

### Shooter Tips
- Target large asteroids first - they break into more valuable chunks
- Lead your shots - asteroids may be moving
- Clear paths for the Hauler to follow safely
- Watch your ammo/energy levels

### Hauler Tips  
- Stay close to the Shooter's path
- Use tractor beam efficiently - it has limited range
- Plan cargo runs when hold is nearly full
- Protect the Shooter from stray asteroid collisions

## 🔄 Future Updates

Coming soon:
- Visual representation of other players' ships
- Voice chat integration
- Larger lobby support (4+ players)
- Cross-platform play
- Persistent player statistics
- Custom ship skins and upgrades

---

**Have fun exploring the asteroid belt together! 🌌**

*If you encounter any issues, check the browser console (F12) and server logs for detailed error information.*