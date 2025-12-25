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
 * (simples, didático)
 ***********************/
function evalExpr(expr) {
    expr = expr.trim();

    // String literal
    if (expr.startsWith('"') && expr.endsWith('"')) {
        return expr.substring(1, expr.length - 1);
    }

    // Substitui arrays A(1) -> valor
    expr = expr.replace(/([A-Za-z]+)\((\d+)\)/g, function(_, nome, idx) {
        let v = getVar(nome + "[" + idx + "]");
        return v === "" ? 0 : v;
    });

    // Substitui variáveis simples
    expr = expr.replace(/\b([A-Za-z]+)\b/g, function(_, nome) {
        let v = getVar(nome);
        return v === "" ? 0 : v;
    });

    // Se ainda for número puro
    if (!isNaN(expr)) {
        return Number(expr);
    }

    // Expressão matemática simples
    try {
        return Function("return " + expr)();
    } catch (e) {
        return "";
    }
}


/***********************
 * INTERPRETADOR DE PRINT
 * (concatenação com ;)
 ***********************/
function evalPrintExpr(expr) {
    let partes = expr.split(";");
    let resultado = "";

    for (let i = 0; i < partes.length; i++) {
        resultado += evalExpr(partes[i]);
    }

    return resultado;
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
        let idx  = nome.substring(nome.indexOf("(") + 1, nome.indexOf(")"));
        setVar(base + "[" + idx + "]", valor);
    } else {
        setVar(nome, valor);
    }
}

/***********************
 * PRINT
 ***********************/
function cmdPrint(parte, saida) {
    let texto = evalPrintExpr(parte);
    saida.value += texto + "\n";
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
