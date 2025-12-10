import { GamePhase } from '../types/GameState';
import { Hand } from '../game/Hand';

export type ControlAction = 'hit' | 'stand' | 'double' | 'split' | 'acceptInsurance' | 'declineInsurance' | 'surrender' | 'betAgain' | 'betAndDealAgain';

export class ControlPanel {
  private container: HTMLDivElement;
  private primaryRow: HTMLDivElement;
  private secondaryRow: HTMLDivElement;
  private buttons: Map<ControlAction, HTMLButtonElement> = new Map();
  private onAction: (action: ControlAction) => void;

  constructor(onAction: (action: ControlAction) => void) {
    this.onAction = onAction;
    this.container = document.createElement('div');
    this.container.className = 'control-panel';
    
    // Create two rows for button layout
    this.primaryRow = document.createElement('div');
    this.primaryRow.className = 'control-panel-row primary-row';
    this.secondaryRow = document.createElement('div');
    this.secondaryRow.className = 'control-panel-row secondary-row';
    
    this.container.appendChild(this.primaryRow);
    this.container.appendChild(this.secondaryRow);
    
    this.createButtons();
  }

  private createButtons(): void {
    // Primary row buttons (Hit, Stand)
    const primaryButtons: { action: ControlAction; label: string; className: string }[] = [
      { action: 'hit', label: 'Hit', className: 'btn-green' },
      { action: 'stand', label: 'Stand', className: 'btn-red' }
    ];

    // Secondary row buttons (Double, Split, Surrender)
    const secondaryButtons: { action: ControlAction; label: string; className: string }[] = [
      { action: 'double', label: 'Double Down', className: 'btn-yellow' },
      { action: 'split', label: 'Split', className: 'btn-yellow' },
      { action: 'surrender', label: 'Surrender', className: 'btn-yellow' }
    ];

    // Other buttons (insurance, betting)
    const otherButtons: { action: ControlAction; label: string; className: string }[] = [
      { action: 'acceptInsurance', label: 'Accept', className: 'btn-secondary' },
      { action: 'declineInsurance', label: 'Decline', className: 'btn-secondary' },
      { action: 'betAgain', label: 'Bet Again', className: 'btn-yellow' },
      { action: 'betAndDealAgain', label: 'Bet & Deal Again', className: 'btn-green bet-deal-again' }
    ];

    // Create primary row buttons
    primaryButtons.forEach(config => {
      const button = this.createButton(config);
      this.primaryRow.appendChild(button);
    });

    // Create secondary row buttons
    secondaryButtons.forEach(config => {
      const button = this.createButton(config);
      this.secondaryRow.appendChild(button);
    });

    // Create other buttons (append to container, not rows)
    otherButtons.forEach(config => {
      const button = this.createButton(config);
      this.container.appendChild(button);
    });
  }

  private createButton(config: { action: ControlAction; label: string; className: string }): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = config.label;
    button.className = `game-button ${config.className}`;
    button.dataset.action = config.action;
    button.addEventListener('click', () => {
      this.onAction(config.action);
    });
    this.buttons.set(config.action, button);
    return button;
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  updateState(phase: GamePhase, playerHand: Hand, _dealerHand: Hand, insuranceOffered: boolean, insuranceTaken: boolean, playerBalance: number, currentBet: number, activeHand?: 'main' | 'split', playerSplitHand?: Hand): void {
    // Reset all buttons
    this.buttons.forEach(btn => {
      btn.disabled = true;
      btn.style.display = 'none';
    });

    // Reset row visibility
    this.primaryRow.style.display = 'none';
    this.secondaryRow.style.display = 'none';

    // Show/hide and enable buttons based on game phase
    switch (phase) {
      case GamePhase.IDLE:
      case GamePhase.BETTING:
        // No action buttons during betting
        break;

      case GamePhase.PLAYER_TURN:
        // If insurance is offered and not yet taken, show only Accept/Decline buttons
        if (insuranceOffered && !insuranceTaken) {
          this.setButtonState('acceptInsurance', true, playerBalance >= currentBet / 2);
          this.setButtonState('declineInsurance', true, true);
          // All other buttons remain hidden/disabled
        } else {
          // Get the active hand for split scenarios
          const activeHandObj = (activeHand === 'split' && playerSplitHand) ? playerSplitHand : playerHand;
          
          // Show primary row (Hit, Stand)
          this.primaryRow.style.display = 'flex';
          this.setButtonState('hit', true, activeHandObj.isBusted === false);
          this.setButtonState('stand', true, activeHandObj.isBusted === false);
          
          // Show secondary row (Double, Split, Surrender)
          this.secondaryRow.style.display = 'flex';
          this.setButtonState('double', true, 
            activeHandObj.canDoubleDown() && 
            !activeHandObj.isBusted && 
            playerBalance >= currentBet
          );
          
          // Split only available on main hand, before any actions taken
          // Only show if canSplit() returns true
          const canSplit = activeHand === 'main' &&
                          playerHand.canSplit() && 
                          !playerHand.isBusted && 
                          playerHand.cards.length === 2 &&
                          playerBalance >= currentBet;
          this.setButtonState('split', canSplit, canSplit);
          
          // Surrender only available on main hand, first two cards
          this.setButtonState('surrender', true, 
            activeHand === 'main' &&
            playerHand.cards.length === 2 && 
            !playerHand.isBusted &&
            !playerSplitHand // Can't surrender if split
          );
        }
        break;

      case GamePhase.RESULT:
      case GamePhase.GAME_OVER:
        // Show both Bet Again and Bet & Deal Again buttons in RESULT phase
        if (phase === GamePhase.RESULT && playerBalance >= 5) {
          this.setButtonState('betAgain', true, true);
          this.setButtonState('betAndDealAgain', true, true);
        }
        break;

      default:
        break;
    }
  }

  private setButtonState(action: ControlAction, visible: boolean, enabled: boolean): void {
    const button = this.buttons.get(action);
    if (button) {
      button.style.display = visible ? 'inline-block' : 'none';
      button.disabled = !enabled;
    }
  }
}

