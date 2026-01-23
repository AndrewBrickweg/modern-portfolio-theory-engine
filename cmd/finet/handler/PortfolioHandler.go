package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"github.com/AndrewBrickweg/Finet_v2/cmd/finet/analysis"
)

//1. receive POST request with tickers
type PortfolioRequest struct {
	Tickers []string `json:"tickers"`

}

func (h *Handler) PortfolioHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("DEBUG: Entered handler")
	// validate request method
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	// parse request body
	var req PortfolioRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	
	//validate tickers is not empty
	if len(req.Tickers) == 0 {
		http.Error(w, "No tickers provided", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	monthlyData, err := analysis.MakeMonthlyDataSlice(ctx, req.Tickers, h.StockDB, h.RequiredMonths,)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error retrieving stock data: %v", err), http.StatusInternalServerError)
		return
	}	
	fmt.Println("DEBUG: monthlyData received:", len(monthlyData))
	fmt.Println("Successfully retrieved monthly data for tickers:", req.Tickers)
	
	//2. process tickers and run optimization
	fmt.Println("DEBUG: About to run orchestrator...")
	optimizedPortfolio, err := analysis.OrchestratePortfolio(
		monthlyData,
		10000,    // number of portfolios to simulate
		0.04,     // risk-free rate
		0.05,      // min weight
		0.15,      // max weight
	)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error optimizing portfolio: %v", err), http.StatusInternalServerError)
		return
	}

	//3. return optimized portfolio as JSON response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(optimizedPortfolio)
}

func (h * Handler) GetTickersHandler (w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	tickers, err := h.StockDB.GetAllTickers(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch tickers", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type","application/json")
	json.NewEncoder(w).Encode(tickers)
}
