import { Card } from '../types/Card';
import { HandEvaluator } from './HandEvaluator';

export class DealerAI {
  /**
   * Determine if dealer should hit based on standard casino rules
   * Dealer must hit on soft 17 (Ace + 6)
   * Dealer must stand on hard 17 or higher
   * Dealer must hit on 16 or lower
   */
  static shouldHit(dealerCards: Card[]): boolean {
    const value = HandEvaluator.getHandValue(dealerCards);
    const softValue = HandEvaluator.getSoftValue(dealerCards);

    // If busted, don't hit
    if (value > 21) {
      return false;
    }

    // Hit on 16 or lower
    if (value <= 16) {
      return true;
    }

    // Check for soft 17 (Ace + 6)
    if (value === 17) {
      // If soft value is also 17, it means Ace is being counted as 11
      // This is a soft 17, dealer must hit
      if (softValue === 17) {
        return true;
      }
      // Hard 17, stand
      return false;
    }

    // 18 or higher, stand
    return false;
  }

  /**
   * Play dealer's turn automatically
   * Returns array of cards after dealer finishes
   */
  static playTurn(dealerCards: Card[], dealCard: () => Card | null): Card[] {
    const cards = [...dealerCards];

    while (this.shouldHit(cards)) {
      const newCard = dealCard();
      if (!newCard) break;
      cards.push(newCard);
    }

    return cards;
  }
}

