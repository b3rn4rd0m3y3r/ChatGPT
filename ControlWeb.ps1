# ==============================
# GerenciarServicosWeb.ps1
# ==============================

# --- 1. Verifica se está em modo Administrador ---
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Reiniciando como Administrador..."
    Start-Process powershell "-ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# --- 2. Criação do Formulário ---
$form = New-Object System.Windows.Forms.Form
$form.Text = "Gerenciar Serviços Web (IIS)"
$form.Size = New-Object System.Drawing.Size(470,340)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(243,246,251)
$form.Font = New-Object System.Drawing.Font("Segoe UI",10)

# --- 3. Título ---
$label = New-Object System.Windows.Forms.Label
$label.Text = "Selecione os serviços do IIS para gerenciar:"
$label.AutoSize = $true
$label.Location = New-Object System.Drawing.Point(20,20)
$label.ForeColor = [System.Drawing.Color]::FromArgb(0,120,215)
$form.Controls.Add($label)

# --- 4. Checkboxes ---
$chkW3SVC = New-Object System.Windows.Forms.CheckBox
$chkW3SVC.Text = "Serviço de Gerenciamento da World Wide Web (W3SVC)"
$chkW3SVC.Location = New-Object System.Drawing.Point(20,55)
$chkW3SVC.AutoSize = $true
$form.Controls.Add($chkW3SVC)

$chkWAS = New-Object System.Windows.Forms.CheckBox
$chkWAS.Text = "Serviço de Publicação da Web (WAS)"
$chkWAS.Location = New-Object System.Drawing.Point(20,80)
$chkWAS.AutoSize = $true
$form.Controls.Add($chkWAS)

# --- 5. Caixa de status ---
$txtStatus = New-Object System.Windows.Forms.TextBox
$txtStatus.Multiline = $true
$txtStatus.ScrollBars = "Vertical"
$txtStatus.Location = New-Object System.Drawing.Point(20,160)
$txtStatus.Size = New-Object System.Drawing.Size(420,120)
$form.Controls.Add($txtStatus)

# --- 6. Funções ---
function Iniciar-Servicos {
    $txtStatus.Clear()
    if ($chkW3SVC.Checked) {
        try {
            Set-Service -Name W3SVC -StartupType Manual -ErrorAction Stop
            Start-Service -Name W3SVC -ErrorAction Stop
            $txtStatus.AppendText("W3SVC definido como Manual e iniciado.`r`n")
        } catch {
            $txtStatus.AppendText("Erro ao iniciar W3SVC: $($_.Exception.Message)`r`n")
        }
    }
    if ($chkWAS.Checked) {
        try {
            Set-Service -Name WAS -StartupType Manual -ErrorAction Stop
            Start-Service -Name WAS -ErrorAction Stop
            $txtStatus.AppendText("WAS definido como Manual e iniciado.`r`n")
        } catch {
            $txtStatus.AppendText("Erro ao iniciar WAS: $($_.Exception.Message)`r`n")
        }
    }
    if (-not $chkW3SVC.Checked -and -not $chkWAS.Checked) {
        $txtStatus.AppendText("Nenhum serviço selecionado.`r`n")
    }
}

function Parar-Servicos {
    $txtStatus.Clear()
    if ($chkW3SVC.Checked) {
        try {
            Stop-Service -Name W3SVC -Force -ErrorAction Stop
            Set-Service -Name W3SVC -StartupType Disabled -ErrorAction Stop
            $txtStatus.AppendText("W3SVC parado e desativado.`r`n")
        } catch {
            $txtStatus.AppendText("Erro ao parar W3SVC: $($_.Exception.Message)`r`n")
        }
    }
    if ($chkWAS.Checked) {
        try {
            Stop-Service -Name WAS -Force -ErrorAction Stop
            Set-Service -Name WAS -StartupType Disabled -ErrorAction Stop
            $txtStatus.AppendText("WAS parado e desativado.`r`n")
        } catch {
            $txtStatus.AppendText("Erro ao parar WAS: $($_.Exception.Message)`r`n")
        }
    }
    if (-not $chkW3SVC.Checked -and -not $chkWAS.Checked) {
        $txtStatus.AppendText("Nenhum serviço selecionado.`r`n")
    }
}

function Abrir-IIS {
    try {
        Start-Process "inetmgr.exe" -ErrorAction Stop
        $txtStatus.AppendText("Abrindo Gerenciador do IIS...`r`n")
    } catch {
        $txtStatus.AppendText("Erro: O Gerenciador do IIS (inetmgr.exe) não foi encontrado.`r`n")
    }
}

# --- 7. Botões ---
$btnIniciar = New-Object System.Windows.Forms.Button
$btnIniciar.Text = "Ativar / Iniciar"
$btnIniciar.BackColor = [System.Drawing.Color]::FromArgb(0,120,215)
$btnIniciar.ForeColor = [System.Drawing.Color]::White
$btnIniciar.Location = New-Object System.Drawing.Point(20,115)
$btnIniciar.Size = New-Object System.Drawing.Size(130,30)
$btnIniciar.Add_Click({ Iniciar-Servicos })
$form.Controls.Add($btnIniciar)

$btnDesativar = New-Object System.Windows.Forms.Button
$btnDesativar.Text = "Desativar / Parar"
$btnDesativar.BackColor = [System.Drawing.Color]::FromArgb(232,17,35)
$btnDesativar.ForeColor = [System.Drawing.Color]::White
$btnDesativar.Location = New-Object System.Drawing.Point(165,115)
$btnDesativar.Size = New-Object System.Drawing.Size(130,30)
$btnDesativar.Add_Click({ Parar-Servicos })
$form.Controls.Add($btnDesativar)

$btnAbrirIIS = New-Object System.Windows.Forms.Button
$btnAbrirIIS.Text = "Abrir IIS Manager"
$btnAbrirIIS.BackColor = [System.Drawing.Color]::FromArgb(16,124,16)
$btnAbrirIIS.ForeColor = [System.Drawing.Color]::White
$btnAbrirIIS.Location = New-Object System.Drawing.Point(310,115)
$btnAbrirIIS.Size = New-Object System.Drawing.Size(130,30)
$btnAbrirIIS.Add_Click({ Abrir-IIS })
$form.Controls.Add($btnAbrirIIS)

# --- 8. Exibir o Formulário ---
[void]$form.ShowDialog()
