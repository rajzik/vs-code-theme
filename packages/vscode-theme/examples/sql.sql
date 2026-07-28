-- Rajzik Dark — SQL syntax sample

-- Create schema for theme audit metadata
CREATE SCHEMA IF NOT EXISTS theme_audit;

CREATE TABLE theme_audit.themes (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(64)  NOT NULL UNIQUE,
    display_name  VARCHAR(128) NOT NULL,
    is_dark       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE theme_audit.scope_checks (
    id          SERIAL PRIMARY KEY,
    theme_id    INTEGER      NOT NULL REFERENCES theme_audit.themes(id),
    scope_name  VARCHAR(256) NOT NULL,
    foreground  CHAR(7)      NOT NULL,
    required    BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_hex_color CHECK (foreground ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE INDEX idx_scope_checks_theme ON theme_audit.scope_checks(theme_id);

-- Seed data
INSERT INTO theme_audit.themes (name, display_name)
VALUES ('rajzik-dark', 'Rajzik Dark')
ON CONFLICT (name) DO NOTHING;

INSERT INTO theme_audit.scope_checks (theme_id, scope_name, foreground, required)
SELECT t.id, s.scope_name, s.foreground, s.required
FROM theme_audit.themes t
CROSS JOIN (
    VALUES
        ('comment', '#57A64A', TRUE),
        ('keyword', '#569CD6', TRUE),
        ('storage.type', '#569CD6', TRUE),
        ('entity.name.function', '#DDDCA4', TRUE),
        ('string', '#CE9178', TRUE),
        ('constant.numeric', '#B5CEA8', TRUE)
) AS s(scope_name, foreground, required)
WHERE t.name = 'rajzik-dark';

-- Query: list required scopes for Rajzik Dark
SELECT
    t.display_name,
    sc.scope_name,
    sc.foreground
FROM theme_audit.themes AS t
INNER JOIN theme_audit.scope_checks AS sc ON sc.theme_id = t.id
WHERE t.name = 'rajzik-dark'
  AND sc.required = TRUE
ORDER BY sc.scope_name;

-- Update and delete examples
UPDATE theme_audit.themes
SET updated_at = NOW()
WHERE name = 'rajzik-dark';

DELETE FROM theme_audit.scope_checks
WHERE scope_name = 'invalid'
  AND theme_id = (SELECT id FROM theme_audit.themes WHERE name = 'rajzik-dark');
