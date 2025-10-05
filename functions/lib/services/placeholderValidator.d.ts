import { PlaceholderField, ValidationResult } from "../types/versioning";
export declare const placeholderValidator: {
    /**
     * Validate a single placeholder field
     */
    validateField(field: PlaceholderField): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Validate a complete placeholder schema
     */
    validateSchema(fields: PlaceholderField[]): ValidationResult;
    /**
     * Check for orphan placeholders (in template but not in schema)
     */
    detectOrphans(templateContent: string, schema: PlaceholderField[]): ValidationResult["errors"];
    /**
     * Check for unused schema fields (in schema but not in template)
     */
    detectUnused(templateContent: string, schema: PlaceholderField[]): ValidationResult["warnings"];
    /**
     * Validate schema with template content (comprehensive check)
     */
    validateWithContent(templateContent: string, schema: PlaceholderField[]): ValidationResult;
    /**
     * Categorize error message into type
     */
    categorizeError(errorMsg: string): ValidationResult["errors"][0]["type"];
    /**
     * Check for collisions between global schema and override schema
     */
    detectCollisions(globalSchema: PlaceholderField[], overrideSchema: PlaceholderField[]): Array<{
        field_key: string;
        reason: string;
    }>;
};
export declare const validateSchema: (fields: PlaceholderField[]) => ValidationResult;
//# sourceMappingURL=placeholderValidator.d.ts.map