# WebAccess — Sessão 02

## Entrega
Construtor funcional de estruturas de tabelas, integrado à interface da Sessão 01.

## Como executar
1. Extraia a pasta `WebAccess_Sessao02`.
2. Abra `index.html` no Chrome, Edge ou Firefox.
3. Entre em **Tabelas** e clique em **Nova tabela**.

Não é necessário servidor, instalação ou conexão com a internet nesta etapa.

## Funcionalidades implementadas
- Criar tabela com nome definido pelo usuário.
- Adicionar e remover campos.
- Definir nome e tipo de cada campo.
- Tipos disponíveis: `INTEGER`, `TEXT`, `REAL`, `NUMERIC`, `DATE` e `BOOLEAN`.
- Definir uma chave primária (PK) por tabela, ou deixar sem PK.
- Editar a estrutura de uma tabela existente.
- Excluir tabela com confirmação.
- Validar nome de tabela, nomes de campos repetidos e campos vazios.
- Exibir resumo de campos e tipos na lista de tabelas.
- Atualizar contadores da interface.

## Teste sugerido
1. Crie a tabela `clientes`.
2. Mantenha `id` como `INTEGER` e PK.
3. Adicione `nome` (`TEXT`), `email` (`TEXT`) e `data_cadastro` (`DATE`).
4. Salve e confira o resumo dos campos.
5. Edite a tabela, acrescente `telefone` (`TEXT`) e salve novamente.
6. Exclua a tabela e confirme a operação.

## Limitações conhecidas
- As definições das tabelas permanecem somente na memória da página. Ao atualizar ou fechar o navegador, elas serão perdidas. A persistência e importação/exportação serão tratadas na etapa de armazenamento.
- Ainda não são criados objetos físicos no SQLite. A estrutura é um metadado do projeto; a integração com SQL.js será feita em etapa posterior.
- Ainda não há entrada de registros nem relacionamentos funcionais.

## Próxima sessão
Sessão 03 — entrada, edição, exclusão e visualização de registros nas tabelas.
