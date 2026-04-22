package authz

import (
	"net/http"
)

type Request struct {
	Permission string
	Resource   map[string]any
	Attributes map[string]string
}

type InputExtractor func(r *http.Request) Request

func Require(authorizer *Authorizer, extractor InputExtractor, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		req := extractor(r)
		opts := make([]Option, 0, 2)
		if req.Resource != nil {
			opts = append(opts, WithResource(req.Resource))
		}
		if req.Attributes != nil {
			opts = append(opts, WithAttributes(req.Attributes))
		}
		if err := authorizer.Require(r.Context(), req.Permission, opts...); err != nil {
			http.Error(w, "authorization check failed", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}
