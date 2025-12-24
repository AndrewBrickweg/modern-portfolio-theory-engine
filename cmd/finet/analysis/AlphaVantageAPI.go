package analysis

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"

	// "sync"
	"time"

	"github.com/AndrewBrickweg/Finet_v2/database"
)

// global constants
const (
	ApiKeyEnv               = "ALPHAVANTAGE_API_KEY"
	ApiURL                  = "https://www.alphavantage.co/query?function=%v&symbol=%v&apikey=%v"
	WeeklyAdjustedFunction  = "TIME_SERIES_WEEKLY_ADJUSTED"
	MonthlyAdjustedFunction = "TIME_SERIES_MONTHLY_ADJUSTED"
)

var httpClient = &http.Client{
	Timeout: 10 * time.Second, // Global timeout for all requests using this client
}

// structs
type StockDataMonthly struct {
	MetaData struct {
		Information   string `json:"1. Information"`
		Symbol        string `json:"2. Symbol"`
		LastRefreshed string `json:"3. Last Refreshed"`
		TimeZone      string `json:"4. Time Zone"`
	} `json:"Meta Data"`

	TimeSeriesMonthly map[string]struct {
		Open      string `json:"1. open"`
		High      string `json:"2. high"`
		Low       string `json:"3. low"`
		Close     string `json:"4. close"`
		AdjClose  string `json:"5. adjusted close"`
		Volume    string `json:"6. volume"`
		DivAmount string `json:"7. dividend amount"`
	} `json:"Monthly Adjusted Time Series"`
	ErrorMessage string `json:"Error Message"`
	Note         string `json:"Note"`
}

type StockDataWeekly struct {
	MetaData struct {
		Information   string `json:"1. Information"`
		Symbol        string `json:"2. Symbol"`
		LastRefreshed string `json:"3. Last Refreshed"`
		TimeZone      string `json:"4. Time Zone"`
	} `json:"Meta Data"`

	TimeSeriesWeekly map[string]struct {
		Open      string `json:"1. open"`
		High      string `json:"2. high"`
		Low       string `json:"3. low"`
		Close     string `json:"4. close"`
		AdjClose  string `json:"5. adjusted close"`
		Volume    string `json:"6. volume"`
		DivAmount string `json:"7. dividend amount"`
	} `json:"Weekly Adjusted Time Series"`
	ErrorMessage string `json:"Error Message"`
	Note         string `json:"Note"`
}

type StockWeights struct {
	OpenPriceWeight  string
	HighPriceWeight  string
	ClosePriceWeight string
	LowPriceWeight   string
	VolumeWeight     string
	PercChangeWeight string
	PercRangeWeight  string
}

type AlphaVantageParam struct {
	Function     string
	Symbol       string
	Datatype     string
	APIKey       string
	StartDate    string //for internal use, not a parameter
	EndDate      string //for internal use, not a parameter
	StockWeights StockWeights
}

func alphaVantageAPIKey() (string, error) {
	key := os.Getenv(ApiKeyEnv)
	if key == "" {
		return "", fmt.Errorf("%s env var not set", ApiKeyEnv)
	}
	return key, nil
}

func RetrieveStockDataWeekly(ctx context.Context, params AlphaVantageParam) (*StockDataWeekly, error) {
	if params.Function != "TIME_SERIES_WEEKLY_ADJUSTED" || params.Symbol == "" || params.APIKey == "" {
		return nil, fmt.Errorf("Required params are missing or wrong")
	}
	if params.Datatype == "" {
		params.Datatype = "json"
	}
	apiRequestUrl := fmt.Sprintf(ApiURL, params.Function, params.Symbol, params.APIKey)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiRequestUrl, nil)
	if err != nil {
		return nil, fmt.Errorf("Failed to create request: %w", err)
	}
	typeAccepting := fmt.Sprintf("application/%v", params.Datatype)
	req.Header.Set("Accept", typeAccepting)
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Error sending request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errorBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(errorBody))
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("Error reading response body: %w", err)
	}
	var stockData StockDataWeekly
	err = json.Unmarshal(body, &stockData)
	if err != nil {
		return nil, fmt.Errorf("Error unmarshalling response: %w", err)
	}
	return &stockData, nil
}

func MakeWeeklyDataSlice(ctx context.Context, symbols []string) ([]*StockDataWeekly, error) {
	apiKey, err := alphaVantageAPIKey()
	if err != nil {
		return nil, err
	}
	paramTemplate := AlphaVantageParam{Function: WeeklyAdjustedFunction, APIKey: apiKey}
	dataSlice := make([]*StockDataWeekly, len(symbols))
	var allErrors []error
	for i, s := range symbols {
		paramTemplate.Symbol = s
		dataSlice[i], err = RetrieveStockDataWeekly(ctx, paramTemplate)
		if err != nil {
			log.Printf("Error retrieving stock data for symbol %q: %v", s, err)
			allErrors = append(allErrors, fmt.Errorf("symbol %q: %w", s, err))
			if len(allErrors) > 3 {
				return nil, fmt.Errorf("Too many failed API calls, check symbols list and API. atleast 9 failed API calls")
			}
			continue
		}
	}
	return dataSlice, nil
}

func RetrieveStockDataMonthly(ctx context.Context, params AlphaVantageParam) (*StockDataMonthly, error) {
	if params.Function != MonthlyAdjustedFunction || params.Symbol == "" || params.APIKey == "" {
		return nil, fmt.Errorf("Required params are missing or wrong")
	}
	if params.Datatype == "" {
		params.Datatype = "json"
	}
	apiRequestUrl := fmt.Sprintf(ApiURL, params.Function, params.Symbol, params.APIKey)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiRequestUrl, nil)
	if err != nil {
		return nil, fmt.Errorf("Failed to create request: %w", err)
	}
	req.Header.Set("Accept", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Error sending request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var stockData StockDataMonthly
	if err := json.NewDecoder(resp.Body).Decode(&stockData); err != nil {
		return nil, fmt.Errorf("Error unmarshalling response: %w", err)
	}
	return &stockData, nil
}

// Using DB in prod, not making requests to API
// need to query db and fit daily monthly close price to stockdatamonthly
const DefaultRequiredMonths = 60

func MakeMonthlyDataSlice(ctx context.Context, symbols []string, stockDB *database.StockDB, requiredMonths int) ([]*StockDataMonthly, error) {

	if requiredMonths < 2 {
		return nil, fmt.Errorf("requiredMonths must be >= 2")
	}

	dataSlice := make([]*StockDataMonthly, 0, len(symbols))

	for _, symbol := range symbols {

		dailyData, err := stockDB.QueryStockData(ctx, symbol)
		if err != nil {
			return nil, fmt.Errorf("query failed for %s: %w", symbol, err)
		}

		if len(dailyData) == 0 {
			log.Printf("No data for symbol %s, skipping", symbol)
			continue
		}

		monthly := make(map[string]database.StockData)
		for _, d := range dailyData {
			key := database.MonthKey(d.Date)

			if prev, ok := monthly[key]; !ok || d.Date > prev.Date {
				monthly[key] = d
			}
		}

		md := &StockDataMonthly{}
		md.MetaData.Symbol = symbol
		md.TimeSeriesMonthly = make(map[string]struct {
			Open      string `json:"1. open"`
			High      string `json:"2. high"`
			Low       string `json:"3. low"`
			Close     string `json:"4. close"`
			AdjClose  string `json:"5. adjusted close"`
			Volume    string `json:"6. volume"`
			DivAmount string `json:"7. dividend amount"`
		})

		for month, d := range monthly {
			md.TimeSeriesMonthly[month] = struct {
				Open      string `json:"1. open"`
				High      string `json:"2. high"`
				Low       string `json:"3. low"`
				Close     string `json:"4. close"`
				AdjClose  string `json:"5. adjusted close"`
				Volume    string `json:"6. volume"`
				DivAmount string `json:"7. dividend amount"`
			}{
				AdjClose: strconv.FormatFloat(d.AdjClose, 'f', -1, 64),
			}
		}

		if err := truncateToMonths(md, requiredMonths); err != nil {
			return nil, err
		}

		dataSlice = append(dataSlice, md)
	}

	if len(dataSlice) == 0 {
		return nil, fmt.Errorf("no valid monthly data produced")
	}

	return dataSlice, nil
}

func truncateToMonths(md *StockDataMonthly, requiredMonths int) error {
	if len(md.TimeSeriesMonthly) < requiredMonths {
		return fmt.Errorf(
			"symbol %s has %d months, requires %d",
			md.MetaData.Symbol,
			len(md.TimeSeriesMonthly),
			requiredMonths,
		)
	}

	//sort dates
	dates := make([]string, 0, len(md.TimeSeriesMonthly))
	for d := range md.TimeSeriesMonthly {
		dates = append(dates, d)
	}
	sort.Strings(dates)

	start := len(dates) - requiredMonths
	newSeries := make(map[string]struct {
		Open      string `json:"1. open"`
		High      string `json:"2. high"`
		Low       string `json:"3. low"`
		Close     string `json:"4. close"`
		AdjClose  string `json:"5. adjusted close"`
		Volume    string `json:"6. volume"`
		DivAmount string `json:"7. dividend amount"`
	}, requiredMonths)

	for _, d := range dates[start:] {
		newSeries[d] = md.TimeSeriesMonthly[d]
	}

	md.TimeSeriesMonthly = newSeries
	return nil
}

func MakeMonthlyDataSliceAPI(ctx context.Context, symbols []string) ([]*StockDataMonthly, error) {
	const (
		maxRetries = 3
		maxErrors  = 5
	)

	apiKey, err := alphaVantageAPIKey()
	if err != nil {
		return nil, err
	}
	paramTemplate := AlphaVantageParam{Function: MonthlyAdjustedFunction, APIKey: apiKey}
	dataSlice := make([]*StockDataMonthly, 0, len(symbols))
	var allErrors []error

	for _, s := range symbols {

		//check db first
		// existingTickers, dbErr = database.QueryStockData()
		paramTemplate.Symbol = s

		var stock *StockDataMonthly
		var err error
		for attempt := 1; attempt <= maxRetries; attempt++ {
			stock, err = RetrieveStockDataMonthly(ctx, paramTemplate)
			if err != nil {
				log.Printf("Attempt %d: Error retrieving %q: %v", attempt, s, err)
				time.Sleep(5 * time.Second) // short retry wait
				continue
			}

			if stock.Note != "" {
				log.Printf("AlphaVantage limit reached for %q: %s", s, stock.Note)
				err = fmt.Errorf("rate limited, retrying")
				continue
			}
			if stock.ErrorMessage != "" {
				err = fmt.Errorf("API error for %q: %s", s, stock.ErrorMessage)
				break
			}

			if len(stock.TimeSeriesMonthly) < 2 {
				err = fmt.Errorf("insufficient data points (%d)", len(stock.TimeSeriesMonthly))
				continue
			}
			// Success
			dataSlice = append(dataSlice, stock)
			break
		}

		if err != nil {
			log.Printf("Failed to retrieve data for %q after %d attempts", s, maxRetries)
			allErrors = append(allErrors, fmt.Errorf("symbol %q: %w", s, err))
			if len(allErrors) > maxErrors {
				return dataSlice, fmt.Errorf("too many failed API calls: %v", allErrors)
			}
		}
	}

	for stock, r := range dataSlice {
		fmt.Println(stock, len(r.TimeSeriesMonthly))
	}

	//check return length of each stock, truncate to shortest length
	minLength := -1
	for _, r := range dataSlice {
		length := len(r.TimeSeriesMonthly)
		if minLength == -1 || length < minLength {
			minLength = length
		}
	}

	if minLength == -1 || minLength < 2 {
		return dataSlice, fmt.Errorf("not enough valid data retrieved")
	}

	// Truncate all to minLength
	for i, r := range dataSlice {
		if len(r.TimeSeriesMonthly) > minLength {
			// Create a new map with only the most recent minLength entries
			newTimeSeries := make(map[string]struct {
				Open      string `json:"1. open"`
				High      string `json:"2. high"`
				Low       string `json:"3. low"`
				Close     string `json:"4. close"`
				AdjClose  string `json:"5. adjusted close"`
				Volume    string `json:"6. volume"`
				DivAmount string `json:"7. dividend amount"`
			}, minLength)

			// Extract and sort the dates to ensure chronological order
			var dates []string
			for date := range r.TimeSeriesMonthly {
				dates = append(dates, date)
			}
			sort.Strings(dates)

			// Keep only the most recent minLength dates
			for _, date := range dates[len(dates)-minLength:] {
				newTimeSeries[date] = r.TimeSeriesMonthly[date]
			}

			// Replace the old map with the new truncated map
			dataSlice[i].TimeSeriesMonthly = newTimeSeries
		}
	}

	return dataSlice, nil
}
