# Componentes customizados

## `UnitFinancialReport.svelte`

Renderiza a tela de detalhamento financeiro da unidade com identificação do morador, KPIs, histórico de pagamentos, dívida, faturas, cobranças extras, resumo anual e ações rápidas.

Exemplo de uso:

```svelte
<UnitFinancialReport {unit} />
```

## `FinancialStatusBadge.svelte`

Badge reutilizável para status financeiro `Adimplente` e `Inadimplente`, mantendo o mesmo padrão visual em toda a interface.

Exemplo de uso:

```svelte
<FinancialStatusBadge status="adimplente" />
```

## `unit-form-page.svelte`

Centraliza os modos de criação, edição e visualização da unidade. No modo `view`, delega a apresentação financeira para `UnitFinancialReport.svelte`.

## `UserManagementTable.svelte`

Renderiza a listagem principal de usuários do condomínio com nome, e-mail, role, status e ações de convite aceito, edição de role e desvinculação.

Exemplo de uso:

```svelte
<UserManagementTable rows={users} onEditRole={handleEdit} onUnlink={handleUnlink} />
```

## `ManagementTransferPanel.svelte`

Apresenta o fluxo de transferência de gestão entre Síndico e Administradora, incluindo estado atual, aviso de dupla confirmação e ações de iniciar ou aceitar a transferência.

Exemplo de uso:

```svelte
<ManagementTransferPanel
	{currentActor}
	{administrators}
	{transfers}
	onStartTransfer={openTransferDialog}
/>
```

## `UserActivityTable.svelte`

Renderiza a linha do tempo de gestão como listagem com filtro por tipo de ação, busca textual, paginação e controle de itens por página.

Exemplo de uso:

```svelte
<UserActivityTable rows={audit} />
```

## `LandingPage.svelte`

Renderiza a landing page pública do AP202 com hero, dores, solução, benefícios, funcionalidades, preços transparentes, FAQ e CTA final. O mockup do painel no hero adapta o grid e os cards para evitar compressão e cortes em larguras intermediárias.

Exemplo de uso:

```svelte
<LandingPage />
```

## `EntryHub.svelte`

Renderiza a página pública de entrada do AP202, redirecionando para login quando necessário e listando os condomínios disponíveis para a conta autenticada.

Exemplo de uso:

```svelte
<EntryHub />
```

## `CreateCondominiumWizard.svelte`

Renderiza a experiência guiada de criação de condomínio em etapas, conectando o frontend ao endpoint real de cadastro. O formulário usa validação com Formsnap, Superforms e Zod, orienta o preenchimento do telefone do condomínio, do síndico ou do responsável, explica a área total do terreno em m² e prioriza o CEP para autopreencher o endereço com seleção de UF.

Exemplo de uso:

```svelte
<CreateCondominiumWizard onCreated={handleCreated} />
```
