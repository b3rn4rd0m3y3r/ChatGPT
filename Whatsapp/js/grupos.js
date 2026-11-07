function sair() {
    chamarApi("auth/logout.php", { method: "POST" }).then(function () {
        localStorage.clear();
        window.location.href = "index.html";
    });
}

function mostrarErroGrupos(mensagem) {
    var el = document.getElementById("erro-grupos");
    if (mensagem) { el.textContent = mensagem; el.style.display = "block"; }
    else { el.style.display = "none"; }
}

function criarBotao(texto, classe, aoClicar, desabilitado) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = texto;
    if (classe) { b.className = classe; }
    if (desabilitado) { b.disabled = true; } else { b.addEventListener("click", aoClicar); }
    return b;
}

function desenharMeusGrupos(grupos, pendentesPorGrupo) {
    var lista = document.getElementById("lista-grupos");
    lista.innerHTML = "";
    var meus = grupos.filter(function (g) { return g.situacao === "membro"; });
    if (meus.length === 0) {
        lista.innerHTML = '<li class="sem-clique"><span class="vazio">Você ainda não participa de nenhum grupo. Peça para entrar em um dos grupos abaixo ou crie o seu.</span></li>';
        return;
    }
    meus.forEach(function (g) {
        var li = document.createElement("li");
        var qtd = pendentesPorGrupo[g.id] || 0;
        li.innerHTML = "<span>" + escaparHtml(g.nome) +
            (g.papel === "admin" ? '<span class="badge-admin">admin</span>' : "") +
            (g.papel === "admin" && qtd > 0 ? '<span class="badge-pend">' + qtd + " pedido(s)</span>" : "") +
            "</span><span>" + g.total_membros + " membro(s)</span>";
        li.addEventListener("click", function () {
            window.location.href = "conversa.html?grupo_id=" + g.id;
        });
        lista.appendChild(li);
    });
}

function responderPedido(p, acao) {
    chamarApi("grupos/solicitacoes/responder.php?grupo_id=" + p.grupo_id + "&usuario_id=" + p.usuario_id, {
        method: "POST", body: JSON.stringify({ acao: acao })
    }).then(function (resp) {
        if (!resp.sucesso) { mostrarErroGrupos(resp.erro.mensagem); }
        carregarTudo();
    });
}

function desenharPendentes(pendentes) {
    var painel = document.getElementById("painel-admin");
    var lista = document.getElementById("lista-pendentes");
    lista.innerHTML = "";
    if (pendentes.length === 0) { painel.style.display = "none"; return; }
    painel.style.display = "block";
    pendentes.forEach(function (p) {
        var li = document.createElement("li");
        li.className = "sem-clique";
        var texto = document.createElement("span");
        texto.innerHTML = "<strong>" + escaparHtml(p.usuario_nome) + "</strong> (" + escaparHtml(p.usuario_email) +
            ") quer entrar em <strong>" + escaparHtml(p.grupo_nome) + "</strong>";
        var acoes = document.createElement("span");
        acoes.className = "acoes";
        acoes.appendChild(criarBotao("Aprovar", "", function () { responderPedido(p, "aprovar"); }));
        acoes.appendChild(criarBotao("Recusar", "btn-recusar", function () { responderPedido(p, "recusar"); }));
        li.appendChild(texto);
        li.appendChild(acoes);
        lista.appendChild(li);
    });
}

function pedirEntrada(g) {
    chamarApi("grupos/solicitar_entrada.php?grupo_id=" + g.id, { method: "POST" }).then(function (resp) {
        if (!resp.sucesso) { mostrarErroGrupos(resp.erro.mensagem); }
        carregarTudo();
    });
}

function desenharOutros(grupos) {
    var lista = document.getElementById("lista-outros");
    lista.innerHTML = "";
    var outros = grupos.filter(function (g) { return g.situacao !== "membro"; });
    if (outros.length === 0) {
        lista.innerHTML = '<li class="sem-clique"><span class="vazio">Não há outros grupos no momento.</span></li>';
        return;
    }
    outros.forEach(function (g) {
        var li = document.createElement("li");
        li.className = "sem-clique";
        var texto = document.createElement("span");
        texto.innerHTML = escaparHtml(g.nome) + ' <span class="vazio">(' + g.total_membros + " membro(s))</span>";
        var acoes = document.createElement("span");
        acoes.className = "acoes";
        if (g.situacao === "pendente") {
            acoes.appendChild(criarBotao("Aguardando aprovação", "secundario", null, true));
        } else if (g.situacao === "recusada") {
            acoes.appendChild(criarBotao("Recusado — pedir de novo", "secundario", function () { pedirEntrada(g); }));
        } else {
            acoes.appendChild(criarBotao("Pedir para entrar", "", function () { pedirEntrada(g); }));
        }
        li.appendChild(texto);
        li.appendChild(acoes);
        lista.appendChild(li);
    });
}

function carregarTudo() {
    if (!localStorage.getItem("token")) { window.location.href = "index.html"; return; }

    chamarApi("auth/me.php").then(function (me) {
        if (!me.sucesso) { return; }
        return Promise.all([
            chamarApi("grupos/explorar.php"),
            chamarApi("grupos/solicitacoes/pendentes.php")
        ]).then(function (r) {
            var grupos = r[0], pend = r[1];
            if (!grupos.sucesso) { mostrarErroGrupos(grupos.erro.mensagem); return; }
            mostrarErroGrupos("");
            var lista = pend.sucesso ? pend.dados : [];
            var porGrupo = {};
            lista.forEach(function (p) { porGrupo[p.grupo_id] = (porGrupo[p.grupo_id] || 0) + 1; });
            desenharMeusGrupos(grupos.dados, porGrupo);
            desenharPendentes(lista);
            desenharOutros(grupos.dados);
        });
    });
}

document.getElementById("form-grupo").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var campo = document.getElementById("nome-grupo");
    chamarApi("grupos/criar.php", { method: "POST", body: JSON.stringify({ nome: campo.value }) })
        .then(function (resp) {
            if (resp.sucesso) { campo.value = ""; carregarTudo(); }
            else { mostrarErroGrupos(resp.erro.mensagem); }
        });
});

carregarTudo();
// Atualiza sozinho a cada 15s: novos grupos, pedidos para o admin e aprovações para quem pediu.
setInterval(function () { if (!document.hidden) { carregarTudo(); } }, 15000);
