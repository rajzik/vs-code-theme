// Rajzik Dark — Rust syntax sample

use std::collections::HashMap;
use std::fmt;
use std::path::{Path, PathBuf};

/// Log level for theme audit output.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogLevel {
    Debug,
    Info,
    Warn,
    Error,
}

/// Theme configuration loaded from JSON.
#[derive(Debug, Clone)]
pub struct ThemeConfig {
    pub name: String,
    pub semantic_highlighting: bool,
    pub colors: HashMap<String, String>,
}

impl ThemeConfig {
    pub fn new(name: impl Into<String>) -> Self {
        let mut colors = HashMap::new();
        colors.insert("editor.background".into(), "#181818".into());
        colors.insert("editor.foreground".into(), "#E4E4E4EB".into());

        Self {
            name: name.into(),
            semantic_highlighting: true,
            colors,
        }
    }

    pub fn validate(&self) -> Result<(), AuditError> {
        if self.name.is_empty() {
            return Err(AuditError::InvalidName);
        }

        for (key, value) in &self.colors {
            if !is_hex_color(value) {
                return Err(AuditError::InvalidColor(key.clone()));
            }
        }

        Ok(())
    }
}

#[derive(Debug)]
pub enum AuditError {
    InvalidName,
    InvalidColor(String),
}

impl fmt::Display for AuditError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AuditError::InvalidName => write!(f, "theme name cannot be empty"),
            AuditError::InvalidColor(key) => write!(f, "invalid color for {}", key),
        }
    }
}

impl std::error::Error for AuditError {}

fn is_hex_color(value: &str) -> bool {
    let bytes = value.as_bytes();
    if !bytes.starts_with(b"#") {
        return false;
    }
    let hex = &bytes[1..];
    hex.len() == 3 || hex.len() == 6
}

macro_rules! log_msg {
    ($level:expr, $($arg:tt)*) => {
        eprintln!("[{:?}] {}", $level, format!($($arg)*));
    };
}

fn audit_directory(dir: &Path) -> Vec<PathBuf> {
    let extensions = ["rs", "ts", "js", "html", "css"];
    std::fs::read_dir(dir)
        .into_iter()
        .flatten()
        .filter_map(|entry| entry.ok())
        .map(|entry| entry.path())
        .filter(|path| {
            path.extension()
                .and_then(|ext| ext.to_str())
                .map(|ext| extensions.contains(&ext))
                .unwrap_or(false)
        })
        .collect()
}

fn main() -> Result<(), AuditError> {
    let config = ThemeConfig::new("rajzik-dark");
    config.validate()?;

    log_msg!(LogLevel::Info, "auditing theme: {}", config.name);

    let examples = Path::new("examples");
    let files = audit_directory(examples);
    println!("Found {} example files", files.len());

    Ok(())
}
