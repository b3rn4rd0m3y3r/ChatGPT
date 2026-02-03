# -*- coding: iso-8859-1 -*-

import json
import math
import urllib.request
import urllib.error

# ================= CONFIGURAÇÃO =================
ARQUIVO_BASE = "embeddings.json"
MODELO_EMBEDDING = "nomic-embed-text-local"
OLLAMA_URL = "http://localhost:11434/api/embeddings"
ENCODING = "iso-8859-1"
TOP_K = 5
# ==============================================


# ===== DESATIVA PROXY (ESSENCIAL EM REDE CORPORATIVA) =====
proxy_handler = urllib.request.ProxyHandler({})
opener = urllib.request.build_opener(proxy_handler)
urllib.request.install_opener(opener)
# =========================================================


def gerar_embedding(texto):
    payload = {
        "model": MODELO_EMBEDDING,
        "prompt": texto
    }

    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    req = urllib.request.Request(
        OLLAMA_URL,
        data=data,
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            resposta = json.loads(resp.read().decode("utf-8"))
            return resposta["embedding"]

    except urllib.error.HTTPError as e:
        print("\nERRO HTTP AO CONSULTAR O OLLAMA")
        print("Status:", e.code)
        print(e.read().decode("utf-8"))
        raise

    except urllib.error.URLError as e:
        print("\nERRO DE CONEXÃO COM O OLLAMA")
        print(e.reason)
        raise


def similaridade_cosseno(v1, v2):
    produto = sum(a * b for a, b in zip(v1, v2))
    norma1 = math.sqrt(sum(a * a for a in v1))
    norma2 = math.sqrt(sum(b * b for b in v2))

    if norma1 == 0 or norma2 == 0:
        return 0.0

    return produto / (norma1 * norma2)


def carregar_base():
    with open(ARQUIVO_BASE, "r", encoding=ENCODING) as f:
        return json.load(f)


def pesquisar(pergunta, base):
    emb_pergunta = gerar_embedding(pergunta)

    resultados = []

    for item in base:
        score = similaridade_cosseno(
            emb_pergunta,
            item["embedding"]
        )

        resultados.append({
            "arquivo": item["arquivo"],
            "texto": item["texto"],
            "score": score
        })

    resultados.sort(key=lambda x: x["score"], reverse=True)
    return resultados[:TOP_K]


def main():
    print("Carregando base indexada...")
    base = carregar_base()

    print("Base carregada. Total de documentos:", len(base))
    print("Digite uma pergunta (ENTER para sair)\n")

    while True:
        pergunta = input("> ").strip()
        if not pergunta:
            break

        resultados = pesquisar(pergunta, base)

        print("\n--- RESULTADOS ---\n")
        for r in resultados:
            print(f"[{r['score']:.4f}] {r['arquivo']}")
            print(r["texto"][:500])
            print("-" * 50)


if __name__ == "__main__":
    main()
