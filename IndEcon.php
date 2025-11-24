<?php
header('Content-Type: text/html; charset=iso-8859-1');
// Lista de índices do SGS
$indices = [
    "IPCA (mensal)"              => 433,
    "INPC (mensal)"              => 188,
    "IGP-M (mensal)"             => 189,
    "IGP-DI (mensal)"            => 190,
    "Selic (efetiva mensal)"     => 4189,
    "Dólar PTAX Venda"           => 21619,
    "IBC-Br dessazonalizado"     => 24364,
];

// Variáveis de retorno
$dados = [];
$erro = "";

if (isset($_GET['codigo'])) {

    $codigo = intval($_GET['codigo']);
    $dataInicial = $_GET["dataInicial"] ?? "";
    $dataFinal   = $_GET["dataFinal"] ?? "";

    // Monta a URL da API
    $url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.$codigo/dados?formato=json";

    if ($dataInicial !== "")
        $url .= "&dataInicial=" . urlencode($dataInicial);

    if ($dataFinal !== "")
        $url .= "&dataFinal=" . urlencode($dataFinal);

    // Tenta acessar
    $json = @file_get_contents($url);

    if ($json === false) {
        $erro = "Erro ao acessar a API do Banco Central.";
    } else {
        $dados = json_decode($json, true);
        if (!is_array($dados) || count($dados) == 0) {
            $erro = "Nenhum dado retornado no intervalo informado.";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="iso-8859-1">
<title>Índices Econômicos - API BCB</title>
<style>
    body {
        font-family: Arial, sans-serif;
        background: #f5f5f5;
        padding: 20px;
    }
    .card {
        background: white;
        padding: 20px;
        margin: auto;
        width: 520px;
        border-radius: 12px;
        box-shadow: 0px 0px 15px rgba(0,0,0,0.15);
    }
    select, input, button {
        width: 100%;
        padding: 12px;
        margin-top: 10px;
        border-radius: 6px;
        border: 1px solid #ccc;
        font-size: 16px;
    }
    button {
        background: #0077cc;
        color: white;
        cursor: pointer;
    }
    table {
        margin-top: 20px;
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
    }
    table th, table td {
        padding: 8px;
        border-bottom: 1px solid #ddd;
        text-align: center;
    }
    th {
        background: #0077cc;
        color: white;
    }
</style>
</head>
<body>

<div class="card">
    <h2>Consultar Índices Econômicos</h2>

    <form method="GET">
        
        <select name="codigo">
            <option value="">Selecione um índice...</option>
            <?php
            foreach ($indices as $nome => $cod) {
                $sel = (isset($_GET['codigo']) && $_GET['codigo'] == $cod) ? "selected" : "";
                echo "<option value='$cod' $sel>$nome</option>";
            }
            ?>
        </select>

        <label>Data Inicial (DD/MM/AAAA)</label>
        <input type="text" name="dataInicial" placeholder="01/01/2000"
               value="<?= $_GET['dataInicial'] ?? '' ?>">

        <label>Data Final (DD/MM/AAAA)</label>
        <input type="text" name="dataFinal" placeholder="31/12/2025"
               value="<?= $_GET['dataFinal'] ?? '' ?>">

        <button type="submit">Buscar</button>
    </form>

    <?php if ($erro): ?>
        <p style="color:red; margin-top:15px;"><?= $erro ?></p>
    <?php endif; ?>

    <?php if (!$erro && isset($_GET['codigo'])): ?>
        <h3>Resultados</h3>

        <table>
            <tr>
                <th>Data</th>
                <th>Valor</th>
            </tr>
            <?php foreach ($dados as $item): ?>
            <tr>
                <td><?= $item['data'] ?></td>
                <td><?= $item['valor'] ?></td>
            </tr>
            <?php endforeach; ?>
        </table>
    <?php endif; ?>
</div>

</body>
</html>
