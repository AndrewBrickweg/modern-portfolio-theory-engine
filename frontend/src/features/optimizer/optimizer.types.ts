export type BestPortfolio = {
  Weights: Record<string, number>;
  Return: number;
  Risk: number;
  Sharpe: number;
};

export type PortfolioResponse = {
  BestPortfolio: BestPortfolio;
  Returns: Record<string, number[]>;
};

export type Ticker = {
  ticker: string;
  company_name: string | null;
  industry: string | null;
};

export type TickerMeta = {
  name: string;
  industry?: string;
  sector?: string;
};
