// Rajzik Dark — C++ syntax sample

#include <cstdint>
#include <iostream>
#include <map>
#include <regex>
#include <string>
#include <vector>

#define THEME_NAME "rajzik-dark"
#define MAX_RETRIES 3

#pragma once

namespace rajzik::theme {

enum class LogLevel : std::uint8_t {
  Debug,
  Info,
  Warn,
  Error,
};

struct ThemeConfig {
  std::string name;
  bool semantic_highlighting;
  std::map<std::string, std::string> colors;
};

inline bool is_hex_color(const std::string& value) {
  static const std::regex pattern(R"(^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$)");
  return std::regex_match(value, pattern);
}

class ThemeAuditor {
 public:
  explicit ThemeAuditor(LogLevel level) : level_(level) {}

  std::vector<std::string> audit_directory(const std::string& path) const {
    std::vector<std::string> results;
    // Simplified: return known extensions for syntax preview
    results.push_back(path + "/typescript.ts");
    results.push_back(path + "/javascript.js");
    return results;
  }

  bool validate(const ThemeConfig& config) const {
    if (config.name.empty()) {
      return false;
    }

    for (const auto& [key, value] : config.colors) {
      if (!is_hex_color(value)) {
        std::cerr << "Invalid color for " << key << ": " << value << '\n';
        return false;
      }
    }
    return true;
  }

 private:
  LogLevel level_;
};

}  // namespace rajzik::theme

// Preprocessor directives
#ifdef DEBUG
#  define LOG(msg) std::cerr << "[DEBUG] " << msg << '\n'
#else
#  define LOG(msg)
#endif

using namespace rajzik::theme;

int main() {
  ThemeConfig config{
      .name = THEME_NAME,
      .semantic_highlighting = true,
      .colors = {{"editor.background", "#181818"},
                 {"editor.foreground", "#E4E4E4EB"}},
  };

  ThemeAuditor auditor{LogLevel::Info};

  if (!auditor.validate(config)) {
    return 1;
  }

  auto files = auditor.audit_directory("examples");
  std::cout << "Theme: " << config.name << " (" << files.size() << " files)\n";

  // Labels and goto (entity.name.label)
start:
  for (const auto& file : files) {
    LOG("Checking " << file);
  }

  return 0;
}

// Operator overloading example
struct Color {
  std::uint8_t r, g, b;
};

Color operator+(const Color& a, const Color& b) {
  return Color{
      static_cast<std::uint8_t>(a.r + b.r),
      static_cast<std::uint8_t>(a.g + b.g),
      static_cast<std::uint8_t>(a.b + b.b),
  };
}
