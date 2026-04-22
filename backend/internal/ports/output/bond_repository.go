package output

import "context"

type AssociationRepository interface {
	HasActiveManagerAssociation(ctx context.Context, personID, condominiumID int64) (bool, error)
}
