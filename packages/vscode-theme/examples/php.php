<?php
// Rajzik Dark — PHP syntax sample

declare(strict_types=1);

namespace Rajzik\Theme\Examples;

use InvalidArgumentException;
use JsonException;

/** Log levels for audit output. */
enum LogLevel: int
{
    case Debug = 0;
    case Info = 1;
    case Warn = 2;
    case Error = 3;
}

/** Theme configuration value object. */
final class ThemeConfig
{
    private const MAX_RETRIES = 3;

    public function __construct(
        public readonly string $name,
        public readonly bool $semanticHighlighting,
        /** @var array<string, string> */
        public readonly array $colors,
    ) {}

    public static function default(): self
    {
        return new self(
            name: 'rajzik-dark',
            semanticHighlighting: true,
            colors: [
                'editor.background' => '#181818',
                'editor.foreground' => '#E4E4E4EB',
            ],
        );
    }

    public function validate(): void
    {
        if ($this->name === '') {
            throw new InvalidArgumentException('Theme name cannot be empty');
        }

        foreach ($this->colors as $key => $value) {
            if (!self::isHexColor($value)) {
                throw new InvalidArgumentException("Invalid color for {$key}: {$value}");
            }
        }
    }

    private static function isHexColor(string $value): bool
    {
        return (bool) preg_match('/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/', $value);
    }
}

function audit_examples(string $directory): array
{
    $extensions = ['php', 'ts', 'js', 'html', 'css'];
    $results = [];

    foreach (scandir($directory) as $entry) {
        if ($entry === '.' || $entry === '..') {
            continue;
        }

        $path = "{$directory}/{$entry}";
        if (!is_file($path)) {
            continue;
        }

        $ext = pathinfo($path, PATHINFO_EXTENSION);
        if (in_array($ext, $extensions, true)) {
            $results[] = $entry;
        }
    }

    sort($results);
    return $results;
}

// Inline HTML with embedded PHP
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?= htmlspecialchars('Rajzik Dark Preview', ENT_QUOTES) ?></title>
</head>
<body>
    <h1>Theme: <?= ThemeConfig::default()->name ?></h1>
    <p>Found <?= count(audit_examples(__DIR__)) ?> example files.</p>
</body>
</html>
<?php

$config = ThemeConfig::default();
$config->validate();

echo match (LogLevel::Info) {
    LogLevel::Debug => "Debug\n",
    LogLevel::Info => "Info: {$config->name}\n",
    default => "Other\n",
};
