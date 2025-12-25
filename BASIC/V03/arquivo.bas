PRINT "=== TESTE DE LET E IF ==="

LET A = 10
LET B = A * 2
PRINT "A = ";A
PRINT "B = ";B

IF B > 15 THEN PRINT "B eh maior que 15"
IF B = 20 THEN PRINT "B eh exatamente 20"

INPUT N
PRINT "Valor digitado: ";N

IF N > 0 THEN PRINT "N eh positivo"
IF N = 0 THEN PRINT "N eh zero"
IF N < 0 THEN PRINT "N eh negativo"

LET A(1) = N * 2
PRINT "Dobro de N armazenado em A(1): ";A(1)

IF A(1) > 10 THEN PRINT "Dobro de N eh maior que 10"

PRINT "=== FIM DO TESTE ==="
