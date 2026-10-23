package server

import "net/http"

type healthBody struct {
	Status string `json:"status"`
}

func health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, healthBody{Status: "ok"})
}
