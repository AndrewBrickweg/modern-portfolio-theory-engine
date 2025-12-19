package database

import (
	"context"
	"database/sql"
	"log"
)

type StockData struct {
	Ticker   string  `json:"ticker"`
	Date     string  `json:"date"`
	Open     float64 `json:"open"`
	High     float64 `json:"high"`
	Low      float64 `json:"low"`
	Close    float64 `json:"close"`
	AdjClose float64 `json:"adj_close"`
	Volume   int64   `json:"volume"`
	Dividend sql.NullFloat64 `json:"dividend"`
}

type StockDB struct {
	DBService *DBService
}

func NewStockDB(ctx context.Context, dataSourceName string) (*StockDB, error) {
	base, err := NewDBService(ctx, dataSourceName)
	if err != nil {
		return nil, err
	}
	return &StockDB{DBService: base}, nil
}

func (s *StockDB) Close() error {
	log.Println("Closing stock database connection.")
	return s.DBService.Close()
}

// method for inserting stock data
func (s *StockDB) InsertStockData(ctx context.Context, stockData []StockData) error {
	tx, err := s.DBService.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO stock_data (ticker, date, open, high, low, close, adj_close, volume, dividend)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			open = VALUES(open),
			high = VALUES(high),
			low = VALUES(low),
			close = VALUES(close),
			adj_close = VALUES(adj_close),
			volume = VALUES(volume),
			dividend = VALUES(dividend)
	`)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	for _, sd := range stockData {
		_, err := stmt.ExecContext(ctx,
			sd.Ticker, sd.Date, sd.Open, sd.High, sd.Low,
			sd.Close, sd.AdjClose, sd.Volume, sd.Dividend,
		)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit()
}

// method for querying stock data
func (s *StockDB) QueryStockData(ctx context.Context, ticker string) ([]StockData, error) {
	rows, err := s.DBService.db.QueryContext(ctx, `
		SELECT ticker, date, open, high, low, close, adj_close, volume, dividend
		FROM stock_data
		WHERE ticker = ?
		ORDER BY date ASC
	`, ticker)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stockData []StockData
	for rows.Next() {
		var sd StockData
		if err := rows.Scan(&sd.Ticker, &sd.Date, &sd.Open, &sd.High, &sd.Low, &sd.Close, &sd.AdjClose, &sd.Volume, &sd.Dividend); err != nil {
			return nil, err
		}
		stockData = append(stockData, sd)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return stockData, nil
}

func MonthKey(date string) string {
	return date[:7]
}

func(s *StockDB) GetAllTickers(ctx context.Context)([]string, error){
	rows, err := s.DBService.db.QueryContext(ctx, `
		SELECT DISTINCT ticker
		FROM stock_data
		ORDER BY ticker ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tickers := make([]string, 0)

	for rows.Next() {
		var ticker string
		if err := rows.Scan(&ticker); err != nil {
			return nil, err
		}
		tickers = append(tickers, ticker)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return tickers, nil

}