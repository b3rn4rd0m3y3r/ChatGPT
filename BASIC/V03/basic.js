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
 ***********************/
function evalExpr(expr) {
    expr = expr.trim();

    // String literal
    if (expr.startsWith('"') && expr.endsWith('"')) {
        return expr.substring(1, expr.length - 1);
    }

    // Substitui arrays A(1)
    expr = expr.replace(/([A-Za-z]+)\((\d+)\)/g, function (_, nome, idx) {
        let v = getVar(nome + "[" + idx + "]");
        return v === "" ? 0 : v;
    });

    // Substitui variáveis simples
    expr = expr.replace(/\b([A-Za-z]+)\b/g, function (_, nome) {
        let v = getVar(nome);
        return v === "" ? 0 : v;
    });

    // Número puro
    if (!isNaN(expr)) {
        return Number(expr);
    }

    // Expressão matemática simples
    try {
        return Function("return " + expr)();
    } catch {
        return "";
    }
}

/***********************
 * PRINT (concatenação ;)
 ***********************/
function evalPrintExpr(expr) {
    let partes = expr.split(";");
    let resultado = "";

    for (let i = 0; i < partes.length; i++) {
        resultado += evalExpr(partes[i]);
    }

    return resultado;
}

function cmdPrint(parte, saida) {
    saida.value += evalPrintExpr(parte) + "\n";
}

/***********************
 * INPUT
 ***********************/
function cmdInput(parte) {
    let nome = parte.trim();
    let valor = prompt("INPUT " + nome);

    if (nome.includes("(")) {
        let base = nome.substring(0, nome.indexOf("("));
        let idx  = nome.substring(nome.indexOf("(") + 1, nome.indexOf(")"));
        setVar(base + "[" + idx + "]", valor);
    } else {
        setVar(nome, valor);
    }
}

/***********************
 * LET
 ***********************/
function cmdLet(parte) {
    let eq = parte.indexOf("=");
    if (eq === -1) return;

    let nome = parte.substring(0, eq).trim();
    let expr = parte.substring(eq + 1).trim();
    let valor = evalExpr(expr);

    if (nome.includes("(")) {
        let base = nome.substring(0, nome.indexOf("("));
        let idx  = nome.substring(nome.indexOf("(") + 1, nome.indexOf(")"));
        setVar(base + "[" + idx + "]", valor);
    } else {
        setVar(nome, valor);
    }
}

/***********************
 * IF ... THEN
 ***********************/
function cmdIf(linha, saida) {
    let partes = linha.split(/THEN/i);
    if (partes.length !== 2) return;

    let condBasic = partes[0].replace(/^IF/i, "").trim();
    let comando = partes[1].trim();

    // Avalia a condição usando o interpretador de expressões
    let condJS = evalExpr(condBasic);

    let resultado;
    try {
        resultado = Function("return " + condJS)();
    } catch {
        resultado = false;
    }

    if (!resultado) return;

    executarLinha(comando, saida);
}


/***********************
 * EXECUTA UMA LINHA
 ***********************/
function executarLinha(linha, saida) {
    let partes = linha.split(" ");
    let comando = partes[0].toUpperCase();
    let resto = linha.substring(comando.length).trim();

    if (comando === "PRINT") cmdPrint(resto, saida);
    else if (comando === "INPUT") cmdInput(resto);
    else if (comando === "LET") cmdLet(resto);
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

        if (/^IF\b/i.test(linha)) {
            cmdIf(linha, saida);
        } else {
            executarLinha(linha, saida);
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
    reader.onload = function (e) {
        executar(e.target.result);
    };
    reader.readAsText(fileInput.files[0], "ISO-8859-1");
}
