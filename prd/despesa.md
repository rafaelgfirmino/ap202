<prompt>
  <title>PR 1 — Expenses + Month Closing + Cash Structure</title>
  <project>ap202</project>

  <stack>Go 1.26.1 · net/http · sqlc · pgx/v5 · Arquitetura hexagonal · Auth via Clerk</stack>

  <rules>
    - Sem ORM — sqlc + pgx/v5
    - Handler → valida input · Usecase → regras de negócio · Repository → SQL
    - Validação de acesso: apenas JWT válido
    - Lançamentos de despesa são imutáveis — sem edição, apenas estorno
    - Fechamento pode ser reaberto enquanto nenhuma unit_charge tiver boleto_generated = true
    - Receita extra NÃO abate despesas — entra diretamente no caixa (PR 2)
    - Tabelas accounts e cash_entries são criadas neste PR mas sem rotas — reservadas para PR 2
  </rules>

  <routes>
    POST /api/v1/condominiums/{code}/expenses
    GET  /api/v1/condominiums/{code}/expenses?month=2026-03&scope=general
    POST /api/v1/condominiums/{code}/expenses/{id}/reverse

    GET  /api/v1/condominiums/{code}/closing/preview?month=2026-03
    POST /api/v1/condominiums/{code}/closing
    DELETE /api/v1/condominiums/{code}/closing/{month}

    GET /api/v1/condominiums/{code}/settings/reserve-fund
    PUT /api/v1/condominiums/{code}/settings/reserve-fund
  </routes>

  <migration>

```sql
    -- Remover modelo anterior se existir
    DROP TABLE IF EXISTS monthly_charges CASCADE;

    -- Contas do caixa — sem rotas no PR 1
    CREATE TABLE accounts (
      id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      condominium_id  BIGINT       NOT NULL REFERENCES condominiums(id),
      name            VARCHAR(100) NOT NULL,
      type            VARCHAR(20)  NOT NULL
                      CHECK (type IN ('checking', 'savings', 'cash', 'reserve_fund')),
      balance         NUMERIC(12,2) NOT NULL DEFAULT 0,
      active          BOOLEAN       NOT NULL DEFAULT TRUE,
      created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      UNIQUE(condominium_id, type)
    );

    -- Entradas do livro caixa — sem rotas no PR 1
    CREATE TABLE cash_entries (
      id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      condominium_id  BIGINT        NOT NULL REFERENCES condominiums(id),
      account_id      BIGINT        NOT NULL REFERENCES accounts(id),
      type            VARCHAR(20)   NOT NULL CHECK (type IN ('income', 'expense')),
      amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
      description     VARCHAR(300)  NOT NULL,
      entry_date      DATE          NOT NULL,
      reference_month DATE          NOT NULL,
      origin          VARCHAR(30)   NOT NULL
                      CHECK (origin IN (
                        'expense',
                        'unit_payment',
                        'extra_income',
                        'reserve_fund',
                        'bank_import',
                        'manual'
                      )),
      origin_id       BIGINT,
      created_by      BIGINT        NOT NULL REFERENCES users(id),
      created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_cash_entries_condominium_month
        ON cash_entries(condominium_id, reference_month);

    -- Despesas e receitas extras
    CREATE TABLE expenses (
      id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      condominium_id  BIGINT        NOT NULL REFERENCES condominiums(id),
      group_id        BIGINT        REFERENCES groups(id),
      unit_id         BIGINT        REFERENCES units(id),
      scope           VARCHAR(20)   NOT NULL
                      CHECK (scope IN ('general', 'group', 'unit')),
      type            VARCHAR(20)   NOT NULL
                      CHECK (type IN ('expense', 'extra_income')),
      category        VARCHAR(50)   NOT NULL,
      description     VARCHAR(300)  NOT NULL,
      amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
      expense_date    DATE          NOT NULL,
      reference_month DATE          NOT NULL,
      receipt_url     VARCHAR(500),
      reversed        BOOLEAN       NOT NULL DEFAULT FALSE,
      reversal_of_id  BIGINT        REFERENCES expenses(id),
      created_by      BIGINT        NOT NULL REFERENCES users(id),
      created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_expenses_condominium_month
        ON expenses(condominium_id, reference_month);

    -- Configuração do fundo de reserva
    CREATE TABLE reserve_fund_settings (
      id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      condominium_id  BIGINT        NOT NULL REFERENCES condominiums(id) UNIQUE,
      mode            VARCHAR(10)   NOT NULL CHECK (mode IN ('percent', 'fixed')),
      value           NUMERIC(10,2) NOT NULL CHECK (value > 0),
      active          BOOLEAN       NOT NULL DEFAULT TRUE,
      updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    -- Fechamento mensal
    CREATE TABLE monthly_closings (
      id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      condominium_id      BIGINT        NOT NULL REFERENCES condominiums(id),
      reference_month     DATE          NOT NULL,
      total_expenses      NUMERIC(12,2) NOT NULL DEFAULT 0,
      total_extra_income  NUMERIC(12,2) NOT NULL DEFAULT 0,
      reserve_fund_total  NUMERIC(12,2) NOT NULL DEFAULT 0,
      fee_rule            VARCHAR(20)   NOT NULL,
      status              VARCHAR(20)   NOT NULL DEFAULT 'open'
                          CHECK (status IN ('open', 'closed')),
      closed_by           BIGINT        REFERENCES users(id),
      closed_at           TIMESTAMPTZ,
      created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      UNIQUE(condominium_id, reference_month)
    );

    -- Cobrança por unidade
    CREATE TABLE unit_charges (
      id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      monthly_closing_id  BIGINT        NOT NULL REFERENCES monthly_closings(id),
      unit_id             BIGINT        NOT NULL REFERENCES units(id),
      general_share       NUMERIC(10,2) NOT NULL DEFAULT 0,
      group_share         NUMERIC(10,2) NOT NULL DEFAULT 0,
      direct_charge       NUMERIC(10,2) NOT NULL DEFAULT 0,
      reserve_fund_share  NUMERIC(10,2) NOT NULL DEFAULT 0,
      total_amount        NUMERIC(10,2) NOT NULL,
      status              VARCHAR(20)   NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'partial', 'paid')),
      paid_amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
      paid_at             DATE,
      boleto_generated    BOOLEAN       NOT NULL DEFAULT FALSE,
      created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      UNIQUE(monthly_closing_id, unit_id)
    );
```

  </migration>

  <accounts_seed>
    Ao criar um condomínio, inserir automaticamente as 4 contas padrão:

```sql
    INSERT INTO accounts (condominium_id, name, type) VALUES
      ($1, 'Conta Corrente',    'checking'),
      ($1, 'Poupança',          'savings'),
      ($1, 'Caixa',             'cash'),
      ($1, 'Fundo de Reserva',  'reserve_fund');
```

    Isso deve ocorrer na mesma transação da criação do condomínio
    no usecase existente — não criar rota nova.
  </accounts_seed>

  <expense_scopes>

    | scope  | group_id | unit_id  | type         | Distribuição              |
    |--------|----------|----------|--------------|---------------------------|
    | general| null     | null     | expense      | Todas as unidades ativas  |
    | group  | required | null     | expense      | Unidades do grupo         |
    | unit   | null     | required | expense      | Somente aquela unidade    |
    | general| null     | null     | extra_income | Entra no caixa (PR 2)     |

  </expense_scopes>

  <closing_calculation>
1. Buscar todas as expenses não estornadas do reference_month

2. Separar por scope:
   general_total  = SUM(amount) WHERE scope='general' AND type='expense'
   group_totals   = SUM(amount) GROUP BY group_id WHERE scope='group'
   unit_totals    = SUM(amount) GROUP BY unit_id WHERE scope='unit'

3. Para cada unidade ativa:

   -- Rateio geral
   IF fee_rule = 'equal':
     general_share = general_total / qtd_unidades_ativas
   IF fee_rule = 'proportional':
     general_share = general_total × unit.ideal_fraction

   -- Rateio do grupo
   IF unidade pertence a grupo com despesas:
     IF fee_rule = 'equal':
       group_share = group_total / qtd_unidades_do_grupo
     IF fee_rule = 'proportional':
       group_fraction = unit.ideal_fraction / SUM(ideal_fraction do grupo)
       group_share = group_total × group_fraction

   -- Despesa direta
   direct_charge = unit_totals[unit_id] OR 0

   -- Fundo de reserva
   IF reserve_fund.active:
     IF mode = 'fixed':
       reserve_fund_share = reserve_fund.value
     IF mode = 'percent':
       reserve_fund_share = general_share × (reserve_fund.value / 100)

   -- Total
   total_amount = general_share + group_share
                + direct_charge + reserve_fund_share

  </closing_calculation>

  <closing_reopen>
    - DELETE /closing/{month} só é permitido se NENHUMA unit_charge
      tiver boleto_generated = true
    - Reabertura deleta todas as unit_charges e reseta status = 'open'
    - Se qualquer boleto gerado → ErrBoletoAlreadyGenerated (409)
  </closing_reopen>

  <requests>

    ## POST /expenses

```json
    {
      "scope": "general",
      "type": "expense",
      "category": "water",
      "description": "Conta de água — março 2026",
      "amount": 840.00,
      "expense_date": "2026-03-10",
      "reference_month": "2026-03",
      "receipt_url": null,
      "group_id": null,
      "unit_id": null
    }
```

    ## PUT /settings/reserve-fund

```json
    {
      "mode": "percent",
      "value": 10.00,
      "active": true
    }
```

    ## POST /closing

```json
    {
      "reference_month": "2026-03"
    }
```

  </requests>

  <preview_response>

```json
    {
      "reference_month": "2026-03",
      "fee_rule": "equal",
      "summary": {
        "total_expenses": 3200.00,
        "total_extra_income": 400.00,
        "reserve_fund_total": 320.00
      },
      "unit_charges": [
        {
          "unit_code": "A-101",
          "general_share": 75.00,
          "group_share": 30.00,
          "direct_charge": 0.00,
          "reserve_fund_share": 7.50,
          "total_amount": 112.50
        }
      ]
    }
```

  </preview_response>

  <categories>
    Despesas:
      water, electricity, gas, cleaning, maintenance,
      insurance, administration, security, elevator, other

    Receita extra:
      common_area_rental, fine, other_income
  </categories>

  <errors>
    ErrCondominiumNotFound    → 404  condominium_not_found
    ErrGroupNotFound          → 404  group_not_found
    ErrUnitNotFound           → 404  unit_not_found
    ErrExpenseNotFound        → 404  expense_not_found
    ErrAlreadyReversed        → 409  expense_already_reversed
    ErrMonthAlreadyClosed     → 409  month_already_closed
    ErrBoletoAlreadyGenerated → 409  boleto_already_generated
    ErrNoActiveUnits          → 422  no_active_units
    ErrMissingIdealFraction   → 422  missing_ideal_fraction
    ErrInvalidScope           → 422  invalid_scope
    ErrInvalidCategory        → 422  invalid_category
    ErrInvalidReserveFund     → 422  invalid_reserve_fund
    ErrUnauthorized           → 401  unauthorized
    Erro genérico             → 500  internal_error
  </errors>

  <out_of_scope>
    - Rotas de accounts e cash_entries — PR 2
    - Registro de pagamento das unit_charges — PR 2
    - Importação de extrato OFX/CSV — PR 2
    - Geração de boleto
    - Notificações
    - Relatório de prestação de contas
  </out_of_scope>

</prompt>