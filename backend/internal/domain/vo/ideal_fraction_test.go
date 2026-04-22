package vo

import (
	"errors"
	"math"
	"testing"
)

func TestCalculateIdealFraction_ReturnsNormalizedProportion(t *testing.T) {
	got, err := CalculateIdealFraction(68.5, 81)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	want := 68.5 / 81.0
	if math.Abs(got-want) > 0.000000001 {
		t.Fatalf("expected %.12f, got %.12f", want, got)
	}
	if got < 0 || got > 1 {
		t.Fatalf("expected normalized fraction between 0 and 1, got %.12f", got)
	}
}

func TestCalculateIdealFraction_ErrorsWhenBuiltAreaIsZero(t *testing.T) {
	_, err := CalculateIdealFraction(10, 0)
	if !errors.Is(err, ErrBuiltAreaZero) {
		t.Fatalf("expected ErrBuiltAreaZero, got %v", err)
	}
}
