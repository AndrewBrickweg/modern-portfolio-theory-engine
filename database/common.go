package database

import (
	"bufio"
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	_ "github.com/go-sql-driver/mysql" // MySQL driver
)

// SQL Related Constants (moved from logindb.go)
const (
	SQL_INSERT_USER             = `INSERT INTO users (username, password_hash) VALUES (?, ?)` // Changed to password_hash
	SQL_CHECK_USER_EXISTS       = `SELECT COUNT(*) FROM users WHERE username = ?`
	SQL_SELECT_USER_PASSWORD    = `SELECT password_hash FROM users WHERE username = ?`               // Changed to password_hash
	SQL_SELECT_USER_BY_USERNAME = `SELECT id, username, password_hash FROM users WHERE username = ?` // Added password_hash for login flow
	SQL_SELECT_USER_BY_ID       = `SELECT id, username FROM users WHERE id = ?`
	SQL_UPDATE_USER_PASSWORD    = `UPDATE users SET password_hash = ? WHERE username = ?` // Changed to password_hash
)

// Session Management Queries (from sessiondb.go)
const (
	SQL_INSERT_SESSION            = `INSERT INTO sessions (sessions_id, user_id, expires_at) VALUES (?, ?, ?)`   // Changed to user_id
	SQL_SELECT_SESSION_BY_ID      = `SELECT user_id, created_at, expires_at FROM sessions WHERE sessions_id = ?` // Changed to user_id
	SQL_DELETE_SESSION_BY_ID      = `DELETE FROM sessions WHERE sessions_id = ?`
	SQL_DELETE_EXPIRED_SESSIONS   = `DELETE FROM sessions WHERE expires_at < NOW()`
	SQL_UPDATE_SESSION_EXPIRATION = `UPDATE sessions SET expires_at = ? WHERE sessions_id = ?`
)

// primary type for interacting with Database (renamed to avoid conflict if you have multiple DBs)
type DBService struct {
	db *sql.DB
}

// helper type for dealing with user databases
type User struct {
	ID           int
	Username     string
	PasswordHash string
}

const (
	DriverName  string = "mysql"
	CONNECTIONS int    = 50
)

var loadEnvOnce sync.Once

func loadDotEnv() {
	file, err := os.Open(".env")
	if err != nil {
		return // ignore if missing; rely on real env
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])
		if key == "" {
			continue
		}
		if _, exists := os.LookupEnv(key); !exists {
			os.Setenv(key, val)
		}
	}
}

func mustEnv(key, fallback string) string {
	loadEnvOnce.Do(loadDotEnv)
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func userSessionDSN() string {
	host := mustEnv("DB_USER_SESSION_HOST", "user_session_db")
	port := mustEnv("DB_USER_SESSION_PORT", "3306")
	user := mustEnv("DB_USER_SESSION_USER", "root")
	pass := mustEnv("DB_USER_SESSION_PASSWORD", "Front2Back!")
	name := mustEnv("DB_USER_SESSION_NAME", "user_session_db")
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", user, pass, host, port, name)
}

func stockDataDSN() string {
	host := mustEnv("DB_STOCK_DATA_HOST", "stock_data_db")
	port := mustEnv("DB_STOCK_DATA_PORT", "3306")
	user := mustEnv("DB_STOCK_DATA_USER", "root")
	pass := mustEnv("DB_STOCK_DATA_PASSWORD", "Front2Back!")
	name := mustEnv("DB_STOCK_DATA_NAME", "stock_data_db")
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", user, pass, host, port, name)
}

func UserSessionDataSource() string {
	return userSessionDSN()
}

func StockDataSource() string {
	return stockDataDSN()
}

func NewDBService(ctx context.Context, dataSourceName string) (*DBService, error) {
	var db *sql.DB
	var err error
	maxRetries := 20
	retryInterval := 20 * time.Second
	for i := range maxRetries {
		db, err = sql.Open(DriverName, dataSourceName)
		if err != nil {
			log.Printf("Attempt %d: Error from sql.Open: %v. Retrying in %v...", i+1, err, retryInterval)
			time.Sleep(retryInterval)
			continue
		}
		err = db.PingContext(ctx)
		if err != nil {
			log.Printf("Attempt %d: Error pinging database: %v. Retrying in %v...", i+1, err, retryInterval)
			db.Close()
			time.Sleep(retryInterval)
			continue
		}

		log.Printf("Connection established to database: %s\n", dataSourceName)
		db.SetConnMaxLifetime(5 * time.Minute)
		db.SetMaxOpenConns(CONNECTIONS)
		db.SetMaxIdleConns(CONNECTIONS)
		return &DBService{db: db}, nil

	}
	return nil, fmt.Errorf("failed to connect to database after %d retries: %w", maxRetries, err)
}

// closes database connection associated with a Service Object
func (s *DBService) Close() error {
	log.Println("Closing database connection.")
	return s.db.Close()
}
