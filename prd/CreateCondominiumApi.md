---
name: Criando API para criar condomínio
description: Criar API para criar condomínio
skills:
  - gopher
---

<requirements>
    O codominio deve ter um código composto por 4letras e 3 nuleros ignorando letras ambíguas como O, I e L (que se confundem com 0 e 1). Utilize o CHAR(7) para indentificar esse campo no banco de dados.
    O campo CNPJ deve ser validado e deve ser único, mas o condomínio pode ter mais de um CNPJ (ex: matriz e filiais).
    O condominio deve ter um endereço completo (rua, número, bairro, cidade, estado, cep). e sua lozalizacão por latitude e longitude(fazer uma função para isso, para que o usuário não precise informar latitude e longitude manualmente).
    O condominio deve ter um nome.
    O condominio deve ter um telefone.
    O condominio deve ter um email principal.
    O condominio deve ter um status (ativo, inativo, suspenso).
    O condominio deve ter uma data de criação.
    O condominio deve ter uma data de atualização.
</requirements>


<regras do CNPJ>
 É comum e legalmente permitido que condomínios grandes, especialmente os que funcionam como subcondomínios (com torres, áreas de lazer ou administrações independentes), tenham mais de um CNPJ. Desde 2016, a Receita Federal permite que subcondomínios tenham CNPJs próprios, facilitando a gestão e contabilidade separada por bloco ou torre. 
TudoCondo
TudoCondo
 +1
Pontos importantes:
Finalidade: Geralmente, cada torre, clube ou ala comercial independente possui sua própria gestão, gerando a necessidade de CNPJ para contratar funcionários, abrir contas e pagar encargos separadamente.
Regras: Cada CNPJ deve ser registrado de forma independente na Receita Federal, com sua própria convenção e ata de síndico.
Vantagens: Melhora a transparência financeira e organização interna, evitando que dívidas de uma torre afetem as outras. 

Empresa pode trocar de CNPJ se necessário, mas deve seguir os procedimentos legais e contábeis. É importante pensar como applicar mudanças de CNPJ no sistema, desde que não apague dados importantes.
</regras do CNPJ>

