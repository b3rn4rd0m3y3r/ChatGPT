// WebAccess — Sessão 02: construtor de tabelas
"use strict";

const pages = {
  inicio: { title: "Visão geral", eyebrow: "ÁREA DE TRABALHO", description: "Bem-vindo ao seu ambiente de gerenciamento de dados." },
  tabelas: { title: "Tabelas", eyebrow: "OBJETOS DO BANCO", description: "Crie e organize as estruturas que armazenarão seus dados." },
  consultas: { title: "Consultas SQL", eyebrow: "OBJETOS DO BANCO", description: "Escreva e execute instruções SQL sobre seu banco de dados." },
  relacionamentos: { title: "Relacionamentos", eyebrow: "OBJETOS DO BANCO", description: "Defina como as tabelas se relacionam entre si." }
};

const DATA_TYPES = ["INTEGER", "TEXT", "REAL", "NUMERIC", "DATE", "BOOLEAN"];
const $ = selector => document.querySelector(selector);
let databaseName = "MeuBanco";
let tables = [];
let editingTableId = null;
let toastTimer = null;

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function navigate(viewName) {
  const page = pages[viewName];
  if (!page) return;
  document.querySelectorAll(".view").forEach(view => view.classList.add("hidden"));
  $(`#view-${viewName}`).classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === viewName));
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
  const count = tables.length;
  $("#tableCount").textContent = count;
  $("#statTables").textContent = count;
  $("#tablesEmpty").classList.toggle("hidden", count > 0);
  $("#tablesList").classList.toggle("hidden", count === 0);
  renderTables();
}

function renderTables() {
  const container = $("#tablesList");
  container.replaceChildren();
  tables.forEach(table => {
    const card = document.createElement("article");
    card.className = "table-object";
    const header = document.createElement("div");
    header.className = "table-object-header";
    const identity = document.createElement("div");
    identity.className = "table-object-identity";
    identity.innerHTML = '<span class="table-object-icon">▦</span>';
    const nameBlock = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = table.name;
    const subtitle = document.createElement("small");
    subtitle.textContent = `${table.fields.length} ${table.fields.length === 1 ? "campo" : "campos"}`;
    nameBlock.append(title, subtitle);
    identity.append(nameBlock);
    const actions = document.createElement("div");
    actions.className = "table-object-actions";
    const editButton = document.createElement("button");
    editButton.className = "button button-outline button-small";
    editButton.type = "button";
    editButton.textContent = "Editar estrutura";
    editButton.addEventListener("click", () => openTableEditor(table.id));
    const deleteButton = document.createElement("button");
    deleteButton.className = "button button-danger button-small";
    deleteButton.type = "button";
    deleteButton.textContent = "Excluir";
    deleteButton.addEventListener("click", () => deleteTable(table.id));
    actions.append(editButton, deleteButton);
    header.append(identity, actions);
    const fields = document.createElement("div");
    fields.className = "field-chips";
    table.fields.forEach(field => {
      const chip = document.createElement("span");
      chip.className = "field-chip";
      chip.innerHTML = `<b>${escapeHtml(field.name)}</b><small>${escapeHtml(field.type)}</small>${field.primaryKey ? '<i title="Chave primária">PK</i>' : ""}`;
      fields.append(chip);
    });
    card.append(header, fields);
    container.append(card);
  });
}

function addFieldRow(field = {}) {
  const row = document.createElement("div");
  row.className = "field-row";
  const name = document.createElement("input");
  name.type = "text";
  name.className = "form-input field-name";
  name.maxLength = 60;
  name.placeholder = "Ex.: id_cliente";
  name.value = field.name || "";
  name.required = true;
  name.autocomplete = "off";
  const type = document.createElement("select");
  type.className = "form-input field-type";
  DATA_TYPES.forEach(dataType => {
    const option = document.createElement("option");
    option.value = dataType;
    option.textContent = dataType;
    type.append(option);
  });
  type.value = field.type || "TEXT";
  const pkWrap = document.createElement("label");
  pkWrap.className = "pk-check";
  const pk = document.createElement("input");
  pk.type = "checkbox";
  pk.className = "field-pk";
  pk.checked = Boolean(field.primaryKey);
  pk.title = "Definir como chave primária";
  pk.addEventListener("change", () => {
    if (pk.checked) {
      $("#fieldRows").querySelectorAll(".field-pk").forEach(other => { if (other !== pk) other.checked = false; });
    }
  });
  pkWrap.append(pk, document.createTextNode(" PK"));
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove-field";
  remove.title = "Remover campo";
  remove.setAttribute("aria-label", "Remover campo");
  remove.textContent = "×";
  remove.addEventListener("click", () => {
    if ($("#fieldRows").children.length === 1) {
      showToast("A tabela precisa ter pelo menos um campo.");
      return;
    }
    row.remove();
  });
  row.append(name, type, pkWrap, remove);
  $("#fieldRows").append(row);
}

function openTableEditor(tableId = null) {
  editingTableId = tableId;
  const table = tableId ? tables.find(item => item.id === tableId) : null;
  $("#tableDialogTitle").textContent = table ? "Editar tabela" : "Nova tabela";
  $("#saveTableBtn").textContent = table ? "Salvar alterações" : "Salvar tabela";
  $("#tableNameInput").value = table ? table.name : "";
  $("#fieldRows").replaceChildren();
  if (table) table.fields.forEach(field => addFieldRow(field));
  else addFieldRow({ name: "id", type: "INTEGER", primaryKey: true });
  $("#tableDialog").showModal();
  setTimeout(() => $("#tableNameInput").focus(), 30);
}

function closeTableEditor() {
  $("#tableDialog").close();
  editingTableId = null;
}

function saveTable(event) {
  event.preventDefault();
  const name = $("#tableNameInput").value.trim();
  if (!name) return showToast("Informe o nome da tabela.");
  const duplicateTable = tables.some(table => table.name.toLowerCase() === name.toLowerCase() && table.id !== editingTableId);
  if (duplicateTable) return showToast("Já existe uma tabela com esse nome.");

  const rows = [...$("#fieldRows").querySelectorAll(".field-row")];
  if (!rows.length) return showToast("Adicione pelo menos um campo.");
  const fields = rows.map(row => ({
    name: row.querySelector(".field-name").value.trim(),
    type: row.querySelector(".field-type").value,
    primaryKey: row.querySelector(".field-pk").checked
  }));
  if (fields.some(field => !field.name)) return showToast("Todos os campos precisam ter um nome.");
  const names = fields.map(field => field.name.toLowerCase());
  if (new Set(names).size !== names.length) return showToast("Não pode haver nomes de campos repetidos.");
  if (fields.filter(field => field.primaryKey).length > 1) return showToast("Defina apenas uma chave primária.");

  if (editingTableId) {
    const index = tables.findIndex(table => table.id === editingTableId);
    tables[index] = { ...tables[index], name, fields };
    showToast(`Estrutura da tabela "${name}" atualizada.`);
  } else {
    tables.push({ id: createId(), name, fields });
    showToast(`Tabela "${name}" criada com sucesso.`);
  }
  closeTableEditor();
  updateTableCounters();
}

function createId() {
  return `tbl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function deleteTable(tableId) {
  const table = tables.find(item => item.id === tableId);
  if (!table) return;
  if (!confirm(`Deseja realmente excluir a tabela "${table.name}"?`)) return;
  tables = tables.filter(item => item.id !== tableId);
  updateTableCounters();
  showToast(`Tabela "${table.name}" excluída.`);
}

// Navegação
 document.querySelectorAll(".nav-item").forEach(button => button.addEventListener("click", () => navigate(button.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.goto)));

// Ações das tabelas
$("#newTableBtn").addEventListener("click", () => { navigate("tabelas"); openTableEditor(); });
$("#newTableBtn2").addEventListener("click", () => openTableEditor());
$("#createPlaceholderBtn").addEventListener("click", () => openTableEditor());
$("#addFieldBtn").addEventListener("click", () => addFieldRow({ name: `campo_${$("#fieldRows").children.length + 1}`, type: "TEXT" }));
$("#tableForm").addEventListener("submit", saveTable);
$("#closeTableDialog").addEventListener("click", closeTableEditor);
$("#cancelTableBtn").addEventListener("click", closeTableEditor);

// Banco e janela Sobre
$("#renameDbBtn").addEventListener("click", () => {
  const newName = prompt("Nome do banco de dados:", databaseName);
  if (newName === null) return;
  if (!newName.trim()) return showToast("O nome do banco não pode ficar vazio.");
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
