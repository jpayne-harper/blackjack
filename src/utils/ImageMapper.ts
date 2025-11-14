import { Card, Suit, Rank } from '../types/Card';

export class ImageMapper {
  /**
   * Get the base path for assets (handles Vite base URL)
   */
  private static getBasePath(): string {
    // In development, import.meta.env.BASE_URL is '/'
    // In production with base: '/blackjack/', it's '/blackjack/'
    return import.meta.env.BASE_URL;
  }

  /**
   * Get image path for a card
   * Handles edge cases for cards missing -small suffix
   */
  static getCardImagePath(card: Card): string {
    const rankStr = card.rank === Rank.TEN ? '10' : card.rank;
    const base = this.getBasePath();
    
    // Handle edge cases: 3_of_diamonds.png and 8_of_diamonds.png (missing -small suffix)
    if ((card.rank === Rank.THREE || card.rank === Rank.EIGHT) && card.suit === Suit.DIAMONDS) {
      return `${base}cards/${rankStr}_of_${card.suit}.png`;
    }
    
    return `${base}cards/${rankStr}_of_${card.suit}-small.png`;
  }

  /**
   * Get card back image path
   */
  static getCardBackPath(): string {
    return `${this.getBasePath()}cards/back_of_card-small.png`;
  }

  /**
   * Get table background path
   */
  static getTableBackgroundPath(): string {
    return `${this.getBasePath()}table/table_bg.jpg`;
  }
}

