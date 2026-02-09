import type { PortfolioResponse, TickerMeta } from "./optimizer.types";

type PortfolioPanelProps = {
  selectedTickers: string[];
  portfolio: PortfolioResponse | null;
  tickerMetaBySymbol?: Record<string, TickerMeta | undefined>;
  onRun: () => void;
  onRemoveTicker: (ticker: string) => void;
  isRunning?: boolean;
};

function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  if (Number.isNaN(value) || !Number.isFinite(value)) return "–";
  return `${(value * 100).toFixed(2)}%`;
}

function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return "–";
  if (Number.isNaN(value) || !Number.isFinite(value)) return "–";
  return value.toFixed(decimals);
}

const PortfolioPanel = ({
  selectedTickers,
  portfolio,
  tickerMetaBySymbol,
  onRun,
  onRemoveTicker,
  isRunning,
}: PortfolioPanelProps) => {
  const n = selectedTickers.length;
  const hasPortfolio = Boolean(portfolio?.BestPortfolio);

  const equalWeight = 0;

  const getWeight = (ticker: string): number | null => {
    if (!hasPortfolio) return equalWeight;
    const w = portfolio!.BestPortfolio.Weights?.[ticker];
    if (w === undefined || w === null) return null;
    if (!Number.isFinite(w) || Number.isNaN(w)) return null;
    return w;
  };

  const totalWeight = selectedTickers.reduce((sum, t) => {
    const w = getWeight(t);
    return sum + (w ?? 0);
  }, 0);

  const retPct =
    hasPortfolio ? formatPct(portfolio!.BestPortfolio.Return * 12) : "–";
  const volPct =
    hasPortfolio ?
      formatPct(portfolio!.BestPortfolio.Risk * Math.sqrt(12))
    : "–";
  const sharpe =
    hasPortfolio ? formatNumber(portfolio!.BestPortfolio.Sharpe, 2) : "–";

  return (
    <section className="container mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow mb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Portfolio
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {n === 0 ?
              "Add tickers above to build a portfolio."
            : `${n} tickers selected`}
          </div>
        </div>

        <button
          onClick={onRun}
          disabled={Boolean(isRunning) || n === 0}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? "Running..." : "Run Optimization"}
        </button>
      </div>

      {n === 0 ?
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Select tickers to populate the table.
        </div>
      : <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/30">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Ticker
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Company
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Industry
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">
                  Weight
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {selectedTickers.map((ticker) => {
                const meta = tickerMetaBySymbol?.[ticker];
                const w = getWeight(ticker);

                return (
                  <tr
                    key={ticker}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/20"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {ticker}
                    </td>

                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {meta?.name ?? "–"}
                    </td>

                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {meta?.industry ?? "–"}
                    </td>

                    <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-gray-100">
                      {formatPct(w)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onRemoveTicker(ticker)}
                        className="inline-flex items-center px-3 py-1.5 rounded-md border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-900/20"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot className="bg-gray-50 dark:bg-gray-900/30">
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-3 text-gray-600 dark:text-gray-300"
                >
                  {hasPortfolio ?
                    "Optimized weights"
                  : "Equal weights (preview)"}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                  {hasPortfolio ? formatPct(totalWeight) : "–"}
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      }

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Annualized Return
          </div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {retPct}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Annualized Volatility
          </div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {volPct}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Sharpe Ratio (monthly returns)
          </div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {sharpe}
          </div>
        </div>
      </div>

      {!hasPortfolio && n > 0 && (
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          No optimization results yet. Click “Run Optimization” to compute
          portfolio metrics.
        </div>
      )}
    </section>
  );
};

export default PortfolioPanel;
