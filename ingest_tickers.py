import os
import csv
import mysql.connector
from dotenv import load_dotenv

load_dotenv(".env.local")

DB_CONFIG = {
    "host": os.getenv("DB_STOCK_DATA_HOST", "stock_data_db"),
    "user": os.getenv("DB_STOCK_DATA_USER", "finet_app"),
    "password": os.getenv("DB_STOCK_DATA_PASSWORD", "finet_password"),
    "database": os.getenv("DB_STOCK_DATA_NAME", "stock_data_db"),
    "port": int(os.getenv("DB_STOCK_DATA_PORT", 3306)),
}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "sp500-companies.csv")

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

insert_sql = '''
INSERT INTO tickers (
    ticker, company_name, industry, sub_industry
) VALUES (%s,%s,%s,%s)
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), industry = VALUES(industry), sub_industry = VALUES(sub_industry)
'''


with open(CSV_PATH, newline="", encoding="utf-8") as csvfile:
    reader = csv.DictReader(csvfile)

    rows = 0
    for row in reader:
        try:
            ticker = row["Ticker"].strip().upper()
            company_name = row["Name"]
            industry = row["Industry"]
            sub_industry = row["Sub-Industry"]

            cursor.execute(insert_sql,
            (ticker, company_name, industry, sub_industry)
            )
            rows += 1

        except Exception as e:
            print(f"Error processing row for ticker {row.get('Ticker','N/A')}: {e}")

    conn.commit()
    print(f"Inserted/Updated {rows} rows into tickers table.")
cursor.close()
conn.close()
print("Done.")
