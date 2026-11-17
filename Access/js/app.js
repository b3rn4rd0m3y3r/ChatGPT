// WebAccess — Sessão 10: Formulários e Relatórios
"use strict";

const pages = {
  inicio: { title: "Visão geral", eyebrow: "ÁREA DE TRABALHO", description: "Bem-vindo ao seu ambiente de gerenciamento de dados." },
  tabelas: { title: "Tabelas", eyebrow: "OBJETOS DO BANCO", description: "Crie tabelas e gerencie os registros armazenados." },
  consultas: { title: "Consultas SQL", eyebrow: "OBJETOS DO BANCO", description: "Consulte e altere os dados usando instruções SQL." },
  relacionamentos: { title: "Relacionamentos", eyebrow: "OBJETOS DO BANCO", description: "Defina como as tabelas se relacionam entre si." },
  registros: { title: "Registros", eyebrow: "DADOS DA TABELA", description: "Visualize e gerencie os registros desta tabela." },
  formularios: { title: "Formulários", eyebrow: "ENTRADA DE DADOS", description: "Cadastre, consulte, edite e exclua registros por formulários." },
  relatorios: { title: "Relatórios", eyebrow: "APRESENTAÇÃO DE DADOS", description: "Selecione campos, filtre registros e gere relatórios para impressão ou CSV." }
};

const DATA_TYPES = ["INTEGER", "TEXT", "REAL", "NUMERIC", "DATE", "BOOLEAN"];
const $ = selector => document.querySelector(selector);
let databaseName = "MeuBanco";
let tables = [];
let relationships = [];
let savedQueries = [];
let savedReports = [];
let reportRows = [];
let reportColumns = [];
let editingRelationshipId = null;
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
  $("#statRelationships").textContent = relationships.length;
  if ($("#statSavedQueries")) $("#statSavedQueries").textContent = savedQueries.length;
  $("#tablesEmpty").classList.toggle("hidden", count > 0);
  $("#tablesList").classList.toggle("hidden", count === 0);
  renderTables();
  renderRelationships();
  if (window.WebAccessPersistence) WebAccessPersistence.scheduleSave();
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
    const protectedFields = relationships
      .filter(rel => rel.parentTableId === editingTableId || rel.childTableId === editingTableId)
      .map(rel => rel.parentTableId === editingTableId ? rel.parentFieldName : rel.childFieldName);
    const removedRelationField = protectedFields.find(fieldName => oldNames.includes(fieldName) && !newNames.includes(fieldName));
    if (removedRelationField) {
      showToast(`O campo "${removedRelationField}" participa de um relacionamento. Exclua o relacionamento antes de remover esse campo.`);
      return;
    }
    const changedRelationType = protectedFields.find(fieldName => {
      const previous = oldFields.find(field => field.name === fieldName);
      const current = fields.find(field => field.name === fieldName);
      return previous && current && previous.type !== current.type;
    });
    if (changedRelationType) {
      showToast(`O tipo do campo "${changedRelationType}" está vinculado a um relacionamento. Exclua a ligação antes de alterar o tipo.`);
      return;
    }
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
  WebAccessPersistence.scheduleSave(); refreshFormTableOptions(); refreshReportTableOptions();
}

function createId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function deleteTable(tableId) {
  const table = tables.find(item => item.id === tableId);
  if (!table) return;
  const relatedCount = relationships.filter(rel => rel.parentTableId === tableId || rel.childTableId === tableId).length;
  const extra = relatedCount ? ` Também serão removido(s) ${relatedCount} relacionamento(s) associado(s).` : "";
  if (!confirm(`Deseja realmente excluir a tabela "${table.name}" e seus ${table.records.length} registro(s)?${extra}`)) return;
  tables = tables.filter(item => item.id !== tableId);
  relationships = relationships.filter(rel => rel.parentTableId !== tableId && rel.childTableId !== tableId);
  updateTableCounters();
  WebAccessPersistence.scheduleSave(); refreshFormTableOptions(); refreshReportTableOptions();
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

    const foreignKey = relationships.find(rel => rel.childTableId === table.id && rel.childFieldName === field.name);
    const parentTable = foreignKey ? tables.find(item => item.id === foreignKey.parentTableId) : null;
    const parentField = parentTable && foreignKey ? parentTable.fields.find(item => item.name === foreignKey.parentFieldName) : null;

    const label = document.createElement("label");
    label.className = "form-label";
    label.textContent = foreignKey
      ? `${field.name} (FK → ${parentTable?.name || "tabela"} . ${foreignKey.parentFieldName})`
      : `${field.name}${field.primaryKey ? " (PK)" : ""} · ${field.type}`;

    let input;
    if (foreignKey && parentTable && parentField) {
      input = document.createElement("select");
      input.className = "form-input record-input";
      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "— Não selecionado —";
      input.append(emptyOption);
      parentTable.records.forEach(parentRecord => {
        const value = parentRecord.values[parentField.name];
        if (value === null || value === undefined || value === "") return;
        const option = document.createElement("option");
        option.value = String(value);
        const labelField = parentTable.fields.find(item => !item.primaryKey && item.type === "TEXT");
        const labelValue = labelField ? parentRecord.values[labelField.name] : value;
        option.textContent = `${value}${labelField && labelValue ? " — " + labelValue : ""}`;
        input.append(option);
      });
      const currentValue = record ? record.values[field.name] : null;
      input.value = currentValue === null || currentValue === undefined ? "" : String(currentValue);
      input.dataset.foreignKey = "true";
    } else if (field.type === "BOOLEAN") {
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
    if (foreignKey) input.required = false;
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

      // Não permitir alterar uma PK que já esteja sendo utilizada por registros filhos.
      if (editingRecordId) {
        const previousRecord = table.records.find(record => record.id === editingRecordId);
        const previousKey = previousRecord?.values[pkField.name];
        if (String(previousKey) !== String(values[pkField.name])) {
          const referenced = relationships.some(rel => {
            if (rel.parentTableId !== table.id || rel.parentFieldName !== pkField.name) return false;
            const childTable = tables.find(item => item.id === rel.childTableId);
            return childTable?.records.some(childRecord =>
              String(childRecord.values[rel.childFieldName]) === String(previousKey)
            );
          });
          if (referenced) throw new Error("Esta chave primária está sendo utilizada por outra tabela e não pode ser alterada.");
        }
      }
    }

    // Integridade referencial: toda FK preenchida precisa existir na tabela principal.
    relationships.filter(rel => rel.childTableId === table.id).forEach(rel => {
      const parent = tables.find(item => item.id === rel.parentTableId);
      const fkValue = values[rel.childFieldName];
      if (fkValue === null || fkValue === undefined || fkValue === "") return; // FK opcional
      const parentField = parent?.fields.find(field => field.name === rel.parentFieldName);
      const exists = parent && parent.records.some(parentRecord =>
        String(parentRecord.values[rel.parentFieldName]) === String(fkValue)
      );
      if (!exists) {
        throw new Error(`Valor inválido em "${rel.childFieldName}". Selecione um registro existente de "${parent?.name || "tabela principal"}".`);
      }
      if (parentField?.type === "INTEGER") values[rel.childFieldName] = Number(fkValue);
      if (parentField?.type === "REAL" || parentField?.type === "NUMERIC") values[rel.childFieldName] = Number(fkValue);
    });

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
    WebAccessPersistence.scheduleSave();
    if (!$("#view-formularios").classList.contains("hidden")) renderFormBrowser();
    if (!$("#view-relatorios").classList.contains("hidden")) renderReportPreview();
  } catch (error) {
    showToast(error.message);
  }
}

function deleteRecord(recordId) {
  const table = tables.find(item => item.id === activeRecordTableId);
  const record = table?.records.find(item => item.id === recordId);
  if (!table || !record) return;
  const blockingRelations = relationships.filter(rel => rel.parentTableId === table.id);
  for (const rel of blockingRelations) {
    const childTable = tables.find(item => item.id === rel.childTableId);
    const parentValue = record.values[rel.parentFieldName];
    const used = childTable?.records.some(childRecord =>
      String(childRecord.values[rel.childFieldName]) === String(parentValue)
    );
    if (used) {
      showToast(`Não é possível excluir: há registros em "${childTable.name}" que utilizam esta chave.`);
      return;
    }
  }
  if (!confirm("Deseja realmente excluir este registro?")) return;
  table.records = table.records.filter(item => item.id !== recordId);
  renderRecordsView();
  updateTableCounters();
  WebAccessPersistence.scheduleSave();
  if (!$("#view-formularios").classList.contains("hidden")) renderFormBrowser();
  showToast("Registro excluído.");
}

// ---------- Formulários e relatórios — Sessão 10 ----------
function refreshFormTableOptions() {
  const select = $("#formTableSelect");
  const previous = select.value;
  select.replaceChildren(new Option("Selecione uma tabela", ""));
  tables.forEach(table => select.add(new Option(table.name, table.id)));
  select.value = tables.some(table => table.id === previous) ? previous : "";
  renderFormBrowser();
}

function renderFormBrowser() {
  const table = tables.find(item => item.id === $("#formTableSelect").value);
  const empty = $("#formBrowserEmpty"), content = $("#formBrowserContent");
  const add = $("#formNewRecordBtn");
  if (!table) {
    empty.classList.remove("hidden"); content.classList.add("hidden"); add.disabled = true; return;
  }
  empty.classList.add("hidden"); content.classList.remove("hidden"); add.disabled = false;
  $("#formBrowserSummary").textContent = `${table.name} · ${table.fields.length} campo(s) · ${table.records.length} registro(s)`;
  const head = $("#formBrowserHeader"), body = $("#formBrowserBody");
  head.replaceChildren(); body.replaceChildren();
  table.fields.forEach(field => { const th = document.createElement("th"); th.textContent = field.name + (field.primaryKey ? " 🔑" : ""); head.append(th); });
  const actionHead = document.createElement("th"); actionHead.textContent = "Ações"; head.append(actionHead);
  table.records.forEach(record => {
    const tr = document.createElement("tr");
    table.fields.forEach(field => { const td = document.createElement("td"); td.textContent = formatCell(record.values[field.name], field.type); tr.append(td); });
    const actions = document.createElement("td"); actions.className = "row-actions";
    const edit = document.createElement("button"); edit.type = "button"; edit.className = "text-action"; edit.textContent = "Editar";
    edit.addEventListener("click", () => { activeRecordTableId = table.id; openRecordEditor(record.id); });
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "text-action danger"; remove.textContent = "Excluir";
    remove.addEventListener("click", () => { activeRecordTableId = table.id; deleteRecord(record.id); });
    actions.append(edit, remove); tr.append(actions); body.append(tr);
  });
  $("#formNoRecords").classList.toggle("hidden", table.records.length > 0);
}

function refreshReportTableOptions() {
  const select = $("#reportTableSelect"), previous = select.value;
  select.replaceChildren(new Option("Selecione uma tabela", ""));
  tables.forEach(table => select.add(new Option(table.name, table.id)));
  select.value = tables.some(table => table.id === previous) ? previous : "";
  renderReportFields();
}

function renderReportFields(selectedNames = null) {
  const table = tables.find(item => item.id === $("#reportTableSelect").value);
  const target = $("#reportFields"); target.replaceChildren();
  if (!table) { const empty = document.createElement("div"); empty.className = "sql-empty"; empty.textContent = "Selecione uma tabela para listar seus campos."; target.append(empty); updateReportButtons(false); return; }
  table.fields.forEach(field => {
    const label = document.createElement("label"); label.className = "report-field-check";
    const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.value = field.name;
    checkbox.checked = selectedNames ? selectedNames.includes(field.name) : true;
    checkbox.addEventListener("change", renderReportPreview);
    const text = document.createElement("span"); text.textContent = `${field.name}${field.primaryKey ? " (PK)" : ""} · ${field.type}`;
    label.append(checkbox, text); target.append(label);
  });
  renderReportPreview();
}

function selectedReportFields() { return [...$("#reportFields").querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value); }
function updateReportButtons(enabled) {
  ["#saveReportBtn", "#exportReportBtn", "#printReportBtn"].forEach(selector => $(selector).disabled = !enabled);
}

function renderReportPreview() {
  const table = tables.find(item => item.id === $("#reportTableSelect").value);
  const target = $("#reportPreview"), title = $("#reportPreviewTitle"), meta = $("#reportPreviewMeta");
  target.replaceChildren(); reportRows = []; reportColumns = [];
  if (!table) { target.innerHTML = '<div class="sql-empty">Nenhum relatório gerado.</div>'; title.textContent = "Prévia do relatório"; meta.textContent = "O resultado aparecerá aqui após selecionar uma tabela."; updateReportButtons(false); return; }
  const columns = selectedReportFields();
  if (!columns.length) { target.innerHTML = '<div class="sql-empty">Marque pelo menos um campo para montar o relatório.</div>'; meta.textContent = "Nenhum campo selecionado."; updateReportButtons(false); return; }
  const term = $("#reportFilterInput").value.trim().toLocaleLowerCase();
  const rows = table.records.filter(record => !term || columns.some(name => String(record.values[name] ?? "").toLocaleLowerCase().includes(term)));
  reportColumns = columns; reportRows = rows.map(record => columns.map(name => record.values[name] ?? null));
  title.textContent = `Relatório — ${table.name}`;
  meta.textContent = `${rows.length} de ${table.records.length} registro(s) · ${columns.length} campo(s)`;
  const htmlTable = document.createElement("table"); htmlTable.className = "records-table report-table";
  const thead = document.createElement("thead"), headRow = document.createElement("tr");
  columns.forEach(name => { const th = document.createElement("th"); th.textContent = name; headRow.append(th); }); thead.append(headRow);
  const tbody = document.createElement("tbody");
  rows.forEach(record => { const tr = document.createElement("tr"); columns.forEach(name => { const td = document.createElement("td"); const field = table.fields.find(item => item.name === name); td.textContent = formatCell(record.values[name], field?.type); tr.append(td); }); tbody.append(tr); });
  htmlTable.append(thead, tbody); target.append(htmlTable); updateReportButtons(true);
}

function saveCurrentReport() {
  const table = tables.find(item => item.id === $("#reportTableSelect").value);
  const name = $("#reportNameInput").value.trim(), fields = selectedReportFields();
  if (!table) return showToast("Selecione uma tabela para o relatório.");
  if (!name) return showToast("Informe um nome para salvar o relatório.");
  if (!fields.length) return showToast("Selecione pelo menos um campo.");
  if (savedReports.some(report => report.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return showToast("Já existe um relatório com esse nome.");
  savedReports.push({ id: createId("rpt"), name, tableId: table.id, fields, filter: $("#reportFilterInput").value.trim(), createdAt: new Date().toISOString() });
  $("#reportNameInput").value = ""; renderSavedReports();
  WebAccessPersistence.saveNow().then(() => showToast("Definição do relatório salva.")).catch(error => showToast("Erro ao salvar relatório: " + error.message));
}

function renderSavedReports() {
  const list = $("#savedReportsList"), empty = $("#savedReportsEmpty"); list.replaceChildren();
  empty.classList.toggle("hidden", savedReports.length > 0); list.classList.toggle("hidden", savedReports.length === 0);
  savedReports.forEach(report => {
    const item = document.createElement("div"); item.className = "saved-report-item";
    const details = document.createElement("div"); details.className = "saved-query-details";
    const name = document.createElement("strong"); name.textContent = report.name;
    const table = tables.find(row => row.id === report.tableId);
    const info = document.createElement("small"); info.textContent = `${table?.name || "Tabela indisponível"} · ${(report.fields || []).join(", ")}`; details.append(name, info);
    const actions = document.createElement("div"); actions.className = "saved-query-actions";
    const load = document.createElement("button"); load.type = "button"; load.className = "button button-outline button-small"; load.textContent = "Carregar";
    load.addEventListener("click", () => {
      if (!table) return showToast("A tabela deste relatório não existe mais.");
      $("#reportTableSelect").value = table.id; $("#reportFilterInput").value = report.filter || ""; $("#reportNameInput").value = report.name; renderReportFields(report.fields || []); showToast("Definição carregada.");
    });
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "button button-danger button-small"; remove.textContent = "Excluir";
    remove.addEventListener("click", async () => { if (!confirm(`Excluir o relatório "${report.name}"?`)) return; savedReports = savedReports.filter(item => item.id !== report.id); renderSavedReports(); try { await WebAccessPersistence.saveNow(); showToast("Relatório excluído."); } catch (error) { showToast("Erro ao salvar exclusão: " + error.message); } });
    actions.append(load, remove); item.append(details, actions); list.append(item);
  });
}

function exportReportCsv() {
  if (!reportColumns.length) return;
  const escapeCsv = value => '"' + String(value ?? "").replace(/"/g, '""') + '"';
  const lines = [reportColumns.map(escapeCsv).join(";"), ...reportRows.map(row => row.map(escapeCsv).join(";"))];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  const table = tables.find(item => item.id === $("#reportTableSelect").value);
  link.href = url; link.download = `relatorio_${(table?.name || "dados").replace(/[^a-z0-9_-]/gi, "_")}.csv`;
  document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

function printReport() { if (!reportColumns.length) return; window.print(); }

// Editor SQL e gerenciamento da estrutura — Sessões 07 e 08
function renderSavedQueries() {
  const list = $("#savedQueriesList");
  const empty = $("#savedQueriesEmpty");
  if (!list || !empty) return;
  list.replaceChildren();
  empty.classList.toggle("hidden", savedQueries.length > 0);
  list.classList.toggle("hidden", savedQueries.length === 0);
  savedQueries.forEach(query => {
    const item = document.createElement("article");
    item.className = "saved-query-item";
    const details = document.createElement("div");
    details.className = "saved-query-details";
    const title = document.createElement("strong");
    title.textContent = query.name;
    const preview = document.createElement("code");
    preview.textContent = query.sql.replace(/\s+/g, " ").trim();
    details.append(title, preview);
    const actions = document.createElement("div");
    actions.className = "saved-query-actions";
    const load = document.createElement("button");
    load.type = "button"; load.className = "button button-outline button-small"; load.textContent = "Carregar";
    load.addEventListener("click", () => { $("#sqlEditor").value = query.sql; $("#sqlEditor").focus(); showToast("Consulta carregada no editor."); });
    const run = document.createElement("button");
    run.type = "button"; run.className = "button button-primary button-small"; run.textContent = "Executar";
    run.addEventListener("click", async () => { $("#sqlEditor").value = query.sql; await runSqlEditor(); });
    const remove = document.createElement("button");
    remove.type = "button"; remove.className = "button button-danger button-small"; remove.textContent = "Excluir";
    remove.addEventListener("click", async () => {
      if (!confirm(`Excluir a consulta "${query.name}"?`)) return;
      savedQueries = savedQueries.filter(item => item.id !== query.id);
      renderSavedQueries();
      try { await WebAccessPersistence.saveNow(); showToast("Consulta excluída."); }
      catch (error) { showToast("Não foi possível salvar a exclusão: " + error.message); }
    });
    actions.append(load, run, remove);
    item.append(details, actions);
    list.append(item);
  });
}

function saveCurrentQuery() {
  const name = $("#savedQueryName").value.trim();
  const sql = $("#sqlEditor").value.trim();
  if (!name) return showToast("Informe um nome para a consulta.");
  const normalized = sql.replace(/^(?:\s|--[^\n]*\n|\/\*[\s\S]*?\*\/)+/g, "").trim();
  if (!/^SELECT\b/i.test(normalized)) return showToast("Somente instruções SELECT podem ser salvas nesta etapa.");
  if (sql.includes(";") && sql.slice(sql.indexOf(";") + 1).trim()) return showToast("Salve apenas uma instrução SQL por consulta.");
  if (savedQueries.some(query => query.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return showToast("Já existe uma consulta com esse nome.");
  savedQueries.push({ id: `qry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, name, sql, createdAt: new Date().toISOString() });
  $("#savedQueryName").value = "";
  renderSavedQueries();
  WebAccessPersistence.saveNow().then(() => showToast("Consulta salva no banco e no backup JSON.")).catch(error => showToast("Erro ao salvar consulta: " + error.message));
}

function renderSqlResults(results) {
  const target = $("#sqlResult");
  target.replaceChildren();
  if (!results || !results.length) {
    target.innerHTML = '<div class="sql-empty">A consulta não retornou uma grade de resultados.</div>';
    return;
  }
  const result = results[0];
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  result.columns.forEach(column => { const th = document.createElement('th'); th.textContent = column; headRow.append(th); });
  thead.append(headRow);
  const tbody = document.createElement('tbody');
  result.values.forEach(row => {
    const tr = document.createElement('tr');
    row.forEach(value => { const td = document.createElement('td'); td.textContent = value === null ? 'NULL' : String(value); td.title = td.textContent; tr.append(td); });
    tbody.append(tr);
  });
  table.append(thead, tbody); target.append(table);
}

async function runSqlEditor() {
  const button = $("#runSqlBtn");
  const meta = $("#sqlResultMeta");
  button.disabled = true; button.textContent = 'Executando...';
  try {
    const result = await WebAccessSQLite.execute(
      $("#sqlEditor").value,
      () => ({ format: 'WebAccess', version: 1, databaseName, tables, relationships, savedQueries, savedReports, savedAt: new Date().toISOString() }),
      data => { databaseName = data.databaseName; tables = data.tables; relationships = data.relationships; savedQueries = Array.isArray(data.savedQueries) ? data.savedQueries : []; savedReports = Array.isArray(data.savedReports) ? data.savedReports : []; updateDatabaseName(); updateTableCounters(); renderSavedQueries(); renderSavedReports(); refreshFormTableOptions(); refreshReportTableOptions(); },
      () => WebAccessPersistence.saveNow()
    );
    if (result.command === 'SELECT') {
      renderSqlResults(result.results);
      const count = result.results[0]?.values.length ?? 0;
      meta.textContent = `${count} registro(s) retornado(s).`;
    } else {
      $("#sqlResult").innerHTML = `<div class="sql-success">Comando ${result.command} executado. ${result.changed} registro(s) afetado(s). Alterações salvas no navegador.</div>`;
      meta.textContent = 'Execução concluída e persistida.';
    }
  } catch (error) {
    $("#sqlResult").innerHTML = '';
    const message = document.createElement('div'); message.className = 'sql-error'; message.textContent = error.message || String(error); $("#sqlResult").append(message);
    meta.textContent = 'A execução apresentou um erro.';
  } finally {
    button.disabled = false; button.textContent = '▶ Executar SQL';
  }
}

$("#runSqlBtn").addEventListener('click', runSqlEditor);
$("#saveQueryBtn").addEventListener('click', saveCurrentQuery);
$("#clearSqlBtn").addEventListener('click', () => { $("#sqlEditor").value = ''; $("#sqlResult").innerHTML = '<div class="sql-empty">O resultado da execução aparecerá aqui.</div>'; $("#sqlResultMeta").textContent = 'Editor limpo.'; });
document.querySelectorAll('[data-sql]').forEach(button => button.addEventListener('click', () => { $("#sqlEditor").value = button.dataset.sql; $("#sqlEditor").focus(); }));
$("#sqlEditor").addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); runSqlEditor(); } });

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
  WebAccessPersistence.scheduleSave();
  showToast("Nome do banco atualizado.");
});
const aboutDialog = $("#aboutDialog");
$("#aboutBtn").addEventListener("click", () => aboutDialog.showModal());
$("#closeAbout").addEventListener("click", () => aboutDialog.close());
$("#okAbout").addEventListener("click", () => aboutDialog.close());

// ---------- Relacionamentos e integridade referencial (Sessão 04) ----------
function getTableById(tableId) {
  return tables.find(table => table.id === tableId);
}

function renderRelationships() {
  const list = $("#relationshipsList");
  if (!list) return;
  const empty = $("#relationshipsEmpty");
  empty.classList.toggle("hidden", relationships.length > 0);
  list.classList.toggle("hidden", relationships.length === 0);
  list.replaceChildren();

  relationships.forEach(rel => {
    const parent = getTableById(rel.parentTableId);
    const child = getTableById(rel.childTableId);
    if (!parent || !child) return;

    const card = document.createElement("article");
    card.className = "relationship-card";

    const parentBox = document.createElement("div");
    parentBox.className = "relationship-table-box";
    parentBox.innerHTML = `<span class="relation-card-icon">▦</span><div><small>TABELA PRINCIPAL · 1</small><strong>${escapeHtml(parent.name)}</strong><span>${escapeHtml(rel.parentFieldName)} <b>PK</b></span></div>`;

    const connector = document.createElement("div");
    connector.className = "relationship-connector";
    connector.innerHTML = '<span>1</span><i></i><span>N</span>';

    const childBox = document.createElement("div");
    childBox.className = "relationship-table-box";
    childBox.innerHTML = `<span class="relation-card-icon child">▦</span><div><small>TABELA RELACIONADA · N</small><strong>${escapeHtml(child.name)}</strong><span>${escapeHtml(rel.childFieldName)} <b class="fk-tag">FK</b></span></div>`;

    const remove = document.createElement("button");
    remove.className = "button button-danger button-small relationship-delete";
    remove.type = "button";
    remove.textContent = "Excluir ligação";
    remove.addEventListener("click", () => deleteRelationship(rel.id));

    card.append(parentBox, connector, childBox, remove);
    list.append(card);
  });
}

function fillSelect(select, options, placeholder) {
  select.replaceChildren();
  const first = document.createElement("option");
  first.value = "";
  first.textContent = placeholder;
  select.append(first);
  options.forEach(item => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    select.append(option);
  });
}

function refreshRelationshipFields() {
  const parent = getTableById($("#parentTableSelect").value);
  const child = getTableById($("#childTableSelect").value);
  const parentFields = parent ? parent.fields.filter(field => field.primaryKey) : [];
  fillSelect($("#parentFieldSelect"), parentFields.map(field => ({
    value: field.name, label: `${field.name} (${field.type})`
  })), parentFields.length ? "Selecione a PK" : "Tabela sem chave primária");

  const selectedParentField = parentFields.find(field => field.name === $("#parentFieldSelect").value) || parentFields[0];
  if (selectedParentField && $("#parentFieldSelect").value !== selectedParentField.name) {
    $("#parentFieldSelect").value = selectedParentField.name;
  }

  const availableChildFields = child && selectedParentField
    ? child.fields.filter(field => !field.primaryKey && field.type === selectedParentField.type &&
        !relationships.some(rel => rel.id !== editingRelationshipId && rel.childTableId === child.id && rel.childFieldName === field.name))
    : [];
  fillSelect($("#childFieldSelect"), availableChildFields.map(field => ({
    value: field.name, label: `${field.name} (${field.type})`
  })), availableChildFields.length ? "Selecione o campo FK" : "Nenhum campo compatível disponível");

  $("#relationshipHint").textContent = selectedParentField
    ? `A FK deve ter o mesmo tipo da PK (${selectedParentField.type}). O campo relacionado não pode ser a chave primária da tabela filha.`
    : "Escolha uma tabela principal que possua uma chave primária.";
}

function openRelationshipEditor() {
  if (tables.length < 2) {
    showToast("Crie pelo menos duas tabelas antes de definir um relacionamento.");
    navigate("tabelas");
    return;
  }
  editingRelationshipId = null;
  $("#relationshipDialogTitle").textContent = "Novo relacionamento";
  $("#saveRelationshipBtn").textContent = "Salvar relacionamento";

  const parentOptions = tables.map(table => ({ value: table.id, label: table.name }));
  const childOptions = tables.map(table => ({ value: table.id, label: table.name }));
  fillSelect($("#parentTableSelect"), parentOptions, "Selecione a tabela principal");
  fillSelect($("#childTableSelect"), childOptions, "Selecione a tabela relacionada");

  const parentWithPk = tables.find(table => table.fields.some(field => field.primaryKey));
  const childDifferent = tables.find(table => table.id !== parentWithPk?.id);
  if (parentWithPk) $("#parentTableSelect").value = parentWithPk.id;
  if (childDifferent) $("#childTableSelect").value = childDifferent.id;
  refreshRelationshipFields();
  $("#relationshipDialog").showModal();
}

function closeRelationshipEditor() {
  $("#relationshipDialog").close();
  editingRelationshipId = null;
}

function saveRelationship(event) {
  event.preventDefault();
  const parent = getTableById($("#parentTableSelect").value);
  const child = getTableById($("#childTableSelect").value);
  const parentFieldName = $("#parentFieldSelect").value;
  const childFieldName = $("#childFieldSelect").value;
  if (!parent || !child) return showToast("Selecione as duas tabelas.");
  if (parent.id === child.id) return showToast("Para este projeto, selecione duas tabelas diferentes.");
  const parentField = parent.fields.find(field => field.name === parentFieldName && field.primaryKey);
  const childField = child.fields.find(field => field.name === childFieldName);
  if (!parentField) return showToast("A tabela principal precisa ter uma chave primária selecionada.");
  if (!childField) return showToast("Selecione um campo da tabela relacionada.");
  if (childField.primaryKey) return showToast("O campo FK não pode ser a chave primária da tabela relacionada.");
  if (parentField.type !== childField.type) return showToast("Os tipos da PK e da FK precisam ser iguais.");

  const alreadyExists = relationships.some(rel =>
    rel.parentTableId === parent.id && rel.parentFieldName === parentField.name &&
    rel.childTableId === child.id && rel.childFieldName === childField.name
  );
  if (alreadyExists) return showToast("Este relacionamento já existe.");
  const childFieldAlreadyUsed = relationships.some(rel =>
    rel.childTableId === child.id && rel.childFieldName === childField.name
  );
  if (childFieldAlreadyUsed) return showToast("Este campo já está sendo utilizado como chave estrangeira.");

  const existingChildValues = child.records
    .map(record => record.values[childField.name])
    .filter(value => value !== null && value !== undefined && value !== "");
  const parentValues = new Set(parent.records.map(record => String(record.values[parentField.name])));
  const invalidExistingValue = existingChildValues.find(value => !parentValues.has(String(value)));
  if (invalidExistingValue !== undefined) {
    return showToast(`Não é possível criar a ligação: já existe o valor "${invalidExistingValue}" em ${child.name}.${childField.name} sem correspondente em ${parent.name}.${parentField.name}.`);
  }

  relationships.push({
    id: createId("rel"),
    parentTableId: parent.id,
    parentFieldName: parentField.name,
    childTableId: child.id,
    childFieldName: childField.name,
    cardinality: "1:N"
  });
  closeRelationshipEditor();
  updateTableCounters();
  showToast(`Relacionamento ${parent.name} → ${child.name} criado.`);
}

function deleteRelationship(relationshipId) {
  const rel = relationships.find(item => item.id === relationshipId);
  if (!rel) return;
  const parent = getTableById(rel.parentTableId);
  const child = getTableById(rel.childTableId);
  if (!confirm(`Excluir o relacionamento entre "${parent?.name}" e "${child?.name}"? Os valores já gravados nos registros serão mantidos, mas deixarão de ser validados como FK.`)) return;
  relationships = relationships.filter(item => item.id !== relationshipId);
  updateTableCounters();
  showToast("Relacionamento excluído.");
}

$("#newRelationshipBtn").addEventListener("click", openRelationshipEditor);
$("#emptyNewRelationshipBtn").addEventListener("click", openRelationshipEditor);
$("#parentTableSelect").addEventListener("change", refreshRelationshipFields);
$("#parentFieldSelect").addEventListener("change", refreshRelationshipFields);
$("#childTableSelect").addEventListener("change", refreshRelationshipFields);
$("#relationshipForm").addEventListener("submit", saveRelationship);
$("#closeRelationshipDialog").addEventListener("click", closeRelationshipEditor);
$("#cancelRelationshipBtn").addEventListener("click", closeRelationshipEditor);

// Eventos da Sessão 10 — Formulários e Relatórios.
$("#formTableSelect").addEventListener("change", () => { activeRecordTableId = $("#formTableSelect").value || null; renderFormBrowser(); });
$("#formNewRecordBtn").addEventListener("click", () => { activeRecordTableId = $("#formTableSelect").value; openRecordEditor(); });
$("#reportTableSelect").addEventListener("change", () => renderReportFields());
$("#reportFilterInput").addEventListener("input", renderReportPreview);
$("#saveReportBtn").addEventListener("click", saveCurrentReport);
$("#exportReportBtn").addEventListener("click", exportReportCsv);
$("#printReportBtn").addEventListener("click", printReport);

// Exportação e importação de backups JSON.
$("#exportDbBtn").addEventListener("click", () => {
  try {
    WebAccessPersistence.exportJSON();
    showToast("Backup JSON exportado.");
  } catch (error) {
    console.error("Erro na exportação:", error);
    showToast("Não foi possível exportar o banco.");
  }
});

$("#importDbBtn").addEventListener("click", () => $("#importDbFile").click());

$("#importDbFile").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imported = await WebAccessPersistence.importJSON(file);
    if (imported) showToast("Banco importado e salvo com sucesso.");
  } catch (error) {
    console.error("Erro na importação:", error);
    showToast("Erro na importação: " + error.message);
  } finally {
    event.target.value = "";
  }
});

async function startWebAccess() {
  try {
    await WebAccessPersistence.initialize({
      getSnapshot: () => ({
        format: "WebAccess",
        version: 1,
        databaseName,
        tables,
        relationships,
        savedQueries,
        savedReports,
        savedAt: new Date().toISOString()
      }),
      applySnapshot: data => {
        databaseName = data.databaseName || "MeuBanco";
        tables = data.tables;
        relationships = data.relationships;
        savedQueries = Array.isArray(data.savedQueries) ? data.savedQueries : []; savedReports = Array.isArray(data.savedReports) ? data.savedReports : [];
      },
      afterRestore: () => {
        updateDatabaseName();
        updateTableCounters();
        renderSavedQueries();
        renderSavedReports(); refreshFormTableOptions(); refreshReportTableOptions();
      }
    });
    console.log("WebAccess iniciado com persistência local.");
    try {
      await WebAccessSQLite.initialize(() => ({
        format: "WebAccess",
        version: 1,
        databaseName,
        tables,
        relationships,
        savedQueries,
        savedReports,
        savedAt: new Date().toISOString()
      }), data => {
        databaseName = data.databaseName || databaseName;
        tables = data.tables;
        relationships = data.relationships;
        savedQueries = Array.isArray(data.savedQueries) ? data.savedQueries : []; savedReports = Array.isArray(data.savedReports) ? data.savedReports : [];
        updateDatabaseName();
        updateTableCounters();
        renderSavedQueries();
        renderSavedReports(); refreshFormTableOptions(); refreshReportTableOptions();
      });
    } catch (sqliteError) {
      console.error("Falha ao inicializar o mecanismo SQLite:", sqliteError);
      showToast("O banco foi recuperado, mas o mecanismo SQLite não iniciou. Consulte o console.");
    }
  } catch (error) {
    console.error("Falha na inicialização do WebAccess:", error);
    const status = $("#storageStatus");
    if (status) {
      status.textContent = "Erro no armazenamento";
      status.className = "storage-status error";
    }
    updateDatabaseName();
    updateTableCounters();
    showToast("Não foi possível abrir o armazenamento local. Consulte o console.");
  }
}

startWebAccess();
