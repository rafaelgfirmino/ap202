package vo

import (
	"strings"
	"testing"
)

func TestGenerateCondominiumCode_Format(t *testing.T) {
	for i := 0; i < 100; i++ {
		code := GenerateCondominiumCode()

		if len(code) != 7 {
			t.Fatalf("expected code length 7, got %d: %s", len(code), code)
		}

		letters := code[:4]
		digits := code[4:]

		for _, c := range letters {
			if !strings.ContainsRune(allowedLetters, c) {
				t.Errorf("code contains disallowed letter %c in %s", c, code)
			}
		}

		for _, c := range digits {
			if c < '0' || c > '9' {
				t.Errorf("code contains non-digit %c in %s", c, code)
			}
		}
	}
}

func TestGenerateCondominiumCode_NoAmbiguousLetters(t *testing.T) {
	ambiguous := "OIL"
	for i := 0; i < 200; i++ {
		code := GenerateCondominiumCode()
		for _, c := range code[:4] {
			if strings.ContainsRune(ambiguous, c) {
				t.Errorf("code contains ambiguous letter %c: %s", c, code)
			}
		}
	}
}
