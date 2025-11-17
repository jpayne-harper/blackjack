export class BettingInterface {
  private container: HTMLDivElement;
  private startingBalanceInput!: HTMLInputElement;
  private betInput!: HTMLInputElement;
  private betSlider!: HTMLInputElement;
  private dealButton!: HTMLButtonElement;
  private onSetStartingBalance: (amount: number) => void;
  private onSetBet: (amount: number) => void;
  private onDeal: () => void;
  private currentBalance: number = 0;
  private minBet: number = 5;

  constructor(
    onSetStartingBalance: (amount: number) => void,
    onSetBet: (amount: number) => void,
    onDeal: () => void
  ) {
    this.onSetStartingBalance = onSetStartingBalance;
    this.onSetBet = onSetBet;
    this.onDeal = onDeal;

    this.container = document.createElement('div');
    this.container.className = 'betting-interface';

    this.createStartingBalanceInput();
    this.createBetControls();
  }

  private createStartingBalanceInput(): void {
    const startingBalanceContainer = document.createElement('div');
    startingBalanceContainer.className = 'starting-balance-container';

    const label = document.createElement('label');
    label.textContent = 'Starting Balance: $';
    label.htmlFor = 'starting-balance';

    this.startingBalanceInput = document.createElement('input');
    this.startingBalanceInput.type = 'number';
    this.startingBalanceInput.id = 'starting-balance';
    this.startingBalanceInput.min = '5';
    this.startingBalanceInput.step = '1';
    this.startingBalanceInput.value = '1000';
    this.startingBalanceInput.className = 'balance-input';

    const setBalanceButton = document.createElement('button');
    setBalanceButton.textContent = 'Set Balance';
    setBalanceButton.className = 'game-button btn-primary';
    setBalanceButton.addEventListener('click', () => {
      const amount = parseFloat(this.startingBalanceInput.value);
      if (amount >= this.minBet) {
        this.onSetStartingBalance(amount);
      }
    });

    startingBalanceContainer.appendChild(label);
    startingBalanceContainer.appendChild(this.startingBalanceInput);
    startingBalanceContainer.appendChild(setBalanceButton);

    this.container.appendChild(startingBalanceContainer);
  }

  private createBetControls(): void {
    const betContainer = document.createElement('div');
    betContainer.className = 'bet-container';

    const label = document.createElement('label');
    label.textContent = 'Bet Amount: $';
    label.htmlFor = 'bet-amount';

    this.betInput = document.createElement('input');
    this.betInput.type = 'number';
    this.betInput.id = 'bet-amount';
    this.betInput.min = this.minBet.toString();
    this.betInput.step = '5';
    this.betInput.value = '25';
    this.betInput.className = 'bet-input';

    this.betSlider = document.createElement('input');
    this.betSlider.type = 'range';
    this.betSlider.min = this.minBet.toString();
    this.betSlider.step = '5';
    this.betSlider.value = '25';
    this.betSlider.className = 'bet-slider';

    // Sync input and slider
    this.betInput.addEventListener('input', () => {
      const value = Math.max(this.minBet, Math.min(parseFloat(this.betInput.value) || this.minBet, this.currentBalance));
      this.betInput.value = value.toString();
      this.betSlider.value = value.toString();
      this.betSlider.max = Math.max(this.minBet, this.currentBalance).toString();
    });

    this.betSlider.addEventListener('input', () => {
      this.betInput.value = this.betSlider.value;
    });

    this.dealButton = document.createElement('button');
    this.dealButton.textContent = 'Deal';
    this.dealButton.className = 'game-button btn-primary';
    this.dealButton.addEventListener('click', () => {
      const amount = parseFloat(this.betInput.value);
      if (amount >= this.minBet && amount <= this.currentBalance) {
        this.onSetBet(amount);
        this.onDeal();
      }
    });

    betContainer.appendChild(label);
    betContainer.appendChild(this.betInput);
    betContainer.appendChild(this.betSlider);
    betContainer.appendChild(this.dealButton);

    this.container.appendChild(betContainer);
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  updateBalance(balance: number): void {
    this.currentBalance = balance;
    const maxBet = Math.max(this.minBet, balance);
    this.betSlider.max = maxBet.toString();
    if (parseFloat(this.betInput.value) > balance) {
      this.betInput.value = Math.min(balance, parseFloat(this.betInput.value) || this.minBet).toString();
      this.betSlider.value = this.betInput.value;
    }
  }

  setBetAmount(amount: number): void {
    this.betInput.value = amount.toString();
    this.betSlider.value = amount.toString();
  }

  show(show: boolean): void {
    this.container.style.display = show ? 'block' : 'none';
  }
}

