#!/usr/bin/env bash
# Rajzik Dark — Shell syntax sample

set -euo pipefail

readonly THEME_NAME="rajzik-dark"
readonly MAX_RETRIES=3
readonly EXAMPLES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Associative array for color tokens
declare -A COLORS=(
  ["bg"]="#181818"
  ["fg"]="#E4E4E4EB"
  ["accent"]="#88C0D0"
)

log_info() {
  echo "[INFO] $*" >&2
}

log_error() {
  echo "[ERROR] $*" >&2
}

validate_hex_color() {
  local color="$1"
  if [[ "$color" =~ ^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$ ]]; then
    return 0
  fi
  return 1
}

count_example_files() {
  local count=0
  for file in "$EXAMPLES_DIR"/*; do
    if [[ -f "$file" ]]; then
      ((count++)) || true
    fi
  done
  echo "$count"
}

audit_examples() {
  local extensions=("ts" "js" "html" "css" "py" "go" "rs")
  local found=0

  for ext in "${extensions[@]}"; do
    if compgen -G "${EXAMPLES_DIR}/*.${ext}" > /dev/null; then
      log_info "Found *.${ext} examples"
      ((found++)) || true
    fi
  done

  echo "$found"
}

main() {
  log_info "Auditing theme: ${THEME_NAME}"
  log_info "Examples directory: ${EXAMPLES_DIR}"

  for key in "${!COLORS[@]}"; do
    if ! validate_hex_color "${COLORS[$key]}"; then
      log_error "Invalid color for ${key}: ${COLORS[$key]}"
      exit 1
    fi
  done

  local total
  total="$(count_example_files)"
  local matched
  matched="$(audit_examples)"

  cat <<EOF
Theme audit complete:
  Total files: ${total}
  Matched extensions: ${matched}
  Retries: ${MAX_RETRIES}
EOF
}

# Run only when executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
