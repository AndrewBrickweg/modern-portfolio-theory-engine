# modern-portfolio-theory-engine

Frontend application for the Modern Portfolio Theory (MPT) engine. This UI is built with React, TypeScript, and Vite.

## Features

- User authentication flows (`/`, `/register`)
- Portfolio construction from searchable ticker data
- Portfolio optimization with annualized return, volatility, Sharpe, and optimized weights
- Time Value of Money (TVM) projection and charting

## Tech Stack

- React 18 + TypeScript
- Vite
- React Router
- Tailwind CSS
- Recharts / Chart.js

## Prerequisites

- Node.js 18+
- npm
- Backend service running on `http://localhost:8000`

## Getting Started

```bash
npm install
npm run dev
```

The frontend runs on Vite's local server (usually `http://localhost:5173`).

## Backend Integration

During local development, Vite proxies API calls to `http://localhost:8000` for:

- `/login`
- `/register`
- `/portfolio`
- `/tickers`
- `/logout`

Proxy settings are configured in `vite.config.ts`.

## Available Scripts

```bash
npm run dev      # start development server
npm run build    # type-check and build production assets
npm run preview  # preview production build locally
npm run lint     # run ESLint
```
