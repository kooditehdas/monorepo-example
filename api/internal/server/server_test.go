package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// do sends a request to the API handler and returns the recorded response.
func do(t *testing.T, h http.Handler, method, path string) *httptest.ResponseRecorder {
	t.Helper()
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(method, path, nil))
	return rec
}

// decode parses a JSON response body into a map.
func decode(t *testing.T, rec *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("Content-Type = %q, want application/json", ct)
	}
	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON body %q: %v", rec.Body.String(), err)
	}
	return body
}

func TestHealth(t *testing.T) {
	rec := do(t, New(), http.MethodGet, "/health")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	if got := decode(t, rec)["status"]; got != "ok" {
		t.Errorf(`body["status"] = %v, want "ok"`, got)
	}
}

func TestVersion(t *testing.T) {
	tests := []struct {
		name, set, want string
	}{
		// An empty set leaves Version untouched, so this checks the real default.
		{"default", "", "dev"},
		{"set at build time", "v1.2.3", "v1.2.3"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.set != "" {
				orig := Version
				Version = tt.set
				t.Cleanup(func() { Version = orig })
			}

			rec := do(t, New(), http.MethodGet, "/version")

			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
			}
			if got := decode(t, rec)["version"]; got != tt.want {
				t.Errorf(`body["version"] = %v, want %q`, got, tt.want)
			}
		})
	}
}

func TestTime(t *testing.T) {
	orig := now
	// A non-UTC clock checks that the handler converts to UTC.
	now = func() time.Time {
		return time.Date(2026, 10, 23, 16, 20, 0, 0, time.FixedZone("EEST", 3*60*60))
	}
	t.Cleanup(func() { now = orig })

	rec := do(t, New(), http.MethodGet, "/time")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	got, ok := decode(t, rec)["time"].(string)
	if !ok {
		t.Fatalf(`body["time"] is not a string in %q`, rec.Body.String())
	}
	if got != "2026-10-23T13:20:00Z" {
		t.Errorf(`body["time"] = %q, want "2026-10-23T13:20:00Z"`, got)
	}
	parsed, err := time.Parse(time.RFC3339, got)
	if err != nil {
		t.Fatalf("time %q is not RFC 3339: %v", got, err)
	}
	if parsed.Location() != time.UTC {
		t.Errorf("time %q is not in UTC", got)
	}
}

func TestNotFound(t *testing.T) {
	tests := []struct {
		name, method, path string
	}{
		{"unknown path", http.MethodGet, "/does-not-exist"},
		{"unsupported method", http.MethodPost, "/health"},
		{"unsupported method on version", http.MethodPost, "/version"},
		{"delete on version", http.MethodDelete, "/version"},
		{"unsupported method on time", http.MethodPost, "/time"},
		{"delete on time", http.MethodDelete, "/time"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec := do(t, New(), tt.method, tt.path)

			if rec.Code != http.StatusNotFound {
				t.Fatalf("status = %d, want %d", rec.Code, http.StatusNotFound)
			}
			if got := decode(t, rec)["error"]; got != "Not found" {
				t.Errorf(`body["error"] = %v, want "Not found"`, got)
			}
		})
	}
}

func TestPanicBecomesJSON500(t *testing.T) {
	h := recoverJSON(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		panic("boom")
	}))

	rec := do(t, h, http.MethodGet, "/")

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusInternalServerError)
	}
	if got := decode(t, rec)["error"]; got != "Internal server error" {
		t.Errorf(`body["error"] = %v, want "Internal server error"`, got)
	}
}
