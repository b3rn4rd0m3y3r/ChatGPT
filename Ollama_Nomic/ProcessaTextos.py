# -*- coding: iso-8859-1 -*-

import os
import json
import urllib.request
import urllib.error

# === DESATIVA PROXY PARA LOCALHOST ===
proxy_handler = urllib.request.ProxyHandler({})
opener = urllib.request.build_opener(proxy_handler)
urllib.request.install_opener(opener)
# ====================================


# ===== CONFIGURAÇÃO =====
PASTA_TEXTOS = "./"
ARQUIVO_SAIDA = "embeddings.json"
MODELO_EMBEDDING = "nomic-embed-text-local"
OLLAMA_URL = "http://localhost:11434/api/embeddings"
ENCODING = "iso-8859-1"
# =======================


def gerar_embedding(texto):
    payload = {
        "model": MODELO_EMBEDDING,
        "prompt": texto
    }

    # JSON enviado via HTTP deve ser UTF-8
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
        print("\n=== ERRO HTTP AO CHAMAR O OLLAMA ===")
        print("Status:", e.code)
        try:
            print("Resposta do servidor:")
            print(e.read().decode("utf-8"))
        except Exception:
            pass
        raise

    except urllib.error.URLError as e:
        print("\n=== ERRO DE CONEXÃO COM O OLLAMA ===")
        print(e.reason)
        raise


def main():
    base = []

    for nome_arquivo in os.listdir(PASTA_TEXTOS):
        if not nome_arquivo.lower().endswith(".txt"):
            continue

        caminho = os.path.join(PASTA_TEXTOS, nome_arquivo)

        # Leitura explícita em ISO-8859-1
        with open(caminho, "r", encoding=ENCODING) as f:
            texto = f.read().strip()

        if not texto:
            continue

        print("Indexando:", nome_arquivo)

        embedding = gerar_embedding(texto)

        base.append({
            "arquivo": nome_arquivo,
            "texto": texto,
            "embedding": embedding
        })

    # Escrita explícita em ISO-8859-1
    with open(ARQUIVO_SAIDA, "w", encoding=ENCODING) as f:
        json.dump(base, f, ensure_ascii=False, indent=2)

    print("\nIndexação concluída. Arquivo gerado:", ARQUIVO_SAIDA)


if __name__ == "__main__":
    main()
