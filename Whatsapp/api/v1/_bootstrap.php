<?php
// Compartilhado por todo endpoint físico da API. __DIR__ aqui sempre aponta
// para api/v1, então os caminhos funcionam a partir de qualquer subpasta.
// Compatível com PHP 5.5: sem tipo de retorno, sem Throwable (só existe no
// PHP 7+; em 5.5 um erro fatal não é capturável por try/catch, por isso o
// register_shutdown_function abaixo é essencial).

// Captura qualquer saída acidental (warning/notice) para não corromper o JSON.
if (!ob_get_level()) {
    ob_start();
}

// Registrado ANTES de qualquer require: erro fatal (sintaxe, extensão
// faltando etc.) vira JSON legível em vez de resposta vazia.
register_shutdown_function(function () {
    $erro = error_get_last();
    $tiposFatais = array(E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR);
    if ($erro && in_array($erro['type'], $tiposFatais, true)) {
        while (ob_get_level() > 0) {
            ob_end_clean();
        }
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode(array(
            'sucesso' => false,
            'dados' => null,
            'erro' => array(
                'codigo' => 'ERRO_FATAL',
                'mensagem' => 'Erro fatal no servidor: ' . $erro['message']
                    . ' (arquivo: ' . basename($erro['file']) . ', linha ' . $erro['line'] . ')',
            ),
        ), JSON_UNESCAPED_UNICODE);
    }
});

require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/upload.php';
require_once __DIR__ . '/handlers/usuarios.php';
require_once __DIR__ . '/handlers/auth.php';
require_once __DIR__ . '/handlers/grupos.php';
require_once __DIR__ . '/handlers/membros.php';
require_once __DIR__ . '/handlers/solicitacoes.php';
require_once __DIR__ . '/handlers/mensagens.php';
require_once __DIR__ . '/handlers/imagens.php';

/**
 * Todo endpoint físico chama executar(function (PDO $pdo) { ... }).
 * ApiException e demais Exception (ex.: PDOException) viram JSON padrão.
 */
function executar($fn)
{
    try {
        $pdo = obterConexao();
        $fn($pdo);
    } catch (ApiException $e) {
        responderJson(false, null, array('codigo' => $e->codigo, 'mensagem' => $e->getMessage()), $e->statusCode);
    } catch (Exception $e) {
        error_log('[API] Erro interno: ' . $e->getMessage());
        responderJson(false, null, array('codigo' => 'ERRO_INTERNO', 'mensagem' => 'Erro interno do servidor.'), 500);
    }
}

/** Lê um parâmetro obrigatório da query string, como inteiro. */
function paramInt($nome)
{
    if (!isset($_GET[$nome]) || $_GET[$nome] === '') {
        erro('DADOS_INVALIDOS', "Parâmetro '$nome' é obrigatório na URL.", 422);
    }
    return (int) $_GET[$nome];
}
