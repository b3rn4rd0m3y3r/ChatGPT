function salvarSessao(dados) {
    localStorage.setItem("token", dados.token);
    localStorage.setItem("usuario_id", dados.usuario.id);
    localStorage.setItem("usuario_nome", dados.usuario.nome);
    window.location.href = "grupos.html";
}

function mostrarErro(id, mensagem) {
    var el = document.getElementById(id);
    el.textContent = mensagem;
    el.style.display = "block";
}

document.getElementById("form-login").addEventListener("submit", function (ev) {
    ev.preventDefault();
    document.getElementById("erro-login").style.display = "none";
    chamarApi("auth/login.php", {
        method: "POST",
        body: JSON.stringify({
            email: document.getElementById("login-email").value,
            senha: document.getElementById("login-senha").value
        })
    }).then(function (resp) {
        if (resp.sucesso) { salvarSessao(resp.dados); }
        else { mostrarErro("erro-login", resp.erro.mensagem); }
    });
});

document.getElementById("form-cadastro").addEventListener("submit", function (ev) {
    ev.preventDefault();
    document.getElementById("erro-cadastro").style.display = "none";
    var email = document.getElementById("cad-email").value;
    var senha = document.getElementById("cad-senha").value;
    chamarApi("usuarios.php", {
        method: "POST",
        body: JSON.stringify({ nome: document.getElementById("cad-nome").value, email: email, senha: senha })
    }).then(function (resp) {
        if (!resp.sucesso) { mostrarErro("erro-cadastro", resp.erro.mensagem); return; }
        return chamarApi("auth/login.php", {
            method: "POST", body: JSON.stringify({ email: email, senha: senha })
        }).then(function (r) {
            if (r.sucesso) { salvarSessao(r.dados); }
            else { mostrarErro("erro-cadastro", r.erro.mensagem); }
        });
    });
});
