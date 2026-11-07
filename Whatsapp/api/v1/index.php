<?php
// Front controller único da API. O web.config reescreve qualquer
// requisição /api/v1/algo/coisa para este arquivo, passando o caminho
// original em $_GET['url'] (ex.: "grupos/7/mensagens").

require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/upload.php';
require_once __DIR__ . '/handlers/usuarios.php';
require_once __DIR__ . '/handlers/auth.php';
require_once __DIR__ . '/handlers/grupos.php';
require_once __DIR__ . '/handlers/membros.php';
require_once __DIR__ . '/handlers/mensagens.php';
require_once __DIR__ . '/handlers/imagens.php';

$metodo = $_SERVER['REQUEST_METHOD'];
$caminho = trim($_GET['url'] ?? '', '/');
$segmentos = $caminho === '' ? [] : explode('/', $caminho);
$n = count($segmentos);

try {
    $pdo = obterConexao();

    // ---- usuários / autenticação (Fase 1) ----
    if ($metodo === 'POST' && $segmentos === ['usuarios']) {
        criarUsuario($pdo);
    } elseif ($metodo === 'POST' && $segmentos === ['auth', 'login']) {
        login($pdo);
    } elseif ($metodo === 'GET' && $segmentos === ['auth', 'me']) {
        me($pdo);
    } elseif ($metodo === 'POST' && $segmentos === ['auth', 'logout']) {
        logout($pdo);

    // ---- grupos (Fases 2 e 7) ----
    } elseif ($metodo === 'POST' && $segmentos === ['grupos']) {
        criarGrupo($pdo);
    } elseif ($metodo === 'GET' && $segmentos === ['grupos']) {
        listarGrupos($pdo);
    } elseif ($metodo === 'GET' && $n === 2 && $segmentos[0] === 'grupos') {
        detalheGrupo($pdo, $segmentos[1]);
    } elseif ($metodo === 'PATCH' && $n === 2 && $segmentos[0] === 'grupos') {
        editarGrupo($pdo, $segmentos[1]);
    } elseif ($metodo === 'DELETE' && $n === 2 && $segmentos[0] === 'grupos') {
        apagarGrupo($pdo, $segmentos[1]);
    } elseif ($metodo === 'POST' && $n === 3 && $segmentos[0] === 'grupos' && $segmentos[2] === 'foto') {
        fotoGrupo($pdo, $segmentos[1]);

    // ---- membros (Fases 2 e 7) ----
    } elseif ($metodo === 'POST' && $n === 3 && $segmentos[0] === 'grupos' && $segmentos[2] === 'membros') {
        adicionarMembro($pdo, $segmentos[1]);
    } elseif ($metodo === 'DELETE' && $n === 4 && $segmentos[0] === 'grupos' && $segmentos[2] === 'membros') {
        removerMembro($pdo, $segmentos[1], $segmentos[3]);
    } elseif ($metodo === 'PATCH' && $n === 4 && $segmentos[0] === 'grupos' && $segmentos[2] === 'membros') {
        alterarPapel($pdo, $segmentos[1], $segmentos[3]);

    // ---- mensagens (Fases 3, 5, 6, 8) ----
    } elseif ($metodo === 'POST' && $n === 3 && $segmentos[0] === 'grupos' && $segmentos[2] === 'mensagens') {
        enviarMensagem($pdo, $segmentos[1]);
    } elseif ($metodo === 'GET' && $n === 3 && $segmentos[0] === 'grupos' && $segmentos[2] === 'mensagens') {
        listarMensagens($pdo, $segmentos[1]);
    } elseif ($metodo === 'GET' && $n === 4 && $segmentos[0] === 'grupos' && $segmentos[2] === 'mensagens' && $segmentos[3] === 'novas') {
        mensagensNovas($pdo, $segmentos[1]);
    } elseif ($metodo === 'GET' && $n === 4 && $segmentos[0] === 'grupos' && $segmentos[2] === 'mensagens' && $segmentos[3] === 'aguardar') {
        mensagensAguardar($pdo, $segmentos[1]);
    } elseif ($metodo === 'POST' && $n === 4 && $segmentos[0] === 'grupos' && $segmentos[2] === 'mensagens' && $segmentos[3] === 'imagem') {
        enviarImagem($pdo, $segmentos[1]);
    } elseif ($metodo === 'POST' && $n === 4 && $segmentos[0] === 'grupos' && $segmentos[2] === 'mensagens' && $segmentos[3] === 'lidas') {
        marcarLidasLote($pdo, $segmentos[1]);
    } elseif ($metodo === 'POST' && $n === 3 && $segmentos[0] === 'mensagens' && $segmentos[2] === 'lida') {
        marcarLida($pdo, $segmentos[1]);

    } else {
        erro('ROTA_NAO_ENCONTRADA', 'Rota não encontrada.', 404);
    }
} catch (ApiException $e) {
    responderJson(false, null, ['codigo' => $e->codigo, 'mensagem' => $e->getMessage()], $e->statusCode);
} catch (Throwable $e) {
    error_log('[API] Erro interno: ' . $e->getMessage());
    responderJson(false, null, ['codigo' => 'ERRO_INTERNO', 'mensagem' => 'Erro interno do servidor.'], 500);
}
