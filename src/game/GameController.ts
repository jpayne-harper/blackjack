import { GamePhase, GameState } from '../types/GameState';
import { DeckManager } from './DeckManager';
import { HandEvaluator } from './HandEvaluator';
import { DealerAI } from './DealerAI';
import { Hand } from './Hand';
import { Card } from '../types/Card';

export class GameController {
  private state: GameState;
  private deckManager: DeckManager;
  private readonly MIN_BET = 5;

  constructor(startingBalance: number = 1000) {
    this.deckManager = new DeckManager();
    this.state = this.createInitialState(startingBalance);
  }

  private createInitialState(startingBalance: number): GameState {
    return {
      phase: GamePhase.IDLE,
      playerHand: new Hand(0),
      dealerHand: new Hand(0),
      deck: [],
      currentBet: 0,
      playerBalance: startingBalance,
      startingBalance,
      message: 'Set your starting balance and place a bet to begin',
      insuranceOffered: false,
      insuranceTaken: false
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  setStartingBalance(amount: number): void {
    if (amount < this.MIN_BET) {
      this.state.message = `Starting balance must be at least $${this.MIN_BET}`;
      return;
    }
    this.state.startingBalance = amount;
    this.state.playerBalance = amount;
    this.state.phase = GamePhase.BETTING;
    this.state.message = 'Place your bet';
  }

  setBet(amount: number): void {
    if (this.state.phase !== GamePhase.BETTING && this.state.phase !== GamePhase.IDLE) {
      return;
    }

    if (amount < this.MIN_BET) {
      this.state.message = `Minimum bet is $${this.MIN_BET}`;
      return;
    }

    if (amount > this.state.playerBalance) {
      this.state.message = 'Insufficient balance';
      return;
    }

    this.state.currentBet = amount;
    this.state.playerBalance -= amount;
    this.state.phase = GamePhase.DEALING;
    this.deal();
  }

  private deal(): void {
    this.state.playerHand = new Hand(this.state.currentBet);
    this.state.dealerHand = new Hand(0);
    this.state.playerSplitHand = undefined;
    this.state.insuranceOffered = false;
    this.state.insuranceTaken = false;

    // Deal initial cards
    const card1 = this.deckManager.dealCard();
    const card2 = this.deckManager.dealCard();
    const dealerCard1 = this.deckManager.dealCard();
    const dealerCard2 = this.deckManager.dealCard();

    if (!card1 || !card2 || !dealerCard1 || !dealerCard2) {
      this.state.message = 'Error: Unable to deal cards';
      return;
    }

    this.state.playerHand.addCard(card1);
    this.state.playerHand.addCard(card2);
    this.state.dealerHand.addCard(dealerCard1);
    this.state.dealerHand.addCard(dealerCard2);

    // Check for insurance opportunity
    if (HandEvaluator.dealerShowsAce(this.state.dealerHand.cards)) {
      this.state.insuranceOffered = true;
      this.state.phase = GamePhase.PLAYER_TURN;
      this.state.message = 'Dealer shows Ace. Would you like insurance?';
    } else {
      this.state.phase = GamePhase.PLAYER_TURN;
      this.checkForBlackjack();
    }
  }

  private checkForBlackjack(): void {
    if (this.state.playerHand.isBlackjack) {
      this.state.message = 'Blackjack!';
      // Dealer still needs to check for blackjack
      this.state.phase = GamePhase.DEALER_TURN;
      this.playDealerTurn();
    } else {
      this.state.message = 'Your turn';
    }
  }

  takeInsurance(): void {
    if (!this.state.insuranceOffered || this.state.insuranceTaken) {
      return;
    }

    const insuranceAmount = this.state.currentBet / 2;
    if (insuranceAmount > this.state.playerBalance) {
      this.state.message = 'Insufficient balance for insurance';
      return;
    }

    this.state.playerBalance -= insuranceAmount;
    this.state.playerHand.setInsuranceBet(insuranceAmount);
    this.state.insuranceTaken = true;

    // Check if dealer has blackjack
    if (this.state.dealerHand.isBlackjack) {
      // Insurance pays 2:1
      this.state.playerBalance += insuranceAmount * 3; // Return insurance + 2x payout
      // Original bet pushes
      this.state.playerBalance += this.state.currentBet;
      this.state.message = 'Dealer has blackjack. Insurance pays!';
      this.state.phase = GamePhase.RESULT;
      this.endHand();
    } else {
      this.state.message = 'Insurance lost. Continue playing.';
    }
  }

  declineInsurance(): void {
    if (!this.state.insuranceOffered) return;
    this.state.insuranceOffered = false;
    this.state.message = 'Your turn';
  }

  hit(): void {
    if (this.state.phase !== GamePhase.PLAYER_TURN) return;

    const card = this.deckManager.dealCard();
    if (!card) {
      this.state.message = 'Error: Unable to deal card';
      return;
    }

    this.state.playerHand.addCard(card);

    if (this.state.playerHand.isBusted) {
      this.state.message = 'Bust! You lose.';
      this.state.phase = GamePhase.RESULT;
      this.endHand();
    } else {
      this.state.message = 'Your turn';
    }
  }

  stand(): void {
    if (this.state.phase !== GamePhase.PLAYER_TURN) return;

    this.state.phase = GamePhase.DEALER_TURN;
    this.playDealerTurn();
  }

  doubleDown(): void {
    if (this.state.phase !== GamePhase.PLAYER_TURN) return;
    if (!this.state.playerHand.canDoubleDown()) return;

    const additionalBet = this.state.currentBet;
    if (additionalBet > this.state.playerBalance) {
      this.state.message = 'Insufficient balance to double down';
      return;
    }

    this.state.playerBalance -= additionalBet;
    const card = this.deckManager.dealCard();
    if (!card) {
      this.state.message = 'Error: Unable to deal card';
      return;
    }

    this.state.playerHand.doubleDown(card);

    if (this.state.playerHand.isBusted) {
      this.state.message = 'Bust! You lose.';
      this.state.phase = GamePhase.RESULT;
      this.endHand();
    } else {
      this.state.phase = GamePhase.DEALER_TURN;
      this.playDealerTurn();
    }
  }

  split(): void {
    if (this.state.phase !== GamePhase.PLAYER_TURN) return;
    if (!this.state.playerHand.canSplit()) return;

    const additionalBet = this.state.currentBet;
    if (additionalBet > this.state.playerBalance) {
      this.state.message = 'Insufficient balance to split';
      return;
    }

    this.state.playerBalance -= additionalBet;

    // Create split hand
    const splitCard = this.state.playerHand.cards.pop()!;
    this.state.playerHand.isSplit = true;
    this.state.playerSplitHand = new Hand(additionalBet, true);
    this.state.playerSplitHand.addCard(splitCard);

    // Deal one card to each hand
    const card1 = this.deckManager.dealCard();
    const card2 = this.deckManager.dealCard();
    if (!card1 || !card2) {
      this.state.message = 'Error: Unable to deal cards';
      return;
    }

    this.state.playerHand.addCard(card1);
    this.state.playerSplitHand.addCard(card2);

    this.state.message = 'Playing first hand';
  }

  surrender(): void {
    if (this.state.phase !== GamePhase.PLAYER_TURN) return;
    if (this.state.playerHand.cards.length !== 2) return;

    this.state.playerHand.surrender();
    this.state.playerBalance += this.state.currentBet / 2; // Return half bet
    this.state.message = 'Hand surrendered. You lose half your bet.';
    this.state.phase = GamePhase.RESULT;
    this.endHand();
  }

  private playDealerTurn(): void {
    // Reveal dealer's hidden card
    const dealerCards = DealerAI.playTurn(
      this.state.dealerHand.cards,
      () => this.deckManager.dealCard() || null
    );

    this.state.dealerHand = new Hand(0);
    dealerCards.forEach(card => this.state.dealerHand.addCard(card));

    this.determineResult();
  }

  private determineResult(): void {
    const playerValue = this.state.playerHand.getValue();
    const dealerValue = this.state.dealerHand.getValue();

    // Handle surrender
    if (this.state.playerHand.isSurrendered) {
      this.state.phase = GamePhase.RESULT;
      this.endHand();
      return;
    }

    // Handle player bust
    if (this.state.playerHand.isBusted) {
      this.state.message = 'You busted. Dealer wins.';
      this.state.phase = GamePhase.RESULT;
      this.endHand();
      return;
    }

    // Handle dealer bust
    if (this.state.dealerHand.isBusted) {
      let payout = this.state.currentBet * 2;
      if (this.state.playerHand.isBlackjack) {
        payout = Math.floor(this.state.currentBet * 2.5); // 3:2 payout
      }
      this.state.playerBalance += payout;
      this.state.message = 'Dealer busted! You win!';
      this.state.phase = GamePhase.RESULT;
      this.endHand();
      return;
    }

    // Compare values
    if (this.state.playerHand.isBlackjack && !this.state.dealerHand.isBlackjack) {
      const payout = Math.floor(this.state.currentBet * 2.5); // 3:2 payout
      this.state.playerBalance += payout;
      this.state.message = 'Blackjack! You win!';
    } else if (playerValue > dealerValue) {
      const payout = this.state.currentBet * 2;
      this.state.playerBalance += payout;
      this.state.message = 'You win!';
    } else if (playerValue < dealerValue) {
      this.state.message = 'Dealer wins.';
    } else {
      // Push
      this.state.playerBalance += this.state.currentBet;
      this.state.message = 'Push! It\'s a tie.';
    }

    this.state.phase = GamePhase.RESULT;
    this.endHand();
  }

  private endHand(): void {
    // Store the bet amount for potential reuse, then reset it
    // The bet amount is already reflected in the balance (wins/losses applied)
    // We'll keep currentBet for betAgain/betAndDealAgain to use
    
    // Check if game over
    if (this.state.playerBalance < this.MIN_BET) {
      this.state.phase = GamePhase.GAME_OVER;
      this.state.message = 'Game Over! Insufficient balance to continue.';
    }
  }

  betAndDealAgain(betAmount?: number): void {
    if (this.state.phase !== GamePhase.RESULT && this.state.phase !== GamePhase.GAME_OVER) {
      return;
    }

    const bet = betAmount || this.state.currentBet;
    if (bet > this.state.playerBalance) {
      this.state.message = 'Insufficient balance';
      return;
    }

    if (this.state.playerBalance < this.MIN_BET) {
      this.state.phase = GamePhase.GAME_OVER;
      this.state.message = 'Game Over! Insufficient balance to continue.';
      return;
    }

    // Set the bet and automatically deal
    this.state.currentBet = bet;
    this.state.playerBalance -= bet;
    this.state.phase = GamePhase.DEALING;
    this.deal();
  }

  betAgain(): void {
    if (this.state.phase !== GamePhase.RESULT && this.state.phase !== GamePhase.GAME_OVER) {
      return;
    }

    if (this.state.playerBalance < this.MIN_BET) {
      this.state.phase = GamePhase.GAME_OVER;
      this.state.message = 'Game Over! Insufficient balance to continue.';
      return;
    }

    // Set bet to previous amount but stay in BETTING phase for user to adjust
    const previousBet = this.state.currentBet || this.MIN_BET;
    this.state.currentBet = Math.min(previousBet, this.state.playerBalance);
    this.state.phase = GamePhase.BETTING;
    this.state.message = 'Adjust your bet amount if needed, then click Deal';
  }

  resetGame(newStartingBalance?: number): void {
    const balance = newStartingBalance || this.state.startingBalance;
    this.deckManager.reset();
    this.state = this.createInitialState(balance);
  }
}

