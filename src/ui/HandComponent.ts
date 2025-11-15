import { Hand } from '../game/Hand';
import { CardComponent } from './CardComponent';

export class HandComponent {
  private container: HTMLDivElement;
  private valueDisplay: HTMLDivElement;
  private cardsContainer: HTMLDivElement;

  constructor(isDealer: boolean = false) {
    this.container = document.createElement('div');
    this.container.className = `hand ${isDealer ? 'dealer-hand' : 'player-hand'}`;

    this.valueDisplay = document.createElement('div');
    this.valueDisplay.className = 'hand-value';

    this.cardsContainer = document.createElement('div');
    this.cardsContainer.className = 'cards';

    this.container.appendChild(this.cardsContainer);
    this.container.appendChild(this.valueDisplay);
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  updateHand(hand: Hand, showHiddenCard: boolean = false): void {
    // Clear animation classes before updating
    this.clearAnimations();
    
    // Clear existing cards
    this.cardsContainer.innerHTML = '';

    // Add cards
    hand.cards.forEach((card, index) => {
      const isFaceDown = !showHiddenCard && index === 0 && hand.cards.length === 2;
      const delay = index * 150; // Stagger card dealing animation
      const cardComponent = new CardComponent(card, isFaceDown, delay);
      this.cardsContainer.appendChild(cardComponent.getElement());
    });

    // Update value display
    if (showHiddenCard || hand.cards.length <= 1) {
      const value = hand.getValue();
      this.valueDisplay.textContent = hand.isBusted 
        ? `Bust (${value})` 
        : hand.isBlackjack 
        ? 'Blackjack!' 
        : `${value}`;
      this.valueDisplay.style.display = 'block';
    } else {
      this.valueDisplay.textContent = '?';
      this.valueDisplay.style.display = 'block';
    }

    // Add animations
    if (hand.isBusted) {
      this.cardsContainer.classList.add('bust');
    } else if (hand.isBlackjack) {
      this.cardsContainer.classList.add('blackjack');
      // console.log('blackjack', this.cardsContainer);
      this.revealHiddenCard();
    }
  }

  revealHiddenCard(): void {
    console.log('revealing hidden card');
    // const firstCard = this.cardsContainer.querySelector('.card.face-down');
    const firstCard = this.cardsContainer.querySelector('.card.face-up.dealing');
    if (firstCard) {
      const cardComponent = firstCard as HTMLElement;
      // console.log('firstCard', firstCard);
      // cardComponent.classList.remove('face-down');
      cardComponent.classList.remove('dealing');
      cardComponent.classList.add('flipping');
      
    }
  }

  clearAnimations(): void {
    this.cardsContainer.classList.remove('bust', 'blackjack', 'win');
  }
}

