import { GameState } from '../types/GameState';

export class ScoreDisplay {
  private container: HTMLDivElement;
  private balanceDisplay: HTMLDivElement;
  private betDisplay: HTMLDivElement;
  private insuranceDisplay: HTMLDivElement;
  private payoutDisplay: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'score-display';

    this.balanceDisplay = document.createElement('div');
    this.balanceDisplay.className = 'balance';
    
    this.betDisplay = document.createElement('div');
    this.betDisplay.className = 'bet';
    
    this.insuranceDisplay = document.createElement('div');
    this.insuranceDisplay.className = 'insurance';
    this.insuranceDisplay.style.display = 'none';
    
    this.payoutDisplay = document.createElement('div');
    this.payoutDisplay.className = 'payout';
    this.payoutDisplay.style.display = 'none';

    this.container.appendChild(this.balanceDisplay);
    this.container.appendChild(this.betDisplay);
    this.container.appendChild(this.insuranceDisplay);
    this.container.appendChild(this.payoutDisplay);
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  update(state: GameState): void {
    // Format currency
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(amount);
    };

    this.balanceDisplay.textContent = `Balance: ${formatCurrency(state.playerBalance)}`;
    this.betDisplay.textContent = `Bet: ${formatCurrency(state.currentBet)}`;

    // Show insurance if taken
    if (state.playerHand.insuranceBet && state.playerHand.insuranceBet > 0) {
      this.insuranceDisplay.textContent = `Insurance: ${formatCurrency(state.playerHand.insuranceBet)}`;
      this.insuranceDisplay.style.display = 'block';
    } else {
      this.insuranceDisplay.style.display = 'none';
    }

    // Show payout on result
    if (state.phase === 'result') {
      // Calculate payout (this would be better calculated in GameController)
      // For now, just show a message
      this.payoutDisplay.style.display = 'none';
    } else {
      this.payoutDisplay.style.display = 'none';
    }
  }

  showPayout(amount: number): void {
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(amount);
    };

    if (amount > 0) {
      this.payoutDisplay.textContent = `+${formatCurrency(amount)}`;
      this.payoutDisplay.style.display = 'block';
      this.payoutDisplay.classList.add('positive');
    } else if (amount < 0) {
      this.payoutDisplay.textContent = formatCurrency(amount);
      this.payoutDisplay.style.display = 'block';
      this.payoutDisplay.classList.add('negative');
    } else {
      this.payoutDisplay.style.display = 'none';
    }
  }
}

