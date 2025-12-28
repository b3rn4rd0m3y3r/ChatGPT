REM ==========================================
REM TESTE DO INTERPRETADOR BASIC (VERSAO ATUAL)
REM ==========================================

PRINT "=== INICIO DO TESTE ==="

REM --- INPUT STRING ---
INPUT NOME
PRINT "OLA ";NOME

REM --- INPUT NUMERICO ---
INPUT X
PRINT "X = ";X

REM --- LET EXPLICITO E IMPLICITO ---
LET A = 5
B = 3
C = 10
PRINT "A=";A;" B=";B;" C=";C

REM --- ARRAY ---
INPUT V(1)
V(2) = V(1) * 2
PRINT "V(1)=";V(1);" V(2)=";V(2)

REM --- EXPRESSOES ---
PRINT "A + B = ";A + B
PRINT "C / A = ";C / A

REM --- IF SIMPLES ---
IF A = 5 THEN PRINT "A eh 5"

REM --- IF AND / OR ---
IF A = 5 AND B = 3 THEN PRINT "A e B corretos"
IF A = 4 OR B = 3 THEN PRINT "B eh 3"

REM --- IF NOT ---
IF NOT A = 3 THEN PRINT "A nao eh 3"

REM --- IF COM PARENTESES ---
IF (A = 5 AND B = 3) OR C = 20 THEN PRINT "Condicao composta OK"
IF NOT (A = 3 OR B = 4) THEN PRINT "NOT com parenteses OK"
IF A = 5 AND (B = 4 OR C = 10) THEN PRINT "Parenteses aninhados OK"

REM --- FOR SIMPLES ---
PRINT "FOR DE 1 A 3"
FOR I = 1 TO 3
    PRINT "I = ";I
NEXT I

REM --- FOR COM STEP ---
PRINT "FOR COM STEP"
FOR J = 10 TO 2 STEP -4
    PRINT "J = ";J
NEXT J

REM --- SOMATORIO ---
S = 0
FOR K = 1 TO 5
    S = S + K
NEXT K
PRINT "SOMA DE 1 A 5 = ";S

REM --- END ---
PRINT "ANTES DO END"
END

PRINT "ESTA LINHA NAO DEVE APARECER"
