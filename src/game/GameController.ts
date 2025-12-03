import { GamePhase, GameState } from '../types/GameState';
import { DeckManager } from './DeckManager';
import { HandEvaluator } from './HandEvaluator';
import { DealerAI } from './DealerAI';
import { Hand } from './Hand';

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
      insuranceTaken: false,
      activeHand: 'main',
      mainHandComplete: false,
      minTableLimit: 0,
      maxTableLimit: 0
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
    // Stay in IDLE phase - don't auto-transition to BETTING
    this.state.message = 'Select table limits to continue';
  }

  setTableLimits(minLimit: number): void {
    const validLimits = [10, 15, 25, 50, 100, 250];
    if (!validLimits.includes(minLimit)) {
      this.state.message = 'Invalid table limit selected';
      return;
    }
    
    this.state.minTableLimit = minLimit;
    this.state.maxTableLimit = minLimit * 10;
    
    // Transition to BETTING phase if balance is set
    if (this.state.startingBalance > 0) {
      console.log('current phase: ' + GamePhase.BETTING);
      this.state.phase = GamePhase.BETTING;
      this.state.message = 'Place your bet';
    } else {
      this.state.message = 'Set your starting balance and table limits to begin';
    }
  }

  setBet(amount: number, onStateUpdate?: () => void): void {
    if (this.state.phase !== GamePhase.BETTING && this.state.phase !== GamePhase.IDLE) {
      return;
    }

    // Check if table limits are set
    if (this.state.minTableLimit === 0 || this.state.maxTableLimit === 0) {
      this.state.message = 'Table limits must be set before betting';
      return;
    }

    if (amount < this.state.minTableLimit) {
      this.state.message = `Minimum bet is $${this.state.minTableLimit}`;
      return;
    }

    if (amount > this.state.maxTableLimit) {
      this.state.message = `Maximum bet is $${this.state.maxTableLimit}`;
      return;
    }

    if (amount > this.state.playerBalance) {
      this.state.message = 'Insufficient balance';
      return;
    }

    this.state.currentBet = amount;
    this.state.playerBalance -= amount;
    console.log('current phase: ' + GamePhase.DEALING);
    this.state.phase = GamePhase.DEALING;
    this.deal(onStateUpdate); // Pass callback to deal
  }

  private async deal(onStateUpdate?: () => void): Promise<void> {
    this.state.playerHand = new Hand(this.state.currentBet);
    this.state.dealerHand = new Hand(0);
    this.state.playerSplitHand = undefined;
    this.state.insuranceOffered = false;
    this.state.insuranceTaken = false;
    this.state.activeHand = 'main';
    this.state.mainHandComplete = false;

    // Define the dealing order: [playerIndex, dealerIndex, playerIndex, dealerIndex, ...]
    // For future expansion: could be [player1, player2, dealer, player1, player2, dealer]
    const dealingOrder: Array<{ target: 'player' | 'dealer', isFaceDown: boolean }> = [
      { target: 'player', isFaceDown: false },  // Player card 1
      { target: 'dealer', isFaceDown: false },   // Dealer card 1 (face up)
      { target: 'player', isFaceDown: false },   // Player card 2
      { target: 'dealer', isFaceDown: true },    // Dealer card 2 (face down)
    ];

    // Deal cards one at a time
    for (let i = 0; i < dealingOrder.length; i++) {
      const card = this.deckManager.dealCard();
      if (!card) {
        this.state.message = 'Error: Unable to deal cards';
        return;
      }

      const { target } = dealingOrder[i];
      
      if (target === 'player') {
        this.state.playerHand.addCard(card);
      } else {
        this.state.dealerHand.addCard(card);
      }

      // Notify UI to update after each card
      if (onStateUpdate) {
        onStateUpdate();
      }
      
      // Wait before dealing next card (400ms delay between cards)
      if (i < dealingOrder.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // After all cards are dealt, check for insurance
    if (HandEvaluator.dealerShowsAce(this.state.dealerHand.cards)) {
      this.state.insuranceOffered = true;
      console.log('current phase: ' + GamePhase.PLAYER_TURN);
      this.state.phase = GamePhase.PLAYER_TURN;
      this.state.message = 'Dealer shows Ace. Would you like insurance?';
    } else {
      console.log('current phase: ' + GamePhase.PLAYER_TURN);
      this.state.phase = GamePhase.PLAYER_TURN;
      this.checkForBlackjack();
    }
    
    // Final UI update after dealing is complete
    if (onStateUpdate) {
      onStateUpdate();
    }
  }

  private checkForBlackjack(): void {
    if (this.state.playerHand.isBlackjack) {
      this.state.message = 'Blackjack! Continue playing.';
      // Don't auto-transition to dealer turn - let player continue
      // Dealer blackjack will be checked in DEALER_TURN phase
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

    // Deduct insurance amount and continue to normal player actions
    // Insurance payout will be handled after dealer reveals card
    this.state.playerBalance -= insuranceAmount;
    this.state.playerHand.setInsuranceBet(insuranceAmount);
    this.state.insuranceTaken = true;
    this.state.insuranceOffered = false; // Hide insurance buttons
    this.state.message = 'Insurance taken. Your turn';
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

    // Get the active hand
    const activeHand = this.state.activeHand === 'split' && this.state.playerSplitHand
      ? this.state.playerSplitHand
      : this.state.playerHand;

    activeHand.addCard(card);

    if (activeHand.isBusted) {
      if (this.state.activeHand === 'main' && this.state.playerSplitHand) {
        // Main hand busted, switch to split hand
        this.state.mainHandComplete = true;
        this.state.activeHand = 'split';
        this.state.message = 'First hand busted. Playing second hand.';
      } else {
        // Current hand busted, check if we can continue with other hand
        if (this.state.playerSplitHand && this.state.activeHand === 'main') {
          this.state.mainHandComplete = true;
          this.state.activeHand = 'split';
          this.state.message = 'First hand busted. Playing second hand.';
        } else {
          // Both hands done or no split, end hand
          this.state.message = 'Bust! You lose.';
          console.log('current phase: ' + GamePhase.RESULT);
          this.state.phase = GamePhase.RESULT;
          this.endHand();
        }
      }
    } else {
      this.state.message = this.state.activeHand === 'split' ? 'Playing second hand' : 'Your turn';
    }
  }

  stand(): void {
    if (this.state.phase !== GamePhase.PLAYER_TURN) return;

    // Mark current hand as complete
    if (this.state.activeHand === 'main') {
      this.state.mainHandComplete = true;
      
      // If split hand exists, switch to it
      if (this.state.playerSplitHand) {
        this.state.activeHand = 'split';
        this.state.message = 'First hand complete. Playing second hand.';
        return;
      }
    }

    // Both hands complete, proceed to dealer turn
    console.log('current phase: ' + GamePhase.DEALER_TURN);
    this.state.phase = GamePhase.DEALER_TURN;
    this.playDealerTurn();
  }

  doubleDown(): void {
    if (this.state.phase !== GamePhase.PLAYER_TURN) return;

    // Get the active hand
    const activeHand = this.state.activeHand === 'split' && this.state.playerSplitHand
      ? this.state.playerSplitHand
      : this.state.playerHand;

    if (!activeHand.canDoubleDown()) return;

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

    activeHand.doubleDown(card);

    // Mark current hand as complete (double down ends the hand)
    if (this.state.activeHand === 'main') {
      this.state.mainHandComplete = true;
      
      // If split hand exists and main hand not busted, switch to split
      if (this.state.playerSplitHand && !activeHand.isBusted) {
        this.state.activeHand = 'split';
        this.state.message = 'First hand doubled. Playing second hand.';
        return;
      }
    }

    if (activeHand.isBusted) {
      // Check if we can continue with other hand
      if (this.state.playerSplitHand && this.state.activeHand === 'main') {
        this.state.mainHandComplete = true;
        this.state.activeHand = 'split';
        this.state.message = 'First hand busted. Playing second hand.';
      } else {
        this.state.message = 'Bust! You lose.';
        this.state.phase = GamePhase.RESULT;
        this.endHand();
      }
    } else {
      // Hand complete, check if we need to switch to split hand
      if (this.state.activeHand === 'main' && this.state.playerSplitHand) {
        this.state.activeHand = 'split';
        this.state.message = 'First hand doubled. Playing second hand.';
      } else {
        // Both hands complete, proceed to dealer turn
        console.log('current phase: ' + GamePhase.DEALER_TURN);
        this.state.phase = GamePhase.DEALER_TURN;
        this.playDealerTurn();
      }
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

    // Set active hand to main and reset completion status
    this.state.activeHand = 'main';
    this.state.mainHandComplete = false;
    this.state.message = 'Playing first hand';
  }

  surrender(): void {
    if (this.state.phase !== GamePhase.PLAYER_TURN) return;
    if (this.state.playerHand.cards.length !== 2) return;

    this.state.playerHand.surrender();
    this.state.playerBalance += this.state.currentBet / 2; // Return half bet
    this.state.message = 'Hand surrendered. You lose half your bet.';
    console.log('current phase: ' + GamePhase.RESULT);
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

    // Handle insurance payout after dealer reveals card
    if (this.state.insuranceTaken && this.state.playerHand.insuranceBet) {
      const insuranceAmount = this.state.playerHand.insuranceBet;
      if (this.state.dealerHand.isBlackjack) {
        // Insurance pays 2:1 if dealer has blackjack
        this.state.playerBalance += insuranceAmount * 3; // Return insurance + 2x payout
        // Original bet pushes (will be handled in determineResult)
      }
      // If dealer doesn't have blackjack, insurance is lost (already deducted)
    }

    this.determineResult();
  }

  private determineResult(): void {
    const dealerValue = this.state.dealerHand.getValue();
    let totalPayout = 0;
    const results: string[] = [];

    // Handle surrender (only applies to main hand)
    if (this.state.playerHand.isSurrendered) {
      this.state.playerBalance += this.state.currentBet / 2; // Return half bet
      results.push('First hand surrendered');
      console.log('current phase: ' + GamePhase.RESULT);
      this.state.phase = GamePhase.RESULT;
      this.endHand();
      return;
    }

    // Handle dealer bust
    const dealerBusted = this.state.dealerHand.isBusted;

    // Calculate result for main hand
    if (!this.state.playerHand.isBusted) {
      const mainPayout = this.calculateHandResult(
        this.state.playerHand,
        this.state.currentBet,
        dealerValue,
        dealerBusted
      );
      totalPayout += mainPayout.payout;
      if (mainPayout.message) {
        results.push(`First hand: ${mainPayout.message}`);
      }
    } else {
      results.push('First hand: Bust');
    }

    // Calculate result for split hand if it exists
    if (this.state.playerSplitHand && !this.state.playerSplitHand.isBusted) {
      const splitPayout = this.calculateHandResult(
        this.state.playerSplitHand,
        this.state.currentBet,
        dealerValue,
        dealerBusted
      );
      totalPayout += splitPayout.payout;
      if (splitPayout.message) {
        results.push(`Second hand: ${splitPayout.message}`);
      }
    } else if (this.state.playerSplitHand && this.state.playerSplitHand.isBusted) {
      results.push('Second hand: Bust');
    }

    // Handle dealer blackjack with insurance (affects both hands)
    if (this.state.dealerHand.isBlackjack) {
      if (this.state.insuranceTaken) {
        // Insurance already paid out in playDealerTurn()
        // Original bets push (returned) for both hands
        const betAmount = this.state.currentBet;
        if (!this.state.playerHand.isBusted) {
          this.state.playerBalance += betAmount;
        }
        if (this.state.playerSplitHand && !this.state.playerSplitHand.isBusted) {
          this.state.playerBalance += betAmount;
        }
        this.state.message = 'Dealer has blackjack. Insurance pays! Original bets returned.';
      } else {
        // No insurance, dealer wins all non-busted hands
        this.state.message = 'Dealer has blackjack. Dealer wins.';
      }
      console.log('current phase: ' + GamePhase.RESULT);
      this.state.phase = GamePhase.RESULT;
      this.endHand();
      return;
    }

    // Apply total payout
    this.state.playerBalance += totalPayout;

    // Build result message
    if (results.length > 0) {
      this.state.message = results.join(' | ');
    } else {
      this.state.message = 'Hand complete';
    }

    console.log('current phase: ' + GamePhase.RESULT);
    this.state.phase = GamePhase.RESULT;
    this.endHand();
  }

  private calculateHandResult(hand: Hand, bet: number, dealerValue: number, dealerBusted: boolean): { payout: number; message: string } {
    const handValue = hand.getValue();
    let payout = 0;
    let message = '';

    // Handle dealer bust
    if (dealerBusted) {
      if (hand.isBlackjack) {
        payout = Math.floor(bet * 2.5); // 3:2 payout
        message = 'Blackjack! You win!';
      } else {
        payout = bet * 2;
        message = 'You win!';
      }
      return { payout, message };
    }

    // Compare values
    if (hand.isBlackjack && !this.state.dealerHand.isBlackjack) {
      payout = Math.floor(bet * 2.5); // 3:2 payout
      message = 'Blackjack! You win!';
    } else if (handValue > dealerValue) {
      payout = bet * 2;
      message = 'You win!';
    } else if (handValue < dealerValue) {
      payout = 0;
      message = 'Dealer wins';
    } else {
      // Push
      payout = bet;
      message = 'Push';
    }

    return { payout, message };
  }

  private endHand(): void {
    // Store the bet amount for potential reuse, then reset it
    // The bet amount is already reflected in the balance (wins/losses applied)
    // We'll keep currentBet for betAgain/betAndDealAgain to use
    
    // Check if game over
    if (this.state.playerBalance < (this.state.minTableLimit || this.MIN_BET)) {
      console.log('current phase: ' + GamePhase.GAME_OVER);
      this.state.phase = GamePhase.GAME_OVER;
      this.state.message = 'Game Over! Insufficient balance to continue.';
    }
  }

  betAndDealAgain(betAmount?: number, onStateUpdate?: () => void): void {
    if (this.state.phase !== GamePhase.RESULT && this.state.phase !== GamePhase.GAME_OVER) {
      return;
    }

    const bet = betAmount || this.state.currentBet;
    if (bet > this.state.playerBalance) {
      this.state.message = 'Insufficient balance';
      return;
    }

    if (this.state.playerBalance < (this.state.minTableLimit || this.MIN_BET)) {
      console.log('current phase: ' + GamePhase.GAME_OVER);
      this.state.phase = GamePhase.GAME_OVER;
      this.state.message = 'Game Over! Insufficient balance to continue.';
      return;
    }

    // Set the bet and automatically deal
    this.state.currentBet = bet;
    this.state.playerBalance -= bet;
    console.log('current phase: ' + GamePhase.DEALING);
    this.state.phase = GamePhase.DEALING;
    this.deal(onStateUpdate);
  }

  betAgain(): void {
    if (this.state.phase !== GamePhase.RESULT && this.state.phase !== GamePhase.GAME_OVER) {
      return;
    }

    if (this.state.playerBalance < (this.state.minTableLimit || this.MIN_BET)) {
      console.log('current phase: ' + GamePhase.GAME_OVER);
      this.state.phase = GamePhase.GAME_OVER;
      this.state.message = 'Game Over! Insufficient balance to continue.';
      return;
    }

    // Set bet to previous amount but stay in BETTING phase for user to adjust
    const previousBet = this.state.currentBet || (this.state.minTableLimit || this.MIN_BET);
    this.state.currentBet = Math.min(previousBet, this.state.playerBalance);
    console.log('current phase: ' + GamePhase.BETTING);
    this.state.phase = GamePhase.BETTING;
    this.state.message = 'Adjust your bet amount if needed, then click Deal';
  }

  resetGame(newStartingBalance?: number): void {
    const balance = newStartingBalance || this.state.startingBalance;
    this.deckManager.reset();
    this.state = this.createInitialState(balance);
  }
}

