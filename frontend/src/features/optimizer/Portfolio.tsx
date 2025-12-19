import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import PortfolioChart from "./PortfolioChart";
import CPICalculator from "../simulator/CPICalculator";

type BestPortfolio = {
  Weights: Record<string, number>;
  Return: number;
  Risk: number;
  Sharpe: number;
};

type PortfolioResponse = {
  BestPortfolio: BestPortfolio;
  Returns: Record<string, number[]>;
};

// const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

const Portfolio = () => {
  // const [tickers, setTickers] = useState<string[]>([]);

  const [allTickers, setAllTickers] = useState<string[]>([]);
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [filteredTickers, setFilteredTickers] = useState<string[]>([]);

  // const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");

  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [cpiData, setCpiData] = useState({
    initialInvestment: 0,
    monthlyContribution: 0,
    years: 0,
    expectedReturn: 0,
    variance: 0,
  });

  //set cpi data from state
  useEffect(() => {
    if (!portfolio?.BestPortfolio?.Return) return;

    setCpiData((prev) => ({
      ...prev,
      expectedReturn: Number((portfolio.BestPortfolio.Return * 12).toFixed(2)),
    }));
  }, [portfolio]);

  //request portfolio from db
  const getPortfolioData = async () => {
    try {
      const res = await fetch("/finet/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers: selectedTickers }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch portfolio data");
      }

      const data = await res.json();
      setPortfolio(data);
      console.log("Portfolio data fetched:", data);
    } catch {
      console.error("Error fetching portfolio data");
    }
  };

  //fetch all tickers from db + load tickers on mount
  async function fetchTickers(): Promise<string[]> {
    const res = await fetch("/finet/tickers");

    if (!res.ok) {
      throw new Error("Failed to fetch tickers");
    }

    return res.json();
  }

  useEffect(() => {
    async function loadTickers() {
      try {
        const data = await fetchTickers();
        setAllTickers(data);
        setFilteredTickers(data);
      } catch {
        setError("Failed to load tickers");
      }
    }

    loadTickers();
  }, []);

  // refresh search
  useEffect(() => {
    if (!query.trim()) {
      setFilteredTickers(allTickers);
      return;
    }

    const lower = query.toLowerCase();

    const filtered = allTickers.filter((t) => t.toLowerCase().includes(lower));

    setFilteredTickers(filtered);
  }, [query, allTickers]);

  // const handleSearchAPI = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   if (!query) return;

  //   setLoading(true);
  //   setError(null);

  //   try {
  //     const res = await fetch(
  //       `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${apiKey}`
  //     );

  //     const data = await res.json();

  //     if (data.bestMatches) {
  //       setSearchResults(data.bestMatches);
  //     }
  //   } catch {
  //     setError("Failed to fetch search results");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleAddTicker = (ticker: string) => {
    if (!selectedTickers.includes(ticker)) {
      setSelectedTickers([...selectedTickers, ticker]);
    }
  };

  const handleRemoveTicker = (ticker: string) => {
    setSelectedTickers(selectedTickers.filter((t) => t !== ticker));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      <Navbar />

      {/* Ticker Selector */}
      <section className="container mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow mb-10 mg-top-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
          Build Portfolio
        </h3>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex gap-4 items-center"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for company or ticker symbol"
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            Search for ticker
          </button>
        </form>
        <button
          onClick={getPortfolioData}
          className="bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Run Portfolio Optimizer
        </button>

        {error && (
          <p className="text-red-500 mt-2 text-sm font-medium">{error}</p>
        )}

        {filteredTickers.length > 0 && (
          <ul className="mt-4 max-h-48 overflow-y-auto border-t pt-2">
            {filteredTickers.slice(0, 10).map((ticker) => (
              <li
                key={ticker}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => handleAddTicker(ticker)}
              >
                {ticker}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Selected Tickers */}
      {selectedTickers.length > 0 && (
        <ul className="mt-4 max-h-48 overflow-y-auto border-t pt-2">
          {selectedTickers.map((ticker) => (
            <li
              key={ticker}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => handleRemoveTicker(ticker)}
            >
              {ticker}
            </li>
          ))}
        </ul>
      )}

      {/* portfolio results if exists */}
      <div>
        {portfolio && (
          <section className="container mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow mb-10">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
              Optimal Portfolio Allocation
            </h3>

            <div className="space-y-2 text-gray-800 dark:text-gray-200">
              <p>
                <strong>Historical Annual Return:</strong>{" "}
                {(portfolio.BestPortfolio.Return * 12).toFixed(2)}%
              </p>
              <p>
                <strong>Risk (Volatility):</strong>{" "}
                {(portfolio.BestPortfolio.Risk * Math.sqrt(12)).toFixed(2)}%
              </p>
              <p>
                <strong>Sharpe Ratio:</strong>{" "}
                {portfolio.BestPortfolio.Sharpe.toFixed(2)}
              </p>

              <h4 className="font-semibold mt-4">Weights:</h4>
              <ul className="list-disc pl-5">
                {Object.entries(portfolio.BestPortfolio.Weights).map(
                  ([ticker, weight]) => (
                    <li key={ticker}>
                      {ticker}: {(weight * 100).toFixed(1)}%
                    </li>
                  )
                )}
              </ul>
            </div>
          </section>
        )}
      </div>

      <CPICalculator onChange={setCpiData} defaults={cpiData} />

      <PortfolioChart cpiData={cpiData} />

      <Footer />
    </div>
  );
};

export default Portfolio;
