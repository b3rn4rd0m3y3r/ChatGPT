# WebAccess — Sessão 04

## Entrega
Relacionamentos 1:N entre tabelas, definição de chave estrangeira (FK) e validação de integridade referencial na interface.

## Como executar
1. Extraia o ZIP.
2. Abra `index.html` no Chrome ou Edge.
3. Crie duas tabelas em **Tabelas**.
4. Defina uma PK na tabela principal e um campo de mesmo tipo na tabela relacionada.
5. Abra **Relacionamentos** e clique em **Novo relacionamento**.
6. Selecione a tabela principal, a PK, a tabela relacionada e o campo que será FK.

## Exemplo de teste: clientes e pedidos

### Tabela clientes
| Campo | Tipo | PK |
|---|---|---|
| id | INTEGER | Sim |
| nome | TEXT | Não |

Insira dois clientes:
- João Silva
- Maria Souza

### Tabela pedidos
| Campo | Tipo | PK |
|---|---|---|
| id | INTEGER | Sim |
| cliente_id | INTEGER | Não |
| descricao | TEXT | Não |

Crie o relacionamento:
- Tabela principal: `clientes`
- PK: `id`
- Tabela relacionada: `pedidos`
- FK: `cliente_id`

Abra os registros de `pedidos`. O campo `cliente_id` aparecerá como uma lista com os clientes existentes.

## Regras implementadas
- Relacionamento 1:N entre tabelas diferentes.
- A origem deve ser um campo marcado como PK.
- A FK deve ter o mesmo tipo da PK.
- Um campo da tabela relacionada não pode ser associado a mais de um relacionamento.
- O campo FK é apresentado como lista de valores válidos no formulário de registros.
- Valor de FK preenchido é validado contra registros existentes na tabela principal.
- FK pode ficar vazia (relação opcional).
- Não é permitido excluir um registro principal que esteja sendo referenciado por registros da tabela relacionada.
- Ao excluir uma tabela, os relacionamentos associados também são removidos.
- Não é permitido remover da estrutura um campo que ainda participa de relacionamento; primeiro exclua a ligação.

## Limitações conhecidas
- Tabelas, registros e relacionamentos ainda ficam somente na memória da página. Atualizar ou fechar o navegador elimina os dados.
- A integridade referencial é validada pelo JavaScript, ainda não por constraints reais do SQLite.
- Não há exclusão em cascata: a exclusão do registro principal referenciado é bloqueada.
- Nesta etapa, são suportados relacionamentos 1:N entre duas tabelas distintas; N:N exige uma tabela associativa e será possível modelar com dois relacionamentos 1:N.
- A criação de relacionamento exige que a tabela filha já tenha um campo com tipo compatível com a PK principal.

## Próxima sessão
Sessão 05 — armazenamento e gerenciamento do banco: persistência local, importar/exportar JSON e recuperação dos dados entre aberturas do navegador.
