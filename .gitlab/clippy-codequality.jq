# Converts `cargo clippy --message-format=json` output (slurped with `jq -s`)
# into a GitLab code quality report. Cargo reports paths relative to the
# backend workspace, GitLab expects them relative to the repository root.
[
  .[]
  | select(.reason == "compiler-message" and .message.code != null)
  | .message as $message
  | $message.spans[]
  | select(.is_primary)
  | {
      description: $message.message,
      check_name: $message.code.code,
      fingerprint: "\($message.code.code):\(.file_name):\(.line_start):\(.column_start)",
      severity: (if $message.level == "error" then "major" else "minor" end),
      location: {
        path: "backend/\(.file_name)",
        lines: { begin: .line_start }
      }
    }
]
| unique_by(.fingerprint)
