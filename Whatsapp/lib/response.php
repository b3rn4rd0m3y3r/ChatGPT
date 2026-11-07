<?php
// Envelope de resposta padrão da API + mecanismo de erro único.
// Compatível com PHP 5.5: sem tipo de retorno, sem tipos escalares, sem "??".

class ApiException extends Exception
{
    public $codigo;
    public $statusCode;

    public function __construct($codigo, $mensagem, $statusCode)
    {
        parent::__construct($mensagem);
        $this->codigo = $codigo;
        $this->statusCode = $statusCode;
    }
}

function erro($codigo, $mensagem, $statusCode)
{
    throw new ApiException($codigo, $mensagem, $statusCode);
}

function responderJson($sucesso, $dados, $erro, $statusCode = 200)
{
    // Descarta qualquer saída acidental (warning/notice) antes do JSON real.
    if (ob_get_level() > 0) {
        ob_clean();
    }

    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(
        array('sucesso' => $sucesso, 'dados' => $dados, 'erro' => $erro),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

function lerJson()
{
    $bruto = file_get_contents('php://input');
    $dados = json_decode($bruto, true);
    return is_array($dados) ? $dados : array();
}

function agoraIso()
{
    return gmdate('Y-m-d\TH:i:s\Z');
}

/**
 * Gera bytes aleatórios seguros sem random_bytes() (PHP 7.0+).
 * Tenta openssl, depois mcrypt; só em último caso usa mt_rand.
 */
function gerarBytesAleatorios($tamanho)
{
    if (function_exists('openssl_random_pseudo_bytes')) {
        $forte = false;
        $bytes = openssl_random_pseudo_bytes($tamanho, $forte);
        if ($bytes !== false && $forte) {
            return $bytes;
        }
    }
    if (function_exists('mcrypt_create_iv')) {
        $bytes = mcrypt_create_iv($tamanho, MCRYPT_DEV_URANDOM);
        if ($bytes !== false) {
            return $bytes;
        }
    }
    $bytes = '';
    for ($i = 0; $i < $tamanho; $i++) {
        $bytes .= chr(mt_rand(0, 255));
    }
    return $bytes;
}
