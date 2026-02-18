import random
from datetime import datetime, timedelta

# =========================
# CONFIGURAÇÕES POR CATEGORIA
# =========================

CATEGORIAS = {
    "UberX": {
        "valor_normal": (12, 25),
        "valor_pico": (8, 18),
        "km": (3, 12)
    },
    "Comfort": {
        "valor_normal": (18, 35),
        "valor_pico": (15, 28),
        "km": (5, 18)
    },
    "Black": {
        "valor_normal": (30, 70),
        "valor_pico": (25, 55),
        "km": (7, 25)
    }
}

# =========================
# FUNÇÃO PARA VERIFICAR PICO
# =========================

def horario_pico(horario):
    inicio_pico = horario.replace(hour=7, minute=30)
    fim_pico = horario.replace(hour=9, minute=20)
    return inicio_pico <= horario <= fim_pico


# =========================
# SIMULAÇÃO
# =========================

categoria = input("Escolha a categoria (UberX, Comfort, Black): ")

if categoria not in CATEGORIAS:
    print("Categoria inválida.")
    exit()

config = CATEGORIAS[categoria]

inicio = datetime(2024, 1, 1, 7, 0)
fim = datetime(2024, 1, 1, 17, 0)

viagem_num = 1
total_bruto = 0
total_liquido = 0
total_km = 0

print("\n--- SIMULAÇÃO DO DIA ---\n")

hora_atual = inicio

while hora_atual < fim:
    
    if horario_pico(hora_atual):
        qtd_viagens = random.randint(4, 7)
        faixa_valor = config["valor_pico"]
    else:
        qtd_viagens = random.randint(3, 5)
        faixa_valor = config["valor_normal"]
    
    for _ in range(qtd_viagens):
        
        minuto_sorteado = random.randint(0, 59)
        horario_viagem = hora_atual.replace(minute=minuto_sorteado)
        
        valor_bruto = round(random.uniform(*faixa_valor), 2)
        
        if horario_pico(horario_viagem):
            desconto_percentual = random.uniform(0.20, 0.25)
        else:
            desconto_percentual = 0.25
        
        valor_liquido = round(valor_bruto * (1 - desconto_percentual), 2)
        km = round(random.uniform(*config["km"]), 1)
        
        total_bruto += valor_bruto
        total_liquido += valor_liquido
        total_km += km
        
        print(f"{viagem_num:03d} | "
              f"{horario_viagem.strftime('%H:%M')} | "
              f"{desconto_percentual*100:.1f}% | "
              f"R$ {valor_bruto:.2f} | "
              f"R$ {valor_liquido:.2f} | "
              f"{km} km")
        
        viagem_num += 1
    
    hora_atual += timedelta(hours=1)

# =========================
# RESUMO
# =========================

print("\n--- RESUMO DO DIA ---")
print(f"Total de viagens: {viagem_num - 1}")
print(f"Faturamento Bruto: R$ {total_bruto:.2f}")
print(f"Faturamento Líquido: R$ {total_liquido:.2f}")
print(f"Total KM rodados: {total_km:.1f} km")
print(f"Média por hora (líquido): R$ {total_liquido/10:.2f}")
