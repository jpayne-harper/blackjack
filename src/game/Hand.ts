import { Card } from '../types/Card';
import { Hand as IHand } from '../types/Hand';
import { HandEvaluator } from './HandEvaluator';

export class Hand implements IHand {
  cards: Card[] = [];
  bet: number = 0;
  isSplit: boolean = false;
  isDoubleDown: boolean = false;
  isBusted: boolean = false;
  isBlackjack: boolean = false;
  insuranceBet?: number;
  isSurrendered: boolean = false;

  constructor(bet: number = 0, isSplit: boolean = false) {
    this.bet = bet;
    this.isSplit = isSplit;
  }

  addCard(card: Card): void {
    this.cards.push(card);
    this.updateStatus();
  }

  private updateStatus(): void {
    this.isBusted = HandEvaluator.isBusted(this.cards);
    this.isBlackjack = HandEvaluator.isBlackjack(this.cards);
  }

  getValue(): number {
    return HandEvaluator.getHandValue(this.cards);
  }

  getSoftValue(): number {
    return HandEvaluator.getSoftValue(this.cards);
  }

  canSplit(): boolean {
    return HandEvaluator.canSplit(this.cards);
  }

  canDoubleDown(): boolean {
    return HandEvaluator.canDoubleDown(this.cards);
  }

  doubleDown(card: Card): void {
    this.bet *= 2;
    this.isDoubleDown = true;
    this.addCard(card);
  }

  surrender(): void {
    this.isSurrendered = true;
  }

  setInsuranceBet(amount: number): void {
    this.insuranceBet = amount;
  }
}

