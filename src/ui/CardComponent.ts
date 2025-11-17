import { Card } from '../types/Card';
import { ImageMapper } from '../utils/ImageMapper';

export class CardComponent {
  private element: HTMLDivElement;

  constructor(card: Card | null, isFaceDown: boolean = false, delay: number = -1) {
    this.element = document.createElement('div');
    this.element.className = 'card';
    
    if (isFaceDown) {
      this.element.classList.add('face-down');
      this.element.style.backgroundImage = `url(${ImageMapper.getCardBackPath()})`;
    } else {
      this.element.classList.add('face-up');
      if (card) {
        this.element.style.backgroundImage = `url(${ImageMapper.getCardImagePath(card)})`;
      }
    }

    // Add dealing class if delay is >= 0 (including 0 for immediate animation start)
    if (delay >= 0) {
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
    this.element.classList.add('face-up');
  }

  addWinAnimation(): void {
    this.element.classList.add('win');
  }

  addBustAnimation(): void {
    this.element.classList.add('bust');
  }
}

