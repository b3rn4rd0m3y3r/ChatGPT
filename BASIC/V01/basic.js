/***********************
 * GERENCIADOR DE VARIÁVEIS
 ***********************/
var VARS = {};

function setVar(nome, valor) {
    VARS[nome] = valor;
}

function getVar(nome) {
    return VARS[nome] !== undefined ? VARS[nome] : "";
}

/***********************
 * INTERPRETADOR DE EXPRESSÕES
 * (simples e didático)
 ***********************/
function evalExpr(expr) {
    expr = expr.trim();

    // String literal
    if (expr.startsWith('"') && expr.endsWith('"')) {
        return expr.substring(1, expr.length - 1);
    }

    // Número
    if (!isNaN(expr)) {
        return Number(expr);
    }

    // Array: A(1)
    if (expr.includes("(")) {
        let nome = expr.substring(0, expr.indexOf("("));
        let idx = expr.substring(expr.indexOf("(") + 1, expr.indexOf(")"));
        let chave = nome + "[" + idx + "]";
        return getVar(chave);
    }

    // Variável simples
    return getVar(expr);
}

/***********************
 * INPUT
 ***********************/
function cmdInput(parte) {
    let nome = parte.trim();
    let valor = prompt("INPUT " + nome);

    // Array?
    if (nome.includes("(")) {
        let base = nome.substring(0, nome.indexOf("("));
        let idx = nome.substring(nome.indexOf("(") + 1, nome.indexOf(")"));
        setVar(base + "[" + idx + "]", valor);
    } else {
        setVar(nome, valor);
    }
}

/***********************
 * PRINT
 ***********************/
function cmdPrint(parte, saida) {
    let valor = evalExpr(parte);
    saida.value += valor + "\n";
}

/***********************
 * EXECUTOR DO BASIC
 ***********************/
function executar(codigo) {
    VARS = {};
    let linhas = codigo.split(/\r?\n/);
    let saida = document.getElementById("saida");
    saida.value = "";

    for (let i = 0; i < linhas.length; i++) {
        let linha = linhas[i].trim();
        if (linha === "") continue;

        let partes = linha.split(" ");
        let comando = partes[0].toUpperCase();
        let resto = linha.substring(comando.length).trim();

        if (comando === "INPUT") {
            cmdInput(resto);
        }

        else if (comando === "PRINT") {
            cmdPrint(resto, saida);
        }

        else {
            saida.value += "Comando desconhecido: " + comando + "\n";
        }
    }
}

/***********************
 * INTERFACE HTML
 ***********************/
function runBasic() {
    let fileInput = document.getElementById("fonteBasic");
    if (!fileInput.files.length) return;

    let reader = new FileReader();
    reader.onload = function(e) {
        executar(e.target.result);
    };
    reader.readAsText(fileInput.files[0], "ISO-8859-1");
}
