package domain

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

type Coordinates struct {
	Latitude  float64
	Longitude float64
}

type nominatimResponse struct {
	Lat string `json:"lat"`
	Lon string `json:"lon"`
}

func Geocode(street, number, city, state, zipCode string) (Coordinates, error) {
	address := fmt.Sprintf("%s, %s, %s, %s, %s, Brazil", street, number, city, state, zipCode)

	reqURL := fmt.Sprintf("https://nominatim.openstreetmap.org/search?q=%s&format=json&limit=1",
		url.QueryEscape(address))

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest(http.MethodGet, reqURL, nil)
	if err != nil {
		return Coordinates{}, fmt.Errorf("failed to create geocoding request: %w", err)
	}
	req.Header.Set("User-Agent", "ap202-condominium-api/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return Coordinates{}, fmt.Errorf("geocoding request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return Coordinates{}, fmt.Errorf("geocoding returned status %d", resp.StatusCode)
	}

	var results []nominatimResponse
	if err := json.NewDecoder(resp.Body).Decode(&results); err != nil {
		return Coordinates{}, fmt.Errorf("failed to decode geocoding response: %w", err)
	}

	if len(results) == 0 {
		return Coordinates{}, nil
	}

	lat, err := strconv.ParseFloat(results[0].Lat, 64)
	if err != nil {
		return Coordinates{}, fmt.Errorf("failed to parse latitude: %w", err)
	}

	lon, err := strconv.ParseFloat(results[0].Lon, 64)
	if err != nil {
		return Coordinates{}, fmt.Errorf("failed to parse longitude: %w", err)
	}

	return Coordinates{Latitude: lat, Longitude: lon}, nil
}
