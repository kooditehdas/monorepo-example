package server

import (
	"net/http"
	"time"
)

// now returns the current time. Tests replace it to get a fixed clock.
var now = time.Now

type timeBody struct {
	Time string `json:"time"`
}

func serverTime(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, timeBody{Time: now().UTC().Format(time.RFC3339)})
}
