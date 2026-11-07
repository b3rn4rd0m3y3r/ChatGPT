<?php
// Descoberta de grupos e solicitações de entrada — compatível com PHP 5.5.
// Fluxo: qualquer usuário vê todos os grupos (explorar) e pede para entrar
// (solicitarEntrada); o administrador do grupo vê os pedidos (pendentesDoAdmin)
// e aprova ou recusa (responderSolicitacao). Mensagens seguem restritas a membros.

function explorarGrupos(PDO $pdo)
{
    $usuario = usuarioAutenticado($pdo);

    $stmt = $pdo->prepare('
        SELECT g.id, g.nome, g.foto,
               (SELECT COUNT(*) FROM membros_grupo WHERE grupo_id = g.id) AS total_membros,
               (SELECT papel FROM membros_grupo WHERE grupo_id = g.id AND usuario_id = :u1) AS papel,
               (SELECT status FROM solicitacoes_entrada WHERE grupo_id = g.id AND usuario_id = :u2) AS status_solicitacao
        FROM grupos g
        WHERE g.ativo = 1
        ORDER BY g.nome
    ');
    $stmt->execute(array(':u1' => $usuario['id'], ':u2' => $usuario['id']));

    $grupos = array();
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $linha) {
        if ($linha['papel'] !== null) {
            $situacao = 'membro';
        } elseif ($linha['status_solicitacao'] === 'pendente') {
            $situacao = 'pendente';
        } elseif ($linha['status_solicitacao'] === 'recusada') {
            $situacao = 'recusada';
        } else {
            $situacao = 'nenhuma';
        }
        $grupos[] = array(
            'id' => (int) $linha['id'],
            'nome' => $linha['nome'],
            'foto' => $linha['foto'],
            'total_membros' => (int) $linha['total_membros'],
            'papel' => $linha['papel'],
            'situacao' => $situacao,
        );
    }

    responderJson(true, $grupos, null, 200);
}

function solicitarEntrada(PDO $pdo, $grupoIdRaw)
{
    $usuario = usuarioAutenticado($pdo);
    $grupoId = (int) $grupoIdRaw;
    $usuarioId = (int) $usuario['id'];

    $stmt = $pdo->prepare('SELECT id FROM grupos WHERE id = :id AND ativo = 1');
    $stmt->execute(array(':id' => $grupoId));
    if (!$stmt->fetch()) {
        erro('GRUPO_NAO_ENCONTRADO', 'Grupo não encontrado.', 404);
    }

    $stmt = $pdo->prepare('SELECT 1 FROM membros_grupo WHERE grupo_id = :g AND usuario_id = :u');
    $stmt->execute(array(':g' => $grupoId, ':u' => $usuarioId));
    if ($stmt->fetch()) {
        erro('JA_E_MEMBRO', 'Você já participa deste grupo.', 409);
    }

    $stmt = $pdo->prepare('SELECT status FROM solicitacoes_entrada WHERE grupo_id = :g AND usuario_id = :u');
    $stmt->execute(array(':g' => $grupoId, ':u' => $usuarioId));
    $existente = $stmt->fetchColumn();

    if ($existente === 'pendente') {
        erro('SOLICITACAO_JA_ENVIADA', 'Você já pediu para entrar neste grupo. Aguarde o administrador.', 409);
    }

    if ($existente !== false) {
        // pedido anterior recusado (ou de quem já saiu do grupo): reabre como pendente
        $pdo->prepare("UPDATE solicitacoes_entrada
                       SET status = 'pendente', criado_em = :agora, resolvido_em = NULL, resolvido_por = NULL
                       WHERE grupo_id = :g AND usuario_id = :u")
            ->execute(array(':agora' => agoraIso(), ':g' => $grupoId, ':u' => $usuarioId));
    } else {
        $pdo->prepare("INSERT INTO solicitacoes_entrada (grupo_id, usuario_id, status) VALUES (:g, :u, 'pendente')")
            ->execute(array(':g' => $grupoId, ':u' => $usuarioId));
    }

    responderJson(true, array('grupo_id' => $grupoId, 'usuario_id' => $usuarioId, 'status' => 'pendente'), null, 201);
}

function pendentesDoAdmin(PDO $pdo)
{
    $usuario = usuarioAutenticado($pdo);

    // Todos os pedidos pendentes dos grupos em que o usuário logado é administrador.
    $stmt = $pdo->prepare("
        SELECT s.grupo_id, g.nome AS grupo_nome,
               s.usuario_id, u.nome AS usuario_nome, u.email AS usuario_email,
               s.criado_em
        FROM solicitacoes_entrada s
        JOIN grupos g ON g.id = s.grupo_id AND g.ativo = 1
        JOIN membros_grupo m ON m.grupo_id = s.grupo_id AND m.usuario_id = :u AND m.papel = 'admin'
        JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.status = 'pendente'
        ORDER BY s.criado_em
    ");
    $stmt->execute(array(':u' => $usuario['id']));

    responderJson(true, $stmt->fetchAll(PDO::FETCH_ASSOC), null, 200);
}

function responderSolicitacao(PDO $pdo, $grupoIdRaw, $usuarioIdRaw)
{
    $usuario = usuarioAutenticado($pdo);
    $grupoId = (int) $grupoIdRaw;
    $usuarioIdAlvo = (int) $usuarioIdRaw;

    exigirAdmin($pdo, $grupoId, (int) $usuario['id']);

    $input = lerJson();
    $acao = isset($input['acao']) ? $input['acao'] : '';
    if (!in_array($acao, array('aprovar', 'recusar'), true)) {
        erro('DADOS_INVALIDOS', "Ação deve ser 'aprovar' ou 'recusar'.", 422);
    }

    $stmt = $pdo->prepare("SELECT 1 FROM solicitacoes_entrada WHERE grupo_id = :g AND usuario_id = :u AND status = 'pendente'");
    $stmt->execute(array(':g' => $grupoId, ':u' => $usuarioIdAlvo));
    if (!$stmt->fetch()) {
        erro('SOLICITACAO_NAO_ENCONTRADA', 'Não há pedido pendente deste usuário para este grupo.', 404);
    }

    $novoStatus = ($acao === 'aprovar') ? 'aprovada' : 'recusada';

    $pdo->beginTransaction();
    try {
        if ($acao === 'aprovar') {
            $pdo->prepare("INSERT OR IGNORE INTO membros_grupo (grupo_id, usuario_id, papel) VALUES (:g, :u, 'membro')")
                ->execute(array(':g' => $grupoId, ':u' => $usuarioIdAlvo));
        }
        $pdo->prepare('UPDATE solicitacoes_entrada
                       SET status = :s, resolvido_em = :agora, resolvido_por = :por
                       WHERE grupo_id = :g AND usuario_id = :u')
            ->execute(array(
                ':s' => $novoStatus, ':agora' => agoraIso(), ':por' => $usuario['id'],
                ':g' => $grupoId, ':u' => $usuarioIdAlvo,
            ));
        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }

    responderJson(true, array('grupo_id' => $grupoId, 'usuario_id' => $usuarioIdAlvo, 'status' => $novoStatus), null, 200);
}
