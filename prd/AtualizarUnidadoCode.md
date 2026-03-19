O que muda na abordagem:
O UnitCode deixa de ser derivado em tempo de exibição e passa a ser gerado uma vez no momento do cadastro e persistido no banco.
A lógica de formação continua a mesma — {cond_code}-{block}-{identifier} — mas agora executada no usecase antes do INSERT e salva na coluna code da tabela units.

O que muda na migration:
sqlCREATE TABLE IF NOT EXISTS units (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  condominium_id BIGINT       NOT NULL REFERENCES condominiums(id),
  code           VARCHAR(50)  NOT NULL,  -- gerado no cadastro, imutável
  block          VARCHAR(20),
  identifier     VARCHAR(20)  NOT NULL,
  floor          VARCHAR(10),
  description    VARCHAR(200),
  active         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_units_code
    ON units (code);

CREATE UNIQUE INDEX idx_units_condominium_block_identifier
    ON units (condominium_id, COALESCE(block, ''), identifier);

CREATE INDEX idx_units_condominium
    ON units (condominium_id);

O que muda no VO:
O UnitCode continua existindo como VO para encapsular a lógica de geração e validação — mas agora é usado no usecase para gerar o valor que será persistido:
go// domain/vo/unit_code.go
type UnitCode struct {
    value string
}

func NewUnitCode(condominiumCode, block, identifier string) (UnitCode, error) {
    if identifier == "" {
        return UnitCode{}, ErrUnitIdentifierRequired
    }
    var value string
    if block == "" {
        value = fmt.Sprintf("%s-%s", condominiumCode, identifier)
    } else {
        value = fmt.Sprintf("%s-%s-%s", condominiumCode, block, identifier)
    }
    if len(value) > 50 {
        return UnitCode{}, ErrUnitCodeTooLong
    }
    return UnitCode{value: value}, nil
}

func (u UnitCode) String() string { return u.value }

O que muda no usecase:
go// Antes de inserir a unidade
unitCode, err := vo.NewUnitCode(condominium.Code, input.Block, input.Identifier)
if err != nil {
    return nil, err
}

unit := &domain.Unit{
    CondominiumID: condominium.ID,
    Code:          unitCode.String(),  // persistido
    Block:         input.Block,
    Identifier:    input.Identifier,
    Floor:         input.Floor,
    Description:   input.Description,
    Active:        true,
}

Regra importante:
O code da unidade é imutável após criação — assim como o código do condomínio. Se o síndico precisar corrigir um erro, desativa a unidade e cria uma nova. Isso garante rastreabilidade em faturas futuras.