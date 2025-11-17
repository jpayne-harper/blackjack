import { Hand } from './Hand';
import { Card } from './Card';

export enum GamePhase {
  IDLE = 'idle',
  BETTING = 'betting',
  DEALING = 'dealing',
  PLAYER_TURN = 'player_turn',
  DEALER_TURN = 'dealer_turn',
  RESULT = 'result',
  GAME_OVER = 'game_over'
}

export interface GameState {
  phase: GamePhase;
  playerHand: Hand;
  dealerHand: Hand;
  playerSplitHand?: Hand;  // Optional second hand if split
  deck: Card[];
  currentBet: number;
  playerBalance: number;
  startingBalance: number;
  message: string;
  insuranceOffered: boolean;
  insuranceTaken: boolean;
  activeHand: 'main' | 'split';  // Track which hand is currently being played
  mainHandComplete: boolean;      // Track if main hand is done (for split scenarios)
}

