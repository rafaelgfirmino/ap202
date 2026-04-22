package vo

import "errors"

var (
	ErrBuiltAreaZero       = errors.New("built area sum is zero — cannot calculate ideal fraction")
	ErrPrivateAreaRequired = errors.New("private area is required for proportional fee rule")
)

func CalculateIdealFraction(privateArea, builtAreaSum float64) (float64, error) {
	if builtAreaSum == 0 {
		return 0, ErrBuiltAreaZero
	}
	return privateArea / builtAreaSum, nil
}
