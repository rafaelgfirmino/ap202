<prompt>
  <title>Ideal Fraction Calculation — NBR 12.721</title>
  <project>ap202</project>

  <stack>Go 1.26.1 · net/http · sqlc · pgx/v5 · Arquitetura hexagonal · Auth via Clerk</stack>

  <rules>
    - Handler → valida input · Usecase → regras de negócio · Repository → SQL
    - Validação de acesso: apenas JWT válido
    - ideal_fraction nunca é informado pelo síndico — sempre calculado pelo sistema
    - built_area_sum é persistido e atualizado atomicamente a cada evento
    - Cobranças já geradas não são afetadas pelo recálculo
  </rules>

  <formula>

    ## Fórmula NBR 12.721
```
    ideal_fraction = (land_area × private_area) / built_area_sum
```

    | Variável       | Onde fica    | O que é                                            |
    |----------------|--------------|----------------------------------------------------|
    | land_area      | condominiums | Área total do terreno — informado pelo síndico     |
    | built_area_sum | condominiums | Soma das private_area das unidades ativas — persistido |
    | private_area   | units        | Área privativa da unidade — informada pelo síndico |
    | ideal_fraction | units        | Resultado da fórmula — calculado pelo sistema      |

    ## Exemplo
```
    land_area      = 1.000m²
    built_area_sum = 60 + 80 + 120 = 260m²

    Unidade 101 (60m²):
      ideal_fraction = (1.000 × 60) / 260 = 0,23076923

    Unidade 201 (80m²):
      ideal_fraction = (1.000 × 80) / 260 = 0,30769231

    Cobertura (120m²):
      ideal_fraction = (1.000 × 120) / 260 = 0,46153846
```

    > A soma de todas as ideal_fraction deve ser igual a 1,0
    > (pequena variação por arredondamento é aceitável).

  </formula>

  <migration>
```sql
    -- condominiums: renomear total_area e adicionar built_area_sum
    ALTER TABLE condominiums
      RENAME COLUMN total_area TO land_area;

    ALTER TABLE condominiums
      ADD COLUMN built_area_sum NUMERIC(10,2) NOT NULL DEFAULT 0;

    -- units: renomear area para private_area
    ALTER TABLE units
      RENAME COLUMN area TO private_area;
```

  </migration>

  <built_area_sum_rules>

    ## Manutenção do built_area_sum

    O `built_area_sum` é atualizado **na mesma transação** do evento que o disparou.
    Nunca atualizar fora de transação — garantir consistência com `ideal_fraction`.

    | Evento                                  | Operação no built_area_sum                     |
    |-----------------------------------------|------------------------------------------------|
    | Nova unidade com private_area           | `built_area_sum += private_area`               |
    | Nova unidade sem private_area           | sem alteração                                  |
    | private_area atualizada em uma unidade  | `built_area_sum = built_area_sum - old + new`  |
    | private_area removida de uma unidade    | `built_area_sum -= old_private_area`           |
    | Unidade desativada (active = false)     | `built_area_sum -= private_area`               |
    | Unidade reativada (active = true)       | `built_area_sum += private_area`               |

  </built_area_sum_rules>

  <recalculation_triggers>

    ## Quando recalcular ideal_fraction de todas as unidades ativas

    | Evento                                  | Campo alterado         |
    |-----------------------------------------|------------------------|
    | land_area do condomínio atualizado      | condominiums.land_area |
    | private_area de uma unidade atualizada  | units.private_area     |
    | Nova unidade criada com private_area    | units.private_area     |
    | Unidade desativada                      | units.active           |
    | Unidade reativada                       | units.active           |

    ## Sequência obrigatória dentro da transação
```
    1. Executar a operação principal (criar/atualizar unidade ou land_area)
    2. Atualizar built_area_sum no condomínio
    3. Recalcular ideal_fraction de todas as unidades ativas
    4. Commit — se qualquer passo falhar, rollback total
```

  </recalculation_triggers>

  <business_rules>

    - `ideal_fraction` é sempre calculado — nunca aceitar valor informado pelo síndico
    - Se `land_area` for null → não calcular, manter `ideal_fraction = null`
    - Se `private_area` da unidade for null → `ideal_fraction = null` para essa unidade
    - Se `built_area_sum = 0` → retornar `ErrBuiltAreaZero` — evitar divisão por zero
    - Cobranças já geradas em `unit_charges` não são afetadas — snapshot já aplicado

  </business_rules>

  <domain>
```go
    // Função de cálculo — internal/domain/vo/ideal_fraction.go
    func CalculateIdealFraction(landArea, privateArea, builtAreaSum float64) (float64, error) {
        if builtAreaSum == 0 {
            return 0, ErrBuiltAreaZero
        }
        return (landArea * privateArea) / builtAreaSum, nil
    }

    var (
        ErrBuiltAreaZero       = errors.New("built area sum is zero — cannot calculate ideal fraction")
        ErrLandAreaRequired    = errors.New("land area is required for proportional fee rule")
        ErrPrivateAreaRequired = errors.New("private area is required for proportional fee rule")
    )
```

  </domain>

  <api>

    ## Nenhuma rota nova

    O recálculo é disparado internamente pelos eventos existentes.
    O campo `ideal_fraction` aparece como somente leitura na response de unidade:
```json
    {
      "id": 1,
      "code": "A-101",
      "private_area": 60.00,
      "ideal_fraction": 0.23076923,
      "active": true
    }
```

    O campo `built_area_sum` aparece como somente leitura na response do condomínio:
```json
    {
      "code": "GYZP555",
      "land_area": 1000.00,
      "built_area_sum": 260.00,
      "fee_rule": "proportional"
    }
```

  </api>

  <errors>

    | Erro de domínio            | Status | Campo error              |
    |----------------------------|--------|--------------------------|
    | `ErrBuiltAreaZero`         | 422    | `built_area_zero`        |
    | `ErrLandAreaRequired`      | 422    | `land_area_required`     |
    | `ErrPrivateAreaRequired`   | 422    | `private_area_required`  |

  </errors>

  <out_of_scope>
    - Alteração da fee_rule (equal ↔ proportional) — próximo PR
    - Recálculo retroativo de cobranças já geradas
    - Validação da convenção condominial
    - Integração com cartório ou registro de imóveis
  </out_of_scope>

</prompt>