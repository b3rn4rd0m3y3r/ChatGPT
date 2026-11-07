<?php
require_once __DIR__ . '/../../_bootstrap.php';
executar(function (PDO $pdo) {
    removerMembro($pdo, paramInt('grupo_id'), paramInt('usuario_id'));
});
