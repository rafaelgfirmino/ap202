package middleware

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v4"

	"ap202/internal/authctx"
	"ap202/internal/ports/input"
)

var errTokenExpired = errors.New("token expired")

type AuthMiddleware struct {
	userService input.UserService
	jwksURL     string
	issuer      string
	client      *http.Client
	cacheTTL    time.Duration

	mu         sync.RWMutex
	cachedAt   time.Time
	cachedKeys map[string]*rsa.PublicKey
}

type clerkClaims struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	jwt.RegisteredClaims
}

type jwksResponse struct {
	Keys []jwk `json:"keys"`
}

type jwk struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	Alg string `json:"alg"`
	Use string `json:"use"`
	N   string `json:"n"`
	E   string `json:"e"`
}

func NewAuthMiddleware(userService input.UserService) (*AuthMiddleware, error) {
	jwksURL := os.Getenv("CLERK_JWKS_URL")
	issuer := os.Getenv("CLERK_ISSUER")
	if jwksURL == "" {
		return nil, fmt.Errorf("CLERK_JWKS_URL is required")
	}
	if issuer == "" {
		return nil, fmt.Errorf("CLERK_ISSUER is required")
	}

	return &AuthMiddleware{
		userService: userService,
		jwksURL:     jwksURL,
		issuer:      issuer,
		client:      &http.Client{Timeout: 5 * time.Second},
		cacheTTL:    5 * time.Minute,
		cachedKeys:  make(map[string]*rsa.PublicKey),
	}, nil
}

func (m *AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString, err := extractBearerToken(r.Header.Get("Authorization"))
		if err != nil {
			writeAuthError(w, http.StatusUnauthorized, "unauthorized", "Token inválido ou ausente.")
			return
		}

		claims, err := m.validateToken(r.Context(), tokenString)
		if err != nil {
			if errors.Is(err, errTokenExpired) {
				writeAuthError(w, http.StatusUnauthorized, "token_expired", "Token expirado.")
				return
			}
			log.Printf("failed to validate clerk token: %v", err)
			writeAuthError(w, http.StatusUnauthorized, "unauthorized", "Token inválido ou ausente.")
			return
		}

		user, err := m.userService.FindOrCreate(r.Context(), claims.externalAuthID(), claims.FirstName, claims.LastName, claims.Email)
		if err != nil {
			log.Printf("failed to find or create user: %v", err)
			writeAuthError(w, http.StatusInternalServerError, "internal_error", "Erro interno do servidor.")
			return
		}

		ctx := authctx.WithUser(r.Context(), user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (c *clerkClaims) externalAuthID() string {
	if c.Subject != "" {
		return c.Subject
	}

	return c.ID
}

func (m *AuthMiddleware) validateToken(ctx context.Context, tokenString string) (*clerkClaims, error) {
	claims := &clerkClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		kid, _ := token.Header["kid"].(string)
		if kid == "" {
			return nil, fmt.Errorf("missing kid")
		}

		keys, err := m.getJWKSKeys(ctx)
		if err != nil {
			return nil, err
		}

		key, ok := keys[kid]
		if !ok {
			return nil, fmt.Errorf("kid not found in jwks")
		}

		return key, nil
	})
	if err != nil {
		var validationErr *jwt.ValidationError
		if errors.As(err, &validationErr) && validationErr.Errors&jwt.ValidationErrorExpired != 0 {
			return nil, errTokenExpired
		}
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	if claims.Issuer != m.issuer {
		return nil, fmt.Errorf("invalid issuer")
	}
	if claims.externalAuthID() == "" {
		return nil, fmt.Errorf("missing subject")
	}
	if claims.IssuedAt == nil || claims.ExpiresAt == nil {
		return nil, fmt.Errorf("missing token timestamps")
	}

	return claims, nil
}

func (m *AuthMiddleware) getJWKSKeys(ctx context.Context) (map[string]*rsa.PublicKey, error) {
	m.mu.RLock()
	if time.Since(m.cachedAt) < m.cacheTTL && len(m.cachedKeys) > 0 {
		defer m.mu.RUnlock()
		return m.cachedKeys, nil
	}
	m.mu.RUnlock()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, m.jwksURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create jwks request: %w", err)
	}

	resp, err := m.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch jwks: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected jwks status: %d", resp.StatusCode)
	}

	var payload jwksResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("failed to decode jwks: %w", err)
	}

	keys := make(map[string]*rsa.PublicKey, len(payload.Keys))
	for _, key := range payload.Keys {
		if key.Kty != "RSA" || key.Kid == "" {
			continue
		}
		publicKey, err := parseRSAPublicKey(key.N, key.E)
		if err != nil {
			return nil, fmt.Errorf("failed to parse jwk %s: %w", key.Kid, err)
		}
		keys[key.Kid] = publicKey
	}

	m.mu.Lock()
	m.cachedKeys = keys
	m.cachedAt = time.Now()
	m.mu.Unlock()

	return keys, nil
}

func parseRSAPublicKey(modulus, exponent string) (*rsa.PublicKey, error) {
	nBytes, err := base64.RawURLEncoding.DecodeString(modulus)
	if err != nil {
		return nil, fmt.Errorf("failed to decode modulus: %w", err)
	}
	eBytes, err := base64.RawURLEncoding.DecodeString(exponent)
	if err != nil {
		return nil, fmt.Errorf("failed to decode exponent: %w", err)
	}

	var e int
	for _, b := range eBytes {
		e = e<<8 + int(b)
	}
	if e == 0 {
		return nil, fmt.Errorf("invalid exponent")
	}

	return &rsa.PublicKey{N: new(big.Int).SetBytes(nBytes), E: e}, nil
}

func extractBearerToken(header string) (string, error) {
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || strings.TrimSpace(parts[1]) == "" {
		return "", fmt.Errorf("invalid authorization header")
	}
	return strings.TrimSpace(parts[1]), nil
}

func writeAuthError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(map[string]string{
		"error":   code,
		"message": message,
	}); err != nil {
		log.Printf("failed to write auth error response: %v", err)
	}
}
