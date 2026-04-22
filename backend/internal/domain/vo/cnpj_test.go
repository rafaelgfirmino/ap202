package vo

import "testing"

func TestValidateCNPJ_Valid(t *testing.T) {
	validCNPJs := []string{
		"11222333000181",
		"11.222.333/0001-81",
	}

	for _, cnpj := range validCNPJs {
		if !ValidateCNPJ(cnpj) {
			t.Errorf("expected CNPJ %s to be valid", cnpj)
		}
	}
}

func TestValidateCNPJ_Invalid(t *testing.T) {
	invalidCNPJs := []string{
		"",
		"00000000000000",
		"11111111111111",
		"12345678901234",
		"1234567890123",
		"123456789012345",
		"abcdefghijklmn",
		"11222333000182",
	}

	for _, cnpj := range invalidCNPJs {
		if ValidateCNPJ(cnpj) {
			t.Errorf("expected CNPJ %s to be invalid", cnpj)
		}
	}
}
