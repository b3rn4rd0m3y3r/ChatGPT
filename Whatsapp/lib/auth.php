<?php
// Autenticação via Bearer token e checagem de associação/papel em grupo.
// Compatível com PHP 5.5.

function obterHeaderAutorizacao()
{
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $nome => $valor) {
            if (strtolower($nome) === 'authorization') {
                return $valor;
            }
        }
    }
    // No PHP 5.5 fora do Apache, getallheaders() não existe: este fallback
    // via $_SERVER é o caminho principal.
    return isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
}

function usuarioAutenticado(PDO $pdo)
{
    $autorizacao = obterHeaderAutorizacao();

    if (!preg_match('/Bearer\s+(.+)/i', $autorizacao, $m)) {
        erro('TOKEN_INVALIDO', 'Token ausente, inválido ou expirado.', 401);
    }
    $token = trim($m[1]);

    $stmt = $pdo->prepare('
        SELECT u.id, u.nome, u.email
        FROM usuarios u
        JOIN tokens_acesso t ON t.usuario_id = u.id
        WHERE t.token = :token AND t.expira_em > :agora
    ');
    $stmt->execute(array(':token' => $token, ':agora' => agoraIso()));
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        erro('TOKEN_INVALIDO', 'Token ausente, inválido ou expirado.', 401);
    }

    return $usuario;
}

function papelNoGrupo(PDO $pdo, $grupoId, $usuarioId)
{
    $stmtGrupo = $pdo->prepare('SELECT id FROM grupos WHERE id = :id AND ativo = 1');
    $stmtGrupo->execute(array(':id' => $grupoId));
    if (!$stmtGrupo->fetch()) {
        erro('GRUPO_NAO_ENCONTRADO', 'Grupo não encontrado.', 404);
    }

    $stmt = $pdo->prepare('SELECT papel FROM membros_grupo WHERE grupo_id = :g AND usuario_id = :u');
    $stmt->execute(array(':g' => $grupoId, ':u' => $usuarioId));
    $linha = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$linha) {
        erro('ACESSO_NEGADO', 'Você não é membro deste grupo.', 403);
    }

    return $linha['papel'];
}

function exigirAdmin(PDO $pdo, $grupoId, $usuarioId)
{
    $papel = papelNoGrupo($pdo, $grupoId, $usuarioId);
    if ($papel !== 'admin') {
        erro('APENAS_ADMIN', 'Apenas administradores podem realizar esta ação.', 403);
    }
    return $papel;
}
