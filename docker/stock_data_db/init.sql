CREATE DATABASE IF NOT EXISTS stock_data_db;
USE stock_data_db;

CREATE USER IF NOT EXISTS 'finet_app'@'%' IDENTIFIED BY 'finet_password';
GRANT ALL PRIVILEGES ON stock_data_db.* TO 'finet_app'@'%';
FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS tickers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL UNIQUE,
    company_name VARCHAR(255),
    industry VARCHAR(100),
    sub_industry VARCHAR(100),
    UNIQUE KEY uq_tickers_ticker (ticker)
);


CREATE TABLE IF NOT EXISTS stock_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    open DOUBLE,
    high DOUBLE,
    low DOUBLE,
    close DOUBLE,
    adj_close DOUBLE,
    volume BIGINT,
    dividend DOUBLE,
    
    UNIQUE KEY uq_stock_ticker_date (ticker, date),
    INDEX idx_stock_ticker_date (ticker, date),

    CONSTRAINT fk_stock_ticker
        FOREIGN KEY (ticker)
        REFERENCES tickers(ticker)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

