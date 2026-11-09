// WebAccess — Sessão 05: persistência local com IndexedDB e backup JSON
"use strict";

window.WebAccessPersistence = (() => {
  const DB_NAME = "WebAccessStorage";
  const DB_VERSION = 1;
  const STORE_NAME = "bancos";
  const RECORD_KEY = "banco_atual";
  let db = null;
  let ready = false;
  let saveTimer = null;
  let getSnapshotCallback = null;
  let applySnapshotCallback = null;
  let afterRestoreCallback = null;
  let saving = false;

  function setStatus(message, state = "") {
    const element = document.querySelector("#storageStatus");
    if (!element) return;
    element.textContent = message;
    element.className = `storage-status ${state}`.trim();
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("Este navegador não oferece suporte ao armazenamento IndexedDB."));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Não foi possível abrir o armazenamento local."));
      request.onblocked = () => reject(new Error("O armazenamento está bloqueado por outra aba do WebAccess. Feche as outras abas e tente novamente."));
    });
  }

  function readSavedRecord() {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(RECORD_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Não foi possível ler o banco salvo."));
      transaction.onabort = () => reject(transaction.error || new Error("A leitura do banco foi cancelada."));
    });
  }

  function writeRecord(record) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Não foi possível gravar os dados."));
      transaction.onabort = () => reject(transaction.error || new Error("A gravação foi cancelada."));
    });
  }

  function validateDatabase(data) {
    if (!data || data.format !== "WebAccess" || !Array.isArray(data.tables) || !Array.isArray(data.relationships)) {
      throw new Error("O arquivo não contém um backup válido do WebAccess.");
    }
    if (typeof data.databaseName !== "string" || !data.databaseName.trim()) {
      throw new Error("O backup não contém um nome válido para o banco.");
    }

    const tableIds = new Set();
    for (const table of data.tables) {
      if (!table || typeof table.id !== "string" || !table.id || typeof table.name !== "string" || !table.name.trim() || !Array.isArray(table.fields) || !Array.isArray(table.records)) {
        throw new Error("Foi encontrada uma tabela com estrutura inválida no backup.");
      }
      if (tableIds.has(table.id)) throw new Error("O backup contém identificadores de tabela repetidos.");
      tableIds.add(table.id);
      const fieldNames = new Set();
      for (const field of table.fields) {
        if (!field || typeof field.name !== "string" || !field.name.trim() || typeof field.type !== "string") {
          throw new Error(`A tabela ${table.name} contém um campo inválido.`);
        }
        if (fieldNames.has(field.name)) throw new Error(`A tabela ${table.name} contém campos com nomes repetidos.`);
        fieldNames.add(field.name);
      }
      const recordIds = new Set();
      for (const record of table.records) {
        if (!record || typeof record.id !== "string" || !record.id || !record.values || typeof record.values !== "object" || Array.isArray(record.values)) {
          throw new Error(`A tabela ${table.name} contém um registro inválido.`);
        }
        if (recordIds.has(record.id)) throw new Error(`A tabela ${table.name} contém identificadores de registro repetidos.`);
        recordIds.add(record.id);
      }
    }

    const relationIds = new Set();
    const childFieldsUsed = new Set();
    for (const rel of data.relationships) {
      if (!rel || typeof rel.id !== "string" || !rel.id) throw new Error("Foi encontrado um relacionamento inválido no backup.");
      if (relationIds.has(rel.id)) throw new Error("O backup contém identificadores de relacionamento repetidos.");
      relationIds.add(rel.id);
      const parent = data.tables.find(table => table.id === rel.parentTableId);
      const child = data.tables.find(table => table.id === rel.childTableId);
      if (!parent || !child || parent.id === child.id) throw new Error("Um relacionamento aponta para uma tabela inexistente ou inválida.");
      const parentField = parent.fields.find(field => field.name === rel.parentFieldName && field.primaryKey);
      const childField = child.fields.find(field => field.name === rel.childFieldName);
      if (!parentField || !childField || childField.primaryKey || parentField.type !== childField.type) {
        throw new Error("Um relacionamento possui campos incompatíveis no backup.");
      }
      const childFieldKey = `${child.id}::${childField.name}`;
      if (childFieldsUsed.has(childFieldKey)) throw new Error("Um campo da tabela relacionada está associado a mais de um relacionamento.");
      childFieldsUsed.add(childFieldKey);
      const parentValues = new Set(parent.records.map(record => String(record.values[parentField.name])));
      for (const record of child.records) {
        const value = record.values[childField.name];
        if (value !== null && value !== undefined && value !== "" && !parentValues.has(String(value))) {
          throw new Error(`O valor de ${child.name}.${childField.name} não encontra correspondente em ${parent.name}.${parentField.name}.`);
        }
      }
    }
    return data;
  }

  function createSnapshot() {
    const snapshot = getSnapshotCallback();
    return JSON.parse(JSON.stringify(snapshot));
  }

  async function saveNow() {
    if (!ready || !db) return false;
    clearTimeout(saveTimer);
    if (saving) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (saving) return saveNow();
    }
    saving = true;
    setStatus("Salvando...", "saving");
    try {
      const snapshot = createSnapshot();
      await writeRecord({ id: RECORD_KEY, data: snapshot, updatedAt: new Date().toISOString() });
      setStatus("Salvo neste navegador", "saved");
      return true;
    } catch (error) {
      setStatus("Erro ao salvar", "error");
      throw error;
    } finally {
      saving = false;
    }
  }

  function scheduleSave() {
    if (!ready) return;
    clearTimeout(saveTimer);
    setStatus("Alterações pendentes...", "saving");
    saveTimer = setTimeout(() => {
      saveNow().catch(error => console.error("WebAccess: erro ao salvar automaticamente:", error));
    }, 450);
  }

  async function initialize(options) {
    getSnapshotCallback = options.getSnapshot;
    applySnapshotCallback = options.applySnapshot;
    afterRestoreCallback = options.afterRestore;
    setStatus("Abrindo banco...", "saving");
    db = await openDatabase();
    const savedRecord = await readSavedRecord();
    if (savedRecord && savedRecord.data) {
      const snapshot = validateDatabase(savedRecord.data);
      applySnapshotCallback(snapshot);
    }
    ready = true;
    if (typeof afterRestoreCallback === "function") afterRestoreCallback();
    if (savedRecord) {
      setStatus("Banco recuperado", "saved");
    } else {
      await saveNow();
      setStatus("Banco pronto — salvamento automático ativo", "saved");
    }
    return true;
  }

  function exportJSON() {
    if (!ready) throw new Error("Aguarde a abertura do banco antes de exportar.");
    const snapshot = createSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = (snapshot.databaseName || "WebAccess").replace(/[\\/:*?"<>|]+/g, "_");
    link.href = url;
    link.download = `${safeName}_backup.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importJSON(file) {
    if (!ready) throw new Error("Aguarde a abertura do banco antes de importar.");
    const text = await file.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("O arquivo selecionado não contém um JSON válido.");
    }
    validateDatabase(data);
    const confirmed = window.confirm(`O banco atual será substituído pelos dados do arquivo "${file.name}". Esta ação não pode ser desfeita, a menos que você tenha um backup. Deseja continuar?`);
    if (!confirmed) return false;
    applySnapshotCallback(data);
    if (typeof afterRestoreCallback === "function") afterRestoreCallback();
    await saveNow();
    return true;
  }

  return {
    initialize,
    scheduleSave,
    saveNow,
    exportJSON,
    importJSON,
    isReady: () => ready
  };
})();
