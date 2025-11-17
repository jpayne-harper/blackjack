# Blackjack Game

A single-player blackjack web application that can be embedded via iframe. Built with TypeScript, Vite, and SCSS.

https://jpayne-harper.github.io/blackjack/

## Features

- Single-player blackjack game
- Virtual chips with configurable starting balance
- Full blackjack rules: Hit, Stand, Double Down, Split, Insurance, Surrender
- "Bet & Deal Again" button for seamless gameplay
- Responsive design for desktop, tablet, and mobile
- Iframe-ready for embedding on any website
- No backend required - pure client-side application

## Technology Stack

- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **SCSS** - Styled with navy blue and gold branding
- **Vitest** - Unit testing framework

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The game will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to GitHub Pages.

### Testing

```bash
npm test
```

## Project Structure

```
blackjack/
├── src/
│   ├── types/          # TypeScript type definitions
│   ├── game/           # Game logic (Deck, Hand, Dealer AI, etc.)
│   ├── ui/             # UI components
│   ├── utils/          # Utility functions (AssetLoader, ImageMapper)
│   └── styles/         # SCSS stylesheets
├── cards/              # Card images (79x123px)
├── table/              # Table background image
└── dist/               # Build output (for GitHub Pages)
```

## Game Rules

- **Deck**: 4 decks (208 cards total)
- **Dealer Rules**: Hits on soft 17, stands on hard 17+
- **Blackjack Payout**: 3:2
- **Insurance**: Available when dealer shows Ace, pays 2:1
- **Surrender**: Available on first two cards only
- **Minimum Bet**: $5

## Deployment

### GitHub Pages

1. Push code to GitHub repository
2. GitHub Actions will automatically deploy to `gh-pages` branch
3. Enable GitHub Pages in repository settings

### Iframe Embedding

```html
<iframe 
  src="https://jpayne-harper.github.io/blackjack/" 
  width="800" 
  height="1000" 
  frameborder="0"
  allowfullscreen>
</iframe>
```

## License

MIT

