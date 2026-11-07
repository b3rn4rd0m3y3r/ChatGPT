<?php
require_once __DIR__ . '/../../_bootstrap.php';
executar(function (PDO $pdo) {
    responderSolicitacao($pdo, paramInt('grupo_id'), paramInt('usuario_id'));
});
