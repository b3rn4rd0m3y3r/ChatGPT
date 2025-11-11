<#
.SYNOPSIS
  Interface visual para iniciar/parar serviços listados num CSV.

.DESCRIPTION
  Lê um CSV com duas colunas (ServiceName, Description). Mostra uma tabela com checkbox, nome, descrição e estado atual. Permite iniciar/parar serviços selecionados e registra resultados em um TextArea.

.NOTES
  - Por segurança e funcionalidade, o script verifica se está sendo executado como Administrador e relança com elevação se necessário.
  - CSV esperado: sem cabeçalho, duas colunas separadas por vírgula e (opcionalmente) entre aspas.
#>

# --- Configuração: atualize o caminho do CSV se desejar ---
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$inputFile = Join-Path $scriptDir "Servicos.csv"  # altere aqui se estiver em outro local

# --- Elevação (Executar como Administrador) ---
function Test-IsElevated {
    $current = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $current.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsElevated)) {
    Write-Host "Reiniciando com privilégios de administrador..."
    Start-Process -FilePath "powershell" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# --- Carregar assemblies de GUI ---
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# --- Função para importar CSV robustamente ---
function Load-ServiceListFromCsv {
    param($path)
    if (-not (Test-Path $path)) {
        [System.Windows.Forms.MessageBox]::Show("Arquivo não encontrado: $path", "Erro", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
        return @()
    }

    try {
        # Tenta importar assumindo 2 colunas sem cabeçalho
        $rows = Import-Csv -Path $path -Header ServiceName,Description -Delimiter ',' -Encoding UTF8
        return $rows
    } catch {
        # fallback: leitura manual linha a linha
        $lines = Get-Content -Path $path -ErrorAction SilentlyContinue
        $out = @()
        foreach ($ln in $lines) {
            $parts = $ln -split '","'    # tenta separar campos entre aspas
            if ($parts.Count -ge 2) {
                $s = $parts[0].Trim('"')
                $d = ($parts[1..($parts.Count-1)] -join '","').Trim('"')
            } else {
                $p = $ln -split ','
                $s = $p[0].Trim('"')
                $d = if ($p.Count -gt 1) { $p[1].Trim('"') } else { "" }
            }
            $out += [PSCustomObject]@{ ServiceName = $s; Description = $d }
        }
        return $out
    }
}

# --- Função para obter estado de serviço (Running/Stopped/NotFound) ---
function Get-ServiceState($name) {
    try {
        $svc = Get-Service -Name $name -ErrorAction Stop
        return $svc.Status.ToString()
    } catch {
        return "NotFound"
    }
}

# --- Construção do formulário ---
$form = New-Object System.Windows.Forms.Form
$form.Text = "Gerenciador Visual de Serviços"
$form.Size = New-Object System.Drawing.Size(980, 720)
$form.StartPosition = "CenterScreen"
$form.Font = New-Object System.Drawing.Font("Segoe UI",10)
$form.BackColor = [System.Drawing.Color]::FromArgb(250,250,250)

# Título
$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text = "Lista de serviços (marque e clique em Iniciar / Parar)"
$lblTitle.Font = New-Object System.Drawing.Font("Segoe UI Semibold",14)
$lblTitle.AutoSize = $true
$lblTitle.Location = New-Object System.Drawing.Point(12,10)
$form.Controls.Add($lblTitle)

# DataGridView
$dgv = New-Object System.Windows.Forms.DataGridView
$dgv.Location = New-Object System.Drawing.Point(12,50)
$dgv.Size = New-Object System.Drawing.Size(950,420)
$dgv.AllowUserToAddRows = $false
$dgv.AllowUserToDeleteRows = $false
$dgv.ReadOnly = $false
$dgv.RowHeadersVisible = $false
$dgv.SelectionMode = "FullRowSelect"
$dgv.MultiSelect = $false
$dgv.AutoSizeColumnsMode = "Fill"
$dgv.ColumnHeadersHeightSizeMode = "AutoSize"
$dgv.Font = New-Object System.Drawing.Font("Segoe UI",10)

# Adicionar colunas: Checkbox, Nome, Descrição, Estado
$colChk = New-Object System.Windows.Forms.DataGridViewCheckBoxColumn
$colChk.HeaderText = ""
$colChk.Width = 30
$colChk.Name = "sel"
$dgv.Columns.Add($colChk) | Out-Null

$colName = New-Object System.Windows.Forms.DataGridViewTextBoxColumn
$colName.HeaderText = "Nome do Serviço"
$colName.Name = "svcname"
$colName.ReadOnly = $true
$colName.FillWeight = 30
$dgv.Columns.Add($colName) | Out-Null

$colDesc = New-Object System.Windows.Forms.DataGridViewTextBoxColumn
$colDesc.HeaderText = "Descrição"
$colDesc.Name = "desc"
$colDesc.ReadOnly = $true
$colDesc.FillWeight = 50
$dgv.Columns.Add($colDesc) | Out-Null

$colState = New-Object System.Windows.Forms.DataGridViewTextBoxColumn
$colState.HeaderText = "Estado"
$colState.Name = "state"
$colState.ReadOnly = $true
$colState.FillWeight = 20
$dgv.Columns.Add($colState) | Out-Null

# Estética header
$dgv.EnableHeadersVisualStyles = $false
$dgv.ColumnHeadersDefaultCellStyle.BackColor = [System.Drawing.Color]::FromArgb(40,40,40)
$dgv.ColumnHeadersDefaultCellStyle.ForeColor = [System.Drawing.Color]::White
$dgv.ColumnHeadersDefaultCellStyle.Font = New-Object System.Drawing.Font("Segoe UI Semibold",10)
$dgv.RowTemplate.Height = 30

$form.Controls.Add($dgv)

# Botões
$btnStart = New-Object System.Windows.Forms.Button
$btnStart.Text = "Iniciar selecionados"
$btnStart.Font = New-Object System.Drawing.Font("Segoe UI Semibold",11)
$btnStart.Size = New-Object System.Drawing.Size(220,48)
$btnStart.Location = New-Object System.Drawing.Point(12, 490)
$btnStart.FlatStyle = "Flat"
$btnStart.FlatAppearance.BorderSize = 0
$btnStart.BackColor = [System.Drawing.Color]::FromArgb(33,150,83) # verde
$btnStart.ForeColor = [System.Drawing.Color]::White
$form.Controls.Add($btnStart)

$btnStop = New-Object System.Windows.Forms.Button
$btnStop.Text = "Parar selecionados"
$btnStop.Font = New-Object System.Drawing.Font("Segoe UI Semibold",11)
$btnStop.Size = New-Object System.Drawing.Size(220,48)
$btnStop.Location = New-Object System.Drawing.Point(250, 490)
$btnStop.FlatStyle = "Flat"
$btnStop.FlatAppearance.BorderSize = 0
$btnStop.BackColor = [System.Drawing.Color]::FromArgb(220,53,69) # vermelho
$btnStop.ForeColor = [System.Drawing.Color]::White
$form.Controls.Add($btnStop)

$btnRefresh = New-Object System.Windows.Forms.Button
$btnRefresh.Text = "Atualizar status"
$btnRefresh.Font = New-Object System.Drawing.Font("Segoe UI",10)
$btnRefresh.Size = New-Object System.Drawing.Size(150,40)
$btnRefresh.Location = New-Object System.Drawing.Point(490, 498)
$btnRefresh.FlatStyle = "System"
$form.Controls.Add($btnRefresh)

# TextArea para log
$txtLog = New-Object System.Windows.Forms.TextBox
$txtLog.Multiline = $true
$txtLog.ReadOnly = $true
$txtLog.ScrollBars = "Vertical"
$txtLog.Location = New-Object System.Drawing.Point(12,550)
$txtLog.Size = New-Object System.Drawing.Size(950,120)
$txtLog.Font = New-Object System.Drawing.Font("Consolas",10)
$form.Controls.Add($txtLog)

# Label caminho do arquivo
$lblFile = New-Object System.Windows.Forms.Label
$lblFile.AutoSize = $true
$lblFile.Location = New-Object System.Drawing.Point(12,520)
$lblFile.Text = "Arquivo CSV: $inputFile"
$lblFile.Font = New-Object System.Drawing.Font("Segoe UI",8)
$form.Controls.Add($lblFile)

# --- Funções de apoio ---
function Append-Log {
    param($text)
    $time = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $txtLog.AppendText("[$time] $text`r`n")
    # scroll to end
    $txtLog.SelectionStart = $txtLog.Text.Length
    $txtLog.ScrollToCaret()
}

function Populate-Grid {
    $dgv.Rows.Clear()
    $rows = Load-ServiceListFromCsv -path $inputFile
    foreach ($r in $rows) {
        $svc = $r.ServiceName.Trim()
        $desc = $r.Description.Trim()
        $state = Get-ServiceState -name $svc
        $rowIndex = $dgv.Rows.Add($false, $svc, $desc, $state)
        # colorizar estado
        if ($state -eq "Running") {
            $dgv.Rows[$rowIndex].Cells["state"].Style.BackColor = [System.Drawing.Color]::FromArgb(220,255,220)
        } elseif ($state -eq "Stopped") {
            $dgv.Rows[$rowIndex].Cells["state"].Style.BackColor = [System.Drawing.Color]::FromArgb(255,230,230)
        } else {
            $dgv.Rows[$rowIndex].Cells["state"].Style.BackColor = [System.Drawing.Color]::FromArgb(240,240,240)
        }
    }
}

# --- Ações dos botões ---
$btnStart.Add_Click({
    $selected = @()
    for ($i=0; $i -lt $dgv.Rows.Count; $i++) {
        if ($dgv.Rows[$i].Cells["sel"].Value -eq $true) {
            $selected += $dgv.Rows[$i]
        }
    }
    if ($selected.Count -eq 0) {
        [System.Windows.Forms.MessageBox]::Show("Nenhum serviço selecionado.", "Info", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
        return
    }
    foreach ($row in $selected) {
        $svcName = $row.Cells["svcname"].Value
        Append-Log "Tentando iniciar serviço: $svcName"
        try {
            Start-Service -Name $svcName -ErrorAction Stop
            Append-Log "OK: Serviço '$svcName' iniciado."
        } catch {
            # tenta com sc start se Start-Service falhar
            try {
                sc.exe start $svcName | Out-Null
                Append-Log "OK (via sc): Serviço '$svcName' iniciado."
            } catch {
                Append-Log "ERRO: Não foi possível iniciar '$svcName' -> $($_.Exception.Message)"
            }
        }
        # atualizar estado no grid
        $newState = Get-ServiceState -name $svcName
        $row.Cells["state"].Value = $newState
        if ($newState -eq "Running") {
            $row.Cells["state"].Style.BackColor = [System.Drawing.Color]::FromArgb(220,255,220)
        } elseif ($newState -eq "Stopped") {
            $row.Cells["state"].Style.BackColor = [System.Drawing.Color]::FromArgb(255,230,230)
        } else {
            $row.Cells["state"].Style.BackColor = [System.Drawing.Color]::FromArgb(240,240,240)
        }
    }
})

$btnStop.Add_Click({
    $selected = @()
    for ($i=0; $i -lt $dgv.Rows.Count; $i++) {
        if ($dgv.Rows[$i].Cells["sel"].Value -eq $true) {
            $selected += $dgv.Rows[$i]
        }
    }
    if ($selected.Count -eq 0) {
        [System.Windows.Forms.MessageBox]::Show("Nenhum serviço selecionado.", "Info", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
        return
    }
    foreach ($row in $selected) {
        $svcName = $row.Cells["svcname"].Value
        Append-Log "Tentando parar serviço: $svcName"
        try {
            Stop-Service -Name $svcName -Force -ErrorAction Stop
            Append-Log "OK: Serviço '$svcName' parado."
        } catch {
            try {
                sc.exe stop $svcName | Out-Null
                Append-Log "OK (via sc): Serviço '$svcName' parado."
            } catch {
                Append-Log "ERRO: Não foi possível parar '$svcName' -> $($_.Exception.Message)"
            }
        }
        # atualizar estado no grid
        $newState = Get-ServiceState -name $svcName
        $row.Cells["state"].Value = $newState
        if ($newState -eq "Running") {
            $row.Cells["state"].Style.BackColor = [System.Drawing.Color]::FromArgb(220,255,220)
        } elseif ($newState -eq "Stopped") {
            $row.Cells["state"].Style.BackColor = [System.Drawing.Color]::FromArgb(255,230,230)
        } else {
            $row.Cells["state"].Style.BackColor = [System.Drawing.Color]::FromArgb(240,240,240)
        }
    }
})

$btnRefresh.Add_Click({
    Append-Log "Atualizando status dos serviços..."
    for ($i=0; $i -lt $dgv.Rows.Count; $i++) {
        $svcName = $dgv.Rows[$i].Cells["svcname"].Value
        $state = Get-ServiceState -name $svcName
        $dgv.Rows[$i].Cells["state"].Value = $state
        if ($state -eq "Running") {
            $dgv.Rows[$i].Cells["state"].Style.BackColor = [System.Drawing.Color]::FromArgb(220,255,220)
        } elseif ($state -eq "Stopped") {
            $dgv.Rows[$i].Cells["state"].Style.BackColor = [System.Drawing.Color]::FromArgb(255,230,230)
        } else {
            $dgv.Rows[$i].Cells["state"].Style.BackColor = [System.Drawing.Color]::FromArgb(240,240,240)
        }
    }
    Append-Log "Atualização concluída."
})

# Duplo-clique na linha abre a descrição completa (opcional)
$dgv.Add_CellDoubleClick({
    param($sender,$e)
    if ($e.RowIndex -ge 0) {
        $svc = $dgv.Rows[$e.RowIndex].Cells["svcname"].Value
        $desc = $dgv.Rows[$e.RowIndex].Cells["desc"].Value
        [System.Windows.Forms.MessageBox]::Show("Serviço: $svc`n`nDescrição:`n$desc", "Descrição", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
    }
})

# --- Inicialização ---
Populate-Grid

# Exibir formulário
[void]$form.ShowDialog()
