REM ======================================
REM PROGRAMA DE TESTE DO INTERPRETADOR BASIC
REM ======================================

PRINT "=== TESTE GERAL DO BASIC ==="

REM ---- INPUT e PRINT ----
INPUT NOME
PRINT "OLA ";NOME

REM ---- ATRIBUICAO EXPLICITA E IMPLICITA ----
LET A = 4
B = 3
C = 20

PRINT "A=";A;" B=";B;" C=";C

REM ---- ARRAYS ----
INPUT V(1)
V(2) = V(1) * 2
PRINT "V(1)=";V(1);" V(2)=";V(2)

REM ---- IF SIMPLES ----
IF A = 5 THEN PRINT "A eh 5"

REM ---- IF COM AND / OR ----
IF A = 5 AND B = 3 THEN PRINT "A e B corretos"
IF A = 4 OR B = 3 THEN PRINT "B eh 3"

REM ---- IF COM NOT ----
IF NOT A = 3 THEN PRINT "A nao eh 3"

REM ---- IF COM PARENTESES ----
IF (A = 5 AND B = 3) OR C = 20 THEN PRINT "Condicao composta OK"
IF NOT (A = 3 OR B = 4) THEN PRINT "NOT com parenteses OK"
IF A = 5 AND (B = 4 OR C = 10) THEN PRINT "Parenteses aninhados OK"

REM ---- FOR SIMPLES ----
PRINT "FOR de 1 a 3"
FOR I = 1 TO 3
    PRINT "I = ";I
NEXT I

REM ---- FOR COM STEP ----
PRINT "FOR com STEP"
FOR J = 10 TO 2 STEP -4
    PRINT "J = ";J
NEXT J

REM ---- SOMATORIO (ATRIBUICAO IMPLICITA) ----
S = 0
FOR K = 1 TO 5
    S = S + K
NEXT K
PRINT "SOMA DE 1 A 5 = ";S

REM ---- END ----
PRINT "ANTES DO END"
END

PRINT "ISTO NAO DEVE APARECER"




