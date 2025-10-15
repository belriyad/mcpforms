/**
 * Field Name Normalization Utility
 * 
 * Converts field names between different naming conventions.
 * Primary use: Convert camelCase form field names to snake_case
 * for document generation compatibility.
 */

/**
 * Convert a camelCase string to snake_case
 * 
 * @param str - The camelCase string to convert
 * @returns The snake_case version of the string
 * 
 * @example
 * camelToSnake("trustName") → "trust_name"
 * camelToSnake("successorTrustees") → "successor_trustees"
 * camelToSnake("county") → "county" (unchanged)
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert all keys in an object from camelCase to snake_case
 * 
 * @param data - Object with camelCase keys
 * @returns New object with snake_case keys
 * 
 * @example
 * normalizeFieldNames({
 *   trustName: "Riyad Trust",
 *   grantorNames: "John Doe"
 * })
 * // Returns:
 * // {
 * //   trust_name: "Riyad Trust",
 * //   grantor_names: "John Doe"
 * // }
 */
export function normalizeFieldNames(data: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const snakeKey = camelToSnake(key);
    normalized[snakeKey] = value;
  }
  
  return normalized;
}

/**
 * Convert a snake_case string to camelCase (inverse operation)
 * 
 * @param str - The snake_case string to convert
 * @returns The camelCase version of the string
 * 
 * @example
 * snakeToCamel("trust_name") → "trustName"
 * snakeToCamel("grantor_names") → "grantorNames"
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert all keys in an object from snake_case to camelCase (inverse operation)
 * 
 * @param data - Object with snake_case keys
 * @returns New object with camelCase keys
 */
export function denormalizeFieldNames(data: Record<string, any>): Record<string, any> {
  const denormalized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const camelKey = snakeToCamel(key);
    denormalized[camelKey] = value;
  }
  
  return denormalized;
}
