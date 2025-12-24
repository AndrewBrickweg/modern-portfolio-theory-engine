package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"
)

func (h *Handler) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("SessionCookie")
		if err != nil {
			if !errors.Is(err, http.ErrNoCookie) {
				log.Printf("AuthMiddleware: Error getting cookie: %v", err)
				http.Error(w, "Bad Request", http.StatusBadRequest)
				return
			}
			respondUnauthorized(w, h.SecureCookie, "authentication required")
			return
		}

		sessionID := cookie.Value
		session, dbErr := h.UserSessionDBService.GetSessionByID(r.Context(), sessionID)
		if dbErr != nil {
			log.Printf("AuthMiddleware: Session validation failed for session ID '%s': %v", sessionID, dbErr)
			clearSessionCookie(w, h.SecureCookie)
			respondUnauthorized(w, h.SecureCookie, "session invalid")
			return
		}

		if time.Now().After(session.ExpiresAt) {
			log.Printf("AuthMiddleware: Session ID '%s' has expired for user ID '%d'", sessionID, session.UserID)
			go func() {
				deleteCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
				defer cancel()
				_, delErr := h.UserSessionDBService.DeleteSessionByID(deleteCtx, sessionID)
				if delErr != nil {
					log.Printf("AuthMiddleware: Failed to delete expired session '%s': %v", sessionID, delErr)
				}
			}()

			clearSessionCookie(w, h.SecureCookie)
			respondUnauthorized(w, h.SecureCookie, "session expired")
			return
		}

		user, userErr := h.UserSessionDBService.GetUserByID(r.Context(), session.UserID)
		if userErr != nil {
			log.Printf("AuthMiddleware: Failed to get user details for user ID '%d': %v", session.UserID, userErr)
			clearSessionCookie(w, h.SecureCookie)
			respondUnauthorized(w, h.SecureCookie, "user not found")
			return
		}

		ctx := context.WithValue(r.Context(), userContextKey, user)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}

func respondUnauthorized(w http.ResponseWriter, secure bool, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func clearSessionCookie(w http.ResponseWriter, secure bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     "SessionCookie",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
}
