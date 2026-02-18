import { useEffect, useState } from "react";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import TVMCalculator from "../simulator/TVMCalculator";
import PortfolioChart from "./PortfolioChart";
import PortfolioPanel from "./PortfolioPanel";
import type { PortfolioResponse, Ticker, TickerMeta } from "./optimizer.types";

//const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

const Portfolio = () => {
  const [allTickers, setAllTickers] = useState<Ticker[]>([]);
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [filteredTickers, setFilteredTickers] = useState<Ticker[]>([]);
  // const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [tickerMetaBySymbol, setTickerMetaBySymbol] = useState<
    Record<string, TickerMeta>
  >({});

  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [TVMData, setTVMData] = useState({
    initialInvestment: 0,
    monthlyContribution: 0,
    years: 0,
    expectedReturn: 0,
    variance: 0,
  });

  //request portfolio from db
  const getPortfolioData = async () => {
    try {
      const res = await fetch("/portfolio", {
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
  async function fetchTickers(): Promise<Ticker[]> {
    const res = await fetch("/tickers");

    if (!res.ok) {
      throw new Error("Failed to fetch tickers");
    }
    return res.json();
  }

  //load all tickers on mount
  useEffect(() => {
    async function loadTickers() {
      try {
        const data = await fetchTickers();

        const map: Record<string, TickerMeta> = {};

        for (const row of data) {
          map[row.ticker] = {
            name: row.company_name ?? "",
            industry: row.industry ?? undefined,
          };
        }

        setTickerMetaBySymbol(map);
        console.log("Tickers loaded:", data);
        setAllTickers(data);
        setFilteredTickers([]);
      } catch {
        setError("Failed to load tickers");
      }
    }

    loadTickers();
  }, []);

  //rank tickers based on query
  const rankTickers = (list: Ticker[], query: string): Ticker[] => {
    const q = query.trim().toLowerCase();
    if (!q) return list;

    const ranked = list
      .map((t) => {
        const ticker = t.ticker.toLowerCase();
        const name = (t.company_name ?? "").toLowerCase();
        const industry = (t.industry ?? "").toLowerCase();

        let rank = 999;

        if (ticker.startsWith(q)) rank = 0;
        else if (name.split(/\s+/).some((word) => word.startsWith(q))) rank = 1;
        else if (name.startsWith(q)) rank = 2;
        else if (ticker.includes(q)) rank = 3;
        else if (name.includes(q)) rank = 4;
        else if (industry.includes(q)) rank = 5;

        return { ticker: t, rank };
      })
      .filter((x) => x.rank !== 999);

    ranked.sort((a, b) => a.rank - b.rank);

    return ranked.map((x) => x.ticker);
  };

  // refresh search
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) {
      setFilteredTickers([]);
      return;
    }

    setFilteredTickers(rankTickers(allTickers, query));
  }, [query, allTickers]);

  const handleAddTicker = (ticker: string) => {
    if (!selectedTickers.includes(ticker)) {
      setSelectedTickers([...selectedTickers, ticker]);
    }
  };

  const handleRemoveTicker = (ticker: string) => {
    setSelectedTickers(selectedTickers.filter((t) => t !== ticker));
    setPortfolio(null);
  };

  //Original search function using Alpha Vantage API
  //const handleSearchAPI = async (e: React.FormEvent) => {
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      <Navbar />

      {/* Ticker Selector */}
      <section className="container mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow mb-10 mt-4">
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
            className="w-full p-2 mb-4 border rounded-lg dark:bg-gray-700 dark:text-white"
          />
        </form>

        {error && (
          <p className="text-red-500 mt-2 text-sm font-medium">{error}</p>
        )}

        {filteredTickers.slice(0, 10).map((t) => (
          <li
            key={t.ticker}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white cursor-pointer"
            onClick={() => handleAddTicker(t.ticker)}
          >
            <div className="font-medium">{t.ticker}</div>
            <div className="text-sm opacity-70">
              {t.company_name ?? "Unknown"}
              {t.industry ? ` • ${t.industry}` : ""}
            </div>
          </li>
        ))}
      </section>

      <PortfolioPanel
        selectedTickers={selectedTickers}
        portfolio={portfolio}
        tickerMetaBySymbol={tickerMetaBySymbol}
        onRun={getPortfolioData}
        onRemoveTicker={handleRemoveTicker}
        // isRunning={isRunning}
      />

      <TVMCalculator onChange={setTVMData} defaults={TVMData} />

      <PortfolioChart TVMData={TVMData} />

      <Footer />
    </div>
  );
};

export default Portfolio;
