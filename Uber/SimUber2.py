import random
from datetime import datetime, timedelta

# =========================
# CONFIGURAÇÕES POR CATEGORIA (INALTERADAS)
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
# FUNÇÃO PARA VERIFICAR PICO (INALTERADA)
# =========================

def horario_pico(horario):
    inicio_pico = horario.replace(hour=7, minute=30)
    fim_pico = horario.replace(hour=9, minute=20)
    return inicio_pico <= horario <= fim_pico


# =========================
# ENTRADA DE PARÂMETROS
# =========================

categoria = input("Escolha a categoria (UberX, Comfort, Black): ")

if categoria not in CATEGORIAS:
    print("Categoria inválida.")
    exit()

hora_inicio_str = input("Hora de início da jornada (HH:MM): ")
horas_trabalho = float(input("Número de horas a trabalhar: "))

percentual_minimo = float(input("Percentual mínimo da Uber fora do pico (ex: 0.25 para 25%): "))

min_pico = int(input("Mínimo de viagens por hora no pico: "))
max_pico = int(input("Máximo de viagens por hora no pico: "))

min_normal = int(input("Mínimo de viagens por hora no horário normal: "))
max_normal = int(input("Máximo de viagens por hora no horário normal: "))


# =========================
# PREPARAÇÃO DA SIMULAÇÃO
# =========================

config = CATEGORIAS[categoria]

inicio = datetime(2024, 1, 1, int(hora_inicio_str.split(":")[0]), int(hora_inicio_str.split(":")[1]))
fim = inicio + timedelta(hours=horas_trabalho)

viagem_num = 1
total_bruto = 0
total_liquido = 0
total_km = 0

print("\n--- SIMULAÇÃO DO DIA ---\n")

hora_atual = inicio

# =========================
# SIMULAÇÃO
# =========================

while hora_atual < fim:
    
    if horario_pico(hora_atual):
        qtd_viagens = random.randint(min_pico, max_pico)
        faixa_valor = config["valor_pico"]
    else:
        qtd_viagens = random.randint(min_normal, max_normal)
        faixa_valor = config["valor_normal"]
    
    for _ in range(qtd_viagens):
        
        minuto_sorteado = random.randint(0, 59)
        horario_viagem = hora_atual.replace(minute=minuto_sorteado)
        
        valor_bruto = round(random.uniform(*faixa_valor), 2)
        
        if horario_pico(horario_viagem):
            desconto_percentual = random.uniform(0.20, 0.25)
        else:
            desconto_percentual = percentual_minimo
        
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

horas_totais = horas_trabalho
print(f"Média líquida por hora: R$ {total_liquido/horas_totais:.2f}")
