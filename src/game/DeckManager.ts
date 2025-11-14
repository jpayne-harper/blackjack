import { Card, Suit, Rank } from '../types/Card';

export class DeckManager {
  private deck: Card[] = [];
  private readonly DECKS_COUNT = 4;
  private readonly SHUFFLE_THRESHOLD = 52; // ~25% of 208 cards

  constructor() {
    this.createDeck();
    this.shuffle();
  }

  /**
   * Create a standard 52-card deck, repeated DECKS_COUNT times
   */
  private createDeck(): void {
    this.deck = [];
    const suits = [Suit.CLUBS, Suit.DIAMONDS, Suit.HEARTS, Suit.SPADES];
    const ranks = [
      Rank.ACE, Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX,
      Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING
    ];

    for (let deck = 0; deck < this.DECKS_COUNT; deck++) {
      for (const suit of suits) {
        for (const rank of ranks) {
          const card: Card = {
            suit,
            rank,
            value: this.getCardValue(rank),
            imagePath: this.getCardImagePath(rank, suit)
          };
          this.deck.push(card);
        }
      }
    }
  }

  /**
   * Get numeric value of a card rank
   */
  private getCardValue(rank: Rank): number {
    if (rank === Rank.ACE) return 11; // Default to 11, adjusted in hand evaluation
    if ([Rank.JACK, Rank.QUEEN, Rank.KING].includes(rank)) return 10;
    return parseInt(rank);
  }

  /**
   * Get image path for a card
   */
  private getCardImagePath(rank: Rank, suit: Suit): string {
    const rankStr = rank === Rank.TEN ? '10' : rank;
    // Handle edge cases: 3_of_diamonds.png and 8_of_diamonds.png (missing -small suffix)
    if ((rank === Rank.THREE || rank === Rank.EIGHT) && suit === Suit.DIAMONDS) {
      return `/cards/${rankStr}_of_${suit}.png`;
    }
    return `/cards/${rankStr}_of_${suit}-small.png`;
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  shuffle(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  /**
   * Deal a single card from the deck
   */
  dealCard(): Card | null {
    if (this.deck.length === 0) {
      return null;
    }

    // Reshuffle if below threshold
    if (this.deck.length < this.SHUFFLE_THRESHOLD) {
      this.createDeck();
      this.shuffle();
    }

    return this.deck.pop() || null;
  }

  /**
   * Get remaining cards count
   */
  getRemainingCards(): number {
    return this.deck.length;
  }

  /**
   * Reset and reshuffle the deck
   */
  reset(): void {
    this.createDeck();
    this.shuffle();
  }
}

