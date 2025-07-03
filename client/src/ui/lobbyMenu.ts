import { NetworkManager, LobbyInfo } from '../network/connection'

export class LobbyMenu {
  private container: HTMLElement
  private networkManager: NetworkManager
  private playerName: string = ''
  private onGameStart: (() => void) | null = null

  constructor(networkManager: NetworkManager) {
    this.networkManager = networkManager
    this.container = this.createMenuDOM()
    this.setupEventHandlers()
    document.body.appendChild(this.container)
  }

  private createMenuDOM(): HTMLElement {
    const container = document.createElement('div')
    container.id = 'lobby-menu'
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #0c0c1e 0%, #1a1a2e 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      font-family: 'Arial', sans-serif;
      color: white;
    `

    container.innerHTML = `
      <div style="
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 40px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
      ">
        <h1 style="
          text-align: center;
          margin: 0 0 30px 0;
          font-size: 2.5em;
          background: linear-gradient(45deg, #4CAF50, #2196F3);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        ">🚀 Space Arcade</h1>
        
        <div id="connection-status" style="
          text-align: center;
          margin-bottom: 20px;
          padding: 10px;
          border-radius: 8px;
          background: rgba(76, 175, 80, 0.2);
          border: 1px solid #4CAF50;
        ">
          ✅ Connected to server
        </div>

        <div id="player-setup" style="margin-bottom: 30px;">
          <label style="display: block; margin-bottom: 10px; font-weight: bold;">
            👤 Your Name:
          </label>
          <input 
            type="text" 
            id="player-name" 
            placeholder="Enter your name"
            maxlength="16"
            style="
              width: 100%;
              padding: 12px;
              border: none;
              border-radius: 8px;
              background: rgba(255, 255, 255, 0.1);
              color: white;
              font-size: 16px;
              box-sizing: border-box;
            "
          >
        </div>

        <div id="lobby-section">
          <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <button id="create-lobby" style="
              flex: 1;
              padding: 12px;
              background: linear-gradient(45deg, #4CAF50, #45a049);
              border: none;
              border-radius: 8px;
              color: white;
              font-weight: bold;
              cursor: pointer;
              transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              🎯 Create Room
            </button>
            <button id="join-lobby" style="
              flex: 1;
              padding: 12px;
              background: linear-gradient(45deg, #2196F3, #1976D2);
              border: none;
              border-radius: 8px;
              color: white;
              font-weight: bold;
              cursor: pointer;
              transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              🚪 Join Room
            </button>
          </div>

          <div id="room-code-section" style="display: none; margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px; font-weight: bold;">
              🔑 Room Code:
            </label>
            <input 
              type="text" 
              id="room-code" 
              placeholder="Enter 6-character room code"
              maxlength="6"
              style="
                width: 100%;
                padding: 12px;
                border: none;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 18px;
                text-align: center;
                letter-spacing: 4px;
                text-transform: uppercase;
                box-sizing: border-box;
              "
            >
            <button id="confirm-join" style="
              width: 100%;
              margin-top: 10px;
              padding: 12px;
              background: linear-gradient(45deg, #FF9800, #F57C00);
              border: none;
              border-radius: 8px;
              color: white;
              font-weight: bold;
              cursor: pointer;
            ">
              Connect to Room
            </button>
          </div>
        </div>

        <div id="lobby-info" style="display: none;">
          <div style="
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
          ">
            <h3 style="margin: 0 0 15px 0; text-align: center;">Room: <span id="current-room-code"></span></h3>
            <div id="players-list"></div>
          </div>

          <div id="role-selection" style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 15px 0; text-align: center;">Choose Your Ship:</h4>
            <div style="display: flex; gap: 15px;">
              <button id="select-shooter" style="
                flex: 1;
                padding: 15px;
                background: linear-gradient(45deg, #FF5722, #D84315);
                border: none;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                cursor: pointer;
                text-align: center;
              ">
                🎯 SHOOTER<br>
                <small>Fast & Agile<br>Breaks asteroids</small>
              </button>
              <button id="select-hauler" style="
                flex: 1;
                padding: 15px;
                background: linear-gradient(45deg, #9C27B0, #7B1FA2);
                border: none;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                cursor: pointer;
                text-align: center;
              ">
                🚛 HAULER<br>
                <small>Strong & Steady<br>Collects ore</small>
              </button>
            </div>
          </div>

          <button id="start-game" style="
            width: 100%;
            padding: 15px;
            background: linear-gradient(45deg, #4CAF50, #45a049);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            display: none;
          ">
            🚀 START GAME
          </button>
        </div>

        <div id="error-message" style="
          display: none;
          background: rgba(244, 67, 54, 0.2);
          border: 1px solid #f44336;
          color: #ffcdd2;
          padding: 12px;
          border-radius: 8px;
          margin-top: 15px;
          text-align: center;
        "></div>
      </div>
    `

    return container
  }

  private setupEventHandlers() {
    // Player name input
    const nameInput = this.container.querySelector('#player-name') as HTMLInputElement
    nameInput.addEventListener('input', (e) => {
      this.playerName = (e.target as HTMLInputElement).value.trim()
    })

    // Create lobby button
    this.container.querySelector('#create-lobby')?.addEventListener('click', () => {
      if (!this.validatePlayerName()) return
      const roomCode = NetworkManager.generateRoomCode()
      this.joinRoom(roomCode)
    })

    // Join lobby button
    this.container.querySelector('#join-lobby')?.addEventListener('click', () => {
      if (!this.validatePlayerName()) return
      const roomCodeSection = this.container.querySelector('#room-code-section') as HTMLElement
      roomCodeSection.style.display = 'block'
    })

    // Confirm join button
    this.container.querySelector('#confirm-join')?.addEventListener('click', () => {
      const roomCodeInput = this.container.querySelector('#room-code') as HTMLInputElement
      const roomCode = roomCodeInput.value.trim().toUpperCase()
      if (roomCode.length === 6) {
        this.joinRoom(roomCode)
      } else {
        this.showError('Please enter a valid 6-character room code')
      }
    })

    // Role selection
    this.container.querySelector('#select-shooter')?.addEventListener('click', () => {
      this.selectRole('shooter')
    })

    this.container.querySelector('#select-hauler')?.addEventListener('click', () => {
      this.selectRole('hauler')
    })

    // Start game button
    this.container.querySelector('#start-game')?.addEventListener('click', () => {
      this.startGame()
    })

    // Room code input formatting
    const roomCodeInput = this.container.querySelector('#room-code') as HTMLInputElement
    roomCodeInput.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement
      input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    })

    // Network event handlers
    this.networkManager.setOnLobbyUpdate((lobby) => this.updateLobbyInfo(lobby))
    this.networkManager.setOnError((error) => this.showError(error))
  }

  private validatePlayerName(): boolean {
    if (this.playerName.length < 2) {
      this.showError('Please enter a name (at least 2 characters)')
      return false
    }
    return true
  }

  private joinRoom(roomCode: string) {
    if (this.networkManager.joinLobby(roomCode, this.playerName)) {
      this.showLobbyInfo(roomCode)
    }
  }

  private showLobbyInfo(roomCode: string) {
    const lobbySection = this.container.querySelector('#lobby-section') as HTMLElement
    const lobbyInfo = this.container.querySelector('#lobby-info') as HTMLElement
    const roomCodeDisplay = this.container.querySelector('#current-room-code') as HTMLElement
    
    lobbySection.style.display = 'none'
    lobbyInfo.style.display = 'block'
    roomCodeDisplay.textContent = roomCode
  }

  private selectRole(role: 'shooter' | 'hauler') {
    if (this.networkManager.selectRole(role)) {
      const shooterBtn = this.container.querySelector('#select-shooter') as HTMLElement
      const haulerBtn = this.container.querySelector('#select-hauler') as HTMLElement
      
      // Update button styles
      shooterBtn.style.opacity = role === 'shooter' ? '1' : '0.5'
      haulerBtn.style.opacity = role === 'hauler' ? '1' : '0.5'
      
      // Show start button if both roles are filled
      this.checkGameReady()
    }
  }

  private updateLobbyInfo(lobby: LobbyInfo) {
    const playersList = this.container.querySelector('#players-list') as HTMLElement
    playersList.innerHTML = lobby.players.map(player => 
      `<div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        margin: 5px 0;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
      ">
        <span>${player.name}</span>
        <span style="
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          background: ${player.role === 'shooter' ? '#FF5722' : player.role === 'hauler' ? '#9C27B0' : '#666'};
        ">
          ${player.role ? player.role.toUpperCase() : 'NO ROLE'}
        </span>
      </div>`
    ).join('')
    
    this.checkGameReady()
  }

  private checkGameReady() {
    const startButton = this.container.querySelector('#start-game') as HTMLElement
    const lobby = this.networkManager.currentLobby
    
    if (lobby && lobby.players.length === 2) {
      const hasShooter = lobby.players.some(p => p.role === 'shooter')
      const hasHauler = lobby.players.some(p => p.role === 'hauler')
      
      if (hasShooter && hasHauler) {
        startButton.style.display = 'block'
      }
    } else {
      startButton.style.display = 'none'
    }
  }

  private startGame() {
    this.hide()
    this.onGameStart?.()
  }

  private showError(message: string) {
    const errorDiv = this.container.querySelector('#error-message') as HTMLElement
    errorDiv.textContent = message
    errorDiv.style.display = 'block'
    setTimeout(() => {
      errorDiv.style.display = 'none'
    }, 5000)
  }

  setOnGameStart(handler: () => void) {
    this.onGameStart = handler
  }

  show() {
    this.container.style.display = 'flex'
  }

  hide() {
    this.container.style.display = 'none'
  }

  destroy() {
    document.body.removeChild(this.container)
  }
}