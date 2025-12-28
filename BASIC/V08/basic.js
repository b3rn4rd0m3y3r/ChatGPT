/***********************
 * VARIÁVEIS GLOBAIS
 ***********************/
var VARS = {};
var FOR_STACK = [];
var GOSUB_STACK = [];
var LABELS = {};
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
 * TOKENIZER DE EXPRESSÕES
 ***********************/
function tokenizeExpr(expr) {
    let tokens = [];
    let i = 0;

    while (i < expr.length) {
        let c = expr[i];

        if (c === " " || c === "\t") { i++; continue; }

        if (c === '"') {
            let j = i + 1, s = "";
            while (j < expr.length && expr[j] !== '"') s += expr[j++];
            tokens.push({ type: "STRING", value: s });
            i = j + 1;
            continue;
        }

        if (/[0-9]/.test(c)) {
            let n = "";
            while (i < expr.length && /[0-9.]/.test(expr[i])) n += expr[i++];
            tokens.push({ type: "NUMBER", value: Number(n) });
            continue;
        }

        if (/[A-Za-z]/.test(c)) {
            let id = "";
            while (i < expr.length && /[A-Za-z0-9]/.test(expr[i])) id += expr[i++];
            let u = id.toUpperCase();
            if (u === "AND" || u === "OR" || u === "NOT")
                tokens.push({ type: "OP", value: u });
            else
                tokens.push({ type: "IDENT", value: id });
            continue;
        }

        let two = expr.substr(i, 2);
        if (["<=", ">=", "<>"].includes(two)) {
            tokens.push({ type: "OP", value: two });
            i += 2;
            continue;
        }

        if ("+-*/=<>".includes(c)) {
            tokens.push({ type: "OP", value: c });
            i++;
            continue;
        }

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
 * EXPRESSÕES
 ***********************/
function evalExpr_old1(expr) {
    expr = expr.trim();
    if (expr.startsWith('"') && expr.endsWith('"'))
        return expr.substring(1, expr.length - 1);

    expr = expr.replace(/([A-Za-z]+)\((\d+)\)/g, (_, v, i) => getVar(v + "[" + i + "]"));
    expr = expr.replace(/\b([A-Za-z]+)\b/g, (_, v) => getVar(v));

    try { return Function("return " + expr)(); }
    catch { return 0; }
}

function evalExpr(expr) {
    expr = expr.trim();

    if (expr.startsWith('"') && expr.endsWith('"'))
        return expr.substring(1, expr.length - 1);

    expr = expr.replace(/([A-Za-z]+)\((\d+)\)/g, (_, v, i) => {
        let val = getVar(v + "[" + i + "]");
        return typeof val === "string" ? JSON.stringify(val) : val;
    });

    expr = expr.replace(/\b([A-Za-z]+)\b/g, (_, v) => {
        let val = getVar(v);
        return typeof val === "string" ? JSON.stringify(val) : val;
    });

    try { return Function("return " + expr)(); }
    catch { return 0; }
}

/***********************
 * EXPRESSÕES BOOLEANAS
 ***********************/
function evalBoolExpr(expr) {
    expr = expr.trim()
        .replace(/\bAND\b/gi, "&&")
        .replace(/\bOR\b/gi, "||")
        .replace(/\bNOT\b/gi, "!")
        .replace(/<>/g, "!=")
        .replace(/=/g, "==");

    expr = expr.replace(/([A-Za-z]+)\((\d+)\)/g, (_, v, i) => getVar(v + "[" + i + "]"));
    expr = expr.replace(/\b([A-Za-z]+)\b/g, (_, v) => getVar(v));

    try { return Function("return (" + expr + ")")(); }
    catch { return false; }
}

/***********************
 * PRINT
 ***********************/
function cmdPrint(arg, saida) {
    let partes = arg.split(";");
    saida.value += partes.map(p => evalExpr(p)).join("") + "\n";
}

/***********************
 * INPUT
 ***********************/
function cmdInput(arg) {
    let v = arg.trim();
    let val = prompt("INPUT " + v);
    let num = Number(val);

    if (v.includes("(")) {
        let b = v.substring(0, v.indexOf("("));
        let i = v.substring(v.indexOf("(") + 1, v.indexOf(")"));
        setVar(b + "[" + i + "]", isNaN(num) ? val : num);
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
        let b = nome.substring(0, nome.indexOf("("));
        let i = nome.substring(nome.indexOf("(") + 1, nome.indexOf(")"));
        setVar(b + "[" + i + "]", valor);
    } else setVar(nome, valor);
}

function isImplicitLet(l) {
    return /^[A-Za-z][A-Za-z0-9]*(\(\d+\))?\s*=/.test(l);
}

/***********************
 * IF
 ***********************/
function cmdIf(linha, saida, linhas, ref) {
    let p = linha.split(/THEN/i);
    if (p.length < 2) return;
    if (!evalBoolExpr(p[0].replace(/^IF/i, ""))) return;
    linhas.splice(ref.i + 1, 0, p[1].trim());
}

/***********************
 * FOR / NEXT
 ***********************/
function cmdFor(linha, ref) {
    let m = linha.match(/FOR\s+(\w+)\s*=\s*(.+)\s+TO\s+(.+?)(\s+STEP\s+(.+))?/i);
    if (!m) return;

    setVar(m[1], evalExpr(m[2]));
    FOR_STACK.push({
        var: m[1],
        fim: evalExpr(m[3]),
        step: m[5] ? evalExpr(m[5]) : 1,
        linha: ref.i
    });
}

function cmdNext(ref) {
    if (!FOR_STACK.length) return;
    let t = FOR_STACK[FOR_STACK.length - 1];
    let v = getVar(t.var) + t.step;
    setVar(t.var, v);

    if ((t.step > 0 && v <= t.fim) || (t.step < 0 && v >= t.fim))
        ref.i = t.linha;
    else FOR_STACK.pop();
}

/***********************
 * LABEL / GOSUB / RETURN
 ***********************/
function cmdGosub(arg, ref) {
    let lbl = arg.trim();
    if (LABELS[lbl] === undefined) return;
    GOSUB_STACK.push(ref.i);
    ref.i = LABELS[lbl];
}

function cmdReturn(ref) {
    if (!GOSUB_STACK.length) return;
    ref.i = GOSUB_STACK.pop();
}

/***********************
 * EXECUÇÃO DE LINHA
 ***********************/
function executarLinha(linha, saida, linhas, ref) {
    if (!linha) return;
    let u = linha.toUpperCase();

    if (u.startsWith("REM")) return;
    if (u.startsWith("LABEL")) return;
    if (u === "END") { END_EXEC = true; return; }

    if (u.startsWith("PRINT")) cmdPrint(linha.substring(5), saida);
    else if (u.startsWith("INPUT")) cmdInput(linha.substring(5));
    else if (u.startsWith("LET")) cmdLet(linha.substring(3));
    else if (isImplicitLet(linha)) cmdLet(linha);
    else if (u.startsWith("IF")) cmdIf(linha, saida, linhas, ref);
    else if (u.startsWith("FOR")) cmdFor(linha, ref);
    else if (u.startsWith("NEXT")) cmdNext(ref);
    else if (u.startsWith("GOSUB")) cmdGosub(linha.substring(5), ref);
    else if (u.startsWith("RETURN")) cmdReturn(ref);
}

/***********************
 * EXECUÇÃO (DUPLA PASSADA)
 ***********************/
function executar(codigo) {
    VARS = {};
    FOR_STACK = [];
    GOSUB_STACK = [];
    LABELS = {};
    END_EXEC = false;

    let saida = document.getElementById("saida");
    saida.value = "";

    let linhas = codigo.split(/\r?\n/);

    // 1ª passada: coleta LABELs
    for (let i = 0; i < linhas.length; i++) {
        let l = linhas[i].trim();
        if (l.toUpperCase().startsWith("LABEL")) {
            let nome = l.substring(5).trim();
            LABELS[nome] = i;
        }
    }

    // 2ª passada: execução
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
