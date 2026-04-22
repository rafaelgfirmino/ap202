package output

type HealthChecker interface {
	Health() map[string]string
	Close() error
}
