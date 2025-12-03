import './styles/main.scss';
import { GameController } from './game/GameController';
import { AssetLoader } from './utils/AssetLoader';
import { HandComponent } from './ui/HandComponent';
import { ControlPanel, ControlAction } from './ui/ControlPanel';
import { ScoreDisplay } from './ui/ScoreDisplay';
import { GameStatus } from './ui/GameStatus';
import { BettingInterface } from './ui/BettingInterface';
import { ChipBettingComponent } from './ui/ChipBettingComponent';
import { GamePhase } from './types/GameState';

class BlackjackApp {
  private gameController: GameController;
  private assetLoader: AssetLoader;
  private appContainer: HTMLDivElement;
  private dealerHandComponent!: HandComponent;
  private playerHandComponent!: HandComponent;
  private playerSplitHandComponent?: HandComponent;
  private controlPanel!: ControlPanel;
  private scoreDisplay!: ScoreDisplay;
  private gameStatus!: GameStatus;
  private bettingInterface!: BettingInterface;
  private chipBettingComponent!: ChipBettingComponent;
  private loadingOverlay!: HTMLDivElement;

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
      (minLimit) => this.handleSetTableLimits(minLimit)
    );
    gameContainer.appendChild(this.bettingInterface.getElement());

    // Create chip betting component
    this.chipBettingComponent = new ChipBettingComponent(
      (betAmount) => this.handleSetBet(betAmount)
    );
    // Position it below player hand
    const playerHandElement = this.playerHandComponent.getElement();
    playerHandElement.parentNode?.insertBefore(
      this.chipBettingComponent.getElement(),
      playerHandElement.nextSibling
    );

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

  private handleSetTableLimits(minLimit: number): void {
    this.gameController.setTableLimits(minLimit);
    this.updateUI();
  }

  private handleSetBet(amount: number): void {
    this.gameController.setBet(amount, () => {
      // This callback is called after each card is dealt
      this.updateUI();
    });
    // Reset chip betting component bet after placing bet
    this.chipBettingComponent.updateCurrentBet(0);
    // Initial UI update (before any cards are dealt)
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
      case 'acceptInsurance':
        this.gameController.takeInsurance();
        break;
      case 'declineInsurance':
        this.gameController.declineInsurance();
        break;
      case 'surrender':
        this.gameController.surrender();
        break;
      case 'betAgain':
        // Clear animations and dealt cards before starting new hand
        this.dealerHandComponent.clearAnimations();
        this.dealerHandComponent.clearDealtCards();
        this.playerHandComponent.clearAnimations();
        this.playerHandComponent.clearDealtCards();
        if (this.playerSplitHandComponent) {
          this.playerSplitHandComponent.clearAnimations();
          this.playerSplitHandComponent.clearDealtCards();
        }
        this.gameController.betAgain();
        break;
      case 'betAndDealAgain':
        // Clear animations and dealt cards before starting new hand
        this.dealerHandComponent.clearAnimations();
        this.dealerHandComponent.clearDealtCards();
        this.playerHandComponent.clearAnimations();
        this.playerHandComponent.clearDealtCards();
        if (this.playerSplitHandComponent) {
          this.playerSplitHandComponent.clearAnimations();
          this.playerSplitHandComponent.clearDealtCards();
        }
        const betAmount = state.currentBet || 25;
        this.gameController.betAndDealAgain(betAmount, () => {
          // This callback is called after each card is dealt
          this.updateUI();
        });
        // Initial UI update
        this.updateUI();
        break;
    }

    // Note: We don't call updateUI() here anymore for betAndDealAgain
    // because it's handled by the callback
    if (action !== 'betAndDealAgain') {
      this.updateUI();
    }
  }

  private updateUI(): void {
    const state = this.gameController.getState();

    // Update game status message
    this.gameStatus.setMessage(
      state.message,
      this.getMessageType(state.phase)
    );

    // Phase-based element visibility
    if (state.phase === GamePhase.IDLE) {
      // Hide game elements in IDLE phase
      this.dealerHandComponent.getElement().style.display = 'none';
      this.playerHandComponent.getElement().style.display = 'none';
      this.controlPanel.getElement().style.display = 'none';
      this.scoreDisplay.getElement().style.display = 'none';
      this.chipBettingComponent.show(false);
      this.bettingInterface.show(true);
    } else if (state.phase === GamePhase.BETTING) {
      // Show game elements, hide betting interface, show chip betting
      this.dealerHandComponent.getElement().style.display = 'block';
      this.playerHandComponent.getElement().style.display = 'block';
      this.controlPanel.getElement().style.display = 'block';
      this.scoreDisplay.getElement().style.display = 'block';
      this.bettingInterface.show(false);
      this.chipBettingComponent.show(true);
      
      // Update chip betting component
      this.chipBettingComponent.updateBalance(state.playerBalance);
      this.chipBettingComponent.updateTableLimits(state.minTableLimit, state.maxTableLimit);
      this.chipBettingComponent.updateCurrentBet(state.currentBet);
    } else {
      // Show all game elements, hide betting interfaces
      this.dealerHandComponent.getElement().style.display = 'block';
      this.playerHandComponent.getElement().style.display = 'block';
      this.controlPanel.getElement().style.display = 'block';
      this.scoreDisplay.getElement().style.display = 'block';
      this.bettingInterface.show(false);
      this.chipBettingComponent.show(false);
    }

    // Update hands
    // Show dealer cards only in DEALER_TURN, RESULT, or GAME_OVER phases
    // During DEALING phase, show dealer's first card but keep second card face down
    const showDealerCard = state.phase === GamePhase.DEALER_TURN ||
                           state.phase === GamePhase.RESULT ||
                           state.phase === GamePhase.GAME_OVER;
    
    // During dealing phase, show cards as they're dealt (dealer's second card stays face down)
    if (state.phase === GamePhase.DEALING) {
      // Cards are added one at a time, so update with current state
      // Dealer's second card should be face down during dealing
      this.playerHandComponent.updateHand(state.playerHand, true, 0, false);
      this.dealerHandComponent.updateHand(state.dealerHand, false, 0, false); // Don't show hidden card during dealing
    } else {
      this.playerHandComponent.updateHand(state.playerHand, true, 0, false);
      this.dealerHandComponent.updateHand(state.dealerHand, showDealerCard, 0, false);
    }

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
      this.playerSplitHandComponent.updateHand(state.playerSplitHand, true, 0, false);
      
      // Highlight active hand
      if (state.activeHand === 'split') {
        this.playerSplitHandComponent.getElement().classList.add('active-hand');
        this.playerHandComponent.getElement().classList.remove('active-hand');
      } else {
        this.playerHandComponent.getElement().classList.add('active-hand');
        this.playerSplitHandComponent.getElement().classList.remove('active-hand');
      }
    } else {
      if (this.playerSplitHandComponent) {
        this.playerSplitHandComponent.getElement().remove();
        this.playerSplitHandComponent = undefined;
      }
      this.playerHandComponent.getElement().classList.remove('active-hand');
    }

    // Update control panel
    this.controlPanel.updateState(
      state.phase,
      state.playerHand,
      state.dealerHand,
      state.insuranceOffered,
      state.insuranceTaken,
      state.playerBalance,
      state.currentBet,
      state.activeHand,
      state.playerSplitHand
    );

    // Update score display
    this.scoreDisplay.update(state);

    // Update betting interface balance (for display)
    this.bettingInterface.updateBalance(state.playerBalance);

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

