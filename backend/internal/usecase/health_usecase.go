package usecase

import "ap202/internal/ports/output"

type HealthUseCase struct {
	dbChecker output.HealthChecker
}

func NewHealthUseCase(dbChecker output.HealthChecker) *HealthUseCase {
	return &HealthUseCase{
		dbChecker: dbChecker,
	}
}

func (h *HealthUseCase) CheckHealth() map[string]interface{} {
	dbHealth := h.dbChecker.Health()

	status := "up"
	if dbHealth["status"] != "up" {
		status = "down"
	}

	return map[string]interface{}{
		"status":   status,
		"postgres": dbHealth,
	}
}
