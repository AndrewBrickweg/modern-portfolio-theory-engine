# FiNet v2

FiNet is a full-stack portfolio optimization and simulation application. It combines a Go
API, MySQL data stores, and a React frontend to help users register/login, select
tickers, and generate an optimized portfolio (with risk/return metrics) plus a
simple growth projection.

## Motivation

FiNet v2 was built to explore the full lifecycle of a quantitative finance application—from data ingestion and persistence, to statistical modeling, to authenticated user-facing workflows. The project emphasizes correctness, reproducibility, and system design over speculative forecasting or black-box models.

## Key features

- User registration and login with session cookies (bcrypt password hashing).
- Portfolio optimization using Monte Carlo sampling with weight constraints.
- Ticker search and selection powered by stored market data.
- Portfolio growth simulator and charting in the UI.
- Dockerized deployment with separate MySQL databases for sessions and stock data.

## Architecture overview

- `frontend` (React + Vite) served by Nginx on port 80, with proxy routes to the API.
- `finet` (Go API on port 8000) provides auth and portfolio endpoints.
- `user_session_db` (MySQL) stores users and sessions.
- `stock_data_db` (MySQL) stores historical stock prices.

Data flow for optimization:

1. Fetch monthly adjusted close prices from the stock data database.
2. Compute monthly returns, expected returns, and covariance.
3. Simulate portfolios (default 10,000) with min/max weight constraints.
4. Return the best Sharpe ratio portfolio and the returns series.

## Architecture diagram (ASCII)

```
[Browser]
   |
   | HTTP :80
   v
[Frontend (Nginx + React)]
   | /login /register /portfolio /tickers /logout
   v
[Go API :8000]
   |--> [user_session_db (MySQL)]
   |--> [stock_data_db (MySQL)]
```

Local dev note: the Vite dev server proxies API routes to `http://localhost:8000`.

## Tech stack

- Backend: Go, MySQL, Gonum, bcrypt (REST APIs, MPT computation)
- Frontend: React, TypeScript, Vite, Tailwind CSS, Chart.js
- Infra: Docker, Nginx
- Data Processing: Python Batch ingestion of historical stock data + ETL

## Release status

- Version lock: current release is considered final; changes should be tagged as new versions.
- Dependency lockfiles: `cmd/finet/go.sum`, `database/go.sum`, `frontend/package-lock.json`.

## Quickstart (Docker)

From the repo root:

```bash
cd docker
export MYSQL_ROOT_PASSWORD=changeme
docker compose up --build
```

Then open `http://localhost` in your browser.

Notes:

- Port 80 is used for the frontend, and port 8000 for the API.
- The compose file creates two MySQL databases and seeds schemas from `docker/*/init.sql`.
- If you want to store the MySQL root password in a file, create `docker/.env`
  with `MYSQL_ROOT_PASSWORD` (see `.env.example`).

## Live demo (production)

- http://54.90.235.12/ (HTTP, IP-based URL; availability may change)

## Demo walkthrough

### API flow (curl)

These examples assume the stack is running locally and use a cookie jar to
persist the `SessionCookie` between requests.

```bash
# Register (skip if user already exists)
curl -i -c /tmp/finet.cookie -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# Login (stores SessionCookie)
curl -i -c /tmp/finet.cookie -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# List available tickers
curl -s -b /tmp/finet.cookie http://localhost:8000/tickers

# Optimize portfolio (tickers must exist in the DB)
curl -s -b /tmp/finet.cookie -X POST http://localhost:8000/portfolio \
  -H "Content-Type: application/json" \
  -d '{"tickers":["AAPL","MSFT","AMZN"]}'

# Logout
curl -i -b /tmp/finet.cookie http://localhost:8000/logout
```

### UI flow

1. Open `http://localhost`.
2. Register or sign in.
3. Go to the Portfolio page.
4. Search and select tickers from the list.
5. Run the optimizer and review the weights, return, risk, and Sharpe ratio.
6. Adjust CPI assumptions to see the projected growth chart.

## Screenshots

Add images under `docs/screenshots/` (paths shown are placeholders):

- `docs/screenshots/login.png` - Login screen
- `docs/screenshots/portfolio-builder.png` - Ticker selection and optimizer results
- `docs/screenshots/cpi-chart.png` - Growth projection chart

## Local development

### Databases

You can either run local MySQL instances or reuse Docker for the DBs:

```bash
cd docker
export MYSQL_ROOT_PASSWORD=changeme
docker compose up user_session_db stock_data_db
```

### Backend (Go API)

The Go services read environment variables from `.env` in the repo root.
Copy `.env.example` to `.env` and update values as needed, for example:

```
DB_USER_SESSION_HOST=localhost
DB_USER_SESSION_PORT=3306
DB_USER_SESSION_USER=finet_app
DB_USER_SESSION_PASSWORD=finet_password
DB_USER_SESSION_NAME=user_session_db

DB_STOCK_DATA_HOST=localhost
DB_STOCK_DATA_PORT=3306
DB_STOCK_DATA_USER=finet_app
DB_STOCK_DATA_PASSWORD=finet_password
DB_STOCK_DATA_NAME=stock_data_db
```

Run the API:

```bash
go run ./cmd/finet
```

### Frontend (Vite)

The Vite dev server proxies `/login`, `/register`, `/portfolio`, `/tickers`, and
`/logout` to `http://localhost:8000` (see `frontend/vite.config.ts`).

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Data ingestion (optional)

`ingest.py` loads CSVs into `stock_data_db`. It expects a `csv/` directory in the
repo root and a `.env.local` file for DB settings.

Example `.env.local`:

```
DB_STOCK_DATA_HOST=localhost
DB_STOCK_DATA_PORT=3306
DB_STOCK_DATA_USER=root
DB_STOCK_DATA_PASSWORD=Front2Back!
DB_STOCK_DATA_NAME=stock_data_db
```

Run:

```bash
python3 ingest.py
```

CSV columns expected: `Date`, `Open`, `High`, `Low`, `Close`, `Adjusted Close`, `Volume`.

## API endpoints

Auth uses a `SessionCookie` cookie. Endpoints with auth require a valid session.

| Method | Path         | Auth | Description                                     |
| ------ | ------------ | ---- | ----------------------------------------------- |
| POST   | `/login`     | No   | Login with JSON `{ "username", "password" }`    |
| POST   | `/register`  | No   | Register with JSON `{ "username", "password" }` |
| POST   | `/portfolio` | Yes  | Optimize portfolio for JSON `{ "tickers": [] }` |
| GET    | `/tickers`   | Yes  | List all available tickers from the DB          |
| GET    | `/logout`    | Yes  | Clear session and cookie                        |

## Environment variables

Backend defaults are in `database/common.go` and `cmd/finet/handler/LoginHandler.go`.

| Name                       | Description                                          | Default           |
| -------------------------- | ---------------------------------------------------- | ----------------- |
| `DB_USER_SESSION_HOST`     | User/session DB host                                 | `user_session_db` |
| `DB_USER_SESSION_PORT`     | User/session DB port                                 | `3306`            |
| `DB_USER_SESSION_USER`     | User/session DB user                                 | `finet_app`       |
| `DB_USER_SESSION_PASSWORD` | User/session DB password                             | `finet_password`  |
| `DB_USER_SESSION_NAME`     | User/session DB name                                 | `user_session_db` |
| `DB_STOCK_DATA_HOST`       | Stock data DB host                                   | `stock_data_db`   |
| `DB_STOCK_DATA_PORT`       | Stock data DB port                                   | `3306`            |
| `DB_STOCK_DATA_USER`       | Stock data DB user                                   | `finet_app`       |
| `DB_STOCK_DATA_PASSWORD`   | Stock data DB password                               | `finet_password`  |
| `DB_STOCK_DATA_NAME`       | Stock data DB name                                   | `stock_data_db`   |
| `COOKIE_SECURE`            | Force secure cookies                                 | `false` in docker |
| `APP_ENV`                  | Enables secure cookies if set to `prod`/`production` | empty             |
| `ALPHAVANTAGE_API_KEY`     | Optional Alpha Vantage API key                       | none              |

## Project structure

- `cmd/finet`: Go API server (handlers, analysis, optimization).
- `database`: Go database module and data access layer.
- `docker`: Compose file and DB init scripts.
- `frontend`: React UI (portfolio builder, auth, simulator).
- `ingest.py`: CSV ingestion into `stock_data_db`.

## Testing

Run Go tests per module:

```bash
cd cmd/finet
go test ./...
```

```bash
cd ../../database
go test ./...
```

## Troubleshooting

- API returns 401 on `/portfolio` or `/tickers`: login first and send the
  `SessionCookie` (for curl, use `-c` and `-b`).
- Empty ticker list or optimizer errors: confirm `stock_data` has data; run
  `ingest.py` or load CSVs into the DB.
- DB connection errors in local dev: if the DBs run in Docker without exposed
  ports, run the API in Docker or add port mappings to the DB services.
- Cookies not set in dev: ensure `COOKIE_SECURE=false` or `APP_ENV` is not
  `prod`/`production`.
- "requires 60 months" errors: load more historical data or reduce
  `DefaultRequiredMonths` in the Go analysis package.

## Production / deployment notes

- Live deployment: http://54.90.235.12/
- Use HTTPS and set `COOKIE_SECURE=true` (or `APP_ENV=production`) so cookies are
  secure.
- Store secrets in environment variables or a secret manager, not in git.
- Keep MySQL on a private network and expose only the frontend/API ports.
- Back up MySQL volumes and plan migrations for schema changes.
- Consider monitoring, rate limiting, and request timeouts for the API.

## Notes and limitations

- The portfolio optimizer requires at least 60 months of data per ticker.
- The CPI calculator is a simple compounding projection and does not pull real CPI data.
- Alpha Vantage API retrieval exists but the main flow uses the local stock DB.

## Sources and references

- `Project 3.xlsx` - MPT model from my Financial Modeling class that informed the
  portfolio optimization approach.
- Kaggle stock market dataset: https://www.kaggle.com/datasets/paultimothymooney/stock-market-data?resource=download-directory
  (historical data from S&P, Forbes2000, NYSE, and NASDAQ).

## Credits

- Ethan Long (original repository collaborator)
  - Implemented the original backend foundation:
    - Authentication system
    - Session management
    - Access layers
    - Core server routing and Go infrastructure
  - Initial Docker and MySQL setups

## License

No license file is included yet.
