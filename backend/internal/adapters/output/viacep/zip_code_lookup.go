package viacep

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"ap202/internal/domain"
)

const defaultBaseURL = "https://viacep.com.br"

type ZipCodeLookupClient struct {
	baseURL    string
	httpClient *http.Client
}

type viaCEPResponse struct {
	ZipCode      string `json:"cep"`
	Street       string `json:"logradouro"`
	Neighborhood string `json:"bairro"`
	City         string `json:"localidade"`
	State        string `json:"uf"`
	Error        bool   `json:"erro"`
}

func NewZipCodeLookupClient(httpClient *http.Client) *ZipCodeLookupClient {
	if httpClient == nil {
		httpClient = &http.Client{Timeout: 5 * time.Second}
	}

	return &ZipCodeLookupClient{
		baseURL:    defaultBaseURL,
		httpClient: httpClient,
	}
}

func (c *ZipCodeLookupClient) LookupAddressByZipCode(ctx context.Context, zipCode string) (*domain.ZipCodeAddress, error) {
	cleanZipCode := onlyDigits(zipCode)
	if len(cleanZipCode) != 8 {
		return nil, domain.ErrInvalidZipCode
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		fmt.Sprintf("%s/ws/%s/json/", c.baseURL, cleanZipCode),
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("create zip code request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("lookup zip code: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("lookup zip code returned status %d", resp.StatusCode)
	}

	var payload viaCEPResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("decode zip code response: %w", err)
	}

	if payload.Error {
		return nil, domain.ErrZipCodeNotFound
	}

	return &domain.ZipCodeAddress{
		ZipCode:      cleanZipCode,
		Street:       strings.TrimSpace(payload.Street),
		Neighborhood: strings.TrimSpace(payload.Neighborhood),
		City:         strings.TrimSpace(payload.City),
		State:        strings.TrimSpace(payload.State),
	}, nil
}

func onlyDigits(value string) string {
	var builder strings.Builder
	builder.Grow(len(value))

	for _, char := range value {
		if char >= '0' && char <= '9' {
			builder.WriteRune(char)
		}
	}

	return builder.String()
}
