<?php
// login / me / logout — compatível com PHP 5.5.

function login(PDO $pdo)
{
    $input = lerJson();
    $email = trim(isset($input['email']) ? $input['email'] : '');
    $senha = isset($input['senha']) ? $input['senha'] : '';

    $stmt = $pdo->prepare('SELECT * FROM usuarios WHERE email = :email');
    $stmt->execute(array(':email' => $email));
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || !password_verify($senha, $usuario['senha_hash'])) {
        erro('CREDENCIAIS_INVALIDAS', 'Usuário ou senha incorretos.', 401);
    }

    $token = bin2hex(gerarBytesAleatorios(32));
    $expiraEm = gmdate('Y-m-d\TH:i:s\Z', time() + 7 * 24 * 3600); // 7 dias

    $pdo->prepare('INSERT INTO tokens_acesso (usuario_id, token, expira_em) VALUES (:u, :t, :e)')
        ->execute(array(':u' => $usuario['id'], ':t' => $token, ':e' => $expiraEm));

    responderJson(true, array(
        'token' => $token,
        'expira_em' => $expiraEm,
        'usuario' => array(
            'id' => (int) $usuario['id'],
            'nome' => $usuario['nome'],
            'email' => $usuario['email'],
        ),
    ), null, 200);
}

function me(PDO $pdo)
{
    $usuario = usuarioAutenticado($pdo);
    responderJson(true, array(
        'id' => (int) $usuario['id'],
        'nome' => $usuario['nome'],
        'email' => $usuario['email'],
    ), null, 200);
}

function logout(PDO $pdo)
{
    $autorizacao = obterHeaderAutorizacao();
    if (!preg_match('/Bearer\s+(.+)/i', $autorizacao, $m)) {
        erro('TOKEN_INVALIDO', 'Token ausente, inválido ou expirado.', 401);
    }
    $token = trim($m[1]);

    $pdo->prepare('DELETE FROM tokens_acesso WHERE token = :t')->execute(array(':t' => $token));
    responderJson(true, array('mensagem' => 'Sessão encerrada.'), null, 200);
}
