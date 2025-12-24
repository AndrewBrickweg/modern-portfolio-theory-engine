package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/AndrewBrickweg/Finet_v2/cmd/finet/handler"
	"github.com/AndrewBrickweg/Finet_v2/database"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	servUSDB, err := database.NewDBService(ctx, database.UserSessionDataSource())
	if err != nil {
		log.Fatal(err)
	}
	defer servUSDB.Close()

	// servStockPredictionsDB, err := database.NewDBService(ctx, database.StockPredictionsDataSource)
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// defer servStockDB.Close()

	servStockDB, err := database.NewStockDB(ctx, database.StockDataSource())
	if err != nil {
		log.Fatal(err)
	}
	defer servStockDB.Close()

	go func() {
		ticker := time.NewTicker(1 * time.Hour) // Clean up every hour
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done(): // Listen for app shutdown signal
				log.Println("Session cleanup goroutine stopping.")
				return
			case <-ticker.C:
				rowsAffected, err := servUSDB.DeleteExpiredSessions(ctx)
				if err != nil {
					log.Printf("Error during session cleanup: %v", err)
				} else {
					log.Printf("Cleaned up %d expired sessions.", rowsAffected)
				}
			}
		}
	}()

	sessionLifetime := 24 * time.Hour
	appHandler, err := handler.NewHandler(servUSDB, servStockDB, sessionLifetime)
	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.Handle("/", appHandler.AuthMiddleware(http.HandlerFunc(appHandler.RootHandler)))

	mux.Handle("POST /login", http.HandlerFunc(appHandler.LoginHandler))
	mux.Handle("POST /register", http.HandlerFunc(appHandler.RegistrationHandler))

	mux.Handle("/portfolio", appHandler.AuthMiddleware(http.HandlerFunc(appHandler.PortfolioHandler)))
	mux.Handle("/tickers", appHandler.AuthMiddleware(http.HandlerFunc(appHandler.GetTickersHandler)))

	mux.Handle("GET /logout", appHandler.AuthMiddleware(http.HandlerFunc(appHandler.LogoutHandler)))

	// mux.Handle("GET /homepage", appHandler.AuthMiddleware(http.HandlerFunc(appHandler.HomepageHandler)))
	// mux.HandleFunc("GET /login", appHandler.ShowLogin)
	// mux.Handle("GET /stock", appHandler.AuthMiddleware(http.HandlerFunc(appHandler.StockRequestPageHandler)))
	// mux.Handle("POST /stock", appHandler.AuthMiddleware(http.HandlerFunc(appHandler.StockRequestHandler)))
	// mux.HandleFunc("GET /register", appHandler.ShowRegistration)
	// mux.Handle("GET /predictions", appHandler.AuthMiddleware(http.HandlerFunc(appHandler.ShowPredictionsHandler)))
	// mux.Handle("GET /rawdata", appHandler.AuthMiddleware(http.HandlerFunc(appHandler.RawDataRequest)))
	// mux.Handle("POST /rawdata", appHandler.AuthMiddleware(http.HandlerFunc(appHandler.RawDataHandler)))

	fmt.Printf("port running on localhost:8000/\n")
	if err := http.ListenAndServe(":8000", mux); err != nil {
		log.Fatal(err)
	}

}
