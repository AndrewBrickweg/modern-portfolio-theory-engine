import os
import csv
from datetime import datetime
import mysql.connector
from dotenv import load_dotenv

load_dotenv(".env.local")

DB_CONFIG = {
    "host": os.getenv("DB_STOCK_DATA_HOST", "localhost"),
    "user": os.getenv("DB_STOCK_DATA_USER", "root"),
    "password": os.getenv("DB_STOCK_DATA_PASSWORD", "Front2Back!"),
    "database": os.getenv("DB_STOCK_DATA_NAME", "stock_data_db"),
    "port": int(os.getenv("DB_STOCK_DATA_PORT", 3306)),
}

DATA_DIR = "stock_market_data/sp500/csv"

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

insert_sql = '''
INSERT INTO stock_data (
    ticker, date, open, high, low, close, adj_close, volume, dividend
) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,NULL )
ON DUPLICATE KEY UPDATE adj_close = adj_close
'''

def parse_date(date_str):
    return datetime.strptime(date_str, "%d-%m-%Y").date()

files = [f for f in os.listdir(DATA_DIR) if f.endswith(".csv")]

print(f"Found {len(files)} CSV Files")

for file in files:
    ticker = file.replace(".csv","").upper()
    file_path = os.path.join(DATA_DIR, file)

    with open(file_path, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)

        rows = 0
        for row in reader:
            try:
                date = parse_date(row["Date"])

                open_price = float(row["Open"]) if row["Open"] else None
                high_price = float(row["High"]) if row["High"] else None
                low_price = float(row["Low"]) if row["Low"] else None
                close_price = float(row["Close"]) if row["Close"] else None
                adj_close = float(row["Adjusted Close"]) if row["Adjusted Close"] else None
                volume = int(row["Volume"]) if row["Volume"] else None

                if adj_close is None:
                    continue
                
                cursor.execute(insert_sql,
                (ticker,date,open_price,high_price,low_price,close_price, adj_close, volume)
                )

                rows += 1

                if rows % 1000 == 0:
                    conn.commit()
            except Exception as e:
                print(f"Error ingesting {ticker} {row['Date']}: {e}")

        conn.commit()
        print(f"Ingested {rows} rows for {ticker}")
cursor.close()
conn.close()
print("complete")