REM ==========================================
REM TESTE DE SUBROTINAS COM LABEL / GOSUB
REM ==========================================

PRINT "=== PROGRAMA PRINCIPAL ==="

INPUT NOME
PRINT "OLA ";NOME

INPUT X
PRINT "VALOR DIGITADO: ";X

GOSUB DOBRO
GOSUB TESTE_LOGICO

PRINT "RETORNOU DAS SUBROTINAS"

REM --- LOOP NO PROGRAMA PRINCIPAL ---
S = 0
FOR I = 1 TO X
    S = S + I
NEXT I
PRINT "SOMA DE 1 A ";X;" = ";S

PRINT "ANTES DO END"
END

REM ==========================================
REM SUBROTINAS (PODEM FICAR APOS O END)
REM ==========================================

LABEL DOBRO
PRINT "SUBROTINA DOBRO"
PRINT "DOBRO DE ";X;" = ";X * 2
RETURN

LABEL TESTE_LOGICO
PRINT "SUBROTINA TESTE_LOGICO"

IF X > 0 AND NOT (X = 3 OR X = 7) THEN PRINT "X VALIDO"
IF X = 3 OR X = 7 THEN PRINT "X ESPECIAL"

RETURN

