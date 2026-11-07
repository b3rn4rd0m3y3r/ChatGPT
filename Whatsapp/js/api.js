// Wrapper único de chamadas à API. Todo caminho é RELATIVO à página (sem "/"
// inicial), então o sistema funciona em qualquer subpasta do IIS
// (ex.: http://servidor/Whatsapp/). As páginas ficam no mesmo nível da pasta api/.
var API_BASE = "api/v1";

function chamarApi(caminho, opcoes) {
    opcoes = opcoes || {};
    var token = localStorage.getItem("token");
    var headers = Object.assign({}, opcoes.headers || {});

    // Em upload (FormData) o navegador define o Content-Type sozinho.
    if (!(opcoes.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }
    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    var url = API_BASE + "/" + caminho.replace(/^\/+/, "");
    var config = Object.assign({}, opcoes, { headers: headers });

    return fetch(url, config).then(function (resposta) {
        // Tolerância a falha: resposta que não é JSON (página de erro do IIS,
        // corpo vazio) vira um erro utilizável, sem estourar exceção.
        return resposta.text().then(function (texto) {
            var json;
            try {
                json = JSON.parse(texto);
            } catch (e) {
                return {
                    sucesso: false, dados: null,
                    erro: { codigo: "RESPOSTA_INVALIDA",
                            mensagem: "Servidor respondeu HTTP " + resposta.status + " sem JSON válido: " + texto.substring(0, 200) }
                };
            }
            if (!json.sucesso && json.erro && json.erro.codigo === "TOKEN_INVALIDO") {
                localStorage.removeItem("token");
                if (!document.getElementById("form-login")) {
                    window.location.href = "index.html";
                }
            }
            return json;
        });
    }, function (erroDeRede) {
        if (erroDeRede && erroDeRede.name === "AbortError") { throw erroDeRede; }
        return { sucesso: false, dados: null,
                 erro: { codigo: "ERRO_REDE", mensagem: "Não foi possível conectar ao servidor." } };
    });
}

function formatarHora(isoUtc) {
    return new Date(isoUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function escaparHtml(texto) {
    return String(texto == null ? "" : texto)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
