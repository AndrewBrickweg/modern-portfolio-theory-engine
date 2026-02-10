# modern-portfolio-theory-engine

Full-stack portfolio optimization and simulation app with a Go API, MySQL data stores, and a React frontend.

## Highlights

- Authenticated portfolio workflow with session cookies
- Monte Carlo optimization with weight constraints and risk/return metrics
- Ticker search backed by stored market data
- TVM growth projection and charting
- Dockerized deployment with separate MySQL databases for sessions and stock data

## Architecture (at a glance)

- React + Vite frontend served by Nginx
- Go API on port 8000 for auth and portfolio endpoints
- MySQL databases for users/sessions and historical prices

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

Local dev: the Vite server proxies API routes to `http://localhost:8000`.

## Stack

- Backend: Go, MySQL, Gonum, bcrypt
- Frontend: React, TypeScript, Vite, Tailwind CSS, Chart.js
- Infra: Docker, Nginx
- Data: Python ingestion + ETL

## Quickstart (Docker)

From the repo root:

```bash
cd docker
export MYSQL_ROOT_PASSWORD=changeme
docker compose up --build
```

Then open `http://localhost` in your browser.

## Notes

- Optimizer requires at least 60 months of data per ticker.
- Alpha Vantage retrieval exists, but the main flow uses the local stock DB.

## Credits

- Ethan Long (original repository collaborator)

## License

No license file is included yet.
