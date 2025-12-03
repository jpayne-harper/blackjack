export class BettingInterface {
  private container: HTMLDivElement;
  private onSetStartingBalance: (amount: number) => void;
  private onSetTableLimits: (minLimit: number) => void;
  private currentBalance: number = 0;
  private selectedBalance: number = 0;
  private selectedTableLimit: number = 0;

  constructor(
    onSetStartingBalance: (amount: number) => void,
    onSetTableLimits: (minLimit: number) => void
  ) {
    this.onSetStartingBalance = onSetStartingBalance;
    this.onSetTableLimits = onSetTableLimits;

    this.container = document.createElement('div');
    this.container.className = 'betting-interface';

    this.createStartingBalanceSelection();
    this.createTableLimitsSelection();
  }

  private createStartingBalanceSelection(): void {
    const startingBalanceContainer = document.createElement('div');
    startingBalanceContainer.className = 'starting-balance-container';

    const label = document.createElement('label');
    label.textContent = 'Starting Balance:';
    label.className = 'selection-label';

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'balance-options';

    const balanceOptions = [500, 1000, 2500, 5000];
    
    balanceOptions.forEach(amount => {
      const button = document.createElement('button');
      button.textContent = `$${amount.toLocaleString()}`;
      button.className = 'option-button';
      button.dataset.value = amount.toString();
      
      button.addEventListener('click', () => {
        // Remove selected class from all buttons
        buttonContainer.querySelectorAll('.option-button').forEach(btn => {
          btn.classList.remove('selected');
        });
        // Add selected class to clicked button
        button.classList.add('selected');
        this.selectedBalance = amount;
        this.onSetStartingBalance(amount);
      });
      
      buttonContainer.appendChild(button);
    });

    startingBalanceContainer.appendChild(label);
    startingBalanceContainer.appendChild(buttonContainer);
    this.container.appendChild(startingBalanceContainer);
  }

  private createTableLimitsSelection(): void {
    const tableLimitsContainer = document.createElement('div');
    tableLimitsContainer.className = 'table-limits-container';

    const label = document.createElement('label');
    label.textContent = 'Table Limits (Min):';
    label.className = 'selection-label';

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'table-limit-options';

    const limitOptions = [10, 15, 25, 50, 100, 250];
    
    limitOptions.forEach(limit => {
      const button = document.createElement('button');
      button.textContent = `$${limit}`;
      button.className = 'option-button';
      button.dataset.value = limit.toString();
      
      button.addEventListener('click', () => {
        // Remove selected class from all buttons
        buttonContainer.querySelectorAll('.option-button').forEach(btn => {
          btn.classList.remove('selected');
        });
        // Add selected class to clicked button
        button.classList.add('selected');
        this.selectedTableLimit = limit;
        this.onSetTableLimits(limit);
      });
      
      buttonContainer.appendChild(button);
    });

    tableLimitsContainer.appendChild(label);
    tableLimitsContainer.appendChild(buttonContainer);
    this.container.appendChild(tableLimitsContainer);
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  updateBalance(balance: number): void {
    this.currentBalance = balance;
  }

  show(show: boolean): void {
    this.container.style.display = show ? 'block' : 'none';
  }
}

