export class GameStatus {
  private element: HTMLDivElement;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'game-status';
  }

  getElement(): HTMLDivElement {
    return this.element;
  }

  setMessage(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
    this.element.textContent = message;
    this.element.className = `game-status ${type}`;
  }

  clear(): void {
    this.element.textContent = '';
    this.element.className = 'game-status';
  }
}

