package seed

type RoleSeed struct {
	Name        string
	Description string
	Scope       string
}

const ScopeGlobal = "global"

var GlobalRoles = []RoleSeed{
	{Name: "platform-admin", Description: "Administradora, acesso irrestrito", Scope: ScopeGlobal},
	{Name: "support", Description: "Suporte interno, leitura global", Scope: ScopeGlobal},
}

var RoleTemplates = []RoleSeed{
	{Name: "sindico", Description: "Administrador do condomínio"},
	{Name: "morador", Description: "Morador do condomínio"},
	{Name: "inquilino", Description: "Inquilino do condomínio"},
}

func IsGlobalRoleName(name string) bool {
	for _, role := range GlobalRoles {
		if role.Name == name {
			return true
		}
	}
	return false
}
