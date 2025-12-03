export class ChipBettingComponent {
  private container: HTMLDivElement;
  private chipStack: HTMLDivElement;
  private bettingArea: HTMLDivElement;
  private betValueDisplay: HTMLDivElement;
  private clearBetButton: HTMLButtonElement;
  private dealButton: HTMLButtonElement;
  private onDeal: (betAmount: number) => void;
  
  private currentBet: number = 0;
  private balance: number = 0;
  private minTableLimit: number = 0;
  private maxTableLimit: number = 0;
  
  private chipButtons: Map<number, HTMLButtonElement> = new Map();
  
  // Chip denominations and their image paths
  private readonly chipDenominations = [
    { value: 5, color: 'green', image: '/chips/poker_chip_5_green_97x100.png' },
    { value: 25, color: 'yellow', image: '/chips/poker_chip_25_yellow_97x100.png' },
    { value: 100, color: 'blue', image: '/chips/poker_chip_100_blue_97x100.png' },
    { value: 500, color: 'red', image: '/chips/poker_chip_500_red_97x100.png' }
  ];

  constructor(onDeal: (betAmount: number) => void) {
    this.onDeal = onDeal;
    
    this.container = document.createElement('div');
    this.container.className = 'chip-betting-component';
    this.container.style.display = 'none'; // Initially hidden
    
    this.createChipStack();
    this.createBettingArea();
  }

  private createChipStack(): void {
    this.chipStack = document.createElement('div');
    this.chipStack.className = 'chip-stack';
    
    this.chipDenominations.forEach(chip => {
      const chipButton = document.createElement('button');
      chipButton.className = 'chip-button';
      chipButton.dataset.value = chip.value.toString();
      chipButton.style.backgroundImage = `url(${chip.image})`;
      chipButton.style.backgroundSize = 'contain';
      chipButton.style.backgroundRepeat = 'no-repeat';
      chipButton.style.backgroundPosition = 'center';
      chipButton.style.width = '97px';
      chipButton.style.height = '100px';
      chipButton.style.border = 'none';
      chipButton.style.cursor = 'pointer';
      chipButton.style.transition = 'transform 0.2s ease';
      
      chipButton.addEventListener('click', () => this.handleChipClick(chip.value));
      chipButton.addEventListener('mouseenter', () => {
        chipButton.style.transform = 'scale(1.1)';
      });
      chipButton.addEventListener('mouseleave', () => {
        chipButton.style.transform = 'scale(1)';
      });
      
      this.chipButtons.set(chip.value, chipButton);
      this.chipStack.appendChild(chipButton);
    });
    
    this.container.appendChild(this.chipStack);
  }

  private createBettingArea(): void {
    const bettingContainer = document.createElement('div');
    bettingContainer.className = 'betting-area-container';
    
    this.bettingArea = document.createElement('div');
    this.bettingArea.className = 'betting-area';
    
    this.betValueDisplay = document.createElement('div');
    this.betValueDisplay.className = 'bet-value-display';
    this.betValueDisplay.textContent = '$0.00';
    this.bettingArea.appendChild(this.betValueDisplay);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'betting-buttons';
    
    this.clearBetButton = document.createElement('button');
    this.clearBetButton.textContent = 'Clear Bet';
    this.clearBetButton.className = 'game-button btn-secondary';
    this.clearBetButton.addEventListener('click', () => this.clearBet());
    
    this.dealButton = document.createElement('button');
    this.dealButton.textContent = 'Deal';
    this.dealButton.className = 'game-button btn-primary';
    this.dealButton.disabled = true;
    this.dealButton.addEventListener('click', () => {
      if (this.currentBet >= this.minTableLimit && this.currentBet <= this.maxTableLimit) {
        this.onDeal(this.currentBet);
      }
    });
    
    buttonContainer.appendChild(this.clearBetButton);
    buttonContainer.appendChild(this.dealButton);
    this.bettingArea.appendChild(buttonContainer);
    
    bettingContainer.appendChild(this.bettingArea);
    this.container.appendChild(bettingContainer);
  }

  private handleChipClick(value: number): void {
    const newBet = this.currentBet + value;
    
    // Check if adding this chip would exceed max limit or balance
    if (newBet > this.maxTableLimit) {
      return; // Can't exceed max table limit
    }
    
    if (newBet > this.balance) {
      return; // Can't exceed balance
    }
    
    this.currentBet = newBet;
    this.updateBetDisplay();
    this.updateChipDisabling();
    this.animateChipToBettingArea(value);
  }

  private animateChipToBettingArea(value: number): void {
    // Create a temporary chip element for animation
    const chipButton = this.chipButtons.get(value);
    if (!chipButton) return;
    
    const chip = chipButton.cloneNode(true) as HTMLButtonElement;
    chip.style.position = 'absolute';
    chip.style.pointerEvents = 'none';
    chip.style.zIndex = '1000';
    
    const rect = chipButton.getBoundingClientRect();
    chip.style.left = `${rect.left}px`;
    chip.style.top = `${rect.top}px`;
    
    document.body.appendChild(chip);
    
    const bettingRect = this.bettingArea.getBoundingClientRect();
    const targetX = bettingRect.left + bettingRect.width / 2;
    const targetY = bettingRect.top + bettingRect.height / 2;
    
    // Animate to betting area
    requestAnimationFrame(() => {
      chip.style.transition = 'all 0.5s ease-in-out';
      chip.style.left = `${targetX}px`;
      chip.style.top = `${targetY}px`;
      chip.style.transform = 'scale(0.5)';
      chip.style.opacity = '0';
      
      setTimeout(() => {
        chip.remove();
      }, 500);
    });
  }

  clearBet(): void {
    if (this.currentBet === 0) return;
    
    // Animate chips back to stack
    const betAmount = this.currentBet;
    this.currentBet = 0;
    this.updateBetDisplay();
    this.updateChipDisabling();
    
    // Simple fade-in animation for chip stack
    this.chipStack.style.opacity = '0.5';
    setTimeout(() => {
      this.chipStack.style.opacity = '1';
    }, 300);
  }

  private updateBetDisplay(): void {
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(amount);
    };
    
    this.betValueDisplay.textContent = formatCurrency(this.currentBet);
    
    // Enable/disable deal button
    this.dealButton.disabled = 
      this.currentBet < this.minTableLimit || 
      this.currentBet > this.maxTableLimit ||
      this.currentBet > this.balance;
  }

  private updateChipAvailability(): void {
    this.chipDenominations.forEach(chip => {
      const chipButton = this.chipButtons.get(chip.value);
      if (!chipButton) return;
      
      // Hide chips that are too large for current balance
      if (chip.value > this.balance) {
        chipButton.style.display = 'none';
      } else {
        chipButton.style.display = 'block';
      }
    });
  }

  private updateChipDisabling(): void {
    this.chipDenominations.forEach(chip => {
      const chipButton = this.chipButtons.get(chip.value);
      if (!chipButton) return;
      
      const wouldExceedMax = (this.currentBet + chip.value) > this.maxTableLimit;
      const wouldExceedBalance = (this.currentBet + chip.value) > this.balance;
      const belowMin = this.currentBet > 0 && this.currentBet < this.minTableLimit;
      
      // Disable if: would exceed max, would exceed balance, or we're below min (but only if bet > 0)
      if (wouldExceedMax || wouldExceedBalance || (belowMin && chip.value + this.currentBet < this.minTableLimit)) {
        chipButton.disabled = true;
        chipButton.style.opacity = '0.5';
        chipButton.style.cursor = 'not-allowed';
      } else {
        chipButton.disabled = false;
        chipButton.style.opacity = '1';
        chipButton.style.cursor = 'pointer';
      }
    });
  }

  updateBalance(balance: number): void {
    this.balance = balance;
    this.updateChipAvailability();
    this.updateChipDisabling();
    this.updateBetDisplay();
  }

  updateTableLimits(min: number, max: number): void {
    this.minTableLimit = min;
    this.maxTableLimit = max;
    this.updateChipDisabling();
    this.updateBetDisplay();
  }

  updateCurrentBet(bet: number): void {
    this.currentBet = bet;
    this.updateBetDisplay();
    this.updateChipDisabling();
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  show(show: boolean): void {
    this.container.style.display = show ? 'block' : 'none';
  }
}

