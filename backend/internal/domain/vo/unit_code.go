package vo

import (
	"errors"
	"fmt"
	"strings"
)

var (
	ErrUnitCodeIdentifierRequired = errors.New("unit code identifier is required")
	ErrUnitCodeTooLong            = errors.New("unit code is too long")
	ErrUnitCodeInvalid            = errors.New("unit code is invalid")
)

type UnitCode struct {
	value string
}

func NewUnitCode(condominiumCode, groupName, identifier string) (UnitCode, error) {
	if identifier == "" {
		return UnitCode{}, ErrUnitCodeIdentifierRequired
	}

	value := fmt.Sprintf("%s-%s", condominiumCode, identifier)
	if groupName != "" {
		value = fmt.Sprintf("%s-%s-%s", condominiumCode, groupName, identifier)
	}
	if len(value) > 50 {
		return UnitCode{}, ErrUnitCodeTooLong
	}

	return UnitCode{value: value}, nil
}

func (u UnitCode) String() string {
	return u.value
}

func ParseUnitCode(value string) (groupName string, identifier string, err error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return "", "", ErrUnitCodeIdentifierRequired
	}

	parts := strings.Split(value, "-")
	switch len(parts) {
	case 1:
		identifier = strings.TrimSpace(parts[0])
		if identifier == "" {
			return "", "", ErrUnitCodeIdentifierRequired
		}
		return "", identifier, nil
	case 2:
		groupName = strings.TrimSpace(parts[0])
		identifier = strings.TrimSpace(parts[1])
		if groupName == "" || identifier == "" {
			return "", "", ErrUnitCodeInvalid
		}
		return groupName, identifier, nil
	default:
		return "", "", ErrUnitCodeInvalid
	}
}
