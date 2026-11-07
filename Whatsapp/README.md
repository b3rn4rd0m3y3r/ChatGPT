# Mensagens em grupo (estilo WhatsApp) — PHP 5.5 + IIS + SQLite

Stack: Windows + IIS + PHP 5.5.15 + SQLite, em HTTP. Funciona em qualquer subpasta
do site (ex.: http://servidor/Whatsapp/): todos os caminhos são relativos.
Não precisa de URL Rewrite nem de web.config.

## Como funcionam os grupos
- Todo usuário cadastrado vê TODOS os grupos (seção "Outros grupos") e pode
  "Pedir para entrar".
- O administrador do grupo (quem o criou, ou quem foi promovido) vê os pedidos no
  painel "Pedidos para entrar nos seus grupos" e clica em Aprovar ou Recusar.
- Quem foi recusado pode pedir de novo.
- Só o administrador adiciona alguém diretamente pelo id (grupos/membros/adicionar.php).
- Mensagens, imagens e a lista de membros continuam restritos a quem é membro.
- A tela de grupos se atualiza sozinha a cada 15 segundos.

## Instalação
1. Copie a pasta inteira para o diretório do site no IIS (ex.: C:\inetpub\wwwroot\Whatsapp).
2. Dê permissão de ESCRITA à identidade do Application Pool (ex.: IIS_IUSRS) em
   `storage\db\` e `imagens\`.
3. No php.ini habilite: pdo_sqlite, sqlite3, gd, mbstring (e openssl, recomendado).
   Ajuste: upload_max_filesize = 5M, post_max_size = 6M, max_execution_time = 35.
4. Acesse http://servidor/Whatsapp/index.html.

## Atualizando uma instalação que já existe
Basta copiar os arquivos por cima (não apague a pasta storage\db). Na primeira chamada
à API o banco existente é atualizado sozinho (cria a tabela de pedidos de entrada),
sem perder usuários, grupos nem mensagens.

## Observações
- O código não usa recursos do PHP 7+ (Throwable, random_bytes, ??, tipos escalares...).
- Se ocorrer erro fatal no servidor, a API responde JSON com codigo "ERRO_FATAL" e a
  mensagem/arquivo/linha — use isso para diagnosticar.
- Os endpoints não checam o verbo HTTP: use POST para tudo que altera dados
  (evita bloqueio de PATCH/DELETE pelo IIS/WebDAV).
- Se o login funcionar mas as demais chamadas derem TOKEN_INVALIDO, o IIS/FastCGI pode
  não estar repassando o header Authorization ao PHP — avise para ajustarmos.

## Endpoints (api/v1/...; IDs por query string)
usuarios.php | auth/login.php, me.php, logout.php
grupos/criar.php, explorar.php (todos os grupos + situação do usuário), listar.php (só os meus),
  detalhe.php?grupo_id=, editar.php?grupo_id=, apagar.php?grupo_id=, foto.php?grupo_id=,
  solicitar_entrada.php?grupo_id=
grupos/solicitacoes/pendentes.php (pedidos dos grupos que eu administro),
  responder.php?grupo_id=&usuario_id=  (corpo: {"acao":"aprovar"} ou {"acao":"recusar"})
grupos/membros/adicionar.php?grupo_id= (admin), remover.php?grupo_id=&usuario_id=,
  alterar_papel.php?grupo_id=&usuario_id=
mensagens/enviar.php, listar.php, novas.php, aguardar.php (long polling), imagem.php,
  lidas_lote.php (?grupo_id=), lida.php?mensagem_id=
