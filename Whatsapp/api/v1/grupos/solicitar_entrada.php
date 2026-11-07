<?php
require_once __DIR__ . '/../_bootstrap.php';
executar(function (PDO $pdo) {
    solicitarEntrada($pdo, paramInt('grupo_id'));
});
