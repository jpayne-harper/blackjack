import { describe, it, expect } from 'vitest';
import { DealerAI } from './DealerAI';
import { Card, Rank, Suit } from '../types/Card';

describe('DealerAI', () => {
  describe('shouldHit', () => {
    it('should hit on 16', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.TEN, value: 10, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.SIX, value: 6, imagePath: '' }
      ];
      expect(DealerAI.shouldHit(cards)).toBe(true);
    });

    it('should hit on soft 17', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.ACE, value: 11, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.SIX, value: 6, imagePath: '' }
      ];
      expect(DealerAI.shouldHit(cards)).toBe(true);
    });

    it('should stand on hard 17', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.TEN, value: 10, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.SEVEN, value: 7, imagePath: '' }
      ];
      expect(DealerAI.shouldHit(cards)).toBe(false);
    });

    it('should stand on 18', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.TEN, value: 10, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.EIGHT, value: 8, imagePath: '' }
      ];
      expect(DealerAI.shouldHit(cards)).toBe(false);
    });

    it('should not hit when busted', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.TEN, value: 10, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.TEN, value: 10, imagePath: '' },
        { suit: Suit.DIAMONDS, rank: Rank.TEN, value: 10, imagePath: '' }
      ];
      expect(DealerAI.shouldHit(cards)).toBe(false);
    });
  });
});

