PRINT "Teste de FOR simples"

FOR I = 1 TO 5
    PRINT "I = ";I
NEXT I

PRINT "Teste de FOR com STEP"

FOR J = 10 TO 2 STEP -2
    PRINT "J = ";J
NEXT J

PRINT "Teste de FOR com LET e IF"

FOR N = 1 TO 5
    LET D = N * 2
    IF D > 6 THEN PRINT "Dobro maior que 6: ";D
NEXT N

PRINT "Fim do teste"

