# WebAccess — Sessão 05

## Entrega
Esta versão acrescenta persistência local com IndexedDB, recuperação automática do banco e importação/exportação de backups JSON. Mantém os recursos das sessões anteriores: criação de tabelas, campos, registros e relacionamentos 1:N com validação de integridade referencial.

## Como executar
1. Extraia o ZIP para uma pasta do computador.
2. Abra `index.html` no Google Chrome ou Microsoft Edge.
3. Aguarde o indicador no topo informar que o banco foi recuperado ou que o armazenamento está pronto.
4. Crie e edite tabelas normalmente. As alterações são salvas automaticamente após uma breve pausa.

## Persistência
- Os dados são guardados no IndexedDB do navegador.
- Ao abrir novamente o WebAccess no mesmo navegador e perfil, o banco é recuperado automaticamente.
- O indicador no topo informa o estado do salvamento.
- O armazenamento é local ao navegador/computador. Para transportar ou proteger os dados, use **Exportar JSON**.
- Para recuperar uma cópia, use **Importar JSON**. O arquivo é validado e o aplicativo pede confirmação antes de substituir o banco atual.

## Backup JSON
**Exportar JSON** cria um arquivo com o nome do banco e o sufixo `_backup.json`. Esse arquivo contém o nome do banco, tabelas, campos, registros, relacionamentos e data da cópia.

**Importar JSON** aceita backups gerados pelo WebAccess. A importação verifica a estrutura, os campos e os relacionamentos antes de substituir os dados atuais.

## Atenção
- Não use a limpeza de dados do navegador para este site sem antes exportar um backup.
- O IndexedDB não cria um arquivo `.sqlite`; é o mecanismo de armazenamento local do navegador nesta etapa.
- Para usar o mesmo banco em outro computador, exporte o JSON no primeiro e importe no segundo.
- A integridade referencial continua sendo aplicada pelo JavaScript, não por constraints de um motor SQLite.
- A versão mantém as regras de relacionamento 1:N da Sessão 04.

## Estrutura
- `index.html` — interface
- `css/style.css` — estilos
- `js/app.js` — funcionalidades do aplicativo
- `js/persistencia.js` — armazenamento IndexedDB e backups JSON
