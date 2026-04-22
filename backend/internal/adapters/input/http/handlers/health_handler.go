package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"ap202/internal/ports/input"
)

type HealthHandler struct {
	healthService input.HealthService
}

func NewHealthHandler(healthService input.HealthService) *HealthHandler {
	return &HealthHandler{
		healthService: healthService,
	}
}

func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	healthStatus := h.healthService.CheckHealth()

	resp, err := json.Marshal(healthStatus)
	if err != nil {
		http.Error(w, "Failed to marshal health check response", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if _, err := w.Write(resp); err != nil {
		log.Printf("Failed to write response: %v", err)
	}
}
