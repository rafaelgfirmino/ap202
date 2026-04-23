# Agent Instructions — backend/

## Objetivo

Este arquivo define padrões de arquitetura, testes e organização para projetos Go
do time. Essas regras devem ser tratadas como padrão de implementação. Quando
existir decisão explícita do projeto, ADR ou orientação direta do mantenedor,
essa decisão local prevalece.

---

## Stack

- **Linguagem:** Go 1.22+
- **Banco de dados:** PostgreSQL
- **Migrations:** `goose`
- **Camada de queries:** `sqlc`
- **Router HTTP:** `net/http` com `http.ServeMux`
- **UUID:** `github.com/google/uuid`
- **Testes:** `testing` + `httptest` + `testcontainers`
- **Assercoes auxiliares:** `testify` quando agregar clareza
- **Autorização:** `github.com/open-policy-agent/opa` quando aplicável

---

## Estrutura do Projeto

Todo serviço Go deste projeto deve seguir esta organização como padrão:

```text
cmd/
  <service>/
    main.go

internal/
  adapters/
    input/
      http/
    output/
      postgres/
  domain/
  ports/
    input/
    output/
  usecase/
  authz/
  authctx/
  seed/

policies/

sqlc.yaml
docker-compose.yml
Makefile
go.mod
```

### Regras da estrutura

- `cmd/<service>/main.go` apenas inicializa dependências e sobe a aplicação.
- `internal/domain` contém entidades, value objects e regras de negócio puras.
- `internal/usecase` implementa os casos de uso da aplicação.
- `internal/ports/input` define contratos consumidos pelos adapters de entrada.
- `internal/ports/output` define contratos exigidos pelos casos de uso para falar
  com infraestrutura.
- `internal/adapters/input/http` concentra servidor, rotas, handlers e middlewares
  baseados em `net/http`.
- `internal/adapters/output/postgres` implementa persistência PostgreSQL, queries,
  migrations e integrações do `sqlc`.
- `internal/authz` contém engine, autorização embutida e regras relacionadas.
- `internal/authctx` concentra dados de contexto de autenticação/autorização.
- `internal/seed` contém carga inicial de dados de autorização quando necessário.
- `policies/` armazena políticas OPA versionadas do projeto.
- `sqlc.yaml` referencia queries, schema e saída gerada dentro de
  `internal/adapters/output/postgres/`.

---

## Arquitetura

### Direção de dependências

```text
adapters/input -> ports/input -> usecase -> ports/output -> adapters/output
usecase -> domain
adapters/output -> domain
authz -> domain
```

- `domain` é a camada mais estável e não deve depender de HTTP, banco,
  ORM ou detalhes de infraestrutura.
- `adapters/input` apenas traduz entrada externa para chamadas de caso de uso.
- `ports/input` define os contratos expostos pela aplicação.
- `usecase` coordena fluxo, validações de aplicação e colaboração entre portas.
- `ports/output` define o que a aplicação precisa da infraestrutura.
- `adapters/output` conhece persistência e integrações externas e faz o
  mapeamento para `domain`.
- O roteamento HTTP deve usar `http.ServeMux` e middlewares baseados em
  `http.Handler`.
- Nomes e pacotes devem seguir o vocabulário do projeto atual: `usecase`,
  `ports`, `adapters`, `domain`, `authz` e `authctx`.

### Domain

- Um arquivo por entidade, agregado ou value object quando fizer sentido.
- Construtores como `NewEntity(...)` devem validar entrada e retornar
  `(*Entity, error)`.
- Regras de negócio pertencem ao tipo de domínio sempre que fizer sentido.
- `domain` pode usar bibliotecas simples e estáveis como `time`, `fmt`, `errors`
  e `uuid`, mas não deve depender de banco, HTTP ou frameworks.
- Evite gerar `uuid` e timestamps fora do construtor quando isso fizer parte da
  criação da entidade.

```go
func NewPermission(microservice, resource, action string) (*Permission, error) {
    if microservice == "" {
        return nil, errors.New("microservice is required")
    }

    return &Permission{
        ID:           uuid.New(),
        Microservice: microservice,
        Name:         microservice + ":" + resource + ":" + action,
        CreatedAt:    time.Now(),
    }, nil
}
```

### Usecase

- Um arquivo por agregado ou fluxo principal de aplicação.
- Implementa interfaces de `ports/input` quando houver contrato explícito da
  camada de entrada.
- Recebe dependências via interfaces de `ports/output`.
- Não deve conhecer detalhes de SQL, `sqlc` ou transporte HTTP.
- Toda escrita que impactar autorização deve acionar recarga da engine, quando
  o projeto tiver esse requisito.
- Sempre propague contexto recebido da camada acima.

```go
type PermissionRepository interface {
    Create(ctx context.Context, p *domain.Permission) error
    List(ctx context.Context) ([]domain.Permission, error)
}

type PermissionUsecase struct {
    repo   PermissionRepository
    engine AuthzEngine
}
```

### Ports

- `ports/input` define contratos consumidos pelos adapters de entrada.
- `ports/output` define contratos que abstraem persistência, mensageria,
  autorização e integrações externas.
- Interfaces devem morar perto da necessidade da aplicação, não da tecnologia.
- Não vazar detalhes de adapter, banco ou biblioteca através das portas.

```go
type PermissionService interface {
    Create(ctx context.Context, input CreatePermissionInput) (*domain.Permission, error)
    List(ctx context.Context) ([]domain.Permission, error)
}
```

### Adapters Output

- Implementam contratos de `ports/output`.
- Toda query SQL deve viver em
  `internal/adapters/output/postgres/queries/`.
- Schema usado pelo `sqlc` vive em
  `internal/adapters/output/postgres/schema/`.
- Migrations versionadas vivem em
  `internal/adapters/output/postgres/migrations/`.
- Nunca escrever SQL inline em arquivos Go.
- Tipos gerados por `sqlc` não devem vazar para `usecase`, `ports` ou `domain`.
- Sempre mapear tipos do `sqlc` para tipos de `domain` antes de retornar.
- Tratar `sql.ErrNoRows` e equivalentes como erros de domínio ou de aplicação
  adequados.
- Integrações com banco devem seguir o fluxo do projeto com `database/sql`,
  `sqlc` e `goose`.

```go
func (r *PermissionRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Permission, error) {
    row, err := r.queries.GetPermission(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("get permission: %w", err)
    }

    return mapPermission(row), nil
}
```

### Adapters Input

- Handlers apenas fazem: parse de entrada -> chamada de caso de uso -> escrita de saída.
- Sem regra de negócio.
- Use helpers compartilhados como `writeJSON` e `writeError`.
- Não acessar adapters de saída diretamente.
- Validar payload e parâmetros de rota no limite da camada HTTP.
- Converter erros conhecidos em status HTTP apropriado.
- Preferir composição de middlewares via `func(http.Handler) http.Handler`.

```go
func (h *PermissionHandler) Create(w http.ResponseWriter, r *http.Request) {
    var input CreatePermissionInput
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        writeError(w, http.StatusBadRequest, "invalid body")
        return
    }

    permission, err := h.svc.Create(r.Context(), input)
    if err != nil {
        writeError(w, http.StatusInternalServerError, err.Error())
        return
    }

    writeJSON(w, http.StatusCreated, permission)
}
```

---

## Tratamento de Erros

- Erros relevantes de domínio devem ter tipo próprio quando o chamador precisar
  tomar decisão com base neles.
- Evite comparar mensagens de erro.
- Usecases devem adicionar contexto com `fmt.Errorf("creating permission: %w", err)`.
- Handlers devem usar `errors.As` e `errors.Is` para mapear resposta HTTP.

```go
type ErrNotFound struct {
    Entity string
    ID     string
}

func (e *ErrNotFound) Error() string {
    return fmt.Sprintf("%s not found: %s", e.Entity, e.ID)
}
```

---

## Banco de Dados com sqlc

- Todo SQL fica em `internal/adapters/output/postgres/queries/*.sql`.
- O schema consumido pelo `sqlc` fica em
  `internal/adapters/output/postgres/schema/`.
- As migrations do projeto ficam em
  `internal/adapters/output/postgres/migrations/` e são executadas com `goose`.
- Após alterar queries, executar `sqlc generate`.
- O código Go deve consumir acesso ao banco via `ports/output` e
  `adapters/output/postgres`.
- Não vazar structs geradas pelo `sqlc` para `usecase`, `ports` ou `domain`.

Regra importante:

- Escreva SQL manualmente apenas nos arquivos versionados do `sqlc`.
- Nunca escreva SQL raw inline em código Go.
- Ao alterar schema persistido, criar ou ajustar migration correspondente.

---

## Testes

### Diretriz geral

- TDD é o padrão preferido.
- Para código novo, escreva o teste primeiro sempre que viável.
- Em bugfix ou legado, adicione ao menos um teste de caracterização ou regressão
  antes de concluir a alteração.
- Não entregar mudança sem cobertura de teste compatível com a camada alterada,
  salvo orientação explícita do mantenedor.
- Prefira o pacote `testing` da stdlib e dublês simples definidos no próprio
  arquivo de teste quando isso já resolver o problema.

### Convenções

| Arquivo | Teste |
|---|---|
| `internal/domain/permission.go` | `internal/domain/permission_test.go` |
| `internal/usecase/permission_usecase.go` | `internal/usecase/permission_usecase_test.go` |
| `internal/adapters/output/postgres/role_repository_authz.go` | `internal/adapters/output/postgres/role_repository_authz_test.go` |
| `internal/adapters/input/http/handlers/assignment_handler_authz.go` | `internal/adapters/input/http/handlers/assignment_handler_authz_test.go` |

### Estrutura dos testes

- Preferir testes table-driven quando houver múltiplos cenários.
- Nomear subtestes com frases descritivas.
- Comentários em teste devem explicar intenção e risco coberto, não mecânica.
- Cada caso deve ser independente.
- Não depender de ordem de execução.

### Domain tests

- Testes puros, sem mocks.
- Validar construtores, invariantes e comportamento das entidades.

### Usecase tests

- Usar test doubles simples no próprio `_test.go` quando possível.
- Verificar chamadas observáveis, argumentos relevantes e propagação de erro.
- Preferir dublês pequenos e legíveis a frameworks de mock quando não houver
  ganho claro.

### Adapters output tests

- Usar PostgreSQL real com `testcontainers`.
- Validar queries, constraints, migrations e mapeamento.
- Não mockar banco nessa camada.
- Aplicar migrations com `goose` antes de validar comportamento persistido.

### Adapters input tests

- Usar `httptest`.
- Não subir servidor real.
- Usar implementações simples das interfaces de `ports/input`.
- Verificar status code, payload e tratamento de erro.

### Observações práticas

- O projeto atual já usa mocks e stubs escritos manualmente em arquivos de teste;
  esse padrão é aceitável e preferível quando mantém o teste simples.
- `testify` pode ser usado para reduzir ruído, mas não é obrigatório.

---

## Makefile

Sempre preferir os alvos já existentes do projeto e evitar redefinir convenções
sem necessidade. Hoje o backend trabalha com estes alvos principais:

```makefile
.PHONY: all build run test clean watch docker-run docker-down itest migrate-up migrate-down migrate-status

all
build
run
test
watch
docker-run
docker-down
itest
migrate-up
migrate-down
migrate-status
```

- Ao automatizar tarefas, reutilize primeiro o `Makefile` do projeto.
- Se precisar adicionar alvo novo, faça isso só quando houver ganho claro para o
  fluxo do time.
- `sqlc generate` continua sendo obrigatório após mudança em queries, mesmo que
  o projeto ainda não tenha um alvo dedicado para isso no `Makefile`.

---

## Convenções de Nomes

| Conceito | Convenção | Exemplo |
|---|---|---|
| Função de teste | `Test<Type>_<Method>` | `TestCondominiumUseCase_CreateCondominium` |
| Subteste | frase descritiva | `"returns error when microservice is empty"` |
| Mock ou stub | `mock<Dependencia>` | `mockCondoRepo`, `mockCondoService` |
| Helper de teste | verbo + `t.Helper()` | `mustCreatePermission` |
| Caso de uso | `<Aggregate>UseCase` | `CondominiumUseCase` |

---

## O que evitar

- Não colocar lógica de negócio em handlers ou middlewares HTTP.
- Não acessar banco fora de `adapters/output/postgres`.
- Não escrever SQL inline em Go.
- Não vazar tipos do `sqlc` para fora de `adapters/output/postgres`.
- Não usar `time.Sleep` em testes.
- Não ignorar erros em produção nem em testes.
- Não compartilhar estado mutável entre casos de teste.
- Não depender de `t.Log` para sinalizar falha.
- Não introduzir interfaces desnecessárias apenas por padrão; usar abstração com
  propósito claro.
- Não introduzir framework HTTP sem necessidade; seguir o padrão atual com
  `net/http`.
- Não criar novas estruturas paralelas como `service/`, `repository/` ou `db/`
  se o código estiver seguindo o padrão atual de `usecase`, `ports` e
  `adapters`.

---

## Checklist antes de concluir uma mudança

- [ ] A mudança respeita a separação entre `adapters`, `ports`, `usecase` e `domain`
- [ ] Código novo ou alterado possui testes adequados
- [ ] Casos com múltiplos cenários usam testes table-driven quando fizer sentido
- [ ] Não há SQL inline em arquivos Go
- [ ] Tipos de `sqlc` não vazam para fora de `adapters/output/postgres`
- [ ] Erros são propagados com contexto
- [ ] `sqlc generate` foi executado após alteração em queries
- [ ] `goose` foi considerado ao alterar schema ou migrations
- [ ] `make test` ou conjunto equivalente de testes relevantes foi executado
