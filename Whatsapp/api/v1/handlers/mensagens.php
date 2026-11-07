<?php
// Mensagens (Fases 3, 5 e 8) — compatível com PHP 5.5.

function enviarMensagem(PDO $pdo, $grupoIdRaw)
{
    $usuario = usuarioAutenticado($pdo);
    $grupoId = (int) $grupoIdRaw;
    papelNoGrupo($pdo, $grupoId, (int) $usuario['id']);

    $input = lerJson();
    $texto = trim(isset($input['texto']) ? $input['texto'] : '');
    if ($texto === '' || mb_strlen($texto) > 2000) {
        erro('DADOS_INVALIDOS', 'Texto da mensagem não pode estar vazio.', 422);
    }

    $pdo->prepare("INSERT INTO mensagens (grupo_id, autor_id, tipo, texto) VALUES (:g, :a, 'texto', :t)")
        ->execute(array(':g' => $grupoId, ':a' => $usuario['id'], ':t' => $texto));
    $id = (int) $pdo->lastInsertId();

    responderJson(true, array(
        'id' => $id,
        'grupo_id' => $grupoId,
        'autor_id' => (int) $usuario['id'],
        'autor_nome' => $usuario['nome'],
        'tipo' => 'texto',
        'texto' => $texto,
        'criado_em' => agoraIso(),
    ), null, 201);
}

function anexarStatusLeitura(PDO $pdo, $m, $grupoId, $usuarioLogadoId)
{
    // Status de leitura só faz sentido para quem enviou a mensagem.
    if ((int) $m['autor_id'] !== $usuarioLogadoId) {
        $m['status'] = null;
        return $m;
    }

    $stmtTotal = $pdo->prepare('SELECT COUNT(*) FROM membros_grupo WHERE grupo_id = :g AND usuario_id != :a');
    $stmtTotal->execute(array(':g' => $grupoId, ':a' => $m['autor_id']));
    $totalOutros = (int) $stmtTotal->fetchColumn();

    $stmtLidas = $pdo->prepare('SELECT COUNT(*) FROM mensagens_lidas WHERE mensagem_id = :m');
    $stmtLidas->execute(array(':m' => $m['id']));
    $totalLidas = (int) $stmtLidas->fetchColumn();

    $m['status'] = ($totalOutros > 0 && $totalLidas >= $totalOutros) ? 'lida' : 'enviada';
    return $m;
}

function listarMensagens(PDO $pdo, $grupoIdRaw)
{
    $usuario = usuarioAutenticado($pdo);
    $grupoId = (int) $grupoIdRaw;
    papelNoGrupo($pdo, $grupoId, (int) $usuario['id']);

    $limite = min((int) (isset($_GET['limite']) ? $_GET['limite'] : 50), 100);
    if ($limite <= 0) {
        $limite = 50;
    }
    $antesDe = isset($_GET['antes_de']) ? (int) $_GET['antes_de'] : null;

    $sql = '
        SELECT m.id, m.autor_id, u.nome AS autor_nome, m.tipo, m.texto,
               m.caminho_imagem, m.caminho_thumbnail, m.criado_em
        FROM mensagens m
        JOIN usuarios u ON u.id = m.autor_id
        WHERE m.grupo_id = :g
    ';
    $params = array(':g' => $grupoId);
    if ($antesDe) {
        $sql .= ' AND m.id < :antes';
        $params[':antes'] = $antesDe;
    }
    $sql .= ' ORDER BY m.id DESC LIMIT :limite';

    $stmt = $pdo->prepare($sql);
    foreach ($params as $chave => $valor) {
        $stmt->bindValue($chave, $valor, PDO::PARAM_INT);
    }
    // pedimos 1 a mais para saber se "tem_mais"
    $stmt->bindValue(':limite', $limite + 1, PDO::PARAM_INT);
    $stmt->execute();
    $linhas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $temMais = count($linhas) > $limite;
    $linhas = array_slice($linhas, 0, $limite);

    // Closure comum com "use" (arrow function fn() só existe no PHP 7.4+).
    $usuarioId = (int) $usuario['id'];
    $mensagens = array_map(function ($m) use ($pdo, $grupoId, $usuarioId) {
        return anexarStatusLeitura($pdo, $m, $grupoId, $usuarioId);
    }, $linhas);

    responderJson(true, array('mensagens' => $mensagens, 'tem_mais' => $temMais), null, 200);
}

function buscarMensagensApos(PDO $pdo, $grupoId, $desde)
{
    $stmt = $pdo->prepare('
        SELECT m.id, m.autor_id, u.nome AS autor_nome, m.tipo, m.texto,
               m.caminho_imagem, m.caminho_thumbnail, m.criado_em
        FROM mensagens m
        JOIN usuarios u ON u.id = m.autor_id
        WHERE m.grupo_id = :g AND m.id > :desde
        ORDER BY m.id ASC
    ');
    $stmt->execute(array(':g' => $grupoId, ':desde' => $desde));
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function mensagensNovas(PDO $pdo, $grupoIdRaw)
{
    $usuario = usuarioAutenticado($pdo);
    $grupoId = (int) $grupoIdRaw;
    papelNoGrupo($pdo, $grupoId, (int) $usuario['id']);

    $desde = (int) (isset($_GET['desde']) ? $_GET['desde'] : 0);
    responderJson(true, array('mensagens' => buscarMensagensApos($pdo, $grupoId, $desde)), null, 200);
}

function mensagensAguardar(PDO $pdo, $grupoIdRaw)
{
    $usuario = usuarioAutenticado($pdo);
    $grupoId = (int) $grupoIdRaw;
    papelNoGrupo($pdo, $grupoId, (int) $usuario['id']);

    $desde = (int) (isset($_GET['desde']) ? $_GET['desde'] : 0);
    $timeout = min((int) (isset($_GET['timeout']) ? $_GET['timeout'] : 25), 30);
    if ($timeout <= 0) {
        $timeout = 25;
    }

    // Libera a sessão PHP (se houver) para não travar outras abas.
    if (session_id() !== '') {
        session_write_close();
    }

    $limite = time() + $timeout;
    while (time() < $limite) {
        $mensagens = buscarMensagensApos($pdo, $grupoId, $desde);
        if (count($mensagens) > 0) {
            responderJson(true, array('mensagens' => $mensagens), null, 200);
        }
        usleep(500000); // 0.5s entre checagens no banco
    }

    responderJson(true, array('mensagens' => array()), null, 200);
}

function marcarLida(PDO $pdo, $mensagemIdRaw)
{
    $usuario = usuarioAutenticado($pdo);
    $mensagemId = (int) $mensagemIdRaw;

    $stmt = $pdo->prepare('SELECT grupo_id FROM mensagens WHERE id = :id');
    $stmt->execute(array(':id' => $mensagemId));
    $grupoId = $stmt->fetchColumn();

    if (!$grupoId) {
        erro('MENSAGEM_NAO_ENCONTRADA', 'Mensagem não encontrada.', 404);
    }
    papelNoGrupo($pdo, (int) $grupoId, (int) $usuario['id']);

    $pdo->prepare('INSERT OR IGNORE INTO mensagens_lidas (mensagem_id, usuario_id) VALUES (:m, :u)')
        ->execute(array(':m' => $mensagemId, ':u' => $usuario['id']));

    responderJson(true, array(
        'mensagem_id' => $mensagemId,
        'usuario_id' => (int) $usuario['id'],
        'lida_em' => agoraIso(),
    ), null, 200);
}

function marcarLidasLote(PDO $pdo, $grupoIdRaw)
{
    $usuario = usuarioAutenticado($pdo);
    $grupoId = (int) $grupoIdRaw;
    papelNoGrupo($pdo, $grupoId, (int) $usuario['id']);

    $input = lerJson();
    $ateId = (int) (isset($input['ate_mensagem_id']) ? $input['ate_mensagem_id'] : 0);

    $stmt = $pdo->prepare('SELECT id FROM mensagens WHERE grupo_id = :g AND id <= :ate');
    $stmt->execute(array(':g' => $grupoId, ':ate' => $ateId));
    $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $inserir = $pdo->prepare('INSERT OR IGNORE INTO mensagens_lidas (mensagem_id, usuario_id) VALUES (:m, :u)');
    $marcadas = 0;
    foreach ($ids as $id) {
        $inserir->execute(array(':m' => $id, ':u' => $usuario['id']));
        if ($inserir->rowCount() > 0) {
            $marcadas++;
        }
    }

    responderJson(true, array('grupo_id' => $grupoId, 'marcadas' => $marcadas), null, 200);
}
