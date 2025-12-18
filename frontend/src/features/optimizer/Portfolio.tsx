import React, { useEffect, useState } from "react";
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

const Portfolio = () => {
  const [tickers, setTickers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<[]>([]);
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

  const getPortfolioData = async () => {
    try {
      const res = await fetch("/finet/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers }),
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

  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${apiKey}`
      );

      const data = await res.json();

      if (data.bestMatches) {
        setSearchResults(data.bestMatches);
      }
    } catch {
      setError("Failed to fetch search results");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTicker = (ticker: string) => {
    if (!tickers.includes(ticker)) {
      setTickers([...tickers, ticker]);
    }
  };

  const handleRemoveTicker = (ticker: string) => {
    setTickers(tickers.filter((t) => t !== ticker));
  };

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     if (query.trim().length > 1)
  //       handleSearch(
  //         new Event("submit") as unknown as React.FormEvent<HTMLFormElement>
  //       );
  //   }, 100);

  //   return () => clearTimeout(timer);
  // }, [query]);

  // const createPortfolioData = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();

  //   try {
  //     const res = await fetch("/finet/analysis", {
  //       method: "POST",
  //       headers: { "content-type": "application/json" },
  //       body: JSON.stringify({ tickers: [] }),
  //     });

  //     if (!res.ok) {
  //       throw new Error("Failed to fetch portfolio data");
  //     }

  //     const data = await res.json();
  //     console.log("Portfolio data fetched:", data);
  //   } catch {
  //     console.error("Error fetching portfolio data");
  //   }
  // };

  //   handleAddTicker(newTicker);
  // };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      <Navbar />

      {/* Ticker Selector */}
      <section className="container mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow mb-10 mg-top-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
          Build Portfolio
        </h3>
        <form onSubmit={handleSearch} className="flex gap-4 items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for company or ticker symbol"
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            Search for ticker
            {loading ? "..." : ""}
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

        {/* Autocomplete Search Results */}
        {searchResults.length > 0 && (
          <ul className="mt-4 max-h-48 overflow-y-auto border-t pt-2">
            {searchResults.slice(0, 5).map((result) => (
              <li
                key={result["1. symbol"]}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => handleAddTicker(result["1. symbol"])}
              >
                {result["1. symbol"]} - {result["2. name"]}
              </li>
            ))}
          </ul>
        )}

        {/* Selected Tickers */}
        {tickers.length > 0 && (
          <ul className="mt-4 max-h-48 overflow-y-auto border-t pt-2">
            {tickers.map((ticker) => (
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
      </section>

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
