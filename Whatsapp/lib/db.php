<?php
// Conexão única (por requisição) com o banco SQLite.
// Compatível com PHP 5.5: sem declaração de tipo de retorno (só a partir do 7.0).

function obterConexao()
{
    static $pdo = null;

    if ($pdo === null) {
        $caminhoBanco = __DIR__ . '/../storage/db/app.sqlite';

        $pdo = new PDO('sqlite:' . $caminhoBanco);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec('PRAGMA foreign_keys = ON;');
        $pdo->exec('PRAGMA journal_mode = WAL;');

        // Versão do schema: sobe sozinha em bancos já existentes. O schema.sql
        // só usa "CREATE ... IF NOT EXISTS", então aplicá-lo de novo é seguro e
        // não apaga nenhum dado. Quando o schema ganhar tabelas novas, basta
        // aumentar este número.
        $versaoDoSchema = 2;
        $versaoAtual = (int) $pdo->query('PRAGMA user_version')->fetchColumn();
        if ($versaoAtual < $versaoDoSchema) {
            $pdo->exec(file_get_contents(__DIR__ . '/../schema.sql'));
            $pdo->exec('PRAGMA user_version = ' . $versaoDoSchema);
        }
    }

    return $pdo;
}
