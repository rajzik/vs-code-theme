// Rajzik Dark — Go syntax sample

package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"regexp"
	"strings"
)

// LogLevel represents audit verbosity.
type LogLevel int

const (
	Debug LogLevel = iota
	Info
	Warn
	Error
)

// ThemeConfig holds editor theme settings.
type ThemeConfig struct {
	Name                 string            `json:"name"`
	SemanticHighlighting bool              `json:"semanticHighlighting"`
	Colors               map[string]string `json:"colors"`
}

var (
	maxRetries   = 3
	hexColorRe   = regexp.MustCompile(`^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$`)
	defaultTheme = ThemeConfig{
		Name:                 "rajzik-dark",
		SemanticHighlighting: true,
		Colors: map[string]string{
			"editor.background": "#181818",
			"editor.foreground": "#E4E4E4EB",
		},
	}
)

// ValidateColor checks whether s is a valid hex color.
func ValidateColor(s string) bool {
	if s == "" {
		return false
	}
	return hexColorRe.MatchString(s)
}

// AuditFile reads and classifies a syntax example file.
func AuditFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("read %s: %w", path, err)
	}

	content := string(data)
	switch {
	case strings.HasPrefix(content, "package "):
		return "go", nil
	case strings.Contains(content, "<?php"):
		return "php", nil
	default:
		return "unknown", nil
	}
}

func loadConfig(path string) (*ThemeConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cfg ThemeConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, errors.New("invalid JSON config")
	}
	return &cfg, nil
}

func main() {
	cfg := defaultTheme
	fmt.Printf("Theme: %s (retries=%d)\n", cfg.Name, maxRetries)

	for _, key := range []string{"editor.background", "editor.foreground"} {
		if !ValidateColor(cfg.Colors[key]) {
			fmt.Fprintf(os.Stderr, "invalid color for %s\n", key)
			os.Exit(1)
		}
	}
}
