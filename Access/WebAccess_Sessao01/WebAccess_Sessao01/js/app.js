// WebAccess — Sessão 01: navegação e interface inicial
"use strict";

const pages = {
  inicio: {
    title: "Visão geral",
    eyebrow: "ÁREA DE TRABALHO",
    description: "Bem-vindo ao seu ambiente de gerenciamento de dados."
  },
  tabelas: {
    title: "Tabelas",
    eyebrow: "OBJETOS DO BANCO",
    description: "Crie e organize as estruturas que armazenarão seus dados."
  },
  consultas: {
    title: "Consultas SQL",
    eyebrow: "OBJETOS DO BANCO",
    description: "Escreva e execute instruções SQL sobre seu banco de dados."
  },
  relacionamentos: {
    title: "Relacionamentos",
    eyebrow: "OBJETOS DO BANCO",
    description: "Defina como as tabelas se relacionam entre si."
  }
};

let databaseName = "MeuBanco";
let demoTables = [];

const $ = (selector) => document.querySelector(selector);

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function navigate(viewName) {
  const page = pages[viewName];
  if (!page) return;

  document.querySelectorAll(".view").forEach(view => view.classList.add("hidden"));
  const selectedView = $(`#view-${viewName}`);
  if (selectedView) selectedView.classList.remove("hidden");

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  $("#pageTitle").textContent = page.title;
  $("#pageDescription").textContent = page.description;
  $("#eyebrow").textContent = page.eyebrow;
  $("#headingActions").classList.toggle("hidden", viewName !== "inicio" && viewName !== "tabelas");
  $("#newTableBtn").classList.toggle("hidden", viewName !== "inicio");
}

function updateDatabaseName() {
  $("#databaseName").textContent = databaseName;
  document.title = `WebAccess — ${databaseName}`;
}

function updateTableCounters() {
  const count = demoTables.length;
  $("#tableCount").textContent = count;
  $("#statTables").textContent = count;
  $("#tablesEmpty").classList.toggle("hidden", count > 0);
  $("#tablesList").classList.toggle("hidden", count === 0);
  $("#tablesList").innerHTML = demoTables.map(table => `
    <div class="table-item">
      <span class="table-symbol">▦</span>
      <strong>${escapeHtml(table)}</strong>
      <small>Tabela demonstrativa</small>
    </div>
  `).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function createDemoTable() {
  const suggestion = `Tabela${demoTables.length + 1}`;
  const name = window.prompt("Nome da tabela de demonstração:", suggestion);
  if (name === null) return;
  const cleanName = name.trim();
  if (!cleanName) {
    showToast("Informe um nome para a tabela.");
    return;
  }
  if (demoTables.some(item => item.toLowerCase() === cleanName.toLowerCase())) {
    showToast("Já existe uma tabela com esse nome.");
    return;
  }
  demoTables.push(cleanName);
  updateTableCounters();
  showToast(`Tabela "${cleanName}" adicionada à demonstração.`);
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.view));
});

document.querySelectorAll("[data-goto]").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.goto));
});

$("#newTableBtn").addEventListener("click", () => {
  navigate("tabelas");
  createDemoTable();
});
$("#newTableBtn2").addEventListener("click", createDemoTable);
$("#createPlaceholderBtn").addEventListener("click", createDemoTable);

$("#renameDbBtn").addEventListener("click", () => {
  const newName = window.prompt("Nome do banco de dados:", databaseName);
  if (newName === null) return;
  if (!newName.trim()) {
    showToast("O nome do banco não pode ficar vazio.");
    return;
  }
  databaseName = newName.trim();
  updateDatabaseName();
  showToast("Nome do banco atualizado nesta sessão.");
});

const aboutDialog = $("#aboutDialog");
$("#aboutBtn").addEventListener("click", () => aboutDialog.showModal());
$("#closeAbout").addEventListener("click", () => aboutDialog.close());
$("#okAbout").addEventListener("click", () => aboutDialog.close());

updateDatabaseName();
updateTableCounters();
