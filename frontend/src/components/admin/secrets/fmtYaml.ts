// Quotes keys that are not plain YAML scalars, e.g. auth ids containing an `@`.
const fmtYamlKey = (key: string) =>
  /^[\w.-]+$/.test(key) ? key : JSON.stringify(key);

// Pads each column to its widest entry plus one space, so the values and
// comments line up in columns that can be selected across all lines at once.
export const fmtYamlLines = (
  rows: { key: string; value: string; comment: string }[],
) => {
  const keys = rows.map((row) => `${fmtYamlKey(row.key)}:`);
  const keyWidth = Math.max(...keys.map((key) => key.length)) + 1;
  const valueWidth = Math.max(...rows.map((row) => row.value.length)) + 1;

  return rows
    .map(
      (row, i) =>
        `${keys[i].padEnd(keyWidth)}${row.value.padEnd(valueWidth)}# ${row.comment}`,
    )
    .join("\n");
};
