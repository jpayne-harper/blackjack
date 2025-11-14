import { Card } from '../types/Card';
import { ImageMapper } from '../utils/ImageMapper';

export class CardComponent {
  private element: HTMLDivElement;

  constructor(card: Card | null, isFaceDown: boolean = false, delay: number = 0) {
    this.element = document.createElement('div');
    this.element.className = 'card';
    
    if (isFaceDown) {
      this.element.classList.add('face-down');
      this.element.style.backgroundImage = `url(${ImageMapper.getCardBackPath()})`;
    } else if (card) {
      this.element.style.backgroundImage = `url(${ImageMapper.getCardImagePath(card)})`;
    }

    if (delay > 0) {
      this.element.style.animationDelay = `${delay}ms`;
      this.element.classList.add('dealing');
    }
  }

  getElement(): HTMLDivElement {
    return this.element;
  }

  flip(): void {
    this.element.classList.add('flipping');
    setTimeout(() => {
      this.element.classList.remove('flipping');
    }, 600);
  }

  reveal(): void {
    this.element.classList.remove('face-down');
  }

  addWinAnimation(): void {
    this.element.classList.add('win');
  }

  addBustAnimation(): void {
    this.element.classList.add('bust');
  }
}

