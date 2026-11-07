<?php
require_once __DIR__ . '/../_bootstrap.php';
executar(function (PDO $pdo) {
    apagarGrupo($pdo, paramInt('grupo_id'));
});
