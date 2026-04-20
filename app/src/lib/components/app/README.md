# Componentes customizados

## `UnitFinancialReport.svelte`

Renderiza a tela de detalhamento financeiro da unidade com identificação do morador, KPIs, histórico de pagamentos, dívida, faturas, cobranças extras, resumo anual e ações rápidas.

Exemplo de uso:

```svelte
<UnitFinancialReport unit={unit} />
```

## `FinancialStatusBadge.svelte`

Badge reutilizável para status financeiro `Adimplente` e `Inadimplente`, mantendo o mesmo padrão visual em toda a interface.

Exemplo de uso:

```svelte
<FinancialStatusBadge status="adimplente" />
```

## `unit-form-page.svelte`

Centraliza os modos de criação, edição e visualização da unidade. No modo `view`, delega a apresentação financeira para `UnitFinancialReport.svelte`.
