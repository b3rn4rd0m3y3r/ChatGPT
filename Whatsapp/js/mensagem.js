// Monta o HTML de uma mensagem. Toda mensagem mostra QUEM enviou:
// as suas aparecem como "Você"; as dos outros, com o nome e uma cor própria de cada pessoa.
var CORES_AUTORES = ["#d32f2f", "#7b1fa2", "#303f9f", "#0277bd", "#00796b",
                     "#558b2f", "#ef6c00", "#5d4037", "#c2185b", "#455a64"];

function corDoAutor(autorId) {
    return CORES_AUTORES[Math.abs(Number(autorId) || 0) % CORES_AUTORES.length];
}

function nomeDoAutor(msg, ehMinha) {
    if (ehMinha) { return "Você"; }
    return msg.autor_nome ? msg.autor_nome : "Usuário #" + msg.autor_id;
}

function montarHtmlMensagem(msg, ehMinha) {
    var cor = ehMinha ? "#075e54" : corDoAutor(msg.autor_id);
    var imagem = "";
    if (msg.tipo === "imagem" && msg.caminho_imagem) {
        imagem = '<img src="' + escaparHtml(msg.caminho_thumbnail || msg.caminho_imagem) + '" alt="imagem">';
    }
    var status = "";
    if (ehMinha && msg.status) {
        status = msg.status === "lida" ? '<span class="status-lida">lida</span>' : "<span>enviada</span>";
    }
    return '<div class="autor" style="color:' + cor + '">' + escaparHtml(nomeDoAutor(msg, ehMinha)) + "</div>" +
        (msg.texto ? "<div>" + escaparHtml(msg.texto) + "</div>" : "") + imagem +
        '<div class="hora">' + formatarHora(msg.criado_em) + " " + status + "</div>";
}
