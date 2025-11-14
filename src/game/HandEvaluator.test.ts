import { describe, it, expect } from 'vitest';
import { HandEvaluator } from './HandEvaluator';
import { Card, Rank, Suit } from '../types/Card';

describe('HandEvaluator', () => {
  describe('getHandValue', () => {
    it('should calculate value for number cards', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.TWO, value: 2, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.THREE, value: 3, imagePath: '' }
      ];
      expect(HandEvaluator.getHandValue(cards)).toBe(5);
    });

    it('should calculate value for face cards', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.JACK, value: 10, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.QUEEN, value: 10, imagePath: '' }
      ];
      expect(HandEvaluator.getHandValue(cards)).toBe(20);
    });

    it('should handle Ace as 11 when beneficial', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.ACE, value: 11, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.SIX, value: 6, imagePath: '' }
      ];
      expect(HandEvaluator.getHandValue(cards)).toBe(17);
    });

    it('should handle Ace as 1 when 11 would bust', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.ACE, value: 11, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.TEN, value: 10, imagePath: '' },
        { suit: Suit.DIAMONDS, rank: Rank.NINE, value: 9, imagePath: '' }
      ];
      expect(HandEvaluator.getHandValue(cards)).toBe(20);
    });

    it('should handle multiple Aces correctly', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.ACE, value: 11, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.ACE, value: 11, imagePath: '' },
        { suit: Suit.DIAMONDS, rank: Rank.TEN, value: 10, imagePath: '' }
      ];
      expect(HandEvaluator.getHandValue(cards)).toBe(12);
    });
  });

  describe('isBlackjack', () => {
    it('should detect blackjack with Ace and 10', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.ACE, value: 11, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.TEN, value: 10, imagePath: '' }
      ];
      expect(HandEvaluator.isBlackjack(cards)).toBe(true);
    });

    it('should detect blackjack with Ace and Jack', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.ACE, value: 11, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.JACK, value: 10, imagePath: '' }
      ];
      expect(HandEvaluator.isBlackjack(cards)).toBe(true);
    });

    it('should not detect blackjack with 3 cards', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.ACE, value: 11, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.TEN, value: 10, imagePath: '' },
        { suit: Suit.DIAMONDS, rank: Rank.TWO, value: 2, imagePath: '' }
      ];
      expect(HandEvaluator.isBlackjack(cards)).toBe(false);
    });

    it('should not detect blackjack without Ace', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.TEN, value: 10, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.JACK, value: 10, imagePath: '' }
      ];
      expect(HandEvaluator.isBlackjack(cards)).toBe(false);
    });
  });

  describe('isBusted', () => {
    it('should detect busted hand', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.TEN, value: 10, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.TEN, value: 10, imagePath: '' },
        { suit: Suit.DIAMONDS, rank: Rank.TEN, value: 10, imagePath: '' }
      ];
      expect(HandEvaluator.isBusted(cards)).toBe(true);
    });

    it('should not detect bust for 21', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.ACE, value: 11, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.TEN, value: 10, imagePath: '' }
      ];
      expect(HandEvaluator.isBusted(cards)).toBe(false);
    });
  });

  describe('canSplit', () => {
    it('should allow split for same rank', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.EIGHT, value: 8, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.EIGHT, value: 8, imagePath: '' }
      ];
      expect(HandEvaluator.canSplit(cards)).toBe(true);
    });

    it('should not allow split for different ranks', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.EIGHT, value: 8, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.NINE, value: 9, imagePath: '' }
      ];
      expect(HandEvaluator.canSplit(cards)).toBe(false);
    });

    it('should not allow split with more than 2 cards', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.EIGHT, value: 8, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.EIGHT, value: 8, imagePath: '' },
        { suit: Suit.DIAMONDS, rank: Rank.TWO, value: 2, imagePath: '' }
      ];
      expect(HandEvaluator.canSplit(cards)).toBe(false);
    });
  });

  describe('canDoubleDown', () => {
    it('should allow double down with 2 cards', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.SIX, value: 6, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.FIVE, value: 5, imagePath: '' }
      ];
      expect(HandEvaluator.canDoubleDown(cards)).toBe(true);
    });

    it('should not allow double down with more than 2 cards', () => {
      const cards: Card[] = [
        { suit: Suit.HEARTS, rank: Rank.SIX, value: 6, imagePath: '' },
        { suit: Suit.CLUBS, rank: Rank.FIVE, value: 5, imagePath: '' },
        { suit: Suit.DIAMONDS, rank: Rank.TWO, value: 2, imagePath: '' }
      ];
      expect(HandEvaluator.canDoubleDown(cards)).toBe(false);
    });
  });
});

