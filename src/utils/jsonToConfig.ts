type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

interface JsonObject {
  [key: string]: JsonValue;
}

interface JsonArray extends Array<JsonValue> {}

/**
 * Recursively converts a JSON object into an INI-like config format.
 * 
 * Rules:
 * - number → key=value
 * - string → key="value"
 * - object → [key] then recurse
 */
export function jsonToConfig(obj: JsonObject, sectionPrefix = ""): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "number") {
      lines.push(`${key}=${value}`);
    } else if (typeof value === "string") {
      lines.push(`${key}="${value}"`);
    } else if (typeof value === "object" && value !== null) {
      // Nested object — compute full section name
      const sectionName = sectionPrefix ? `${sectionPrefix}.${key}` : key;
      lines.push(`[${sectionName}]`);
      lines.push(jsonToConfig(value as JsonObject, sectionName));
    }
  }

  return lines.join("\n");
}
