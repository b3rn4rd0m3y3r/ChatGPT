<?php
// POST /api/v1/usuarios.php — compatível com PHP 5.5.

function criarUsuario(PDO $pdo)
{
    $input = lerJson();
    $nome  = trim(isset($input['nome']) ? $input['nome'] : '');
    $email = trim(isset($input['email']) ? $input['email'] : '');
    $senha = isset($input['senha']) ? $input['senha'] : '';

    if (mb_strlen($nome) < 2 || mb_strlen($nome) > 100) {
        erro('DADOS_INVALIDOS', 'Nome deve ter entre 2 e 100 caracteres.', 422);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        erro('DADOS_INVALIDOS', 'E-mail inválido.', 422);
    }
    if (mb_strlen($senha) < 8) {
        erro('DADOS_INVALIDOS', 'Senha deve ter no mínimo 8 caracteres.', 422);
    }

    $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = :email');
    $stmt->execute(array(':email' => $email));
    if ($stmt->fetch()) {
        erro('EMAIL_JA_CADASTRADO', 'Este e-mail já está em uso.', 409);
    }

    $hash = password_hash($senha, PASSWORD_DEFAULT);
    $pdo->prepare('INSERT INTO usuarios (nome, email, senha_hash) VALUES (:nome, :email, :hash)')
        ->execute(array(':nome' => $nome, ':email' => $email, ':hash' => $hash));

    $id = (int) $pdo->lastInsertId();

    $stmt = $pdo->prepare('SELECT id, nome, email, criado_em FROM usuarios WHERE id = :id');
    $stmt->execute(array(':id' => $id));

    responderJson(true, $stmt->fetch(PDO::FETCH_ASSOC), null, 201);
}
