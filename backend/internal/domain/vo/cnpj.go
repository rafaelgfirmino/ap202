package vo

import (
	"strconv"
	"strings"
)

func ValidateCNPJ(cnpj string) bool {
	cnpj = strings.ReplaceAll(cnpj, ".", "")
	cnpj = strings.ReplaceAll(cnpj, "/", "")
	cnpj = strings.ReplaceAll(cnpj, "-", "")

	if len(cnpj) != 14 {
		return false
	}

	if _, err := strconv.ParseInt(cnpj, 10, 64); err != nil {
		return false
	}

	if allSameDigits(cnpj) {
		return false
	}

	weights1 := []int{5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2}
	d1 := calculateDigit(cnpj[:12], weights1)

	weights2 := []int{6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2}
	d2 := calculateDigit(cnpj[:13], weights2)

	return cnpj[12] == byte('0'+d1) && cnpj[13] == byte('0'+d2)
}

func calculateDigit(s string, weights []int) int {
	sum := 0
	for i, w := range weights {
		digit := int(s[i] - '0')
		sum += digit * w
	}
	remainder := sum % 11
	if remainder < 2 {
		return 0
	}
	return 11 - remainder
}

func allSameDigits(s string) bool {
	for i := 1; i < len(s); i++ {
		if s[i] != s[0] {
			return false
		}
	}
	return true
}
