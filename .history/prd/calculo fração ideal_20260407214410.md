Você é responsável por implementar a lógica de cobrança de um sistema de condomínio.

O banco de dados já existe. Foque exclusivamente nas regras de negócio e queries.

---

## 🎯 Objetivo

Calcular valores de cobrança por unidade utilizando **inteiros (centavos)**, garantindo precisão total e ausência de erro de arredondamento.

---

## 💰 Regra base de valores

* Todos os valores monetários devem ser armazenados e processados como **inteiros (centavos)**

Exemplo:

* R$ 100,00 → 10000
* R$ 12.345,67 → 1234567

---

## 🧩 Modelos de cobrança

### 1. IGUAL

* Divisão igual entre unidades

### 2. FRACAO_IDEAL

* Proporcional à fração ideal

---

## ⚙️ Regras de cálculo

---

### 🔹 Modelo IGUAL

#### Cálculo:

```text
valor_base = valor_total_centavos / quantidade_unidades
resto = valor_total_centavos % quantidade_unidades
```

#### Distribuição:

* Cada unidade recebe `valor_base`
* O restante (centavos) deve ser distribuído:

  * +1 centavo para as primeiras N unidades
  * Onde N = resto

✔️ Garante que:

* soma final = valor_total
* nenhuma perda de centavos

---

### 🔹 Modelo FRACAO_IDEAL

#### Passo 1: definir fração

Se existir fração:

* usar diretamente

Se não:

```text
fracao = area_unidade / soma_area
```

---

#### Passo 2: normalização

Se soma das frações != 1:

```text
fracao_normalizada = fracao / soma_fracoes
```

---

#### Passo 3: cálculo em centavos

```text
valor_unidade = floor(valor_total_centavos * fracao_normalizada)
```

---

#### Passo 4: ajuste de centavos (CRÍTICO)

Após cálculo:

```text
soma_calculada = SUM(valor_unidade)
diferenca = valor_total_centavos - soma_calculada
```

Distribuir diferença:

* +1 centavo para as unidades com maior fração
* até zerar a diferença

---

## 🔄 Ordenação para distribuição

Para garantir determinismo:

* Ordenar por:

  1. maior fração
  2. id da unidade (tie-break)

---

## 🔒 Regra de imutabilidade

O modelo de cobrança NÃO pode ser alterado se existir qualquer cobrança já registrada.

---

## 🔍 Validação obrigatória

Erro se:

* quantidade_unidades = 0
* soma_area = 0 (quando necessário)
* soma_fracoes = 0
* valor_total_centavos <= 0

---

## 🧮 Queries esperadas

A IA deve gerar:

1. Query para contagem de unidades
2. Query para soma de áreas
3. Query para soma de frações
4. Query para cálculo IGUAL com resto
5. Query para cálculo FRACAO_IDEAL com floor
6. Query para distribuição de centavos restantes
7. Query para garantir soma final exata
8. Query para validação de bloqueio de alteração

---

## 💡 Requisitos técnicos

* Usar CTE (WITH)
* Evitar FLOAT completamente
* Usar BIGINT para valores monetários
* Garantir execução dentro de transação

---

## 📌 Garantias obrigatórias

✔️ Soma final = valor_total_centavos
✔️ Nenhum centavo perdido
✔️ Nenhum centavo criado
✔️ Resultado determinístico

---

## ⚠️ Importante

* Nunca usar ROUND para divisão principal
* Sempre usar:

  * divisão inteira
  * distribuição de resto
* Toda lógica deve ser idempotente

---

Implemente de forma robusta e pronta para produção.
