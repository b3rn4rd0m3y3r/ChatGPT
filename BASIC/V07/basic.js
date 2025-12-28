/***********************
 * VARIÁVEIS GLOBAIS
 ***********************/
var VARS = {};
var FOR_STACK = [];
var END_EXEC = false;

/***********************
 * GERENCIADOR DE VARIÁVEIS
 ***********************/
function setVar(nome, valor) {
    VARS[nome] = valor;
}

function getVar(nome) {
    return VARS[nome] !== undefined ? VARS[nome] : 0;
}

/***********************
 * TOKENIZER DE EXPRESSÕES (NOVO)
 ***********************/
function tokenizeExpr(expr) {
    let tokens = [];
    let i = 0;

    while (i < expr.length) {
        let c = expr[i];

        // espaços
        if (c === " " || c === "\t") {
            i++;
            continue;
        }

        // strings
        if (c === '"') {
            let j = i + 1;
            let s = "";
            while (j < expr.length && expr[j] !== '"') {
                s += expr[j++];
            }
            tokens.push({ type: "STRING", value: s });
            i = j + 1;
            continue;
        }

        // números
        if (/[0-9]/.test(c)) {
            let n = "";
            while (i < expr.length && /[0-9.]/.test(expr[i])) {
                n += expr[i++];
            }
            tokens.push({ type: "NUMBER", value: Number(n) });
            continue;
        }

        // identificadores e operadores lógicos
        if (/[A-Za-z]/.test(c)) {
            let id = "";
            while (i < expr.length && /[A-Za-z0-9]/.test(expr[i])) {
                id += expr[i++];
            }
            let u = id.toUpperCase();
            if (u === "AND" || u === "OR" || u === "NOT") {
                tokens.push({ type: "OP", value: u });
            } else {
                tokens.push({ type: "IDENT", value: id });
            }
            continue;
        }

        // operadores compostos
        let two = expr.substr(i, 2);
        if (["<=", ">=", "<>"].includes(two)) {
            tokens.push({ type: "OP", value: two });
            i += 2;
            continue;
        }

        // operadores simples
        if ("+-*/=<>".includes(c)) {
            tokens.push({ type: "OP", value: c });
            i++;
            continue;
        }

        // parênteses
        if (c === "(" || c === ")") {
            tokens.push({ type: "PAREN", value: c });
            i++;
            continue;
        }

        throw "Token inválido: " + c;
    }

    return tokens;
}

/***********************
 * EXPRESSÕES ARITMÉTICAS / STRINGS
 ***********************/
function evalExpr_old1(expr) {
    expr = expr.trim();

    if (expr.startsWith('"') && expr.endsWith('"')) {
        return expr.substring(1, expr.length - 1);
    }

    expr = expr.replace(/([A-Za-z]+)\((\d+)\)/g, function (_, v, i) {
        return getVar(v + "[" + i + "]");
    });

    expr = expr.replace(/\b([A-Za-z]+)\b/g, function (_, v) {
        return getVar(v);
    });

    try {
        return Function("return " + expr)();
    } catch {
        return 0;
    }
}

function evalExpr(expr) {
    expr = expr.trim();

    if (expr.startsWith('"') && expr.endsWith('"')) {
        return expr.substring(1, expr.length - 1);
    }

    expr = expr.replace(/([A-Za-z]+)\((\d+)\)/g, function (_, v, i) {
        let val = getVar(v + "[" + i + "]");
        return (typeof val === "string") ? JSON.stringify(val) : val;
    });

    expr = expr.replace(/\b([A-Za-z]+)\b/g, function (_, v) {
        let val = getVar(v);
        return (typeof val === "string") ? JSON.stringify(val) : val;
    });

    try {
        return Function("return " + expr)();
    } catch {
        return 0;
    }
}

/***********************
 * EXPRESSÕES BOOLEANAS (IF)
 ***********************/
function evalBoolExpr(expr) {
    expr = expr.trim();

    expr = expr
        .replace(/\bAND\b/gi, "&&")
        .replace(/\bOR\b/gi, "||")
        .replace(/\bNOT\b/gi, "!");

    expr = expr
        .replace(/<>/g, "!=")
        .replace(/=/g, "==");

    expr = expr.replace(/([A-Za-z]+)\((\d+)\)/g, function (_, v, i) {
        return getVar(v + "[" + i + "]");
    });

    expr = expr.replace(/\b([A-Za-z]+)\b/g, function (_, v) {
        return getVar(v);
    });

    try {
        return Function("return (" + expr + ")")();
    } catch {
        return false;
    }
}

/***********************
 * PRINT
 ***********************/
function cmdPrint(arg, saida) {
    let partes = arg.split(";");
    let linha = partes.map(p => evalExpr(p)).join("");
    saida.value += linha + "\n";
}

/***********************
 * INPUT
 ***********************/
function cmdInput(arg) {
    let v = arg.trim();
    let val = prompt("INPUT " + v);
    let num = Number(val);

    if (v.includes("(")) {
        let base = v.substring(0, v.indexOf("("));
        let idx = v.substring(v.indexOf("(") + 1, v.indexOf(")"));
        setVar(base + "[" + idx + "]", isNaN(num) ? val : num);
    } else {
        setVar(v, isNaN(num) ? val : num);
    }
}

/***********************
 * LET
 ***********************/
function cmdLet(arg) {
    let p = arg.split("=");
    let nome = p[0].trim();
    let valor = evalExpr(p[1]);

    if (nome.includes("(")) {
        let base = nome.substring(0, nome.indexOf("("));
        let idx = nome.substring(nome.indexOf("(") + 1, nome.indexOf(")"));
        setVar(base + "[" + idx + "]", valor);
    } else {
        setVar(nome, valor);
    }
}

function isImplicitLet(linha) {
    return /^[A-Za-z][A-Za-z0-9]*(\(\d+\))?\s*=/.test(linha);
}

/***********************
 * IF ... THEN
 ***********************/
function cmdIf(linha, saida, linhas, ref) {
    let p = linha.split(/THEN/i);
    if (p.length < 2) return;

    let cond = evalBoolExpr(p[0].replace(/^IF/i, ""));
    if (!cond) return;

    linhas.splice(ref.i + 1, 0, p[1].trim());
}

/***********************
 * FOR / NEXT
 ***********************/
function cmdFor(linha, ref) {
    let m = linha.match(/FOR\s+(\w+)\s*=\s*(.+)\s+TO\s+(.+?)(\s+STEP\s+(.+))?/i);
    if (!m) return;

    let v = m[1];
    let ini = evalExpr(m[2]);
    let fim = evalExpr(m[3]);
    let step = m[5] ? evalExpr(m[5]) : 1;

    setVar(v, ini);
    FOR_STACK.push({ var: v, fim: fim, step: step, linha: ref.i });
}

function cmdNext(ref) {
    if (!FOR_STACK.length) return;

    let topo = FOR_STACK[FOR_STACK.length - 1];
    let atual = getVar(topo.var) + topo.step;
    setVar(topo.var, atual);

    if (
        (topo.step > 0 && atual <= topo.fim) ||
        (topo.step < 0 && atual >= topo.fim)
    ) {
        ref.i = topo.linha;
    } else {
        FOR_STACK.pop();
    }
}

/***********************
 * EXECUÇÃO
 ***********************/
function executarLinha(linha, saida, linhas, ref) {
    if (!linha) return;

    let u = linha.toUpperCase();

    if (u.startsWith("REM")) return;
    if (u === "END") { END_EXEC = true; return; }
    if (u.startsWith("PRINT")) cmdPrint(linha.substring(5), saida);
    else if (u.startsWith("INPUT")) cmdInput(linha.substring(5));
    else if (u.startsWith("LET")) cmdLet(linha.substring(3));
    else if (isImplicitLet(linha)) cmdLet(linha);
    else if (u.startsWith("IF")) cmdIf(linha, saida, linhas, ref);
    else if (u.startsWith("FOR")) cmdFor(linha, ref);
    else if (u.startsWith("NEXT")) cmdNext(ref);
}

function executar(codigo) {
    VARS = {};
    FOR_STACK = [];
    END_EXEC = false;

    let saida = document.getElementById("saida");
    saida.value = "";

    let linhas = codigo.split(/\r?\n/);
    let ref = { i: 0 };

    while (ref.i < linhas.length && !END_EXEC) {
        executarLinha(linhas[ref.i].trim(), saida, linhas, ref);
        ref.i++;
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
