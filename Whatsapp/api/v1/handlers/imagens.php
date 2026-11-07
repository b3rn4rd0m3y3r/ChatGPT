<?php
// POST /api/v1/mensagens/imagem.php (Fase 6)
// Compatível com PHP 5.5 — ver observações em lib/response.php e _bootstrap.php.

function enviarImagem(PDO $pdo, $grupoIdRaw)
{
    $usuario = usuarioAutenticado($pdo);
    $grupoId = (int) $grupoIdRaw;
    papelNoGrupo($pdo, $grupoId, (int) $usuario['id']);

    $legenda = trim(isset($_POST['legenda']) ? $_POST['legenda'] : '');
    $arquivo = isset($_FILES['arquivo']) ? $_FILES['arquivo'] : null;
    $caminhos = salvarImagemUpload($arquivo, (string) $grupoId);

    $pdo->prepare("
        INSERT INTO mensagens (grupo_id, autor_id, tipo, texto, caminho_imagem, caminho_thumbnail)
        VALUES (:g, :a, 'imagem', :t, :img, :thumb)
    ")->execute(array(
        ':g' => $grupoId,
        ':a' => $usuario['id'],
        ':t' => $legenda !== '' ? $legenda : null,
        ':img' => $caminhos['imagem'],
        ':thumb' => $caminhos['thumbnail'],
    ));
    $id = (int) $pdo->lastInsertId();

    responderJson(true, array(
        'id' => $id,
        'grupo_id' => $grupoId,
        'autor_id' => (int) $usuario['id'],
        'autor_nome' => $usuario['nome'],
        'tipo' => 'imagem',
        'texto' => $legenda !== '' ? $legenda : null,
        'caminho_imagem' => $caminhos['imagem'],
        'caminho_thumbnail' => $caminhos['thumbnail'],
        'criado_em' => agoraIso(),
    ), null, 201);
}
