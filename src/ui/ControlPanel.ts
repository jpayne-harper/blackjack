import { GamePhase } from '../types/GameState';
import { Hand } from '../game/Hand';

export type ControlAction = 'hit' | 'stand' | 'double' | 'split' | 'acceptInsurance' | 'declineInsurance' | 'surrender' | 'betAgain' | 'betAndDealAgain';

export class ControlPanel {
  private container: HTMLDivElement;
  private buttons: Map<ControlAction, HTMLButtonElement> = new Map();
  private onAction: (action: ControlAction) => void;

  constructor(onAction: (action: ControlAction) => void) {
    this.onAction = onAction;
    this.container = document.createElement('div');
    this.container.className = 'control-panel';
    this.createButtons();
  }

  private createButtons(): void {
    const buttonConfigs: { action: ControlAction; label: string; className: string }[] = [
      { action: 'hit', label: 'Hit', className: 'btn-primary' },
      { action: 'stand', label: 'Stand', className: 'btn-primary' },
      { action: 'double', label: 'Double Down', className: 'btn-secondary' },
      { action: 'split', label: 'Split', className: 'btn-secondary' },
      { action: 'acceptInsurance', label: 'Accept', className: 'btn-secondary' },
      { action: 'declineInsurance', label: 'Decline', className: 'btn-secondary' },
      { action: 'surrender', label: 'Surrender', className: 'btn-secondary' },
      { action: 'betAgain', label: 'Bet Again', className: 'btn-primary' },
      { action: 'betAndDealAgain', label: 'Bet & Deal Again', className: 'btn-primary bet-deal-again' }
    ];

    buttonConfigs.forEach(config => {
      const button = document.createElement('button');
      button.textContent = config.label;
      button.className = `game-button ${config.className}`;
      button.dataset.action = config.action;
      button.addEventListener('click', () => {
        this.onAction(config.action);
      });
      this.buttons.set(config.action, button);
      this.container.appendChild(button);
    });
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  updateState(phase: GamePhase, playerHand: Hand, dealerHand: Hand, insuranceOffered: boolean, insuranceTaken: boolean, playerBalance: number, currentBet: number): void {
    // Reset all buttons
    this.buttons.forEach(btn => {
      btn.disabled = true;
      btn.style.display = 'none';
    });

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
          // Show normal player action buttons
          this.setButtonState('hit', true, playerHand.isBusted === false);
          this.setButtonState('stand', true, playerHand.isBusted === false);
          this.setButtonState('double', true, 
            playerHand.canDoubleDown() && 
            !playerHand.isBusted && 
            playerBalance >= currentBet
          );
          this.setButtonState('split', true, 
            playerHand.canSplit() && 
            !playerHand.isBusted && 
            playerBalance >= currentBet
          );
          this.setButtonState('surrender', true, 
            playerHand.cards.length === 2 && 
            !playerHand.isBusted
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

