package output

import "context"

type BundleRefresher interface {
	Refresh(ctx context.Context) error
}
