Implemente a jornada de cadastro de unidades do ap202.

<context>
Unit (Unidade) é a menor divisão física de um condomínio. É o imóvel individual dentro do conjunto.

O que representa na vida real:
Dependendo do tipo de condomínio, uma unidade pode ser:
Tipo de condomínioO que é uma unidadePrédio residencialUm apartamento — 101, 202, 304Condomínio horizontalUma casa — Casa 1, Casa A, Lote 7Condomínio mistoPode ser apto ou casa no mesmo condomínioCondomínio comercialUma sala ou loja — Sala 12, Loja 3

O papel da unidade no domínio do ap202:
A unidade é o ponto central de tudo que envolve dinheiro e pessoa no sistema:
Unit
 ├── tem um ou mais bonds (owner, tenant)
 ├── tem mensalidades (pago, em aberto, parcial)
 └── gera inadimplência quando não paga
Sem a unidade não existe:

Controle de quem deve pagar
Registro de pagamento mensal
Vínculo de morador com papel owner ou tenant
Inadimplência — porque a cobrança é por unidade, não por pessoa


O que a unidade não é:
Ela não é o morador. O morador é uma person com um bond para a unidade. Uma unidade pode existir sem morador cadastrado — o síndico ainda precisa controlar o pagamento dela.
</domain>

Rotas a implementar:
POST  /api/v1/condominiums/{code}/units
GET   /api/v1/condominiums/{code}/units
GET   /api/v1/condominiums/{code}/units/{id}
Todas autenticadas — exigem JWT válido no header Authorization: Bearer <token>.

Migration
sqlCREATE TABLE IF NOT EXISTS units (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  condominium_id BIGINT       NOT NULL REFERENCES condominiums(id),
  identifier     VARCHAR(20)  NOT NULL,
  floor          VARCHAR(10),
  description    VARCHAR(200),
  active         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_units_condominium_identifier
    ON units (condominium_id, identifier);

CREATE INDEX idx_units_condominium
    ON units (condominium_id);

CREATE OR REPLACE TRIGGER trg_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

Entidade de domínio
internal/domain/unit.go
gotype Unit struct {
    ID             int64     json:"id" 
    CondominiumID  int64     json:"condominium_id" 
    Identifier     string    json:"identifier" 
    Floor          string    json:"floor,omitempty" 
    Description    string    json:"description,omitempty" 
    Active         bool      json:"active" 
    CreatedAt      time.Time json:"created_at" 
    UpdatedAt      time.Time json:"updated_at" 
}

var (
    ErrUnitNotFound            = errors.New("unit not found")
    ErrUnitIdentifierDuplicate = errors.New("unit identifier already exists in this condominium")
    ErrUnitIdentifierRequired  = errors.New("unit identifier is required")
)

Regras de negócio — usecase
O usecase recebe o code do condomínio (vindo da URL) e o person_id (vindo do contexto). Antes de qualquer operação:

Resolver o code para condominium_id via condominiumRepo.FindIDByCode(ctx, code) — retorna ErrCondominiumNotFound se não existir
Verificar se o person_id tem bond ativo com role = manager nesse condominium_id via bondRepo.ExistsActiveBond(ctx, personID, condominiumID, "manager") — retorna ErrForbidden se não tiver
Só então executar a operação na tabela units

Regras específicas de criação:

identifier é obrigatório, máximo 20 caracteres
identifier deve ser único dentro do condomínio — retorna ErrUnitIdentifierDuplicate se já existir
floor e description são opcionais
active nasce sempre como true


Interfaces
internal/ports/output/unit_repository.go
gotype UnitRepository interface {
    Create(ctx context.Context, unit *domain.Unit) error
    List(ctx context.Context, condominiumID int64) ([]domain.Unit, error)
    FindByID(ctx context.Context, id int64, condominiumID int64) (*domain.Unit, error)
}
internal/ports/output/bond_repository.go — adicionar método:
goExistsActiveBond(ctx context.Context, personID, condominiumID int64, role string) (bool, error)
internal/ports/output/condominium_repository.go — adicionar método:
goFindIDByCode(ctx context.Context, code string) (int64, error)
internal/ports/input/unit_service.go
gotype UnitService interface {
    Create(ctx context.Context, personID int64, code string, input CreateUnitInput) (*domain.Unit, error)
    List(ctx context.Context, personID int64, code string) ([]domain.Unit, error)
    GetByID(ctx context.Context, personID int64, code string, unitID int64) (*domain.Unit, error)
}

type CreateUnitInput struct {
    Identifier  string json:"identifier" 
    Floor       string json:"floor" 
    Description string json:"description" 
}

Requests e Responses
POST /api/v1/condominiums/{code}/units
Request:
json{
  "identifier": "101",
  "floor": "1",
  "description": "Apto fundos"
}
Response 201:
json{
  "id": 1,
  "condominium_id": 1,
  "identifier": "101",
  "floor": "1",
  "description": "Apto fundos",
  "active": true,
  "created_at": "2026-03-14T05:00:00Z"
}
GET /api/v1/condominiums/{code}/units
Response 200:
json{
  "data": [
    {
      "id": 1,
      "identifier": "101",
      "floor": "1",
      "description": "Apto fundos",
      "active": true,
      "created_at": "2026-03-14T05:00:00Z"
    }
  ],
  "total": 1
}
GET /api/v1/condominiums/{code}/units/{id}
Response 200: mesmo formato do item individual do POST.

Tratamento de erros — mapeamento HTTP:
Erro de domínioStatusCampo errorErrCondominiumNotFound404"condominium_not_found"ErrForbidden403"forbidden"ErrUnitNotFound404"unit_not_found"ErrUnitIdentifierDuplicate409"unit_identifier_duplicate"ErrUnitIdentifierRequired422"unit_identifier_required"Erro genérico500"internal_error"
Formato padrão:
json{
  "error": "unit_identifier_duplicate",
  "message": "This identifier already exists in this condominium."
}

O que NÃO implementar neste PR:

Edição ou desativação de unidade
Vínculo de moradores às unidades
Qualquer outra rota além das três descritas acima