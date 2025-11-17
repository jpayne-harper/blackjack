import { Hand } from '../game/Hand';
import { CardComponent } from './CardComponent';
import { ImageMapper } from '../utils/ImageMapper';

export class HandComponent {
  private container: HTMLDivElement;
  private valueDisplay: HTMLDivElement;
  private cardsContainer: HTMLDivElement;
  private deck?: HTMLDivElement;
  private dealtCardIndices: Set<number> = new Set(); // Track which card indices have been dealt

  constructor(isDealer: boolean = false) {
    this.container = document.createElement('div');
    this.container.className = `hand ${isDealer ? 'dealer-hand' : 'player-hand'}`;

    this.valueDisplay = document.createElement('div');
    this.valueDisplay.className = 'hand-value';

    this.cardsContainer = document.createElement('div');
    this.cardsContainer.className = 'cards';

    this.container.appendChild(this.cardsContainer);
    this.container.appendChild(this.valueDisplay);

    if (isDealer) {
      this.deck = document.createElement('div');
      this.deck.className = 'deck';
      this.cardsContainer.appendChild(this.deck);
    }
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  updateHand(hand: Hand, showHiddenCard: boolean = false, startDelay: number = 0, isInitialDeal: boolean = false): void {
    // Clear animation classes before updating
    this.clearAnimations();
    
    // Get existing card elements (excluding deck element if it exists)
    const existingCards = Array.from(this.cardsContainer.children).filter(
      child => child !== this.deck && child.classList.contains('card')
    ) as HTMLElement[];

    // Add or update cards
    hand.cards.forEach((card, index) => {
      const isFaceDown = !showHiddenCard && index === 0 && hand.cards.length === 2;
      
      // Check if this card index has already been dealt
      const isAlreadyDealt = this.dealtCardIndices.has(index);
      
      // Check if we have an existing card element at this index
      const existingCard = existingCards[index];
      const hasExistingDealtClass = existingCard?.classList.contains('dealt');
      
      // If card already has 'dealt' class, don't re-animate
      if (isAlreadyDealt || hasExistingDealtClass) {
        // Card already dealt, just update it without animation
        if (existingCard) {
          // Update face-down/face-up state if needed
          if (isFaceDown && !existingCard.classList.contains('face-down')) {
            existingCard.classList.remove('face-up');
            existingCard.classList.add('face-down');
            existingCard.style.backgroundImage = `url(${ImageMapper.getCardBackPath()})`;
          } else if (!isFaceDown && !existingCard.classList.contains('face-up')) {
            existingCard.classList.remove('face-down');
            existingCard.classList.add('face-up');
            existingCard.style.backgroundImage = `url(${ImageMapper.getCardImagePath(card)})`;
          }
          // Ensure 'dealt' class is present and 'dealing' is not
          existingCard.classList.add('dealt');
          existingCard.classList.remove('dealing');
        } else {
          // Create card without animation since it's already dealt
          const cardComponent = new CardComponent(card, isFaceDown, -1); // -1 means no animation
          const cardElement = cardComponent.getElement();
          cardElement.classList.add('dealt');
          this.cardsContainer.appendChild(cardElement);
        }
        return; // Skip animation for already-dealt cards
      }
      
      // Calculate delay: for initial deal, alternate player/dealer (0ms, 200ms, 400ms, 600ms)
      // Cards are dealt: player(0), dealer(0), player(1), dealer(1)
      // So player cards are at positions 0 and 2 (delays 0ms, 400ms)
      // And dealer cards are at positions 1 and 3 (delays 200ms, 600ms)
      // For new cards (not initial deal), animate with 0ms delay
      let delay = 0;
      if (isInitialDeal) {
        delay = startDelay + (index * 400); // Player: 0ms, 400ms | Dealer: 200ms, 600ms
      }
      
      // Remove existing card at this index if it exists (shouldn't happen, but safety check)
      if (existingCard && !hasExistingDealtClass) {
        existingCard.remove();
      }
      
      // Create new card with animation
      const cardComponent = new CardComponent(card, isFaceDown, delay);
      const cardElement = cardComponent.getElement();
      this.cardsContainer.appendChild(cardElement);
      
      // Mark this index as dealt and remove 'dealing' class after animation completes
      const totalDelay = delay + 500; // Animation duration is 500ms
      setTimeout(() => {
        cardElement.classList.remove('dealing');
        cardElement.classList.add('dealt');
        cardElement.style.animationDelay = '0ms';
        this.dealtCardIndices.add(index);
      }, totalDelay);
    });
    
    // Remove any extra cards that are no longer in the hand
    // (This shouldn't happen in blackjack, but safety check)
    while (existingCards.length > hand.cards.length) {
      const extraIndex = existingCards.length - 1;
      const extraCard = existingCards.pop();
      if (extraCard) {
        extraCard.remove();
        // Remove from dealt tracking
        this.dealtCardIndices.delete(extraIndex);
      }
    }

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
    }
  }

  revealHiddenCard(): void {
    // This method is no longer needed as cards are revealed properly in updateHand
    // Keeping for backwards compatibility but it's not used
  }

  clearAnimations(): void {
    this.cardsContainer.classList.remove('bust', 'blackjack', 'win');
  }

  clearDealtCards(): void {
    // Clear all dealt card tracking
    this.dealtCardIndices.clear();
    
    // Clear all cards from the container (new hand starting)
    // Preserve deck element if it exists
    if (this.deck) {
      this.cardsContainer.innerHTML = '';
      this.cardsContainer.appendChild(this.deck);
    } else {
      this.cardsContainer.innerHTML = '';
    }
  }
}

