<?php
// Upload de imagem para disco (sem blobs no banco), servida como estático.
// Compatível com PHP 5.5.

function salvarImagemUpload($arquivo, $subpasta, $nomeForcado = null)
{
    if (!$arquivo || $arquivo['error'] !== UPLOAD_ERR_OK) {
        erro('ARQUIVO_INVALIDO', 'Formato não suportado ou arquivo maior que 5MB.', 422);
    }
    if ($arquivo['size'] > 5 * 1024 * 1024) {
        erro('ARQUIVO_INVALIDO', 'Formato não suportado ou arquivo maior que 5MB.', 422);
    }

    $info = @getimagesize($arquivo['tmp_name']);
    if (!$info) {
        erro('ARQUIVO_INVALIDO', 'Formato não suportado ou arquivo maior que 5MB.', 422);
    }

    $mime = $info['mime'];
    if (!in_array($mime, array('image/jpeg', 'image/png', 'image/webp'), true)) {
        erro('ARQUIVO_INVALIDO', 'Formato não suportado ou arquivo maior que 5MB.', 422);
    }

    $uuid = $nomeForcado ? $nomeForcado : bin2hex(gerarBytesAleatorios(16));
    $pastaFisica = __DIR__ . '/../imagens/' . $subpasta;
    if (!is_dir($pastaFisica)) {
        mkdir($pastaFisica, 0775, true);
    }

    gerarImagemPadronizada($arquivo['tmp_name'], $mime, $pastaFisica . '/' . $uuid . '.jpg', 1280);
    gerarImagemPadronizada($arquivo['tmp_name'], $mime, $pastaFisica . '/' . $uuid . '_thumb.jpg', 200);

    // Sem barra inicial: caminho relativo à página (funciona em subpasta).
    return array(
        'imagem'    => 'imagens/' . $subpasta . '/' . $uuid . '.jpg',
        'thumbnail' => 'imagens/' . $subpasta . '/' . $uuid . '_thumb.jpg',
    );
}

function gerarImagemPadronizada($origem, $mime, $destino, $larguraMax)
{
    if ($mime === 'image/jpeg') {
        $imagemOriginal = imagecreatefromjpeg($origem);
    } elseif ($mime === 'image/png') {
        $imagemOriginal = imagecreatefrompng($origem);
    } elseif ($mime === 'image/webp' && function_exists('imagecreatefromwebp')) {
        $imagemOriginal = imagecreatefromwebp($origem);
    } else {
        $imagemOriginal = null;
    }

    if (!$imagemOriginal) {
        erro('ARQUIVO_INVALIDO', 'Não foi possível processar a imagem.', 422);
    }

    $larguraOriginal = imagesx($imagemOriginal);
    $alturaOriginal  = imagesy($imagemOriginal);
    $fator = min(1, $larguraMax / $larguraOriginal);
    $novaLargura = max(1, (int) round($larguraOriginal * $fator));
    $novaAltura  = max(1, (int) round($alturaOriginal * $fator));

    $nova = imagecreatetruecolor($novaLargura, $novaAltura);
    imagecopyresampled($nova, $imagemOriginal, 0, 0, 0, 0, $novaLargura, $novaAltura, $larguraOriginal, $alturaOriginal);
    imagejpeg($nova, $destino, 85);

    imagedestroy($imagemOriginal);
    imagedestroy($nova);
}
