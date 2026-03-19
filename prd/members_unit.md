<prompt>
  <title>Vínculo de Moradores às Unidades — MVP Simplificado</title>
  <project>ap202</project>
  <version>1.0</version>

  <architecture>
    <description>
      Arquitetura hexagonal (Ports and Adapters) em Go 1.22+.
      Autenticação via Clerk — o `user_id` já está disponível no contexto
      da requisição injetado pelo middleware existente.
    </description>
    <structure>
      <![CDATA[
internal/
├── adapters/
│   ├── input/          # HTTP handlers (chi/v5) e middlewares
│   └── output/postgres # repositórios (pgx/v5)
├── domain/             # entidades e VOs
│   └── vo/             # Value Objects
├── ports/
│   ├── input/          # interfaces de service
│   └── output/         # interfaces de repositório
└── usecase/            # implementação dos services
      ]]>
    </structure>
  </architecture>

  <rules>
    <rule>Chaves primárias: `BIGINT GENERATED ALWAYS AS IDENTITY` em todas as tabelas</rule>
    <rule>Sem ORM — SQL puro via `pgx/v5`</rule>
    <rule>Sem frameworks além de `chi/v5`</rule>
    <rule>Erros de domínio definidos em `domain/` e mapeados para HTTP no handler</rule>
    <rule>Handler só valida input e chama usecase — zero lógica de negócio</rule>
    <rule>Usecase contém toda a regra de negócio — zero referência a HTTP</rule>
    <rule>Repositório só executa SQL — zero regra de negócio</rule>
    <rule>
      Validação de acesso: somente verificar se o JWT é válido.
      Não validar role, não validar bond.
      A camada de autorização por role será implementada em passo dedicado antes do lançamento.
    </rule>
  </rules>

  <context>
    <mvp_simplified>
      O síndico cadastra moradores informando nome, e-mail e papel.
      O morador não precisa ter conta no ap202 ainda.
      Não há envio de e-mail, token de convite ou redirect com Clerk.
      O registro é criado para fins de controle de inadimplência.

      Quando o morador fizer login futuramente pelo Clerk, o middleware existente
      já trata o vínculo automaticamente via `FindOrCreate` por e-mail,
      preenchendo o `clerk_id` no `user` existente.
    </mvp_simplified>

    <nomenclature>
      | Entidade | Descrição |
      |----------|-----------|
      | `Bond`   | Entidade de domínio — tabela `bonds` no banco. Representa qualquer vínculo: manager, administrator, owner, tenant |
      | `Member` | Projeção de leitura — output da API. Junta dados de `bonds` + `users` para consumo do frontend. Não tem tabela no banco |
    </nomenclature>
  </context>

  <routes>
    <route method="POST"   path="/api/v1/condominiums/{code}/units/{unit_id}/members" auth="true" />
    <route method="GET"    path="/api/v1/condominiums/{code}/units/{unit_id}/members" auth="true" />
    <route method="DELETE" path="/api/v1/condominiums/{code}/units/{unit_id}/members/{bond_id}" auth="true" />
  </routes>

  <migration>
    <description>
      Nenhuma tabela nova. Apenas garantir que `users` aceita `clerk_id` nulo
      para moradores ainda sem conta.
    </description>
    <sql>
      <![CDATA[
-- clerk_id pode ser nulo para moradores cadastrados pelo síndico
ALTER TABLE users
  ALTER COLUMN clerk_id DROP NOT NULL;

-- Índice parcial — unicidade apenas quando clerk_id está preenchido
DROP INDEX IF EXISTS idx_users_clerk_id;
CREATE UNIQUE INDEX idx_users_clerk_id
    ON users (clerk_id)
    WHERE clerk_id IS NOT NULL;
      ]]>
    </sql>
  </migration>

  <domain>

    <entity name="Bond" file="internal/domain/bond.go">
      <![CDATA[
type Bond struct {
    ID            int64      `json:"id"`
    UserID        int64      `json:"user_id"`
    CondominiumID int64      `json:"condominium_id"`
    UnitID        *int64     `json:"unit_id,omitempty"`
    Role          string     `json:"role"`
    Active        bool       `json:"active"`
    StartDate     time.Time  `json:"start_date"`
    EndDate       *time.Time `json:"end_date,omitempty"`
    CreatedAt     time.Time  `json:"created_at"`
}

var (
    ErrBondNotFound         = errors.New("bond not found")
    ErrUnitAlreadyHasOwner  = errors.New("unit already has an active owner")
    ErrUnitAlreadyHasTenant = errors.New("unit already has an active tenant")
    ErrInvalidMemberRole    = errors.New("role must be owner or tenant")
)
      ]]>
    </entity>

    <entity name="Member" file="internal/domain/member.go">
      <note>Member é uma projeção de leitura — não tem tabela no banco</note>
      <![CDATA[
type Member struct {
    BondID    int64      `json:"bond_id"`
    UserID    int64      `json:"user_id"`
    UnitID    int64      `json:"unit_id"`
    Name      string     `json:"name"`
    Email     string     `json:"email"`
    Role      string     `json:"role"`
    Active    bool       `json:"active"`
    StartDate time.Time  `json:"start_date"`
    EndDate   *time.Time `json:"end_date,omitempty"`
    CreatedAt time.Time  `json:"created_at"`
}

var (
    ErrMemberNotFound = errors.New("member not found")
    ErrNameRequired   = errors.New("name is required")
    ErrEmailRequired  = errors.New("email is required")
)
      ]]>
    </entity>

  </domain>

  <business_rules>

    <pre_conditions>
      <step order="1">
        Resolver `code` para `condominium_id` via `condominiumRepo.FindIDByCode(ctx, code)`.
        Retorna `ErrCondominiumNotFound` se não existir.
      </step>
      <step order="2">
        Verificar se `unit_id` pertence ao `condominium_id` via
        `unitRepo.BelongsToCondominium(ctx, unitID, condominiumID)`.
        Retorna `ErrUnitNotFound` se não pertencer.
      </step>
    </pre_conditions>

    <creation_rules>
      <user_resolution>
        - Buscar `user` existente via `userRepo.FindByEmail(ctx, email)`
        - Se encontrado → usar o `user` existente
        - Se não encontrado → criar novo `user` com `clerk_id = null`, `name` e `email` informados
      </user_resolution>
      <bond_validation>
        - `role` aceita apenas `owner` ou `tenant` → `ErrInvalidMemberRole` para qualquer outro valor
        - Máximo um `owner` ativo por unidade → `ErrUnitAlreadyHasOwner` se já existir
        - Máximo um `tenant` ativo por unidade → `ErrUnitAlreadyHasTenant` se já existir
        - `start_date` padrão é hoje se não informado
        - `end_date` é opcional
      </bond_validation>
      <transaction>
        Criação de `user` (se necessário) + criação de `bond` em uma única transação.
        Se qualquer operação falhar, nada é persistido.
      </transaction>
    </creation_rules>

    <delete_rules>
      Não remove o registro fisicamente. Apenas desativa o bond:
      - `active = false`
      - `end_date = hoje`
    </delete_rules>

  </business_rules>

  <interfaces>

    <port type="input" file="internal/ports/input/member_service.go">
      <![CDATA[
type MemberService interface {
    Add(ctx context.Context, userID int64, code string, unitID int64, input AddMemberInput) (*domain.Member, error)
    List(ctx context.Context, userID int64, code string, unitID int64) ([]domain.Member, error)
    Remove(ctx context.Context, userID int64, code string, unitID int64, bondID int64) error
}

type AddMemberInput struct {
    Name      string     `json:"name"`
    Email     string     `json:"email"`
    Role      string     `json:"role"`
    StartDate *time.Time `json:"start_date"`
    EndDate   *time.Time `json:"end_date"`
}
      ]]>
    </port>

    <port type="output" file="internal/ports/output/bond_repository.go">
      <![CDATA[
type BondRepository interface {
    Create(ctx context.Context, tx pgx.Tx, bond *domain.Bond) error
    ExistsActiveBondByRole(ctx context.Context, unitID int64, role string) (bool, error)
    Deactivate(ctx context.Context, bondID int64, condominiumID int64) error
    ListMembersByUnitID(ctx context.Context, unitID int64) ([]domain.Member, error)
}
      ]]>
    </port>

    <port type="output" file="internal/ports/output/unit_repository.go">
      <note>Adicionar ao repositório existente</note>
      <![CDATA[
BelongsToCondominium(ctx context.Context, unitID int64, condominiumID int64) (bool, error)
      ]]>
    </port>

    <port type="output" file="internal/ports/output/user_repository.go">
      <note>Adicionar ao repositório existente</note>
      <![CDATA[
FindByEmail(ctx context.Context, email string) (*domain.User, error)
      ]]>
    </port>

  </interfaces>

  <api>

    <endpoint method="POST" path="/api/v1/condominiums/{code}/units/{unit_id}/members">
      <request>
        <![CDATA[
{
  "name": "Maria Silva",
  "email": "maria@email.com",
  "role": "owner",
  "start_date": "2026-03-14"
}
        ]]>
      </request>
      <response status="201">
        <![CDATA[
{
  "bond_id": 2,
  "user_id": 5,
  "unit_id": 1,
  "name": "Maria Silva",
  "email": "maria@email.com",
  "role": "owner",
  "active": true,
  "start_date": "2026-03-14",
  "end_date": null,
  "created_at": "2026-03-14T05:00:00Z"
}
        ]]>
      </response>
    </endpoint>

    <endpoint method="GET" path="/api/v1/condominiums/{code}/units/{unit_id}/members">
      <response status="200">
        <![CDATA[
{
  "data": [
    {
      "bond_id": 2,
      "user_id": 5,
      "name": "Maria Silva",
      "email": "maria@email.com",
      "role": "owner",
      "active": true,
      "start_date": "2026-03-14",
      "end_date": null
    }
  ],
  "total": 1
}
        ]]>
      </response>
    </endpoint>

    <endpoint method="DELETE" path="/api/v1/condominiums/{code}/units/{unit_id}/members/{bond_id}">
      <response status="204">
        <note>Sem body — apenas desativa o bond</note>
      </response>
    </endpoint>

  </api>

  <error_mapping>
    | Erro de domínio             | Status | Campo `error`              |
    |-----------------------------|--------|----------------------------|
    | `ErrCondominiumNotFound`    | 404    | `condominium_not_found`    |
    | `ErrUnitNotFound`           | 404    | `unit_not_found`           |
    | `ErrBondNotFound`           | 404    | `bond_not_found`           |
    | `ErrMemberNotFound`         | 404    | `member_not_found`         |
    | `ErrUnitAlreadyHasOwner`    | 409    | `unit_already_has_owner`   |
    | `ErrUnitAlreadyHasTenant`   | 409    | `unit_already_has_tenant`  |
    | `ErrInvalidMemberRole`      | 422    | `invalid_member_role`      |
    | `ErrNameRequired`           | 422    | `name_required`            |
    | `ErrEmailRequired`          | 422    | `email_required`           |
    | `ErrUnauthorized`           | 401    | `unauthorized`             |
    | Erro genérico               | 500    | `internal_error`           |

    **Formato padrão:**
```json
    {
      "error": "unit_already_has_owner",
      "message": "This unit already has an active owner."
    }
```
  </error_mapping>

  <out_of_scope>
    <item>Validação de role ou bond — será feito em passo dedicado antes do lançamento</item>
    <item>Envio de e-mail de convite</item>
    <item>Token de convite ou fluxo de redirect com Clerk</item>
    <item>Edição de dados do morador</item>
    <item>Atualização de bond existente</item>
    <item>Qualquer lógica de pagamento ou inadimplência</item>
  </out_of_scope>

</prompt>