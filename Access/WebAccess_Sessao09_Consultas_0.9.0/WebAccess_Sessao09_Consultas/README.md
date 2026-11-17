# WebAccess — Sessão 09 (Consultas SQL salvas)

## O que esta etapa acrescenta
A Sessão 09 dá continuidade à versão 0.8.0 e acrescenta o gerenciamento de consultas SQL salvas.

- Salvar uma consulta SELECT com nome.
- Listar as consultas salvas.
- Carregar uma consulta no editor para revisar ou modificar.
- Executar uma consulta salva diretamente.
- Excluir consultas salvas com confirmação.
- Impedir nomes duplicados (ignorando diferenças entre maiúsculas e minúsculas).
- Somente uma instrução SELECT pode ser salva nesta etapa.

## Persistência e backup
As consultas são armazenadas no snapshot JSON do banco, no atributo `savedQueries`. Por isso, são incluídas na exportação JSON e recuperadas ao importar um backup criado nesta versão. Backups antigos, sem esse atributo, continuam compatíveis e iniciam com a lista vazia. As consultas não alteram a estrutura das tabelas nem os registros.

## Como usar
1. Abra **Consultas SQL**.
2. Digite uma instrução SELECT e execute-a, se desejar conferir o resultado.
3. Informe um nome em **Minhas consultas salvas**.
4. Clique em **Salvar consulta atual**.
5. Use **Carregar**, **Executar** ou **Excluir** na lista.

## Limites
- Consultas salvas nesta etapa aceitam apenas SELECT.
- O editor SQL continua aceitando os comandos liberados nas etapas anteriores.
- Não há ainda construtor visual de consultas com seleção de tabelas/campos, filtros e ordenação. Isso pode ser desenvolvido em uma etapa posterior.

## Atualização
1. Faça um backup JSON na versão atual.
2. Feche as abas antigas do WebAccess.
3. Extraia esta versão em uma pasta nova ou sobre a pasta do aplicativo, sem apagar dados do navegador.
4. Abra `index.html` no mesmo navegador e perfil.
5. Confirme que tabelas e registros continuam presentes e teste salvar, carregar e executar uma consulta.

Não limpe o IndexedDB nem apague versões anteriores.

## Arquivos principais
- `index.html`: interface de consultas salvas.
- `css/style.css`: estilos da lista de consultas.
- `js/app.js`: gerenciamento e persistência das consultas salvas.
- `js/sqlite.js`: mecanismo SQLite da versão anterior.
- `js/persistencia.js`: persistência local e backups JSON.
- `lib/sql-wasm-inline.js`: SQL.js incorporado localmente.
