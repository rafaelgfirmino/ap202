package vo

import (
	"math/rand"
	"strings"
)

const (
	allowedLetters = "ABCDEFGHJKMNPQRSTUVWXYZ"
	allowedDigits  = "0123456789"
)

func GenerateCondominiumCode() string {
	var sb strings.Builder
	sb.Grow(7)

	for i := 0; i < 4; i++ {
		sb.WriteByte(allowedLetters[rand.Intn(len(allowedLetters))])
	}
	for i := 0; i < 3; i++ {
		sb.WriteByte(allowedDigits[rand.Intn(len(allowedDigits))])
	}

	return sb.String()
}
