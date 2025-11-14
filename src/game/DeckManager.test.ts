import { describe, it, expect, beforeEach } from 'vitest';
import { DeckManager } from './DeckManager';
import { Rank, Suit } from '../types/Card';

describe('DeckManager', () => {
  let deckManager: DeckManager;

  beforeEach(() => {
    deckManager = new DeckManager();
  });

  it('should create a deck with 4 decks (208 cards)', () => {
    const cards: any[] = [];
    let card = deckManager.dealCard();
    while (card) {
      cards.push(card);
      card = deckManager.dealCard();
    }
    expect(cards.length).toBe(208);
  });

  it('should deal cards', () => {
    const card = deckManager.dealCard();
    expect(card).toBeDefined();
    expect(card?.suit).toBeDefined();
    expect(card?.rank).toBeDefined();
  });

  it('should shuffle the deck', () => {
    const firstDeal: any[] = [];
    for (let i = 0; i < 10; i++) {
      const card = deckManager.dealCard();
      if (card) firstDeal.push(card);
    }

    deckManager.reset();
    
    const secondDeal: any[] = [];
    for (let i = 0; i < 10; i++) {
      const card = deckManager.dealCard();
      if (card) secondDeal.push(card);
    }

    // Very unlikely to get same order after shuffle
    const sameOrder = firstDeal.every((card, index) => 
      card.suit === secondDeal[index]?.suit && card.rank === secondDeal[index]?.rank
    );
    expect(sameOrder).toBe(false);
  });

  it('should reshuffle when below threshold', () => {
    // Deal most cards
    for (let i = 0; i < 160; i++) {
      deckManager.dealCard();
    }

    const remainingBefore = deckManager.getRemainingCards();
    expect(remainingBefore).toBeLessThan(52);

    // Deal one more card - should trigger reshuffle
    deckManager.dealCard();
    const remainingAfter = deckManager.getRemainingCards();
    expect(remainingAfter).toBeGreaterThan(200); // Should have reshuffled
  });

  it('should have correct image paths for cards', () => {
    const card = deckManager.dealCard();
    expect(card?.imagePath).toBeDefined();
    expect(card?.imagePath).toMatch(/^\/cards\//);
  });

  it('should handle edge case cards (3_of_diamonds, 8_of_diamonds)', () => {
    let found3Diamonds = false;
    let found8Diamonds = false;

    for (let i = 0; i < 208; i++) {
      const card = deckManager.dealCard();
      if (!card) break;
      
      if (card.rank === Rank.THREE && card.suit === Suit.DIAMONDS) {
        found3Diamonds = true;
        expect(card.imagePath).toBe('/cards/3_of_diamonds.png');
      }
      
      if (card.rank === Rank.EIGHT && card.suit === Suit.DIAMONDS) {
        found8Diamonds = true;
        expect(card.imagePath).toBe('/cards/8_of_diamonds.png');
      }
    }

    expect(found3Diamonds).toBe(true);
    expect(found8Diamonds).toBe(true);
  });
});

