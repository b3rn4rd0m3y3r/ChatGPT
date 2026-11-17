// WebAccess — motor SQLite local (SQL.js)
"use strict";

window.WebAccessSQLite = (() => {
  let SQL = null;
  let database = null;
  let ready = false;
  let syncQueue = Promise.resolve();

  function setStatus(message, state = "") {
    const element = document.querySelector("#sqliteStatus");
    if (!element) return;
    element.textContent = message;
    element.className = `storage-status ${state}`.trim();
  }

  function quoteIdentifier(identifier) {
    return `"${String(identifier).replace(/"/g, '""')}"`;
  }

  function sqliteType(type) {
    const normalized = String(type || "TEXT").toUpperCase();
    if (normalized === "INTEGER" || normalized === "BOOLEAN") return "INTEGER";
    if (normalized === "REAL") return "REAL";
    if (normalized === "NUMERIC") return "NUMERIC";
    return "TEXT";
  }

  function normalizeValue(value, field) {
    if (value === undefined) return null;
    if (typeof value === "boolean") return value ? 1 : 0;
    if (value instanceof Date) return value.toISOString();
    if (value !== null && typeof value === "object" && !(value instanceof Uint8Array)) {
      return JSON.stringify(value);
    }
    return value;
  }

  function createDatabase(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.tables) || !Array.isArray(snapshot.relationships)) {
      throw new Error("Não foi possível montar o SQLite: estrutura do banco inválida.");
    }

    const nextDb = new SQL.Database();
    try {
      nextDb.run("PRAGMA foreign_keys = ON;");

      const tableById = new Map(snapshot.tables.map(table => [table.id, table]));
      for (const table of snapshot.tables) {
        if (!table.fields || table.fields.length === 0) {
          throw new Error(`A tabela "${table.name}" não possui campos.`);
        }

        const definitions = table.fields.map(field => {
          let definition = `${quoteIdentifier(field.name)} ${sqliteType(field.type)}`;
          if (field.primaryKey) definition += " PRIMARY KEY";
          return definition;
        });

        const relations = snapshot.relationships.filter(rel => rel.childTableId === table.id);
        for (const rel of relations) {
          const parent = tableById.get(rel.parentTableId);
          if (!parent) throw new Error(`Tabela principal não encontrada no relacionamento da tabela "${table.name}".`);
          definitions.push(
            `FOREIGN KEY (${quoteIdentifier(rel.childFieldName)}) REFERENCES ${quoteIdentifier(parent.name)} (${quoteIdentifier(rel.parentFieldName)})`
          );
        }

        nextDb.run(`CREATE TABLE ${quoteIdentifier(table.name)} (${definitions.join(", ")});`);
      }

      // Adia a validação das FKs até o COMMIT: assim, a ordem visual das
      // tabelas no WebAccess não interfere na conversão dos registros.
      nextDb.run("PRAGMA defer_foreign_keys = ON; BEGIN;");
      for (const table of snapshot.tables) {
        if (!table.records || table.records.length === 0) continue;
        const columns = table.fields.map(field => quoteIdentifier(field.name));
        const placeholders = table.fields.map(() => "?").join(", ");
        const statement = nextDb.prepare(
          `INSERT INTO ${quoteIdentifier(table.name)} (${columns.join(", ")}) VALUES (${placeholders});`
        );
        try {
          for (const record of table.records) {
            const values = table.fields.map(field => normalizeValue(record.values?.[field.name], field));
            statement.run(values);
          }
        } finally {
          statement.free();
        }
      }
      nextDb.run("COMMIT;");

      return nextDb;
    } catch (error) {
      try { nextDb.run("ROLLBACK;"); } catch (_) {}
      nextDb.close();
      throw error;
    }
  }

  async function performSync(snapshot) {
    let nextDb = null;
    try {
      nextDb = createDatabase(snapshot);
      const bytes = nextDb.export();
      await WebAccessPersistence.saveSqliteBytes(bytes);
      const previousDb = database;
      database = nextDb;
      nextDb = null;
      if (previousDb) previousDb.close();
      setStatus("SQLite sincronizado", "saved");
      return true;
    } catch (error) {
      setStatus("Erro no SQLite", "error");
      throw error;
    } finally {
      if (nextDb) nextDb.close();
    }
  }

  function syncSnapshot(snapshot) {
    if (!ready || !SQL) return Promise.resolve(false);
    // Serializa as sincronizações para que uma gravação mais recente não seja
    // ignorada enquanto a cópia SQLite anterior ainda está sendo persistida.
    const operation = syncQueue.then(() => performSync(snapshot));
    syncQueue = operation.catch(() => false);
    return operation;
  }

  async function initialize(snapshotProvider) {
    setStatus("Carregando SQL.js...", "saving");
    try {
      if (typeof window.initSqlJs !== "function") {
        throw new Error("O arquivo sql-wasm-inline.js não foi carregado.");
      }
      SQL = await window.initSqlJs();
      ready = true;
      await syncSnapshot(snapshotProvider());
      console.info("WebAccess: SQL.js inicializado; SQLite em memória e cópia binária no IndexedDB.");
      return true;
    } catch (error) {
      ready = false;
      setStatus("SQLite indisponível", "error");
      throw error;
    }
  }


  function hasMultipleStatements(sql) {
    let quote = null, escaped = false;
    for (let i = 0; i < sql.length; i++) {
      const ch = sql[i];
      if (quote) {
        if (ch === quote) {
          if (sql[i + 1] === quote) { i++; continue; }
          quote = null;
        } else if (ch === "\\" && quote !== "'") escaped = !escaped;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`' || ch === '[') { quote = ch === '[' ? ']' : ch; continue; }
      if (ch === ';' && sql.slice(i + 1).trim()) return true;
    }
    return false;
  }

  function snapshotFromDatabase(snapshot) {
    const copy = JSON.parse(JSON.stringify(snapshot));
    for (const table of copy.tables) {
      const oldRecords = table.records || [];
      const columns = table.fields.map(field => quoteIdentifier(field.name)).join(', ');
      const result = database.exec(`SELECT ${columns} FROM ${quoteIdentifier(table.name)};`);
      const rows = result.length ? result[0].values : [];
      const pk = table.fields.find(field => field.primaryKey);
      const used = new Set();
      table.records = rows.map((row, index) => {
        const values = {};
        table.fields.forEach((field, i) => { values[field.name] = row[i] === undefined ? null : row[i]; });
        let previous = null;
        if (pk) previous = oldRecords.find(record => !used.has(record.id) && String(record.values?.[pk.name]) === String(values[pk.name]));
        if (!previous) previous = oldRecords.find(record => !used.has(record.id) && table.fields.every(field => JSON.stringify(record.values?.[field.name] ?? null) === JSON.stringify(values[field.name] ?? null)));
        const id = previous ? previous.id : `sql_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
        if (previous) used.add(previous.id);
        return { id, values };
      });
    }
    return copy;
  }


  function mapSqliteType(type) {
    const value = String(type || "TEXT").toUpperCase();
    if (value.includes("INT")) return "INTEGER";
    if (value.includes("REAL") || value.includes("FLOA") || value.includes("DOUB")) return "REAL";
    if (value.includes("NUM") || value.includes("DEC") || value.includes("BOOL")) return value.includes("BOOL") ? "BOOLEAN" : "NUMERIC";
    if (value.includes("DATE") || value.includes("TIME")) return "DATE";
    return "TEXT";
  }

  function introspectDatabase(snapshot) {
    const oldTables = snapshot.tables || [];
    const oldRelationships = snapshot.relationships || [];
    const names = database.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;");
    const tableNames = names.length ? names[0].values.map(row => row[0]) : [];
    const tables = tableNames.map(name => {
      const old = oldTables.find(item => item.name === name);
      const info = database.exec(`PRAGMA table_info(${quoteIdentifier(name)});`);
      const columns = info.length ? info[0].values : [];
      const pkColumns = columns.filter(column => Number(column[5]) > 0);
      if (pkColumns.length > 1) throw new Error(`A tabela "${name}" possui chave primária composta. Esta versão do WebAccess gerencia uma única coluna como PK.`);
      const fields = columns.map(column => ({ name: column[1], type: mapSqliteType(column[2]), primaryKey: Number(column[5]) > 0 }));
      const valuesResult = database.exec(`SELECT * FROM ${quoteIdentifier(name)};`);
      const rows = valuesResult.length ? valuesResult[0].values : [];
      const oldRecords = old?.records || [];
      const pk = fields.find(field => field.primaryKey);
      const used = new Set();
      const records = rows.map((row, index) => {
        const values = {};
        fields.forEach((field, i) => { values[field.name] = row[i] === undefined ? null : row[i]; });
        let previous = pk ? oldRecords.find(record => !used.has(record.id) && String(record.values?.[pk.name]) === String(values[pk.name])) : null;
        if (!previous) previous = oldRecords.find(record => !used.has(record.id) && fields.every(field => JSON.stringify(record.values?.[field.name] ?? null) === JSON.stringify(values[field.name] ?? null)));
        if (previous) used.add(previous.id);
        return { id: previous?.id || `sql_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`, values };
      });
      return { id: old?.id || `tbl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, name, fields, records };
    });

    const relationships = [];
    for (const child of tables) {
      const fkResult = database.exec(`PRAGMA foreign_key_list(${quoteIdentifier(child.name)});`);
      const foreignKeys = fkResult.length ? fkResult[0].values : [];
      const fkGroups = new Map();
      for (const fk of foreignKeys) fkGroups.set(fk[0], (fkGroups.get(fk[0]) || 0) + 1);
      if ([...fkGroups.values()].some(count => count > 1)) throw new Error(`A tabela "${child.name}" possui uma chave estrangeira composta, não suportada pelo modelo visual.`);
      for (const fk of foreignKeys) {
        const parent = tables.find(table => table.name === fk[2]);
        const parentFieldName = fk[4];
        const childFieldName = fk[3];
        if (!parent || !child.fields.some(field => field.name === childFieldName)) continue;
        if (!parent.fields.some(field => field.name === parentFieldName && field.primaryKey)) {
          throw new Error(`A FK de "${child.name}.${childFieldName}" referencia "${parent.name}.${parentFieldName}", que não é a chave primária. O modelo visual exige referência à PK.`);
        }
        const oldRel = oldRelationships.find(rel => rel.parentTableId === parent.id && rel.parentFieldName === parentFieldName && rel.childTableId === child.id && rel.childFieldName === childFieldName);
        relationships.push({ id: oldRel?.id || `rel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, parentTableId: parent.id, parentFieldName, childTableId: child.id, childFieldName, cardinality: "1:N" });
      }
    }
    return { ...snapshot, tables, relationships };
  }

  function classifyCommand(sql) {
    const normalized = sql.replace(/^(?:\s|--[^\n]*\n|\/\*[\s\S]*?\*\/)+/g, '').trim();
    const command = (normalized.match(/^([a-z]+)/i) || [])[1]?.toUpperCase();
    if (["SELECT", "INSERT", "UPDATE", "DELETE"].includes(command)) return command;
    if (command === "CREATE" && /^CREATE\s+TABLE\b/i.test(normalized)) return "CREATE TABLE";
    if (command === "ALTER" && /^ALTER\s+TABLE\b/i.test(normalized)) return "ALTER TABLE";
    if (command === "DROP" && /^DROP\s+TABLE\b/i.test(normalized)) return "DROP TABLE";
    return null;
  }

  async function execute(sql, snapshotProvider, snapshotApplier, saveCallback) {
    if (!ready || !database) throw new Error("O mecanismo SQLite ainda não está pronto.");
    const statement = String(sql || '').trim();
    if (!statement) throw new Error('Digite uma instrução SQL antes de executar.');
    if (hasMultipleStatements(statement)) throw new Error('Execute apenas uma instrução SQL por vez.');
    const normalized = statement.replace(/^(?:\s|--[^\n]*\n|\/\*[\s\S]*?\*\/)+/g, '').trim();
    const command = classifyCommand(normalized);
    if (!command) throw new Error('Comandos permitidos: SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, ALTER TABLE e DROP TABLE.');
    if (command === 'SELECT') return { command, results: database.exec(statement), changed: 0 };
    if (['CREATE TABLE', 'ALTER TABLE'].includes(command)) {
      if (/\b(?:NOT\s+NULL|UNIQUE|CHECK\s*\(|DEFAULT\s|COLLATE|AUTOINCREMENT)\b/i.test(statement)) {
        throw new Error('Esta etapa ainda não representa NOT NULL, UNIQUE, CHECK, DEFAULT, COLLATE ou AUTOINCREMENT no modelo visual. Use apenas tipos de campo, PK e FK de uma coluna.');
      }
      if (/\bPRIMARY\s+KEY\s*\([^)]*,/i.test(statement) || /\bFOREIGN\s+KEY\s*\([^)]*,/i.test(statement)) {
        throw new Error('Chaves compostas não são suportadas pelo modelo visual. Defina uma única coluna para cada PK e FK.');
      }
    }
    const isDdl = ['CREATE TABLE', 'ALTER TABLE', 'DROP TABLE'].includes(command);
    if (isDdl) database.run('SAVEPOINT webaccess_ddl;');
    let updatedSnapshot;
    let changed = 0;
    try {
      database.run(statement);
      changed = database.getRowsModified();
      const currentSnapshot = snapshotProvider();
      updatedSnapshot = isDdl ? introspectDatabase(currentSnapshot) : snapshotFromDatabase(currentSnapshot);
      if (isDdl) database.run('RELEASE webaccess_ddl;');
    } catch (error) {
      if (isDdl) {
        try { database.run('ROLLBACK TO webaccess_ddl;'); } catch (_) {}
        try { database.run('RELEASE webaccess_ddl;'); } catch (_) {}
      }
      throw error;
    }
    snapshotApplier(updatedSnapshot);
    await saveCallback();
    setStatus('SQLite sincronizado', 'saved');
    return { command, results: [], changed, schemaChanged: ['CREATE TABLE', 'ALTER TABLE', 'DROP TABLE'].includes(command) };
  }

  function exec(sql, params) {
    if (!ready || !database) throw new Error("O mecanismo SQLite ainda não está pronto.");
    return database.exec(sql, params);
  }

  function exportBytes() {
    if (!ready || !database) throw new Error("O mecanismo SQLite ainda não está pronto.");
    return database.export();
  }

  function getDatabase() {
    if (!ready || !database) throw new Error("O mecanismo SQLite ainda não está pronto.");
    return database;
  }

  return {
    initialize,
    syncSnapshot,
    exec,
    execute,
    exportBytes,
    getDatabase,
    isReady: () => ready
  };
})();
