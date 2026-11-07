<?php
require_once __DIR__ . '/../_bootstrap.php';
executar(function (PDO $pdo) {
    mensagensAguardar($pdo, paramInt('grupo_id'));
});
