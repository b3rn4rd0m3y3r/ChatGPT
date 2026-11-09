# WebAccess — Sessão 03

## Entrega
Gerenciamento de registros das tabelas criadas no construtor da Sessão 02.

## Como executar
1. Extraia o ZIP.
2. Abra `index.html` no Chrome ou Edge.
3. Entre em **Tabelas**.
4. Crie uma tabela ou abra uma tabela já criada.
5. Clique em **Abrir registros** para inserir, editar e excluir dados.

## Funcionalidades
- Visualização dos registros em grade HTML.
- Inserção de registros por formulário gerado automaticamente a partir dos campos.
- Edição e exclusão de registros.
- Conversão e validação de INTEGER, REAL e NUMERIC.
- Campo DATE apresentado como seletor de data.
- Campo BOOLEAN apresentado como seleção Sim/Não.
- Geração automática de valor para chave primária INTEGER quando deixada vazia.
- Verificação de duplicidade da chave primária.
- Contagem de registros por tabela.

## Teste sugerido
Crie `clientes` com:
- `id` — INTEGER — PK
- `nome` — TEXT
- `email` — TEXT
- `data_cadastro` — DATE
- `ativo` — BOOLEAN

Abra os registros e insira:
1. João Silva / joao@email.com / data de hoje / Sim
2. Maria Souza / maria@email.com / data de hoje / Sim

Edite o nome de João, depois exclua Maria.

## Limitações conhecidas
- Os registros e as tabelas ainda ficam somente na memória da página. Ao atualizar ou fechar o navegador, serão perdidos.
- Ainda não há persistência JSON/IndexedDB nem integração com SQL.js.
- O editor de estrutura permite alterações de campos; se a tabela já tiver registros, a aplicação alerta quando nomes de campos forem removidos/alterados. Alterações mais sofisticadas de esquema serão tratadas quando o motor de banco for integrado.
- A chave primária é validada no nível da interface JavaScript; a restrição será formalizada no SQLite na etapa de integração.

## Próxima sessão
Sessão 04 — relacionamentos entre tabelas, chaves estrangeiras e integridade referencial.
