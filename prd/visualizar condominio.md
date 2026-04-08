# Condominium Detail Page — Frontend

**Projeto:** ap202  
**Stack:** Next.js · Metronic React · Clerk Auth  
**Rota:** `/condominiums/[code]`

---

## Comportamento geral

- Tela de **somente leitura** com botão **Editar** no topo direito
- O código do condomínio (`AZUK258`) é **imutável** — exibir com cadeado e nota explicativa
- Dados carregados via `GET /api/v1/condominiums/{code}`
- Em caso de loading: exibir skeleton nos cards
- Em caso de erro 404: redirecionar para `/condominiums`

---

## Layout

```
Breadcrumb: Condomínios / Residencial das Flores

[Título + código badge]        [Botão Editar]

┌─────────────────────────┐  ┌──────────────────┐
│ Dados básicos           │  │ Resumo           │
├─────────────────────────┤  ├──────────────────┤
│ Endereço                │  │ Rateio e áreas   │
├─────────────────────────┤  ├──────────────────┤
│ CNPJs                   │  │ Identificação    │
└─────────────────────────┘  └──────────────────┘
```

Grid: `1.4fr 1fr` — coluna esquerda mais larga

---

## Seções e campos

### Dados básicos

| Campo | Tipo | Editável |
|---|---|---|
| Nome | texto | Sim |
| Telefone | texto | Sim |
| E-mail | texto | Sim |
| Status | badge (ativo/inativo) | Não |
| Cadastrado em | data | Não |

### Endereço

| Campo | Tipo | Editável |
|---|---|---|
| Logradouro | texto | Sim |
| Número | texto | Sim |
| Bairro | texto | Sim |
| CEP | texto formatado | Sim |
| Cidade | texto | Sim |
| Estado | UF | Sim |

### CNPJs

- Lista de CNPJs vinculados
- Cada item exibe: número formatado, razão social, data de início, badge `Principal` se aplicável
- CNPJ desativado exibe badge `Inativo` com data de encerramento

### Resumo *(somente leitura)*

| Campo | Descrição |
|---|---|
| Unidades | Total de unidades cadastradas |
| Moradores | Vínculos ativos |
| Inadimplência | % do mês corrente |
| Saldo caixa | Valor atualizado |

### Rateio e áreas

| Campo | Tipo | Editável |
|---|---|---|
| Regra de rateio | badge (`equal` / `proportional`) | Sim |
| Área do terreno (`land_area`) | decimal m² | Sim |
| Área construída (`built_area_sum`) | calculado | Não |
| Fração ideal | N/A se `equal` | Não |

> Se `fee_rule = equal`, exibir nota: *"Para usar rateio proporcional informe a área do terreno e a área privativa de cada unidade"*

### Identificação *(somente leitura)*

| Campo | Descrição |
|---|---|
| Código | `AZUK258` — badge roxo com ícone de cadeado |
| ID interno | `#1` em fonte monospace |

> Exibir nota: *"O código é permanente e não pode ser alterado"*

---

## Componentes Metronic sugeridos

| Elemento | Componente |
|---|---|
| Cards de seção | `Card` com `CardHeader` e `CardBody` |
| Badges de status | `Badge` com variantes `success`, `primary`, `warning` |
| Botão editar | `Button` variante `primary` com ícone `KTIcon` |
| Breadcrumb | `PageTitle` com `breadcrumbs` prop |
| Loading state | `Skeleton` ou spinner centralizado |
| Código badge | `Badge` variante `light-primary` com fonte monospace |

---

## API

```
GET /api/v1/condominiums/{code}
Authorization: Bearer <token>
```

### Response 200

```json
{
  "id": 1,
  "code": "AZUK258",
  "name": "Residencial das Flores",
  "phone": "31999990000",
  "email": "contato@resflores.com.br",
  "address": {
    "street": "Rua das Acácias",
    "number": "100",
    "neighborhood": "Centro",
    "city": "Viçosa",
    "state": "MG",
    "zip_code": "36570-000",
    "latitude": null,
    "longitude": null
  },
  "total_units": 32,
  "fee_rule": "equal",
  "land_area": null,
  "built_area_sum": 0.00,
  "status": "active",
  "cnpjs": [
    {
      "id": 1,
      "cnpj": "12.345.678/0001-99",
      "razao_social": "Res. das Flores Condomínio Ltda",
      "descricao": "CNPJ principal",
      "principal": true,
      "ativo": true,
      "data_inicio": "2024-01-01",
      "data_fim": null
    }
  ],
  "created_at": "2026-03-14T05:00:00Z",
  "updated_at": "2026-03-14T05:00:00Z"
}
```

---

## Regras de exibição

- `fee_rule = "equal"` → exibir badge **Igualitário**
- `fee_rule = "proportional"` → exibir badge **Proporcional**
- `land_area = null` → exibir *"Não informada"* em cinza itálico
- `built_area_sum = 0` → exibir *"Não calculada"*
- `status = "active"` → badge verde **Ativo**
- `status = "inactive"` → badge vermelho **Inativo**
- CNPJ `principal = true` → badge roxo **Principal**
- CNPJ `ativo = false` → badge cinza **Inativo** + exibir `data_fim`

---

## Fora do escopo desta tela, você não deve implementar.

- Formulário de edição — tela separada
- Listagem de unidades — link para `/condominiums/[code]/units`
- Painel financeiro — link para `/condominiums/[code]/dashboard`
- Exclusão do condomínio



