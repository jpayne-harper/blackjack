export enum Suit {
  CLUBS = 'clubs',
  DIAMONDS = 'diamonds',
  HEARTS = 'hearts',
  SPADES = 'spades'
}

export enum Rank {
  ACE = 'ace',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'jack',
  QUEEN = 'queen',
  KING = 'king'
}

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;  // For Ace: 1 or 11 (context-dependent)
  imagePath: string;
}

