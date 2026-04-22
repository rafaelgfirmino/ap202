package input

type HealthService interface {
	CheckHealth() map[string]interface{}
}
