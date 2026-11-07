var params = new URLSearchParams(window.location.search);
var grupoId = params.get("grupo_id");
var usuarioIdLogado = Number(localStorage.getItem("usuario_id"));
var ultimoIdVisto = 0;
var controladorAtual = null;
var loopAtivo = true;

if (!localStorage.getItem("token") || !grupoId) { window.location.href = "grupos.html"; }

function exibirMensagem(msg) {
    var painel = document.getElementById("painel-mensagens");
    var div = document.createElement("div");
    var ehMinha = Number(msg.autor_id) === usuarioIdLogado;
    div.className = "msg" + (ehMinha ? " minha" : "");
    div.innerHTML = montarHtmlMensagem(msg, ehMinha);
    painel.appendChild(div);
    painel.scrollTop = painel.scrollHeight;
    if (Number(msg.id) > ultimoIdVisto) { ultimoIdVisto = Number(msg.id); }
}

function marcarLidas() {
    if (ultimoIdVisto > 0) {
        chamarApi("mensagens/lidas_lote.php?grupo_id=" + grupoId, {
            method: "POST", body: JSON.stringify({ ate_mensagem_id: ultimoIdVisto })
        });
    }
}

function carregarConversa() {
    chamarApi("grupos/detalhe.php?grupo_id=" + grupoId).then(function (detalhe) {
        if (!detalhe.sucesso) { alert(detalhe.erro.mensagem); window.location.href = "grupos.html"; return; }
        document.getElementById("nome-grupo").textContent = detalhe.dados.nome;
        return chamarApi("mensagens/listar.php?grupo_id=" + grupoId + "&limite=50").then(function (resp) {
            if (resp.sucesso) {
                resp.dados.mensagens.slice().reverse().forEach(exibirMensagem);
                marcarLidas();
            }
            loopAguardarMensagens();
        });
    });
}

function loopAguardarMensagens() {
    if (!loopAtivo) { return; }
    controladorAtual = (typeof AbortController !== "undefined") ? new AbortController() : null;
    var opcoes = controladorAtual ? { signal: controladorAtual.signal } : {};
    chamarApi("mensagens/aguardar.php?grupo_id=" + grupoId + "&desde=" + ultimoIdVisto + "&timeout=25", opcoes)
        .then(function (resp) {
            if (resp.sucesso && resp.dados.mensagens.length > 0) {
                resp.dados.mensagens.forEach(exibirMensagem);
                marcarLidas();
                loopAguardarMensagens();
            } else if (resp.sucesso) {
                loopAguardarMensagens();
            } else {
                // Erro (rede/servidor): espera 5s antes de tentar de novo, sem martelar o servidor.
                setTimeout(loopAguardarMensagens, 5000);
            }
        }, function () { /* AbortError ao sair da tela: não reagenda */ });
}

window.addEventListener("beforeunload", function () {
    loopAtivo = false;
    if (controladorAtual) { controladorAtual.abort(); }
});

document.getElementById("form-mensagem").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var input = document.getElementById("input-texto");
    var texto = input.value.trim();
    if (!texto) { return; }
    chamarApi("mensagens/enviar.php?grupo_id=" + grupoId, {
        method: "POST", body: JSON.stringify({ texto: texto })
    }).then(function (resp) {
        if (resp.sucesso) { input.value = ""; exibirMensagem(resp.dados); }
        else { alert(resp.erro.mensagem); }
    });
});

document.getElementById("input-imagem").addEventListener("change", function (ev) {
    var arquivo = ev.target.files[0];
    if (!arquivo) { return; }
    var formData = new FormData();
    formData.append("arquivo", arquivo);
    chamarApi("mensagens/imagem.php?grupo_id=" + grupoId, { method: "POST", body: formData })
        .then(function (resp) {
            if (resp.sucesso) { exibirMensagem(resp.dados); } else { alert(resp.erro.mensagem); }
            ev.target.value = "";
        });
});

carregarConversa();
