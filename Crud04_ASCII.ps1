# ============================================================
# CRUD ASCII - Registros com JSON unico
# ============================================================

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$global:Arquivo = ".\dados.json"

function Init-File {
    if (-not (Test-Path $global:Arquivo)) {
        "[]" | Set-Content -LiteralPath $global:Arquivo -Encoding UTF8
    }
}
Init-File

function Load-Data {
    try {
        $txt = Get-Content -LiteralPath $global:Arquivo -Raw -Encoding UTF8
        if ($txt.Trim() -eq "") { return @() }
        return $txt | ConvertFrom-Json
    }
    catch { return @() }
}

function Save-Data($lista) {
    ($lista | ConvertTo-Json -Depth 5) | Set-Content -LiteralPath $global:Arquivo -Encoding UTF8
}

function Validar-Data($d) {
    try {
        [datetime]::ParseExact($d, "dd/MM/yyyy", $null)
        return $true
    }
    catch { return $false }
}

function Add-Record($Data, $Hora, $Tipo, $Obs) {

    $dados = Load-Data

    if ($dados.Count -eq 0) { $novoId = 1 }
    else { $novoId = ($dados.Id | Measure-Object -Maximum).Maximum + 1 }

    $novo = [PSCustomObject]@{
        Id = $novoId
        Data = $Data
        Hora = $Hora
        Tipo = $Tipo
        Observacao = $Obs
    }

    $dados += $novo
    Save-Data $dados
}

function Listar-Data($dt) {
    $dados = Load-Data
    if ($dt -eq "") { return $dados }
    return $dados | Where-Object { $_.Data -eq $dt } | Sort-Object Hora
}

function Totalizar-Dia($dt) {
    $lista = Listar-Data $dt
    if ($lista.Count -eq 0) { return "Nenhum registro encontrado." }

    $totalMin = 0
    $ultimaEntrada = $null

    foreach ($r in $lista) {
        if ($r.Tipo -eq "Entrada") {
            $ultimaEntrada = $r.Hora
        }
        elseif ($r.Tipo -eq "Saida") {
            if ($ultimaEntrada -ne $null) {
                $t1 = [datetime]::ParseExact($ultimaEntrada, "HH:mm", $null)
                $t2 = [datetime]::ParseExact($r.Hora, "HH:mm", $null)
                $totalMin += ($t2 - $t1).TotalMinutes
                $ultimaEntrada = $null
            }
        }
    }

    $h = [int]($totalMin / 60)
    $m = [int]($totalMin % 60)

    return "Total do dia $dt = $h h $m m"
}

# ============================================================
# INTERFACE ASCII SAFE
# ============================================================

$form = New-Object System.Windows.Forms.Form
$form.Text = "CRUD ASCII - Registros"
$form.Size = New-Object System.Drawing.Size(600,470)
$form.StartPosition = "CenterScreen"
$form.BackColor = "White"

function New-Label($txt,$x,$y){
    $l = New-Object System.Windows.Forms.Label
    $l.Text = $txt
    $l.Location = New-Object System.Drawing.Point($x,$y)
    $l.AutoSize = $true
    return $l
}

# ADICIONA LABELS com chamadas parentetizadas para evitar parsing ambíguo
$form.Controls.Add( (New-Label "Data (dd/mm/aaaa)" 20 20) )
$form.Controls.Add( (New-Label "Hora (HH:mm)"       20 60) )
$form.Controls.Add( (New-Label "Tipo"               20 100) )
$form.Controls.Add( (New-Label "Observacao"         20 140) )

$txtData = New-Object System.Windows.Forms.TextBox
$txtData.Location = New-Object System.Drawing.Point(200,20)
$txtData.Width = 120

$txtHora = New-Object System.Windows.Forms.TextBox
$txtHora.Location = New-Object System.Drawing.Point(200,60)
$txtHora.Width = 120

$cboTipo = New-Object System.Windows.Forms.ComboBox
$cboTipo.Location = New-Object System.Drawing.Point(200,100)
$cboTipo.Width = 120
$cboTipo.DropDownStyle = "DropDownList"
$cboTipo.Items.Add("Entrada") | Out-Null
$cboTipo.Items.Add("Saida")   | Out-Null
$cboTipo.SelectedIndex = 0

$txtObs = New-Object System.Windows.Forms.TextBox
$txtObs.Location = New-Object System.Drawing.Point(200,140)
$txtObs.Width = 250
$txtObs.Height = 60
$txtObs.Multiline = $true

$form.Controls.AddRange(@($txtData,$txtHora,$cboTipo,$txtObs))

$lst = New-Object System.Windows.Forms.ListBox
$lst.Location = New-Object System.Drawing.Point(20,220)
$lst.Size = New-Object System.Drawing.Size(530,180)
$form.Controls.Add($lst)

function New-Btn($txt,$x,$y){
    $b = New-Object System.Windows.Forms.Button
    $b.Text = $txt
    $b.Location = New-Object System.Drawing.Point($x,$y)
    $b.Width = 130
    return $b
}

$btnSalvar = New-Btn "Salvar" 400 20
$btnListar = New-Btn "Listar dia" 400 60
$btnTotal  = New-Btn "Totalizar dia" 400 100

$btnSalvar.Add_Click({
    if (-not (Validar-Data $txtData.Text)) {
        [System.Windows.Forms.MessageBox]::Show("Data invalida")
        return
    }
    Add-Record $txtData.Text $txtHora.Text $cboTipo.Text $txtObs.Text
    [System.Windows.Forms.MessageBox]::Show("Registro salvo!")
})

$btnListar.Add_Click({
    $lst.Items.Clear()
    $lista = Listar-Data $txtData.Text
    foreach ($r in $lista) {
        $lst.Items.Add("[$($r.Id)] $($r.Data) $($r.Hora) $($r.Tipo) $($r.Observacao)")
    }
})

$btnTotal.Add_Click({
    $msg = Totalizar-Dia $txtData.Text
    [System.Windows.Forms.MessageBox]::Show($msg)
})

$form.Controls.AddRange(@($btnSalvar,$btnListar,$btnTotal))

$form.ShowDialog()
