# =========================================
# Visualizar_Estoque.ps1
# SQLite via ODBC (sem dependências externas)
# =========================================

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Caminho do banco SQLite (ajuste conforme necessário)
$dbPath = Join-Path $PSScriptRoot "./stock.db"

if (-not (Test-Path $dbPath)) {
    [System.Windows.Forms.MessageBox]::Show("Banco de dados não encontrado em:`n$dbPath", "Erro", "OK", "Error")
    exit
}

# --- Cria a janela ---
$form = New-Object System.Windows.Forms.Form
$form.Text = "Consulta de Estoque (SQLite)"
$form.Size = New-Object System.Drawing.Size(750,450)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(243,246,251)
$form.Font = New-Object System.Drawing.Font("Segoe UI",10)

# --- Título ---
$lblTitulo = New-Object System.Windows.Forms.Label
$lblTitulo.Text = "Tabela: Estoque"
$lblTitulo.Font = New-Object System.Drawing.Font("Segoe UI",14,[System.Drawing.FontStyle]::Bold)
$lblTitulo.ForeColor = [System.Drawing.Color]::FromArgb(0,120,215)
$lblTitulo.AutoSize = $true
$lblTitulo.Location = New-Object System.Drawing.Point(20,15)
$form.Controls.Add($lblTitulo)

# --- Botão Atualizar ---
$btnAtualizar = New-Object System.Windows.Forms.Button
$btnAtualizar.Text = "Atualizar"
$btnAtualizar.BackColor = [System.Drawing.Color]::FromArgb(0,120,215)
$btnAtualizar.ForeColor = [System.Drawing.Color]::White
$btnAtualizar.FlatStyle = "Flat"
$btnAtualizar.Location = New-Object System.Drawing.Point(630,20)
$btnAtualizar.Size = New-Object System.Drawing.Size(90,30)
$form.Controls.Add($btnAtualizar)

# --- Grade de dados ---
$grid = New-Object System.Windows.Forms.DataGridView
$grid.Location = New-Object System.Drawing.Point(20,70)
$grid.Size = New-Object System.Drawing.Size(700,320)
$grid.BackgroundColor = [System.Drawing.Color]::White
$grid.BorderStyle = 'Fixed3D'
$grid.AutoSizeColumnsMode = 'Fill'
$grid.ReadOnly = $true
$grid.AllowUserToAddRows = $false
$form.Controls.Add($grid)

# --- Função para carregar dados via ODBC ---
function Carregar-Dados {
    try {
        # Usa o driver ODBC padrão (vem com o Windows)
        $connStr = "Driver={SQLite3 ODBC Driver};Database=$dbPath;"
        $conn = New-Object System.Data.Odbc.OdbcConnection($connStr)
        $conn.Open()
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT * FROM Estoque;"
        $adapter = New-Object System.Data.Odbc.OdbcDataAdapter($cmd)
        $dt = New-Object System.Data.DataTable
        [void]$adapter.Fill($dt)
        $conn.Close()

        $grid.DataSource = $dt
    }
    catch {
        [System.Windows.Forms.MessageBox]::Show("Erro ao acessar a tabela Estoque:`n$($_.Exception.Message)", "Erro", "OK", "Error")
    }
}

# --- Ação do botão ---
$btnAtualizar.Add_Click({ Carregar-Dados })

# --- Carregar na inicialização ---
Carregar-Dados

# --- Mostrar formulário ---
[void]$form.ShowDialog()
