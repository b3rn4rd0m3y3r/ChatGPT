-- Schema SQLite do projeto (Fases 1, 2, 3, 6, 7 e 8)

CREATE TABLE IF NOT EXISTS usuarios (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nome          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    senha_hash    TEXT NOT NULL,
    criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

CREATE TABLE IF NOT EXISTS tokens_acesso (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id    INTEGER NOT NULL,
    token         TEXT NOT NULL UNIQUE,
    criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    expira_em     TEXT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens_acesso(token);
CREATE INDEX IF NOT EXISTS idx_tokens_usuario ON tokens_acesso(usuario_id);

CREATE TABLE IF NOT EXISTS grupos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nome          TEXT NOT NULL,
    foto          TEXT,
    ativo         INTEGER NOT NULL DEFAULT 1,
    criado_por    INTEGER NOT NULL,
    criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS membros_grupo (
    grupo_id      INTEGER NOT NULL,
    usuario_id    INTEGER NOT NULL,
    papel         TEXT NOT NULL DEFAULT 'membro' CHECK (papel IN ('admin', 'membro')),
    adicionado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    PRIMARY KEY (grupo_id, usuario_id),
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_membros_usuario ON membros_grupo(usuario_id);

CREATE TABLE IF NOT EXISTS mensagens (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    grupo_id           INTEGER NOT NULL,
    autor_id           INTEGER NOT NULL,
    tipo               TEXT NOT NULL DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagem')),
    texto              TEXT,
    caminho_imagem     TEXT,
    caminho_thumbnail  TEXT,
    criado_em          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_mensagens_grupo ON mensagens(grupo_id, id);

CREATE TABLE IF NOT EXISTS mensagens_lidas (
    mensagem_id   INTEGER NOT NULL,
    usuario_id    INTEGER NOT NULL,
    lida_em       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    PRIMARY KEY (mensagem_id, usuario_id),
    FOREIGN KEY (mensagem_id) REFERENCES mensagens(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lidas_mensagem ON mensagens_lidas(mensagem_id);
CREATE INDEX IF NOT EXISTS idx_lidas_usuario ON mensagens_lidas(usuario_id);

-- Solicitações de entrada em grupo (o administrador do grupo aprova ou recusa)
CREATE TABLE IF NOT EXISTS solicitacoes_entrada (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    grupo_id      INTEGER NOT NULL,
    usuario_id    INTEGER NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'recusada')),
    criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    resolvido_em  TEXT,
    resolvido_por INTEGER,
    UNIQUE (grupo_id, usuario_id),
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_solic_grupo_status ON solicitacoes_entrada(grupo_id, status);
