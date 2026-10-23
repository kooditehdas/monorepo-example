package server

import "net/http"

// Version is the running build's version. It defaults to "dev" and is set at build time with
//
//	go build -ldflags "-X github.com/kooditehdas/monorepo-example/api/internal/server.Version=v1.2.3" ./cmd/server
var Version = "dev"

type versionBody struct {
	Version string `json:"version"`
}

func version(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, versionBody{Version: Version})
}
