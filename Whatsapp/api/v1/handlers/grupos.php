<?php
// Grupos (Fases 2 e 7) — compatível com PHP 5.5.

function criarGrupo(PDO $pdo)
{
    $usuario = usuarioAutenticado($pdo);
    $input = lerJson();
    $nome = trim(isset($input['nome']) ? $input['nome'] : '');

    if (mb_strlen($nome) < 2 || mb_strlen($nome) > 100) {
        erro('DADOS_INVALIDOS', 'Nome deve ter entre 2 e 100 caracteres.', 422);
    }

    $pdo->beginTransaction();
    $pdo->prepare('INSERT INTO grupos (nome, criado_por) VALUES (:nome, :por)')
        ->execute(array(':nome' => $nome, ':por' => $usuario['id']));
    $grupoId = (int) $pdo->lastInsertId();

    $pdo->prepare("INSERT INTO membros_grupo (grupo_id, usuario_id, papel) VALUES (:g, :u, 'admin')")
        ->execute(array(':g' => $grupoId, ':u' => $usuario['id']));
    $pdo->commit();

    $stmt = $pdo->prepare('SELECT id, nome, criado_por, criado_em FROM grupos WHERE id = :id');
    $stmt->execute(array(':id' => $grupoId));

    responderJson(true, $stmt->fetch(PDO::FETCH_ASSOC), null, 201);
}

function listarGrupos(PDO $pdo)
{
    $usuario = usuarioAutenticado($pdo);

    $stmt = $pdo->prepare('
        SELECT g.id, g.nome, g.foto, m.papel,
               (SELECT COUNT(*) FROM membros_grupo WHERE grupo_id = g.id) AS total_membros
        FROM grupos g
        JOIN membros_grupo m ON m.grupo_id = g.id
        WHERE m.usuario_id = :u AND g.ativo = 1
        ORDER BY g.nome
    ');
    $stmt->execute(array(':u' => $usuario['id']));

    responderJson(true, $stmt->fetchAll(PDO::FETCH_ASSOC), null, 200);
}

function detalheGrupo(PDO $pdo, $grupoIdRaw)
{
    $usuario = usuarioAutenticado($pdo);
    $grupoId = (int) $grupoIdRaw;
    papelNoGrupo($pdo, $grupoId, (int) $usuario['id']);

    $stmt = $pdo->prepare('SELECT id, nome, foto, criado_em FROM grupos WHERE id = :id AND ativo = 1');
    $stmt->execute(array(':id' => $grupoId));
    $grupo = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmtMembros = $pdo->prepare('
        SELECT u.id, u.nome, m.papel
        FROM membros_grupo m
        JOIN usuarios u ON u.id = m.usuario_id
        WHERE m.grupo_id = :g
        ORDER BY u.nome
    ');
    $stmtMembros->execute(array(':g' => $grupoId));
    $grupo['membros'] = $stmtMembros->fetchAll(PDO::FETCH_ASSOC);

    responderJson(true, $grupo, null, 200);
}

function editarGrupo(PDO $pdo, $grupoIdRaw)
{
    $usuario = usuarioAutenticado($pdo);
    $grupoId = (int) $grupoIdRaw;
    exigirAdmin($pdo, $grupoId, (int) $usuario['id']);

    $input = lerJson();
    $nome = trim(isset($input['nome']) ? $input['nome'] : '');
    if (mb_strlen($nome) < 2 || mb_strlen($nome) > 100) {
        erro('DADOS_INVALIDOS', 'Nome deve ter entre 2 e 100 caracteres.', 422);
    }

    $pdo->prepare('UPDATE grupos SET nome = :nome WHERE id = :id')
        ->execute(array(':nome' => $nome, ':id' => $grupoId));

    responderJson(true, array('id' => $grupoId, 'nome' => $nome, 'atualizado_em' => agoraIso()), null, 200);
}

function apagarGrupo(PDO $pdo, $grupoIdRaw)
{
    $usuario = usuarioAutenticado($pdo);
    $grupoId = (int) $grupoIdRaw;
    exigirAdmin($pdo, $grupoId, (int) $usuario['id']);

    // Soft delete — preserva histórico de mensagens.
    $pdo->prepare('UPDATE grupos SET ativo = 0 WHERE id = :id')->execute(array(':id' => $grupoId));

    responderJson(true, array('mensagem' => 'Grupo apagado.'), null, 200);
}

function fotoGrupo(PDO $pdo, $grupoIdRaw)
{
    $usuario = usuarioAutenticado($pdo);
    $grupoId = (int) $grupoIdRaw;
    exigirAdmin($pdo, $grupoId, (int) $usuario['id']);

    $arquivo = isset($_FILES['arquivo']) ? $_FILES['arquivo'] : null;
    $caminhos = salvarImagemUpload($arquivo, 'grupos/' . $grupoId, 'perfil');

    $pdo->prepare('UPDATE grupos SET foto = :foto WHERE id = :id')
        ->execute(array(':foto' => $caminhos['imagem'], ':id' => $grupoId));

    responderJson(true, array('id' => $grupoId, 'foto' => $caminhos['imagem']), null, 200);
}
