package vo

type Address struct {
	Street       string  `json:"street"`
	Number       string  `json:"number"`
	Neighborhood string  `json:"neighborhood"`
	City         string  `json:"city"`
	State        string  `json:"state"`
	ZipCode      string  `json:"zip_code"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
}
