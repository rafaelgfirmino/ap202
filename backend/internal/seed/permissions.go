package seed

import "ap202/internal/domain"

var PermissionSeeds = []domain.PermissionSyncItem{
	{
		Microservice:   "financeiro-svc",
		Resource:       "boleto",
		Action:         "create",
		Description:    "Criar boletos do condomínio",
		SuggestedRoles: []string{"sindico"},
	},
	{
		Microservice:   "financeiro-svc",
		Resource:       "boleto",
		Action:         "read",
		Description:    "Visualizar boletos do condomínio",
		SuggestedRoles: []string{"sindico"},
	},
	{
		Microservice:   "financeiro-svc",
		Resource:       "inadimplencia",
		Action:         "read",
		Description:    "Consultar inadimplência do condomínio",
		SuggestedRoles: []string{"sindico"},
	},
	{
		Microservice:   "financeiro-svc",
		Resource:       "taxa",
		Action:         "update",
		Description:    "Atualizar taxas do condomínio",
		SuggestedRoles: []string{"sindico"},
	},
}
