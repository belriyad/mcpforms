"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiPlaceholderService = void 0;
const openai_1 = __importDefault(require("openai"));
const functions = __importStar(require("firebase-functions"));
const placeholderValidator_1 = require("./placeholderValidator");
// Lazy OpenAI initialization
let openaiClient = null;
function getOpenAI() {
    var _a;
    if (!openaiClient) {
        const apiKey = (((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key) || process.env.OPENAI_API_KEY || '').trim().replace(/\n/g, '');
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not configured');
        }
        openaiClient = new openai_1.default({ apiKey });
    }
    return openaiClient;
}
// JSON Schema for Structured Outputs
const PLACEHOLDER_SUGGESTION_SCHEMA = {
    type: "object",
    properties: {
        fields: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    field_key: {
                        type: "string",
                        pattern: "^[a-z0-9_]{2,64}$",
                        description: "Unique field identifier (lowercase, alphanumeric + underscore, 2-64 chars)"
                    },
                    label: {
                        type: "string",
                        description: "Human-readable label for the field"
                    },
                    type: {
                        type: "string",
                        enum: ["string", "number", "date", "boolean", "enum", "address", "phone", "email"],
                        description: "Data type of the field"
                    },
                    locations: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                page: { type: "number" },
                                section: { type: "string" },
                                hint: { type: "string" }
                            }
                        },
                        minItems: 1
                    },
                    required: { type: "boolean" },
                    description: { type: "string" },
                    options: {
                        type: "array",
                        items: { type: "string" }
                    },
                    confidence: {
                        type: "number",
                        minimum: 0,
                        maximum: 1
                    }
                },
                required: ["field_key", "label", "type", "locations", "confidence"]
            }
        },
        confidence_score: {
            type: "number",
            minimum: 0,
            maximum: 1
        },
        reasoning: { type: "string" },
        warnings: {
            type: "array",
            items: { type: "string" }
        }
    },
    required: ["fields", "confidence_score"]
};
exports.aiPlaceholderService = {
    /**
     * Suggest placeholders from template content using AI with Structured Outputs
     */
    async suggestPlaceholders(templateContent, fileType, existingPlaceholders) {
        var _a, _b, _c;
        try {
            console.log(`🤖 [AI-PLACEHOLDER] Analyzing ${fileType} template (${templateContent.length} chars)`);
            // Content policy check
            if (templateContent.length > 50000) {
                throw new Error('Template content exceeds maximum length (50,000 characters)');
            }
            const existingKeysContext = existingPlaceholders && existingPlaceholders.length > 0
                ? `\n\nEXISTING PLACEHOLDERS (avoid duplicates):\n${existingPlaceholders.map(f => `- ${f.field_key}: ${f.label}`).join('\n')}`
                : '';
            const prompt = `You are a legal document field extraction system. Analyze the following ${fileType.toUpperCase()} template and identify ALL placeholder fields that need to be filled with client data.

TEMPLATE CONTENT:
${templateContent}
${existingKeysContext}

INSTRUCTIONS:
1. Find ALL blank fields, placeholders, or sections requiring client input
2. Generate unique field_key for each (lowercase, underscore-separated, descriptive)
3. Assign appropriate type: string, number, date, boolean, enum, address, phone, email
4. Identify location hints (section names, page references)
5. Set confidence 0-1 based on clarity of the placeholder
6. For repeated fields (e.g., "Trustee signature" appearing 3 times), create ONE placeholder that applies to all locations
7. Avoid creating duplicate field_keys for the same conceptual field

EXAMPLES:
- "Trust's name" or "Name of Trust" → field_key: "trust_name", type: "string"
- "Date: ___/___/___" → field_key: "execution_date", type: "date"
- "County of _______" → field_key: "county", type: "string"
- "Notary expiration: ______" → field_key: "notary_commission_expires", type: "date"

Return structured JSON with all identified fields.`;
            const openai = getOpenAI();
            const response = await openai.chat.completions.create({
                model: "gpt-4o-2024-08-06", // Model with Structured Outputs support
                messages: [
                    {
                        role: "system",
                        content: "You are a legal document field extraction expert. Extract placeholder fields with high accuracy and return valid JSON matching the schema."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "placeholder_suggestion",
                        strict: true,
                        schema: PLACEHOLDER_SUGGESTION_SCHEMA
                    }
                },
                temperature: 0.2,
                max_tokens: 4096
            });
            const content = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
            if (!content) {
                throw new Error('OpenAI returned empty response');
            }
            const suggestion = JSON.parse(content);
            console.log(`✅ [AI-PLACEHOLDER] Suggested ${suggestion.fields.length} fields`);
            console.log(`💰 [AI-PLACEHOLDER] Tokens used: ${(_c = response.usage) === null || _c === void 0 ? void 0 : _c.total_tokens}`);
            // Post-validation (additional safety layer)
            const validation = placeholderValidator_1.placeholderValidator.validateSchema(suggestion.fields);
            if (!validation.valid) {
                suggestion.warnings = suggestion.warnings || [];
                suggestion.warnings.push(...validation.errors.map(e => e.message));
                console.log(`⚠️ [AI-PLACEHOLDER] Validation warnings:`, suggestion.warnings);
            }
            return suggestion;
        }
        catch (error) {
            console.error('❌ [AI-PLACEHOLDER] Error:', error);
            throw error;
        }
    },
    /**
     * Generate custom clause with new placeholders (for customer overrides)
     */
    async generateCustomClause(customerRequest, templateContext, existingPlaceholders) {
        var _a, _b, _c, _d;
        try {
            console.log(`🤖 [AI-CLAUSE] Generating custom clause for request: "${customerRequest}"`);
            // Content policy check
            if (customerRequest.length > 2000) {
                throw new Error('Customer request exceeds maximum length (2,000 characters)');
            }
            const existingKeysContext = existingPlaceholders.map(f => `- ${f.field_key}: ${f.label}`).join('\n');
            const prompt = `You are a legal document customization assistant. Generate a custom clause/section based on the customer's request.

CUSTOMER REQUEST:
${customerRequest}

TEMPLATE CONTEXT:
${templateContext.substring(0, 5000)}

EXISTING PLACEHOLDERS:
${existingKeysContext}

INSTRUCTIONS:
1. Generate professional legal clause text addressing the customer's request
2. Identify any NEW placeholder fields needed for this clause
3. Use existing placeholders where applicable (don't create duplicates)
4. Return structured JSON with section_text, section_title, new_placeholders array
5. Include legal disclaimers if needed
6. Set confidence for each new placeholder

IMPORTANT:
- No automatic legal advice - mark as "requires attorney review"
- Keep language professional and clear
- New field_keys must not conflict with existing ones

Return structured JSON.`;
            const openai = getOpenAI();
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "You are a legal document customization assistant. Generate clauses with appropriate placeholders. Always include disclaimers that content requires attorney review."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.3,
                max_tokens: 2048
            });
            const content = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
            if (!content) {
                throw new Error('OpenAI returned empty response');
            }
            const result = JSON.parse(content);
            console.log(`✅ [AI-CLAUSE] Generated clause with ${((_c = result.new_placeholders) === null || _c === void 0 ? void 0 : _c.length) || 0} new placeholders`);
            console.log(`💰 [AI-CLAUSE] Tokens used: ${(_d = response.usage) === null || _d === void 0 ? void 0 : _d.total_tokens}`);
            // Validate new placeholders
            if (result.new_placeholders && result.new_placeholders.length > 0) {
                const validation = placeholderValidator_1.placeholderValidator.validateSchema(result.new_placeholders);
                if (!validation.valid) {
                    result.warnings = result.warnings || [];
                    result.warnings.push(...validation.errors.map((e) => e.message));
                }
                // Check for collisions with existing placeholders
                const collisions = placeholderValidator_1.placeholderValidator.detectCollisions(existingPlaceholders, result.new_placeholders);
                if (collisions.length > 0) {
                    result.warnings = result.warnings || [];
                    result.warnings.push(...collisions.map(c => `Collision: ${c.reason}`));
                }
            }
            // Add legal disclaimer
            result.section_text += '\n\n[Note: This clause requires review and approval by a licensed attorney before use.]';
            return result;
        }
        catch (error) {
            console.error('❌ [AI-CLAUSE] Error:', error);
            throw error;
        }
    }
};
//# sourceMappingURL=aiPlaceholderService.js.map