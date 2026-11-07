<?php
require_once __DIR__ . '/../../_bootstrap.php';
executar(function (PDO $pdo) {
    alterarPapel($pdo, paramInt('grupo_id'), paramInt('usuario_id'));
});
