# WebAccess — Sessão 10 (Formulários e Relatórios)

## O que esta etapa acrescenta

### Formulários
- Nova área **Formulários** no menu.
- Seleção de qualquer tabela existente.
- Formulário de cadastro montado automaticamente a partir dos campos da tabela.
- Inclusão, edição e exclusão de registros.
- Campos de chave estrangeira apresentados como listas de valores existentes.
- Validação de chave primária e integridade referencial reaproveitando as regras do WebAccess.

### Relatórios
- Nova área **Relatórios** no menu.
- Seleção da tabela de origem.
- Seleção dos campos que serão exibidos.
- Filtro textual aplicado aos campos selecionados.
- Prévia tabular dos registros correspondentes.
- Exportação do resultado visível para CSV (compatível com Excel, usando ponto e vírgula e BOM UTF-8).
- Impressão da prévia, com folha de impressão simplificada.
- Salvar, carregar e excluir definições de relatórios.

## Persistência e compatibilidade
- As definições dos relatórios são armazenadas no snapshot JSON em `savedReports`.
- Os backups antigos continuam compatíveis; sem `savedReports`, a lista inicia vazia.
- A rotina de salvamento automático também é acionada ao alterar tabelas, registros e relacionamentos.
- Mantém SQL.js, IndexedDB, consultas salvas e importação/exportação JSON das versões anteriores.

## Limites desta etapa
- Os formulários são gerados automaticamente com base na estrutura da tabela; não há ainda personalização de layout por arrastar e soltar.
- Os relatórios são tabulares. Não incluem agrupamentos, totais, gráficos ou campos calculados nesta etapa.
- O filtro é textual e procura o termo nos campos selecionados.

## Instalação e teste
1. Faça um backup JSON na versão anterior.
2. Feche as abas antigas do WebAccess.
3. Extraia esta versão em uma pasta nova ou sobre a pasta do aplicativo, sem apagar dados do navegador.
4. Abra `index.html` no mesmo navegador e perfil.
5. Confira as tabelas e registros existentes.
6. Em **Formulários**, selecione uma tabela e teste incluir, editar e excluir um registro.
7. Em **Relatórios**, selecione uma tabela, escolha campos, filtre, exporte CSV e imprima a prévia.
8. Salve uma definição de relatório, feche e reabra o aplicativo e confirme que ela continua disponível.

Não limpe o IndexedDB nem apague versões anteriores.
