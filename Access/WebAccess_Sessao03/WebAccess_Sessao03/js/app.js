// WebAccess — Sessão 03: gerenciamento de registros
"use strict";

const pages = {
  inicio: { title: "Visão geral", eyebrow: "ÁREA DE TRABALHO", description: "Bem-vindo ao seu ambiente de gerenciamento de dados." },
  tabelas: { title: "Tabelas", eyebrow: "OBJETOS DO BANCO", description: "Crie tabelas e gerencie os registros armazenados." },
  consultas: { title: "Consultas SQL", eyebrow: "OBJETOS DO BANCO", description: "Escreva e execute instruções SQL sobre seu banco de dados." },
  relacionamentos: { title: "Relacionamentos", eyebrow: "OBJETOS DO BANCO", description: "Defina como as tabelas se relacionam entre si." },
  registros: { title: "Registros", eyebrow: "DADOS DA TABELA", description: "Visualize e gerencie os registros desta tabela." }
};

const DATA_TYPES = ["INTEGER", "TEXT", "REAL", "NUMERIC", "DATE", "BOOLEAN"];
const $ = selector => document.querySelector(selector);
let databaseName = "MeuBanco";
let tables = [];
let editingTableId = null;
let activeRecordTableId = null;
let editingRecordId = null;
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
    subtitle.textContent = `${table.fields.length} ${table.fields.length === 1 ? "campo" : "campos"} · ${table.records.length} ${table.records.length === 1 ? "registro" : "registros"}`;
    nameBlock.append(title, subtitle);
    identity.append(nameBlock);

    const actions = document.createElement("div");
    actions.className = "table-object-actions";

    const recordsButton = document.createElement("button");
    recordsButton.className = "button button-primary button-small";
    recordsButton.type = "button";
    recordsButton.textContent = "Abrir registros";
    recordsButton.addEventListener("click", () => openRecords(table.id));

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

    actions.append(recordsButton, editButton, deleteButton);
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

// ---------- Construtor de tabelas (Sessão 02) ----------
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
      $("#fieldRows").querySelectorAll(".field-pk").forEach(other => {
        if (other !== pk) other.checked = false;
      });
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
    const oldFields = tables[index].fields;
    const oldNames = oldFields.map(field => field.name);
    const newNames = fields.map(field => field.name);
    const incompatibleChange = tables[index].records.length > 0 &&
      (oldNames.length !== newNames.length || oldNames.some(fieldName => !newNames.includes(fieldName)));
    if (incompatibleChange && !confirm("A tabela possui registros. Alterar ou remover nomes de campos pode deixar dados antigos sem correspondência. Deseja continuar?")) return;

    const oldRecords = tables[index].records || [];
    const records = oldRecords.map(record => {
      const updated = {};
      fields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(record.values, field.name)) {
          updated[field.name] = record.values[field.name];
        } else {
          updated[field.name] = defaultValueForType(field.type);
        }
      });
      return { ...record, values: updated };
    });
    tables[index] = { ...tables[index], name, fields, records };
    showToast(`Estrutura da tabela "${name}" atualizada.`);
  } else {
    tables.push({ id: createId("tbl"), name, fields, records: [] });
    showToast(`Tabela "${name}" criada com sucesso.`);
  }
  closeTableEditor();
  updateTableCounters();
}

function createId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function deleteTable(tableId) {
  const table = tables.find(item => item.id === tableId);
  if (!table) return;
  if (!confirm(`Deseja realmente excluir a tabela "${table.name}" e seus ${table.records.length} registro(s)?`)) return;
  tables = tables.filter(item => item.id !== tableId);
  updateTableCounters();
  showToast(`Tabela "${table.name}" excluída.`);
}

// ---------- Registros (Sessão 03) ----------
function defaultValueForType(type) {
  if (type === "BOOLEAN") return false;
  return "";
}

function formatCell(value, type) {
  if (value === null || value === undefined || value === "") return "—";
  if (type === "BOOLEAN") return value ? "Sim" : "Não";
  return String(value);
}

function openRecords(tableId) {
  activeRecordTableId = tableId;
  renderRecordsView();
  navigate("registros");
}

function renderRecordsView() {
  const table = tables.find(item => item.id === activeRecordTableId);
  if (!table) {
    navigate("tabelas");
    return;
  }
  $("#recordTableName").textContent = table.name;
  $("#recordCountLabel").textContent = `${table.records.length} ${table.records.length === 1 ? "registro" : "registros"}`;
  const header = $("#recordsHeader");
  const body = $("#recordsBody");
  header.replaceChildren();
  body.replaceChildren();

  table.fields.forEach(field => {
    const th = document.createElement("th");
    th.textContent = field.name + (field.primaryKey ? "  🔑" : "");
    header.append(th);
  });
  const actionsTh = document.createElement("th");
  actionsTh.textContent = "Ações";
  header.append(actionsTh);

  if (table.records.length === 0) {
    $("#recordsEmpty").classList.remove("hidden");
    $("#recordsTableWrap").classList.add("hidden");
  } else {
    $("#recordsEmpty").classList.add("hidden");
    $("#recordsTableWrap").classList.remove("hidden");
    table.records.forEach(record => {
      const tr = document.createElement("tr");
      table.fields.forEach(field => {
        const td = document.createElement("td");
        td.textContent = formatCell(record.values[field.name], field.type);
        tr.append(td);
      });
      const actionsTd = document.createElement("td");
      actionsTd.className = "row-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "text-action";
      edit.textContent = "Editar";
      edit.addEventListener("click", () => openRecordEditor(record.id));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "text-action danger";
      remove.textContent = "Excluir";
      remove.addEventListener("click", () => deleteRecord(record.id));
      actionsTd.append(edit, remove);
      tr.append(actionsTd);
      body.append(tr);
    });
  }
}

function openRecordEditor(recordId = null) {
  const table = tables.find(item => item.id === activeRecordTableId);
  if (!table) return;
  editingRecordId = recordId;
  const record = recordId ? table.records.find(item => item.id === recordId) : null;
  $("#recordDialogTitle").textContent = record ? "Editar registro" : "Novo registro";
  $("#saveRecordBtn").textContent = record ? "Salvar alterações" : "Inserir registro";
  const fieldsContainer = $("#recordFields");
  fieldsContainer.replaceChildren();

  table.fields.forEach(field => {
    const wrap = document.createElement("div");
    wrap.className = "record-field";

    const label = document.createElement("label");
    label.className = "form-label";
    label.textContent = `${field.name}${field.primaryKey ? " (PK)" : ""} · ${field.type}`;

    let input;
    if (field.type === "BOOLEAN") {
      const select = document.createElement("select");
      select.className = "form-input record-input";
      [["false", "Não"], ["true", "Sim"]].forEach(([value, text]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        select.append(option);
      });
      input = select;
      const existing = record ? record.values[field.name] : false;
      input.value = String(Boolean(existing));
    } else {
      input = document.createElement("input");
      input.className = "form-input record-input";
      input.type = field.type === "DATE" ? "date" :
        (field.type === "INTEGER" || field.type === "REAL" || field.type === "NUMERIC") ? "number" : "text";
      if (field.type === "INTEGER") input.step = "1";
      if (field.type === "REAL" || field.type === "NUMERIC") input.step = "any";
      input.value = record && record.values[field.name] !== null && record.values[field.name] !== undefined
        ? record.values[field.name] : "";
      input.placeholder = field.type === "DATE" ? "AAAA-MM-DD" : `Informe ${field.name}`;
    }

    input.dataset.fieldName = field.name;
    input.dataset.fieldType = field.type;
    input.required = field.primaryKey;
    if (field.primaryKey && field.type === "INTEGER" && !record) {
      input.placeholder = "Gerado automaticamente se deixado vazio";
      input.required = false;
    }
    label.htmlFor = `record_${field.name}`;
    input.id = `record_${field.name}`;
    wrap.append(label, input);
    fieldsContainer.append(wrap);
  });

  $("#recordFormHint").textContent = "Campos PK são únicos. Para PK INTEGER, deixe vazio para gerar o próximo número automaticamente.";
  $("#recordDialog").showModal();
}

function closeRecordEditor() {
  $("#recordDialog").close();
  editingRecordId = null;
}

function parseRecordInput(input) {
  const type = input.dataset.fieldType;
  const raw = input.value.trim();
  if (raw === "") return type === "BOOLEAN" ? false : null;
  if (type === "INTEGER") {
    const value = Number(raw);
    if (!Number.isInteger(value)) throw new Error(`O campo "${input.dataset.fieldName}" precisa ser um número inteiro.`);
    return value;
  }
  if (type === "REAL" || type === "NUMERIC") {
    const value = Number(raw);
    if (!Number.isFinite(value)) throw new Error(`O campo "${input.dataset.fieldName}" precisa ser numérico.`);
    return value;
  }
  if (type === "BOOLEAN") return raw === "true";
  return raw;
}

function saveRecord(event) {
  event.preventDefault();
  const table = tables.find(item => item.id === activeRecordTableId);
  if (!table) return;

  try {
    const values = {};
    $("#recordFields").querySelectorAll(".record-input").forEach(input => {
      values[input.dataset.fieldName] = parseRecordInput(input);
    });

    const pkField = table.fields.find(field => field.primaryKey);
    if (pkField) {
      if ((values[pkField.name] === null || values[pkField.name] === "") &&
          pkField.type === "INTEGER" && !editingRecordId) {
        const numericKeys = table.records.map(record => Number(record.values[pkField.name])).filter(Number.isFinite);
        values[pkField.name] = (numericKeys.length ? Math.max(...numericKeys) : 0) + 1;
      }
      if (values[pkField.name] === null || values[pkField.name] === "") {
        throw new Error(`Informe um valor para a chave primária "${pkField.name}".`);
      }
      const duplicate = table.records.some(record =>
        record.id !== editingRecordId &&
        String(record.values[pkField.name]) === String(values[pkField.name])
      );
      if (duplicate) throw new Error(`Já existe um registro com a chave primária "${values[pkField.name]}".`);
    }

    if (editingRecordId) {
      const index = table.records.findIndex(record => record.id === editingRecordId);
      table.records[index] = { ...table.records[index], values };
      showToast("Registro atualizado com sucesso.");
    } else {
      table.records.push({ id: createId("rec"), values });
      showToast("Registro inserido com sucesso.");
    }

    closeRecordEditor();
    renderRecordsView();
    updateTableCounters();
  } catch (error) {
    showToast(error.message);
  }
}

function deleteRecord(recordId) {
  const table = tables.find(item => item.id === activeRecordTableId);
  const record = table?.records.find(item => item.id === recordId);
  if (!table || !record) return;
  if (!confirm("Deseja realmente excluir este registro?")) return;
  table.records = table.records.filter(item => item.id !== recordId);
  renderRecordsView();
  updateTableCounters();
  showToast("Registro excluído.");
}

// Navegação e ações gerais
document.querySelectorAll(".nav-item").forEach(button =>
  button.addEventListener("click", () => navigate(button.dataset.view))
);
document.querySelectorAll("[data-goto]").forEach(button =>
  button.addEventListener("click", () => navigate(button.dataset.goto))
);

$("#newTableBtn").addEventListener("click", () => { navigate("tabelas"); openTableEditor(); });
$("#newTableBtn2").addEventListener("click", () => openTableEditor());
$("#createPlaceholderBtn").addEventListener("click", () => openTableEditor());
$("#addFieldBtn").addEventListener("click", () => addFieldRow({ name: `campo_${$("#fieldRows").children.length + 1}`, type: "TEXT" }));
$("#tableForm").addEventListener("submit", saveTable);
$("#closeTableDialog").addEventListener("click", closeTableEditor);
$("#cancelTableBtn").addEventListener("click", closeTableEditor);

$("#newRecordBtn").addEventListener("click", () => openRecordEditor());
$("#emptyNewRecordBtn").addEventListener("click", () => openRecordEditor());
$("#backToTablesBtn").addEventListener("click", () => navigate("tabelas"));
$("#recordForm").addEventListener("submit", saveRecord);
$("#closeRecordDialog").addEventListener("click", closeRecordEditor);
$("#cancelRecordBtn").addEventListener("click", closeRecordEditor);

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
