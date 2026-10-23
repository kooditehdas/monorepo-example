// Package server builds the HTTP handler for the API. It never listens on a port itself,
// so tests can exercise it with httptest.
package server

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

// New returns the API's root handler with all routes registered.
func New() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", health)
	mux.HandleFunc("GET /version", version)
	mux.HandleFunc("GET /time", serverTime)
	// Everything else, including known paths with an unsupported method.
	mux.HandleFunc("/", notFound)
	return recoverJSON(mux)
}

// errorBody is the JSON shape of every error response.
type errorBody struct {
	Error string `json:"error"`
}

// writeJSON writes v as a JSON response with the given status code.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("writing response", "err", err)
	}
}

func notFound(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusNotFound, errorBody{Error: "Not found"})
}

// recoverJSON turns a panic in a handler into a JSON 500 instead of a dropped connection.
func recoverJSON(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				slog.Error("handler panic", "panic", rec, "path", r.URL.Path)
				writeJSON(w, http.StatusInternalServerError, errorBody{Error: "Internal server error"})
			}
		}()
		next.ServeHTTP(w, r)
	})
}
