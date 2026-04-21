const fs = require("fs");

const OLLAMA_URL = "http://localhost:11434";

async function embed(text) {
  const endpoints = [
    {
      url: `${OLLAMA_URL}/api/embed`,
      body: { model: "nomic-embed-text", input: text },
      extractor: (d) => d.embedding
    },
    {
      url: `${OLLAMA_URL}/api/embeddings`,
      body: { model: "nomic-embed-text", prompt: text },
      extractor: (d) => d.embedding
    }
  ];

  for (let ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ep.body)
      });

      if (!res.ok) {
        console.log(`Falhou: ${ep.url} (${res.status})`);
        continue;
      }

      const data = await res.json();

      if (data.embedding) {
        console.log("Usando endpoint:", ep.url);
        return ep.extractor(data);
      }

    } catch (e) {
      console.log(`Erro em ${ep.url}:`, e.message);
    }
  }

  throw new Error("Nenhum endpoint de embedding funcionou.");
}

async function run() {
  const data = JSON.parse(fs.readFileSync("data.json"));
  const chunks = data.chunks;

  const enriched = [];

  for (let chunk of chunks) {
    const embedding = await embed(chunk.content);

    enriched.push({
      ...chunk,
      embedding
    });

    console.log(`Embedded: ${chunk.id}`);
  }

  fs.writeFileSync("db.json", JSON.stringify(enriched, null, 2));
}

run();