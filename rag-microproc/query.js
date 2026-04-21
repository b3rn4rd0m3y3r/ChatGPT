const fs = require("fs");

const OLLAMA_URL = "http://localhost:11434";

// =======================
// Similaridade
// =======================

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// =======================
// Embedding
// =======================

async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      model: "nomic-embed-text",
      prompt: text
    })
  });

  if (!res.ok) {
    throw new Error(`Erro embedding HTTP ${res.status}`);
  }

  const data = await res.json();

  if (!data.embedding) {
    console.error("Resposta inválida:", data);
    throw new Error("Embedding não retornado");
  }

  return data.embedding;
}

// =======================
// Geração (LLM)
// =======================

async function generate(prompt) {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      model: "mistral",
      prompt: prompt,
      stream: false
    })
  });

  if (!res.ok) {
    throw new Error(`Erro generate HTTP ${res.status}`);
  }

  const data = await res.json();

  return data.response;
}

// =======================
// Query principal
// =======================

async function query(userQuestion) {
  const db = JSON.parse(fs.readFileSync("db.json"));

  console.log("Pergunta:", userQuestion);

  const qEmbedding = await embed(userQuestion);

  const scored = db.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(qEmbedding, chunk.embedding)
  }));

  scored.sort((a, b) => b.score - a.score);

  const topK = scored.slice(0, 5);

  const context = topK.map(c => c.content).join("\n");

  console.log("\n=== CONTEXTO ===\n");
  console.log(context);

  const prompt = `
Responda com base no contexto abaixo.
Se não souber, diga "Não encontrado no contexto".

${context}

Pergunta: ${userQuestion}
Resposta:
`;

  const answer = await generate(prompt);

  console.log("\n=== RESPOSTA ===\n");
  console.log(answer);
}

// =======================
// Execução
// =======================

query(process.argv[2] || "O que faz a ALU?");