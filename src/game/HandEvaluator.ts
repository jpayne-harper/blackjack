import { Card, Rank } from '../types/Card';
import { Hand } from '../types/Hand';

export class HandEvaluator {
  /**
   * Calculate the best possible value of a hand
   * Returns the highest value <= 21, or the lowest value if busted
   */
  static getHandValue(cards: Card[]): number {
    let value = 0;
    let aces = 0;

    for (const card of cards) {
      if (card.rank === Rank.ACE) {
        aces++;
        value += 11;
      } else if ([Rank.JACK, Rank.QUEEN, Rank.KING].includes(card.rank)) {
        value += 10;
      } else {
        value += parseInt(card.rank);
      }
    }

    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    return value;
  }

  /**
   * Get soft value (with Ace as 11)
   */
  static getSoftValue(cards: Card[]): number {
    let value = 0;
    for (const card of cards) {
      if (card.rank === Rank.ACE) {
        value += 11;
      } else if ([Rank.JACK, Rank.QUEEN, Rank.KING].includes(card.rank)) {
        value += 10;
      } else {
        value += parseInt(card.rank);
      }
    }
    return value;
  }

  /**
   * Check if hand is blackjack (Ace + 10-value card with 2 cards)
   */
  static isBlackjack(cards: Card[]): boolean {
    if (cards.length !== 2) return false;
    
    const hasAce = cards.some(c => c.rank === Rank.ACE);
    const hasTenValue = cards.some(c => 
      [Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING].includes(c.rank)
    );
    
    return hasAce && hasTenValue;
  }

  /**
   * Check if hand is busted (value > 21)
   */
  static isBusted(cards: Card[]): boolean {
    return this.getHandValue(cards) > 21;
  }

  /**
   * Check if hand can be split (same rank, 2 cards)
   */
  static canSplit(cards: Card[]): boolean {
    if (cards.length !== 2) return false;
    return cards[0].rank === cards[1].rank;
  }

  /**
   * Check if hand can double down (exactly 2 cards)
   */
  static canDoubleDown(cards: Card[]): boolean {
    return cards.length === 2;
  }

  /**
   * Check if dealer shows Ace (for insurance)
   * Only checks the first card (face-up card, index 0)
   * The second card (face-down, index 1) is not considered
   */
  static dealerShowsAce(dealerCards: Card[]): boolean {
    if (dealerCards.length === 0) return false;
    // Only check the face-up card (second card, index 1)
    return dealerCards[1].rank === Rank.ACE;
  }
}

