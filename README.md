# Margen

AI-powered tax research assistant built for speed and accuracy. Margen helps tax professionals prep taxes with intelligent form completion, comprehensive tax code understanding, and audit-ready documentation.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Utilities:** clsx, tailwind-merge

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page.

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Design system & custom CSS
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Landing page
│   └── chat/
│       └── page.tsx     # Research assistant interface
├── components/
│   ├── features/        # Product mockups & demos
│   ├── layout/          # Header, Footer, Navigation
│   ├── sections/        # Landing page sections
│   └── ui/              # Reusable UI components
├── lib/
│   ├── constants.ts     # App constants
│   └── utils.ts         # Utility functions
└── types/
    └── index.ts         # TypeScript types
```

## Design System

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#14120b` | Page background (warm brown) |
| `--color-card` | `#1b1913` | Card backgrounds |
| `--color-accent` | `#f54e00` | Primary actions (orange) |
| `--color-text` | `#edecec` | Primary text (warm white) |

### Spacing

- **Grid (horizontal):** 10px base (`--g`)
- **Vertical rhythm:** 1.4rem base (`--v`)

### Border Radius

- `--radius-xs`: 4px (cards, inputs)
- `--radius-full`: 9999px (buttons)

## Key Pages

### Landing Page (`/`)

Marketing page with:
- Hero section with product mockup
- Feature showcases (autocomplete, agent capabilities)
- Social proof & ecosystem partners
- Call to action

### Chat Interface (`/chat`)

Three-panel research assistant:
- **Left:** Client selector + chat history
- **Center:** Conversation with citations
- **Right:** Client context & documents

## Features

- **Audit-ready form completion** - Predictive data entry with traceable accuracy
- **Complete tax code understanding** - Semantic search across IRC sections
- **Multi-model support** - Access to Claude, GPT-4, Gemini, and more
- **Enterprise ready** - Secure, scalable architecture for accounting firms

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |

## License

Private - All rights reserved.
