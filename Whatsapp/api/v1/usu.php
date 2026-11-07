<?php
require_once '../../lib/db.php';
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Força o servidor web a enviar o texto imediatamente sem guardar em cache
ob_implicit_flush(true);
while (ob_get_level() > 0) {
    ob_end_flush();
}

$json_recebido = file_get_contents('php://input');
$dados = json_decode($json_recebido, true);

// Use echo comum! O curl vai capturar isso e mostrar no seu console do Windows.
echo "Criando usuário\n";
echo $dados["email"] . "\n";
    static $pdo = null;

    if ($pdo === null) {
        $caminhoBanco = '../storage/db/app.sqlite';

        // Se o arquivo ainda não existe, cria e aplica o schema automaticamente.
        $precisaCriarSchema = !file_exists($caminhoBanco);

        $pdo = new PDO('sqlite:' . $caminhoBanco);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec('PRAGMA foreign_keys = ON;');
        $pdo->exec('PRAGMA journal_mode = WAL;');

        if ($precisaCriarSchema) {
            $schema = file_get_contents(__DIR__ . '/../schema.sql');
            $pdo->exec($schema);
        }
	}
?>
