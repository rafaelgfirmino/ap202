package vo

import (
	"errors"
	"testing"
)

func TestNewUnitCode(t *testing.T) {
	code, err := NewUnitCode("ABCD123", "A", "101")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if code.String() != "ABCD123-A-101" {
		t.Fatalf("unexpected code: %s", code.String())
	}
}

func TestNewUnitCode_WithoutGroup(t *testing.T) {
	code, err := NewUnitCode("ABCD123", "", "101")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if code.String() != "ABCD123-101" {
		t.Fatalf("unexpected code without group: %s", code.String())
	}
}

func TestNewUnitCode_IdentifierRequired(t *testing.T) {
	_, err := NewUnitCode("ABCD123", "A", "")
	if !errors.Is(err, ErrUnitCodeIdentifierRequired) {
		t.Fatalf("expected identifier required, got %v", err)
	}
}

func TestNewUnitCode_TooLong(t *testing.T) {
	_, err := NewUnitCode("CODIGO-CONDOMINIO-EXTREMAMENTE-GRANDE-1234567890", "T1", "101")
	if !errors.Is(err, ErrUnitCodeTooLong) {
		t.Fatalf("expected code too long, got %v", err)
	}
}

func TestParseUnitCode_WithGroup(t *testing.T) {
	groupName, identifier, err := ParseUnitCode("A-101")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if groupName != "A" || identifier != "101" {
		t.Fatalf("unexpected parse result: %s %s", groupName, identifier)
	}
}

func TestParseUnitCode_WithoutGroup(t *testing.T) {
	groupName, identifier, err := ParseUnitCode("101")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if groupName != "" || identifier != "101" {
		t.Fatalf("unexpected parse result: %s %s", groupName, identifier)
	}
}

func TestParseUnitCode_Invalid(t *testing.T) {
	_, _, err := ParseUnitCode("A-101-extra")
	if !errors.Is(err, ErrUnitCodeInvalid) {
		t.Fatalf("expected invalid code error, got %v", err)
	}
}
