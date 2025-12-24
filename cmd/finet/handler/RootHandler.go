package handler

import (
	"net/http"

	"github.com/AndrewBrickweg/Finet_v2/database"
)

func (h *Handler) RootHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.Error(w, "404 not found", http.StatusNotFound)
		return
	}
	_, ok := r.Context().Value(userContextKey).(database.User)
	if ok {
		http.Redirect(w, r, "/home", http.StatusSeeOther)
		return
	}

	// For unauthenticated users, send them to login (SPA handles the page)
	http.Redirect(w, r, "/login", http.StatusSeeOther)
}
