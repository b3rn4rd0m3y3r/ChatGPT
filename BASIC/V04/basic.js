/***********************
 * GERENCIADOR DE VARIÁVEIS
 ***********************/
var VARS = {};
var FOR_STACK = [];

function setVar(nome, valor) {
    VARS[nome] = valor;
}

function getVar(nome) {
    return VARS[nome] !== undefined ? VARS[nome] : 0;
}

/***********************
 * INTERPRETADOR DE EXPRESSÕES
 ***********************/
function evalExpr(expr) {
    expr = expr.trim();

    if (expr.startsWith('"') && expr.endsWith('"')) {
        return expr.substring(1, expr.length - 1);
    }

    expr = expr.replace(/([A-Za-z]+)\((\d+)\)/g, function (_, nome, idx) {
        return getVar(nome + "[" + idx + "]");
    });

    expr = expr.replace(/\b([A-Za-z]+)\b/g, function (_, nome) {
        return getVar(nome);
    });

    if (!isNaN(expr)) return Number(expr);

    try {
        return Function("return " + expr)();
    } catch {
        return 0;
    }
}

/***********************
 * PRINT
 ***********************/
function evalPrintExpr(expr) {
    let partes = expr.split(";");
    let out = "";
    for (let p of partes) out += evalExpr(p);
    return out;
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
        let b = nome.substring(0, nome.indexOf("("));
        let i = nome.substring(nome.indexOf("(") + 1, nome.indexOf(")"));
        setVar(b + "[" + i + "]", Number(valor));
    } else {
        setVar(nome, Number(valor));
    }
}

/***********************
 * LET
 ***********************/
function cmdLet(parte) {
    let eq = parte.indexOf("=");
    if (eq < 0) return;

    let nome = parte.substring(0, eq).trim();
    let expr = parte.substring(eq + 1).trim();
    let valor = evalExpr(expr);

    if (nome.includes("(")) {
        let b = nome.substring(0, nome.indexOf("("));
        let i = nome.substring(nome.indexOf("(") + 1, nome.indexOf(")"));
        setVar(b + "[" + i + "]", valor);
    } else {
        setVar(nome, valor);
    }
}

/***********************
 * IF ... THEN
 ***********************/
function cmdIf(linha, saida) {
    let p = linha.split(/THEN/i);
    if (p.length !== 2) return;

    let cond = evalExpr(p[0].replace(/^IF/i, ""));
    if (!cond) return;

    executarLinha(p[1].trim(), saida);
}

/***********************
 * EXECUTA UMA LINHA
 ***********************/
function executarLinha(linha, saida) {
    let p = linha.split(" ");
    let cmd = p[0].toUpperCase();
    let rest = linha.substring(cmd.length).trim();

    if (cmd === "PRINT") cmdPrint(rest, saida);
    else if (cmd === "INPUT") cmdInput(rest);
    else if (cmd === "LET") cmdLet(rest);
}

/***********************
 * EXECUTOR COM FOR/NEXT
 ***********************/
function executar(codigo) {
    VARS = {};
    FOR_STACK = [];

    let linhas = codigo.split(/\r?\n/);
    let saida = document.getElementById("saida");
    saida.value = "";

    for (let i = 0; i < linhas.length; i++) {
        let linha = linhas[i].trim();
        if (!linha) continue;

        let up = linha.toUpperCase();

        if (up.startsWith("FOR")) {
            let m = linha.match(/FOR\s+(\w+)\s*=\s*(.+)\s+TO\s+(.+?)(\s+STEP\s+(.+))?$/i);
            if (!m) continue;

            let v = m[1];
            let ini = evalExpr(m[2]);
            let fim = evalExpr(m[3]);
            let step = m[5] ? evalExpr(m[5]) : 1;

            setVar(v, ini);
            FOR_STACK.push({ var: v, fim, step, linha: i });
        }

        else if (up.startsWith("NEXT")) {
            let topo = FOR_STACK[FOR_STACK.length - 1];
            let v = topo.var;
            setVar(v, getVar(v) + topo.step);

            if ((topo.step > 0 && getVar(v) <= topo.fim) ||
                (topo.step < 0 && getVar(v) >= topo.fim)) {
                i = topo.linha;
            } else {
                FOR_STACK.pop();
            }
        }

        else if (up.startsWith("IF")) {
            cmdIf(linha, saida);
        }

        else {
            executarLinha(linha, saida);
        }
    }
}

/***********************
 * INTERFACE
 ***********************/
function runBasic() {
    let f = document.getElementById("fonteBasic");
    if (!f.files.length) return;

    let r = new FileReader();
    r.onload = e => executar(e.target.result);
    r.readAsText(f.files[0], "ISO-8859-1");
}
