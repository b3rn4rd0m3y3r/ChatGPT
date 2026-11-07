<?php
require_once __DIR__ . '/../_bootstrap.php';
executar(function (PDO $pdo) {
    editarGrupo($pdo, paramInt('grupo_id'));
});
