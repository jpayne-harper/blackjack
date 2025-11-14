import { Card } from './Card';

export interface Hand {
  cards: Card[];
  bet: number;
  isSplit: boolean;
  isDoubleDown: boolean;
  isBusted: boolean;
  isBlackjack: boolean;
  insuranceBet?: number;  // Optional insurance bet
  isSurrendered: boolean;
  
  getValue(): number;  // Returns best possible value (Ace = 1 or 11)
  getSoftValue(): number;  // Returns soft value if Ace present
  canSplit(): boolean;
  canDoubleDown(): boolean;
}

