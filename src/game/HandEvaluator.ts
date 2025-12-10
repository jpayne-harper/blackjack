import { Card, Rank } from '../types/Card';

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
   * Get the numeric value of a card (for split comparison)
   * Ace = 11, Face cards (J/Q/K) and 10 = 10, Number cards = their rank value
   */
  static getCardValue(card: Card): number {
    if (card.rank === Rank.ACE) {
      return 11;
    } else if ([Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING].includes(card.rank)) {
      return 10;
    } else {
      return parseInt(card.rank);
    }
  }

  /**
   * Check if hand can be split (same value, 2 cards)
   * Allows splitting cards with same value (e.g., Jack + Queen, King + 10)
   */
  static canSplit(cards: Card[]): boolean {
    if (cards.length !== 2) return false;
    return this.getCardValue(cards[0]) === this.getCardValue(cards[1]);
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

