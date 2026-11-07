<?php
require_once __DIR__ . '/../_bootstrap.php';
executar(function (PDO $pdo) {
    detalheGrupo($pdo, paramInt('grupo_id'));
});
