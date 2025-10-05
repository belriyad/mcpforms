"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchema = exports.placeholderValidator = void 0;
const FIELD_KEY_REGEX = /^[a-z0-9_]{2,64}$/;
const VALID_TYPES = [
    'string',
    'number',
    'date',
    'boolean',
    'enum',
    'address',
    'phone',
    'email'
];
exports.placeholderValidator = {
    /**
     * Validate a single placeholder field
     */
    validateField(field) {
        const errors = [];
        // Validate field_key format
        if (!FIELD_KEY_REGEX.test(field.field_key)) {
            errors.push(`Invalid field_key "${field.field_key}": must match ^[a-z0-9_]{2,64}$ (lowercase alphanumeric + underscore, 2-64 chars)`);
        }
        // Validate type
        if (!VALID_TYPES.includes(field.type)) {
            errors.push(`Invalid type "${field.type}": must be one of ${VALID_TYPES.join(', ')}`);
        }
        // Validate locations (must have at least one)
        if (!field.locations || field.locations.length === 0) {
            errors.push(`Field "${field.field_key}" must have at least one location`);
        }
        // Validate enum has options
        if (field.type === 'enum' && (!field.options || field.options.length === 0)) {
            errors.push(`Enum field "${field.field_key}" must have options array`);
        }
        // Validate confidence (if provided, must be 0-1)
        if (field.confidence !== undefined && (field.confidence < 0 || field.confidence > 1)) {
            errors.push(`Confidence for "${field.field_key}" must be between 0 and 1`);
        }
        return {
            valid: errors.length === 0,
            errors
        };
    },
    /**
     * Validate a complete placeholder schema
     */
    validateSchema(fields) {
        const errors = [];
        const warnings = [];
        const fieldKeys = new Set();
        for (const field of fields) {
            // Check for duplicate field_keys
            if (fieldKeys.has(field.field_key)) {
                errors.push({
                    field_key: field.field_key,
                    type: 'duplicate',
                    message: `Duplicate field_key "${field.field_key}" found`
                });
            }
            else {
                fieldKeys.add(field.field_key);
            }
            // Validate individual field
            const fieldValidation = this.validateField(field);
            if (!fieldValidation.valid) {
                for (const errorMsg of fieldValidation.errors) {
                    const errorType = this.categorizeError(errorMsg);
                    errors.push({
                        field_key: field.field_key,
                        type: errorType,
                        message: errorMsg
                    });
                }
            }
            // Check for low confidence warnings
            if (field.confidence !== undefined && field.confidence < 0.7) {
                warnings.push({
                    field_key: field.field_key,
                    type: 'low_confidence',
                    message: `Low confidence (${(field.confidence * 100).toFixed(0)}%) - please review`
                });
            }
            // Check for ambiguous locations
            if (field.locations.length > 0) {
                const hasSpecificLocation = field.locations.some(loc => loc.page || loc.section || loc.xpath || loc.anchor);
                if (!hasSpecificLocation) {
                    warnings.push({
                        field_key: field.field_key,
                        type: 'ambiguous_location',
                        message: 'Location lacks specific identifiers (page, section, xpath, or anchor)'
                    });
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    },
    /**
     * Check for orphan placeholders (in template but not in schema)
     */
    detectOrphans(templateContent, schema) {
        const errors = [];
        const schemaKeys = new Set(schema.map(f => f.field_key));
        // Find all {{placeholder}} patterns in content
        const placeholderPattern = /\{\{([a-z0-9_]+)\}\}/gi;
        const matches = templateContent.matchAll(placeholderPattern);
        const foundPlaceholders = new Set();
        for (const match of matches) {
            const fieldKey = match[1].toLowerCase();
            foundPlaceholders.add(fieldKey);
            if (!schemaKeys.has(fieldKey)) {
                errors.push({
                    field_key: fieldKey,
                    type: 'orphan',
                    message: `Placeholder "{{${fieldKey}}}" found in template but not defined in schema`
                });
            }
        }
        return errors;
    },
    /**
     * Check for unused schema fields (in schema but not in template)
     */
    detectUnused(templateContent, schema) {
        const warnings = [];
        // Find all {{placeholder}} patterns in content
        const placeholderPattern = /\{\{([a-z0-9_]+)\}\}/gi;
        const matches = [...templateContent.matchAll(placeholderPattern)];
        const usedKeys = new Set(matches.map(m => m[1].toLowerCase()));
        for (const field of schema) {
            if (!usedKeys.has(field.field_key.toLowerCase())) {
                warnings.push({
                    field_key: field.field_key,
                    type: 'unused',
                    message: `Field "${field.field_key}" defined in schema but not found in template content`
                });
            }
        }
        return warnings;
    },
    /**
     * Validate schema with template content (comprehensive check)
     */
    validateWithContent(templateContent, schema) {
        // First validate the schema itself
        const schemaValidation = this.validateSchema(schema);
        // Then check for orphans and unused fields
        const orphanErrors = this.detectOrphans(templateContent, schema);
        const unusedWarnings = this.detectUnused(templateContent, schema);
        return {
            valid: schemaValidation.valid && orphanErrors.length === 0,
            errors: [...schemaValidation.errors, ...orphanErrors],
            warnings: [...schemaValidation.warnings, ...unusedWarnings]
        };
    },
    /**
     * Categorize error message into type
     */
    categorizeError(errorMsg) {
        if (errorMsg.includes('Invalid field_key') || errorMsg.includes('must match')) {
            return 'invalid_format';
        }
        if (errorMsg.includes('Duplicate')) {
            return 'duplicate';
        }
        if (errorMsg.includes('Invalid type')) {
            return 'invalid_type';
        }
        if (errorMsg.includes('must have at least one location')) {
            return 'missing_location';
        }
        return 'invalid_format';
    },
    /**
     * Check for collisions between global schema and override schema
     */
    detectCollisions(globalSchema, overrideSchema) {
        const collisions = [];
        const globalKeys = new Map(globalSchema.map(f => [f.field_key, f]));
        for (const overrideField of overrideSchema) {
            const globalField = globalKeys.get(overrideField.field_key);
            if (globalField) {
                // Check if types match
                if (globalField.type !== overrideField.type) {
                    collisions.push({
                        field_key: overrideField.field_key,
                        reason: `Type conflict: global uses "${globalField.type}", override uses "${overrideField.type}"`
                    });
                }
                // Check if both are required
                if (globalField.required && !overrideField.required) {
                    collisions.push({
                        field_key: overrideField.field_key,
                        reason: 'Cannot make a required global field optional in override'
                    });
                }
            }
        }
        return collisions;
    }
};
// Export validateSchema separately for external use
exports.validateSchema = exports.placeholderValidator.validateSchema.bind(exports.placeholderValidator);
//# sourceMappingURL=placeholderValidator.js.map