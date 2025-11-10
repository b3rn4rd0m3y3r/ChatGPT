Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore

# --- AUTO-ELEVACAO PARA ADMINISTRADOR ---
If (-Not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Reexecutando como Administrador..."
    $psi = New-Object System.Diagnostics.ProcessStartInfo powershell
    $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`""
    $psi.Verb = "runas"
    try {
        [System.Diagnostics.Process]::Start($psi) | Out-Null
    } catch {
        Write-Host "Operação cancelada pelo usuário."
    }
    exit
}
# --- FIM AUTO-ELEVACAO ---

# Lista dos serviços alvo
$servicesList_1 = @("AarSvc","Ahcache","BTAGservice","BthA2dp","BthAvctpSvc","BthEnum","BthHFEnum",
"BthLEEnum","BthMini","BthMODEM","BthPan","BTHPORT","bthserv","BTHUSB","bttflt",
"cdfs","CDPSvc","CDPUserSvc","CldFlt","CLFS","CmBatt","DevicesFlowUserSvc","DiagTrack","DoSvc","DusmSvc",
"edgeupdate","edgeupdatem","EntAppSvc","Fax","fdc","FrameServer","googledrive","HvHost","hvservice",
"icssvc","InstallService","lmhosts","MapsBroker","mpsdrv","mpssvc","MsLldp","NativeWifiP","NcbService",
"NdisTapi","NdisWan","Ndu","NetBT","NetLogon","NetTcpPortSharing","OneSyncSvc",
"PhoneSvc","PimIndexMaintenanceSvc","PrintNotify","QWAVE","RemoteRegistry",
"RetailDemo","RmSvc","SEMgrSvc","Shpamsvc","SmsRouter","Sstpsvc","SSDPSRV","SysMain"
)

# Lista dos serviços alvo
$servicesList = @("AarSvc","Agente Conversacional - CORTANA",
"Ahcache","Cache de Compatibilidade de Aplicações",
"BTAGservice","Bluetooth",
"BthA2dp","Bluetooth",
"BthAvctpSvc","Bluetooth",
"BthEnum","Bluetooth",
"BthHFEnum","Bluetooth",
"BthLEEnum","Bluetooth",
"BthMini","Bluetooth",
"BthMODEM","Bluetooth",
"BthPan","Bluetooth",
"BTHPORT","Bluetooth",
"bthserv","Bluetooth",
"BTHUSB","Bluetooth",
"bttflt","Manipula os filtros de discos virtuais para o Hyper-V",
"cdfs","Driver de sistema para o CDROM",
"CDPSvc","Conecta e gerencia dispositivos como periféricos Bluetooth, impressoras, scanners, e fones",
"CDPUserSvc","Sincroniza dados de usuários entre dispositivos, como Bluetooth",
"CldFlt","Permite que os serviços de armazenamento em nuvem sincronizem com seus dispositivos",
"CLFS","Fornece log transacional que permite aos BDs, plataformas de mensagem e Registro guardar alterações nas falhas de sistema",
"CmBatt","DevicesFlowUserSvc","DiagTrack","DoSvc","DusmSvc",
"edgeupdate","edgeupdatem","EntAppSvc","Fax","fdc","FrameServer","googledrive","HvHost","hvservice",
"icssvc","InstallService","lmhosts","MapsBroker","mpsdrv","mpssvc","MsLldp","NativeWifiP","NcbService",
"NdisTapi","NdisWan","Ndu","NetBT","NetLogon","NetTcpPortSharing","OneSyncSvc",
"PhoneSvc","PimIndexMaintenanceSvc","PrintNotify","QWAVE","RemoteRegistry",
"RetailDemo","RmSvc","SEMgrSvc","Shpamsvc","SmsRouter","Sstpsvc","SSDPSRV","SysMain"
)

# Criar janela
$window = New-Object System.Windows.Window
$window.Title = "Gerenciar Serviços"
$window.Width = 680
$window.Height = 600
$window.WindowStartupLocation = "CenterScreen"
$window.Background = "#1e1e1e"

# Layout principal
$grid = New-Object System.Windows.Controls.Grid
$grid.Margin = "10"
$window.Content = $grid

# Linha 1 do layout - Tabela

# Star-sized row (shares remaining space proportionally)
$Rowd1 = New-Object System.Windows.Controls.RowDefinition
$Rowd1.Height = "350"


# Linhas layout
$line1 = $Grid.RowDefinitions.Add($Rowd1) # Tabela
# $line1 = $grid.RowDefinitions.Add((New-Object System.Windows.Controls.RowDefinition))
$line2 = $grid.RowDefinitions.Add((New-Object System.Windows.Controls.RowDefinition)) # Botões
$line3 = $grid.RowDefinitions.Add((New-Object System.Windows.Controls.RowDefinition)) # Log


# DataGrid
$dataGrid = New-Object System.Windows.Controls.DataGrid
$dataGrid.AutoGenerateColumns = $false
$dataGrid.CanUserAddRows = $false
$dataGrid.IsReadOnly = $false
$dataGrid.Foreground = "White"
$dataGrid.Background = "#2d2d30"
$dataGrid.GridLinesVisibility = "None"
$dataGrid.RowBackground = "#333333"
$dataGrid.AlternatingRowBackground = "#3a3a3a"
$dataGrid.HeadersVisibility = "Column"
$dataGrid.FontSize = 14

# Coluna Checkbox
$colCheck = New-Object System.Windows.Controls.DataGridCheckBoxColumn
$colCheck.Header = "Selecionar"
$colCheck.Binding = New-Object System.Windows.Data.Binding("Selected")
$dataGrid.Columns.Add($colCheck)

# Coluna Serviço
$colName = New-Object System.Windows.Controls.DataGridTextColumn
$colName.Header = "Serviço"
$colName.Binding = New-Object System.Windows.Data.Binding("Name")
$dataGrid.Columns.Add($colName)

# Coluna Status
$colStatus = New-Object System.Windows.Controls.DataGridTextColumn
$colStatus.Header = "Status"
$colStatus.Binding = New-Object System.Windows.Data.Binding("Status")
$dataGrid.Columns.Add($colStatus)

# Obter informação dos serviços
$data = foreach ($svc in $servicesList) {
    [PSCustomObject]@{
        Selected = $false
        Name = $svc
        Status = (Get-Service -Name $svc -ErrorAction SilentlyContinue).Status
    }
}
$dataGrid.ItemsSource = $data

[System.Windows.Controls.Grid]::SetRow($dataGrid, 0)
$grid.Children.Add($dataGrid)

# Painel de botões
$stack = New-Object System.Windows.Controls.StackPanel
$stack.Orientation = "Horizontal"
$stack.HorizontalAlignment = "Center"
$stack.Margin = "0,10,0,10"

# Botão Ativar
$btnStart = New-Object System.Windows.Controls.Button
$btnStart.Content = "Ativar Selecionados"
$btnStart.Width = 180
$btnStart.Height = 50
$btnStart.Padding = "10"
$btnStart.Margin = "0,0,10,0"
$btnStart.Background = "lightgreen"
$btnStart.Foreground = "blue"
$btnStart.FontWeight = "Bold"

# Botão Desativar
$btnStop = New-Object System.Windows.Controls.Button
$btnStop.Content = "Desativar Selecionados"
$btnStop.Width = 180
$btnStop.Height = 50
$btnStop.Padding = "10"
$btnStop.Background = "red"
$btnStop.Foreground = "yellow"
$btnStop.FontWeight = "Bold"

$stack.Children.Add($btnStart)
$stack.Children.Add($btnStop)

[System.Windows.Controls.Grid]::SetRow($stack, 1)
$grid.Children.Add($stack)

# Caixa de Log
$logBox = New-Object System.Windows.Controls.TextBox
$logBox.IsReadOnly = $true
$logBox.TextWrapping = "Wrap"
$logBox.VerticalScrollBarVisibility = "Auto"
$logBox.Background = "#111111"
$logBox.Foreground = "White"
$logBox.FontSize = 13
$logBox.Padding = "8"
$logBox.Text = "Log de operações...\n"

[System.Windows.Controls.Grid]::SetRow($logBox, 2)
$grid.Children.Add($logBox)

# Funções Botões
$btnStart.Add_Click({
    foreach ($row in $dataGrid.Items) {
        if ($row.Selected) {
            try {
                Start-Service -Name $row.Name -ErrorAction Stop
                $row.Status = "Running"
                $logBox.AppendText("? Ativado: $($row.Name)`n")
            } catch {
                $logBox.AppendText("? Falha ao ativar: $($row.Name)`n")
            }
        }
    }
    $dataGrid.Items.Refresh()
    $logBox.ScrollToEnd()
})

$btnStop.Add_Click({
    foreach ($row in $dataGrid.Items) {
        if ($row.Selected) {
            try {
                Stop-Service -Name $row.Name -ErrorAction Stop
                $row.Status = "Stopped"
                $logBox.AppendText("? Desativado: $($row.Name)`n")
            } catch {
                $logBox.AppendText("? Falha ao desativar: $($row.Name)`n")
            }
        }
    }
    $dataGrid.Items.Refresh()
    $logBox.ScrollToEnd()
})

# Mostrar janela
$window.ShowDialog() | Out-Null

