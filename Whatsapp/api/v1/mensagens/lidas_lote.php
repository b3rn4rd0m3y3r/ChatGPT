<?php
require_once __DIR__ . '/../_bootstrap.php';
executar(function (PDO $pdo) {
    marcarLidasLote($pdo, paramInt('grupo_id'));
});
