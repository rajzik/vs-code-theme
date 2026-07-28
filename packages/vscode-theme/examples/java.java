// Rajzik Dark — Java syntax sample

package com.rajzik.theme.examples;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Audits syntax example files for basic theme scope coverage.
 */
@Deprecated(since = "1.0", forRemoval = false)
public final class ThemeAuditor {

    private static final int MAX_RETRIES = 3;
    private static final Pattern HEX_COLOR = Pattern.compile("^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$");

    public enum LogLevel {
        DEBUG,
        INFO,
        WARN,
        ERROR
    }

  public record AuditResult(String file, boolean passed, List<String> issues) {}

    private final LogLevel level;
    private final Map<String, Object> config;

    public ThemeAuditor(LogLevel level) {
        this.level = level;
        this.config = Map.of(
            "theme", "rajzik-dark",
            "semanticHighlighting", true,
            "retries", MAX_RETRIES
        );
    }

    public List<AuditResult> auditDirectory(Path directory) throws IOException {
        Objects.requireNonNull(directory, "directory");

        try (var stream = Files.list(directory)) {
            return stream
                .filter(Files::isRegularFile)
                .map(this::auditFile)
                .collect(Collectors.toList());
        }
    }

    private AuditResult auditFile(Path path) {
        List<String> issues = new ArrayList<>();
        String name = path.getFileName().toString();

        if (!name.contains(".")) {
            issues.add("Missing extension");
        }

        boolean passed = issues.isEmpty();
        return new AuditResult(name, passed, issues);
    }

    public static boolean isValidHexColor(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        return HEX_COLOR.matcher(value).matches();
    }

    public static void main(String[] args) {
        var auditor = new ThemeAuditor(LogLevel.INFO);
        System.out.println("Theme: " + auditor.config.get("theme"));

        switch (auditor.level) {
            case DEBUG -> System.out.println("Debug mode");
            case INFO -> System.out.println("Info mode");
            default -> System.out.println("Other level");
        }
    }
}
