import './styles/main.scss';
import { GameController } from './game/GameController';
import { AssetLoader } from './utils/AssetLoader';
import { HandComponent } from './ui/HandComponent';
import { ControlPanel, ControlAction } from './ui/ControlPanel';
import { ScoreDisplay } from './ui/ScoreDisplay';
import { GameStatus } from './ui/GameStatus';
import { BettingInterface } from './ui/BettingInterface';
import { GamePhase } from './types/GameState';

class BlackjackApp {
  private gameController: GameController;
  private assetLoader: AssetLoader;
  private appContainer: HTMLDivElement;
  private dealerHandComponent: HandComponent;
  private playerHandComponent: HandComponent;
  private playerSplitHandComponent?: HandComponent;
  private controlPanel: ControlPanel;
  private scoreDisplay: ScoreDisplay;
  private gameStatus: GameStatus;
  private bettingInterface: BettingInterface;
  private loadingOverlay: HTMLDivElement;

  constructor() {
    this.assetLoader = new AssetLoader();
    this.gameController = new GameController(1000);
    this.appContainer = document.getElementById('app') as HTMLDivElement;
    
    this.createLoadingOverlay();
    this.initializeUI();
    this.setupEventListeners();
    this.loadAssets();
  }

  private createLoadingOverlay(): void {
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = 'loading-overlay';
    this.loadingOverlay.innerHTML = `
      <div class="loading-spinner"></div>
      <p>Loading game assets...</p>
    `;
    this.appContainer.appendChild(this.loadingOverlay);
  }

  private initializeUI(): void {
    // Create game container
    const gameContainer = document.createElement('div');
    gameContainer.className = 'game-container';

    // Create dealer hand
    this.dealerHandComponent = new HandComponent(true);
    gameContainer.appendChild(this.dealerHandComponent.getElement());

    // Create game status
    this.gameStatus = new GameStatus();
    gameContainer.appendChild(this.gameStatus.getElement());

    // Create player hand
    this.playerHandComponent = new HandComponent(false);
    gameContainer.appendChild(this.playerHandComponent.getElement());

    // Create control panel
    this.controlPanel = new ControlPanel((action) => this.handleAction(action));
    gameContainer.appendChild(this.controlPanel.getElement());

    // Create score display
    this.scoreDisplay = new ScoreDisplay();
    gameContainer.appendChild(this.scoreDisplay.getElement());

    // Create betting interface
    this.bettingInterface = new BettingInterface(
      (amount) => this.handleSetStartingBalance(amount),
      (amount) => this.handleSetBet(amount),
      () => {}
    );
    gameContainer.appendChild(this.bettingInterface.getElement());

    this.appContainer.appendChild(gameContainer);
  }

  private setupEventListeners(): void {
    // Listen for window resize to handle iframe sizing
    window.addEventListener('resize', () => {
      this.updateLayout();
    });

    // Listen for postMessage from parent window (if in iframe)
    window.addEventListener('message', (event) => {
      // Handle messages from parent window if needed
      if (event.data && event.data.type === 'reset') {
        this.gameController.resetGame();
        this.updateUI();
      }
    });
  }

  private async loadAssets(): Promise<void> {
    try {
      // Preload critical assets first
      await this.assetLoader.preloadCritical();
      
      // Then preload all cards
      await this.assetLoader.preloadAllCards();
      
      // Hide loading overlay
      this.loadingOverlay.style.display = 'none';
      
      // Initialize UI with current state
      this.updateUI();
    } catch (error) {
      console.error('Error loading assets:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.loadingOverlay.innerHTML = `
        <p style="color: #dc3545; font-weight: bold;">Error loading game assets</p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">${errorMessage}</p>
        <p style="font-size: 0.8rem; margin-top: 0.5rem; color: #ccc;">Check the browser console for details.</p>
        <p style="font-size: 0.8rem; margin-top: 0.5rem;">Make sure the 'cards' and 'table' folders are in the 'public' directory.</p>
      `;
    }
  }

  private handleSetStartingBalance(amount: number): void {
    this.gameController.setStartingBalance(amount);
    this.updateUI();
  }

  private handleSetBet(amount: number): void {
    this.gameController.setBet(amount);
    this.updateUI();
  }

  private handleAction(action: ControlAction): void {
    const state = this.gameController.getState();

    switch (action) {
      case 'hit':
        this.gameController.hit();
        break;
      case 'stand':
        this.gameController.stand();
        break;
      case 'double':
        this.gameController.doubleDown();
        break;
      case 'split':
        this.gameController.split();
        break;
      case 'insurance':
        this.gameController.takeInsurance();
        break;
      case 'surrender':
        this.gameController.surrender();
        break;
      case 'betAndDealAgain':
        const betAmount = state.currentBet || 25;
        this.gameController.betAndDealAgain(betAmount);
        break;
    }

    this.updateUI();
  }

  private updateUI(): void {
    const state = this.gameController.getState();

    // Update game status message
    this.gameStatus.setMessage(
      state.message,
      this.getMessageType(state.phase)
    );

    // Update hands
    const showDealerCard = state.phase !== GamePhase.DEALING && 
                          state.phase !== GamePhase.PLAYER_TURN &&
                          state.phase !== GamePhase.BETTING;
    
    this.dealerHandComponent.updateHand(state.dealerHand, showDealerCard);
    this.playerHandComponent.updateHand(state.playerHand, true);

    // Update split hand if exists
    if (state.playerSplitHand) {
      if (!this.playerSplitHandComponent) {
        this.playerSplitHandComponent = new HandComponent(false);
        const playerHandElement = this.playerHandComponent.getElement();
        playerHandElement.parentNode?.insertBefore(
          this.playerSplitHandComponent.getElement(),
          playerHandElement.nextSibling
        );
      }
      this.playerSplitHandComponent.updateHand(state.playerSplitHand, true);
    } else if (this.playerSplitHandComponent) {
      this.playerSplitHandComponent.getElement().remove();
      this.playerSplitHandComponent = undefined;
    }

    // Update control panel
    this.controlPanel.updateState(
      state.phase,
      state.playerHand,
      state.dealerHand,
      state.insuranceOffered,
      state.insuranceTaken,
      state.playerBalance,
      state.currentBet
    );

    // Update score display
    this.scoreDisplay.update(state);

    // Update betting interface
    this.bettingInterface.updateBalance(state.playerBalance);
    this.bettingInterface.show(
      state.phase === GamePhase.IDLE || 
      state.phase === GamePhase.BETTING ||
      state.phase === GamePhase.GAME_OVER
    );

    // Reveal dealer card when transitioning to dealer turn
    if (state.phase === GamePhase.DEALER_TURN) {
      setTimeout(() => {
        this.dealerHandComponent.revealHiddenCard();
      }, 500);
    }
  }

  private getMessageType(phase: GamePhase): 'info' | 'success' | 'error' | 'warning' {
    switch (phase) {
      case GamePhase.RESULT:
        const state = this.gameController.getState();
        if (state.message.includes('win') || state.message.includes('Blackjack')) {
          return 'success';
        } else if (state.message.includes('lose') || state.message.includes('Bust')) {
          return 'error';
        }
        return 'info';
      case GamePhase.GAME_OVER:
        return 'error';
      default:
        return 'info';
    }
  }

  private updateLayout(): void {
    // Handle responsive layout updates if needed
    const isMobile = window.innerWidth <= 479;
    const isTablet = window.innerWidth >= 480 && window.innerWidth <= 767;
    
    // Add mobile/tablet classes if needed
    document.body.classList.toggle('mobile', isMobile);
    document.body.classList.toggle('tablet', isTablet);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new BlackjackApp();
  });
} else {
  new BlackjackApp();
}

