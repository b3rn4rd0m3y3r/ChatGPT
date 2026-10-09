import requests
from sklearn.metrics.pairwise import cosine_similarity

def get_embedding(texto):
    resp = requests.post("http://localhost:11434/api/embed", json={
        "model": "embedGemma",
        "input": texto
    })
    return resp.json()["embeddings"][0]

# Calcular similaridade entre dois textos
vetor1 = get_embedding("carro")
vetor2 = get_embedding("automóvel")

similaridade = cosine_similarity([vetor1], [vetor2])[0][0]
print(f"Similaridade: {similaridade:.3f}")  # Ex: 0.924