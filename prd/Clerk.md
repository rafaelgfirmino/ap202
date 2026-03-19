Contexto do Clerk
O Clerk gerencia cadastro, login e senha no frontend. O backend não implementa nenhuma dessas rotas. A responsabilidade do backend é:

Validar o JWT emitido pelo Clerk
Criar o registro local de user na primeira requisição autenticada
Retornar o registro existente nas requisições seguintes

Variáveis de ambiente necessárias:
CLERK_JWKS_URL=https://your-clerk-domain/.well-known/jwks.json
CLERK_ISSUER=https://your-clerk-domain

Migration
sqlCREATE TABLE IF NOT EXISTS users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clerk_id      VARCHAR(50)  NOT NULL,
  name          VARCHAR(200) NOT NULL,
  email         VARCHAR(254) NOT NULL,
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_clerk_id ON users (clerk_id);
CREATE UNIQUE INDEX idx_users_email    ON users (email);

CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_atualizado_em
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

Entidade de domínio
internal/domain/user.go
gotype user struct {
    ID        int64     `json:"id"`
    ClerkID   string    `json:"clerk_id"`
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

var (
    ErruserNotFound     = errors.New("user not found")
    ErrEmailAlreadyExists = errors.New("email already exists")
    ErrClerkIDRequired    = errors.New("clerk_id is required")
)

Interface do repositório
internal/ports/output/user_repository.go
gotype userRepository interface {
    FindByClerkID(ctx context.Context, clerkID string) (*domain.user, error)
    Create(ctx context.Context, user *domain.user) error
}

Interface do service
internal/ports/input/user_service.go
gotype userService interface {
    FindOrCreate(ctx context.Context, clerkID, name, email string) (*domain.user, error)
}

Middleware de autenticação
internal/adapters/input/middleware/auth.go
Responsabilidades:

Extrair o Bearer token do header Authorization
Validar o JWT usando o JWKS público do Clerk via CLERK_JWKS_URL
Verificar exp, iat e iss
Extrair do token:

sub → clerk_id
name → nome do usuário
email → e-mail principal


Chamar userService.FindOrCreate(ctx, clerkID, name, email)
Injetar o user_id local no contexto via chave tipada — nunca string, usar tipo próprio:

gotype contextKey string
const CtxKeyuserID contextKey = "user_id"

Retornar 401 para token ausente, inválido ou expirado — sem expor detalhes internos

O restante do sistema usa apenas user_id do contexto. Nenhuma outra camada conhece o Clerk.

Rota de perfil — para validar a implementação
GET /api/v1/me — autenticada
Não recebe body. Lê o user_id do contexto e retorna os dados da user.
Response 200:
json{
  "id": 1,
  "name": "João Silva",
  "email": "joao@email.com",
  "created_at": "2026-03-14T05:00:00Z"
}
Erros:
SituaçãoStatusErroToken ausente ou inválido401"unauthorized"Token expirado401"token_expired"user não encontrada no banco404"user_not_found"Erro genérico500"internal_error"
Formato de erro padrão:
json{
  "error": "unauthorized",
  "message": "Token inválido ou ausente."
}

O que NÃO implementar neste PR:

Cadastro ou login — responsabilidade do Clerk no frontend
Atualização de perfil
Exclusão de conta
Qualquer rota além de GET /api/v1/me
Qualquer lógica relacionada a condomínio ou vínculo

<important>
Not implement any frontend code
</important>
