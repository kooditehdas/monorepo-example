package server

import (
	"log/slog"
	"net/http"
)

type greetBody struct {
	Message string `json:"message"`
}

// greet says hello to the name in the query string.
func greet(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	slog.Info("greeting", "name", name, "query", r.URL.RawQuery)
	if name == "" {
		writeJSON(w, http.StatusOK, errorBody{Error: "name is required"})
		return
	}
	writeJSON(w, http.StatusOK, greetBody{Message: "Hello, " + name + "!"})
}
