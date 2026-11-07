<?php
// Membros de grupo (Fases 2 e 7) — compatível com PHP 5.5.

function adicionarMembro(PDO $pdo, $grupoIdRaw)
{
    $usuario = usuarioAutenticado($pdo);
    $grupoId = (int) $grupoIdRaw;
    exigirAdmin($pdo, $grupoId, (int) $usuario['id']); // só o administrador adiciona direto

    $input = lerJson();
    $usuarioIdNovo = (int) (isset($input['usuario_id']) ? $input['usuario_id'] : 0);

    $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE id = :id');
    $stmt->execute(array(':id' => $usuarioIdNovo));
    if (!$stmt->fetch()) {
        erro('USUARIO_NAO_ENCONTRADO', 'Usuário informado não existe.', 404);
    }

    $stmt = $pdo->prepare('SELECT 1 FROM membros_grupo WHERE grupo_id = :g AND usuario_id = :u');
    $stmt->execute(array(':g' => $grupoId, ':u' => $usuarioIdNovo));
    if ($stmt->fetch()) {
        erro('JA_E_MEMBRO', 'Usuário já pertence a este grupo.', 409);
    }

    $pdo->prepare("INSERT INTO membros_grupo (grupo_id, usuario_id, papel) VALUES (:g, :u, 'membro')")
        ->execute(array(':g' => $grupoId, ':u' => $usuarioIdNovo));

    // se a pessoa tinha um pedido pendente, ele fica resolvido
    $pdo->prepare("UPDATE solicitacoes_entrada SET status = 'aprovada', resolvido_em = :agora, resolvido_por = :por
                   WHERE grupo_id = :g AND usuario_id = :u AND status = 'pendente'")
        ->execute(array(':agora' => agoraIso(), ':por' => $usuario['id'], ':g' => $grupoId, ':u' => $usuarioIdNovo));

    responderJson(true, array(
        'grupo_id' => $grupoId,
        'usuario_id' => $usuarioIdNovo,
        'papel' => 'membro',
        'adicionado_em' => agoraIso(),
    ), null, 201);
}

function removerMembro(PDO $pdo, $grupoIdRaw, $usuarioIdAlvoRaw)
{
    $usuario = usuarioAutenticado($pdo);
    $grupoId = (int) $grupoIdRaw;
    $usuarioIdAlvo = (int) $usuarioIdAlvoRaw;

    papelNoGrupo($pdo, $grupoId, (int) $usuario['id']);

    // Remover outra pessoa exige admin; remover a si mesmo (sair) é sempre permitido.
    if ((int) $usuario['id'] !== $usuarioIdAlvo) {
        exigirAdmin($pdo, $grupoId, (int) $usuario['id']);
    }

    $stmt = $pdo->prepare('SELECT 1 FROM membros_grupo WHERE grupo_id = :g AND usuario_id = :u');
    $stmt->execute(array(':g' => $grupoId, ':u' => $usuarioIdAlvo));
    if (!$stmt->fetch()) {
        erro('MEMBRO_NAO_ENCONTRADO', 'Usuário não é membro deste grupo.', 404);
    }

    $pdo->prepare('DELETE FROM membros_grupo WHERE grupo_id = :g AND usuario_id = :u')
        ->execute(array(':g' => $grupoId, ':u' => $usuarioIdAlvo));

    responderJson(true, array('mensagem' => 'Membro removido.'), null, 200);
}

function alterarPapel(PDO $pdo, $grupoIdRaw, $usuarioIdAlvoRaw)
{
    $usuario = usuarioAutenticado($pdo);
    $grupoId = (int) $grupoIdRaw;
    $usuarioIdAlvo = (int) $usuarioIdAlvoRaw;

    exigirAdmin($pdo, $grupoId, (int) $usuario['id']);

    $input = lerJson();
    $papel = isset($input['papel']) ? $input['papel'] : '';
    if (!in_array($papel, array('admin', 'membro'), true)) {
        erro('DADOS_INVALIDOS', "Papel deve ser 'admin' ou 'membro'.", 422);
    }

    if ($papel === 'membro') {
        $stmtTotal = $pdo->prepare("SELECT COUNT(*) FROM membros_grupo WHERE grupo_id = :g AND papel = 'admin'");
        $stmtTotal->execute(array(':g' => $grupoId));
        $totalAdmins = (int) $stmtTotal->fetchColumn();

        $stmtAtual = $pdo->prepare('SELECT papel FROM membros_grupo WHERE grupo_id = :g AND usuario_id = :u');
        $stmtAtual->execute(array(':g' => $grupoId, ':u' => $usuarioIdAlvo));
        $papelAtual = $stmtAtual->fetchColumn();

        if ($papelAtual === 'admin' && $totalAdmins <= 1) {
            erro('ULTIMO_ADMIN', 'O grupo precisa ter ao menos um administrador.', 409);
        }
    }

    $pdo->prepare('UPDATE membros_grupo SET papel = :p WHERE grupo_id = :g AND usuario_id = :u')
        ->execute(array(':p' => $papel, ':g' => $grupoId, ':u' => $usuarioIdAlvo));

    responderJson(true, array('grupo_id' => $grupoId, 'usuario_id' => $usuarioIdAlvo, 'papel' => $papel), null, 200);
}
