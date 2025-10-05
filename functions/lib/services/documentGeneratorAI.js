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
exports.documentGeneratorAI = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const openai_1 = __importDefault(require("openai"));
const mammoth_1 = __importDefault(require("mammoth"));
const docx_1 = require("docx");
const uuid_1 = require("uuid");
const db = admin.firestore();
const storage = admin.storage();
// Lazy initialize OpenAI (only when actually used)
let openaiClient = null;
function getOpenAI() {
    var _a;
    if (!openaiClient) {
        // Get API key and clean it (remove newlines, whitespace)
        const apiKey = (((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key) || process.env.OPENAI_API_KEY || '').trim().replace(/\n/g, '');
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not configured');
        }
        console.log(`🔑 [AI-GEN] Initializing OpenAI client (key length: ${apiKey.length})`);
        openaiClient = new openai_1.default({
            apiKey: apiKey,
        });
    }
    return openaiClient;
}
exports.documentGeneratorAI = {
    /**
     * Main function: Generate documents using OpenAI instead of placeholder replacement
     */
    async generateDocumentsFromIntake(intakeId, regenerate = false) {
        try {
            console.log(`🤖 [AI-GEN] Starting AI-powered document generation for intake ${intakeId}`);
            // Get intake data
            const intakeDoc = await db.collection("intakes").doc(intakeId).get();
            if (!intakeDoc.exists) {
                return { success: false, error: "Intake not found" };
            }
            const intake = intakeDoc.data();
            // Get service and templates
            const serviceDoc = await db.collection("services").doc(intake.serviceId).get();
            if (!serviceDoc.exists) {
                return { success: false, error: "Service not found" };
            }
            const service = serviceDoc.data();
            const templateIds = (service === null || service === void 0 ? void 0 : service.templateIds) || [];
            const templateDocs = await Promise.all(templateIds.map((id) => db.collection("templates").doc(id).get()));
            const templates = [];
            for (const doc of templateDocs) {
                if (doc.exists) {
                    templates.push(doc.data());
                }
            }
            if (templates.length === 0) {
                return { success: false, error: "No templates found for service" };
            }
            // If regenerating, delete existing artifacts
            if (regenerate) {
                await this.deleteExistingArtifacts(intakeId);
            }
            // Generate documents for each template using AI
            const artifactIds = [];
            for (const template of templates) {
                try {
                    console.log(`🤖 [AI-GEN] Processing template: ${template.name}`);
                    const artifactId = await this.generateDocumentWithAI(template, intake);
                    artifactIds.push(artifactId);
                    console.log(`✅ [AI-GEN] Successfully generated: ${artifactId}`);
                }
                catch (error) {
                    console.error(`❌ [AI-GEN] Error generating document for template ${template.id}:`, error);
                    // Continue with other templates even if one fails
                }
            }
            if (artifactIds.length === 0) {
                return { success: false, error: "Failed to generate any documents" };
            }
            // Update intake status
            await db.collection("intakes").doc(intakeId).update({
                status: "documents-generated",
                updatedAt: new Date(),
            });
            console.log(`🎉 [AI-GEN] Successfully generated ${artifactIds.length} documents`);
            return {
                success: true,
                data: { artifactIds },
                message: `Successfully ${regenerate ? 'regenerated' : 'generated'} ${artifactIds.length} documents using AI`,
            };
        }
        catch (error) {
            console.error("❌ [AI-GEN] Error generating documents:", error);
            return { success: false, error: "Failed to generate documents with AI" };
        }
    },
    /**
     * Generate a single document using OpenAI
     */
    async generateDocumentWithAI(template, intake) {
        const artifactId = (0, uuid_1.v4)();
        try {
            console.log(`🤖 [AI-GEN] Creating artifact record for ${template.name}`);
            // Create document artifact record
            const artifact = {
                id: artifactId,
                intakeId: intake.id,
                templateId: template.id,
                fileName: `${template.name}_${intake.id}.${template.fileType}`,
                fileUrl: `generated-documents/${intake.id}/${artifactId}.${template.fileType}`,
                fileType: template.fileType,
                generatedAt: new Date(),
                status: "generating",
            };
            await db.collection("documentArtifacts").doc(artifactId).set(artifact);
            // Step 1: Download and extract template content
            console.log(`📄 [AI-GEN] Downloading template from ${template.fileUrl}`);
            const templateFile = storage.bucket().file(template.fileUrl);
            const [templateBuffer] = await templateFile.download();
            console.log(`🔍 [AI-GEN] Extracting template content...`);
            const templateContent = await this.extractTemplateContent(templateBuffer, template.fileType);
            console.log(`📝 [AI-GEN] Template content extracted (${templateContent.length} chars)`);
            // Step 2: Send to OpenAI for intelligent document generation
            console.log(`🤖 [AI-GEN] Sending to OpenAI for document generation...`);
            const filledContent = await this.generateWithOpenAI(templateContent, intake.clientData, template);
            console.log(`✅ [AI-GEN] OpenAI generated document (${filledContent.length} chars)`);
            // Step 3: Convert AI response to proper document format
            console.log(`📦 [AI-GEN] Converting to ${template.fileType} format...`);
            let filledBuffer;
            if (template.fileType === "docx") {
                filledBuffer = await this.convertToWordDocument(filledContent, template.name);
            }
            else if (template.fileType === "pdf") {
                // For PDF, we'll need a different conversion approach
                // For now, create a Word doc and note in TODO to add PDF conversion
                filledBuffer = await this.convertToWordDocument(filledContent, template.name);
            }
            else {
                throw new Error(`Unsupported file type: ${template.fileType}`);
            }
            console.log(`💾 [AI-GEN] Uploading generated document...`);
            // Upload filled document
            const outputFile = storage.bucket().file(artifact.fileUrl);
            await outputFile.save(filledBuffer, {
                metadata: {
                    contentType: template.fileType === "pdf"
                        ? "application/pdf"
                        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                },
            });
            // Update artifact status
            await db.collection("documentArtifacts").doc(artifactId).update({
                status: "generated",
            });
            console.log(`🎉 [AI-GEN] Document generation complete: ${artifactId}`);
            return artifactId;
        }
        catch (error) {
            console.error(`❌ [AI-GEN] Error generating document for template ${template.id}:`, error);
            // Update artifact with error status
            await db.collection("documentArtifacts").doc(artifactId).update({
                status: "error",
                errorMessage: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    },
    /**
     * Extract full content from template (Word or PDF)
     */
    async extractTemplateContent(buffer, fileType) {
        try {
            if (fileType === "docx") {
                // Extract text from Word document including headers, footers, tables
                const result = await mammoth_1.default.extractRawText({ buffer });
                return result.value;
            }
            else if (fileType === "pdf") {
                // TODO: Add PDF text extraction (pdf-parse library)
                throw new Error("PDF extraction not yet implemented");
            }
            else {
                throw new Error(`Unsupported file type: ${fileType}`);
            }
        }
        catch (error) {
            console.error("❌ [AI-GEN] Error extracting template content:", error);
            throw error;
        }
    },
    /**
     * Send template and data to OpenAI for intelligent document generation
     */
    async generateWithOpenAI(templateContent, clientData, template) {
        var _a, _b, _c, _d, _e, _f;
        try {
            // Create explicit field mapping instructions
            const fieldInstructions = Object.entries(clientData)
                .map(([key, value]) => `  - ${key}: Replace with "${value}"`)
                .join('\n');
            const prompt = `You are a professional legal document preparation system with 100% accuracy requirements.

TASK: Fill a legal document template with client data following EXACT instructions.

CRITICAL RULES:
1. You MUST replace ALL placeholders with the exact values provided
2. You MUST preserve the original document structure, formatting, and legal language
3. You MUST NOT skip any fields or leave any placeholders unfilled
4. You MUST NOT add any content not in the original template
5. You MUST maintain all headings, sections, numbering, and formatting

TEMPLATE DOCUMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${templateContent}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLIENT DATA TO INSERT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fieldInstructions}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FIELD REPLACEMENT INSTRUCTIONS:
Find and replace these patterns in the template:

1. Direct field names: Replace any occurrence of field names like "trust_name", "grantor_names", "county", etc. with their corresponding values.

2. Quoted placeholders: Replace patterns like "Trust's name", "Grantor's name", "County", etc. with the actual values.

3. Descriptive text: Replace descriptive placeholders like "Name of Trust", "Currently Acting Trustees", "Notary Public Name", etc. with actual values.

4. Blanks and underscores: Replace patterns like "___", "____", "__________" with appropriate values based on context.

5. Date fields: For execution dates, ensure day="${clientData.execution_day}", month="${clientData.execution_month}", year="${clientData.execution_year}".

6. Notary information: Ensure Notary Public name="${clientData.notary_public_name}" and commission expiration="${clientData.notary_commission_expires}".

CRITICAL FIELDS THAT MUST APPEAR IN THE DOCUMENT:
${Object.entries(clientData).map(([key, value]) => `✓ "${value}" (from ${key})`).join('\n')}

EXAMPLE REPLACEMENTS:
- If you see "Notary Public Name" or "Name of Notary" or "_______________ (Notary Public)" → Replace with "${clientData.notary_public_name}"
- If you see "County" or "_______ County" → Replace with "${clientData.county}"
- If you see "Trust's name" or "Name of Trust" → Replace with "${clientData.trust_name}"
- If you see date fields with blanks like "day ____ of _________, 20____" → Replace with "day ${clientData.execution_day} of ${clientData.execution_month}, ${clientData.execution_year}"

SPECIFIC FIELD MAPPINGS (Use these EXACTLY):
${Object.entries(clientData).map(([key, value]) => `- Wherever you see "${key}" or related text → USE: "${value}"`).join('\n')}

VALIDATION CHECKLIST (Verify before responding):
${Object.entries(clientData).map(([key, value]) => `☐ "${value}" appears in the document (for ${key})`).join('\n')}

OUTPUT FORMAT:
Return ONLY the completed document with all fields filled. Do NOT include:
- Explanations or commentary
- Markdown code blocks
- Meta-text like "Here is the document..."
- Validation checklists

Start your response directly with the document text.`;
            console.log(`🤖 [AI-GEN] Calling OpenAI API (template: ${template.name})...`);
            console.log(`📊 [AI-GEN] Template length: ${templateContent.length} chars`);
            console.log(`📊 [AI-GEN] Client data fields: ${Object.keys(clientData).length}`);
            const openai = getOpenAI();
            const response = await openai.chat.completions.create({
                model: "gpt-4o", // Using GPT-4o for better document understanding
                messages: [
                    {
                        role: "system",
                        content: `You are a professional legal document preparation system with a 100% accuracy requirement. Your sole function is to fill document templates with client data while preserving all original formatting, structure, and legal language. You must replace every placeholder with the exact value provided. Never skip fields or add your own content. Never include explanations - only output the completed document.`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.1, // Very low temperature for maximum consistency and accuracy
                max_tokens: 4096, // Increased for longer documents
                top_p: 0.95, // Slightly restrict token selection for consistency
            });
            const generatedContent = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
            if (!generatedContent) {
                throw new Error("OpenAI returned empty response");
            }
            console.log(`✅ [AI-GEN] OpenAI generation successful`);
            console.log(`📊 [AI-GEN] Generated content length: ${generatedContent.length} chars`);
            console.log(`💰 [AI-GEN] Tokens used: ${((_c = response.usage) === null || _c === void 0 ? void 0 : _c.total_tokens) || 'unknown'}`);
            // VALIDATION: Check if all client data values appear in the generated document
            console.log(`🔍 [AI-GEN] Validating field insertion...`);
            const missingFields = [];
            const lowerContent = generatedContent.toLowerCase();
            for (const [fieldKey, fieldValue] of Object.entries(clientData)) {
                const valueStr = String(fieldValue).toLowerCase();
                if (!lowerContent.includes(valueStr)) {
                    missingFields.push(fieldKey);
                    console.log(`⚠️ [AI-GEN] Field "${fieldKey}" with value "${fieldValue}" NOT FOUND in generated document`);
                }
                else {
                    console.log(`✅ [AI-GEN] Field "${fieldKey}" with value "${fieldValue}" FOUND`);
                }
            }
            if (missingFields.length > 0) {
                console.log(`⚠️ [AI-GEN] WARNING: ${missingFields.length} fields missing: ${missingFields.join(', ')}`);
                console.log(`🔄 [AI-GEN] Attempting second pass to fix missing fields...`);
                // SECOND PASS: Ask AI to fix the missing fields specifically
                const fixPrompt = `CRITICAL FIX REQUIRED: The following fields are MISSING from the document and MUST be added.

DOCUMENT (with missing fields):
${generatedContent}

MISSING FIELDS THAT MUST BE INSERTED:
${missingFields.map(field => `- ${field}: "${clientData[field]}" (THIS VALUE MUST APPEAR IN THE DOCUMENT)`).join('\n')}

INSTRUCTIONS:
1. Find where each missing field should go in the document
2. Insert the EXACT value provided for each field
3. Maintain all existing formatting and structure
4. Return the COMPLETE document with ALL fields filled

For example, if "notary_public_name" is missing:
- Look for sections like "Notary Public", "STATE OF ___________", signature blocks, or notarization sections
- Insert "${clientData.notary_public_name || ''}" in the appropriate location
- Common patterns: "Notary Public: _________", "________________ (Notary Public)", "Name: _____________"

Return ONLY the corrected complete document, no explanations.`;
                const fixResponse = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: "You are fixing a document that is missing required fields. Your only job is to insert the missing values in their correct locations while preserving all existing content and formatting."
                        },
                        {
                            role: "user",
                            content: fixPrompt
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 4096,
                });
                const fixedContent = (_e = (_d = fixResponse.choices[0]) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.content;
                if (fixedContent) {
                    console.log(`✅ [AI-GEN] Second pass completed, using fixed document`);
                    console.log(`💰 [AI-GEN] Fix pass tokens: ${((_f = fixResponse.usage) === null || _f === void 0 ? void 0 : _f.total_tokens) || 'unknown'}`);
                    // Validate again
                    const fixedLower = fixedContent.toLowerCase();
                    let stillMissing = 0;
                    for (const field of missingFields) {
                        const valueStr = String(clientData[field]).toLowerCase();
                        if (!fixedLower.includes(valueStr)) {
                            stillMissing++;
                            console.log(`❌ [AI-GEN] Field "${field}" STILL MISSING after fix attempt`);
                        }
                        else {
                            console.log(`✅ [AI-GEN] Field "${field}" NOW FOUND after fix`);
                        }
                    }
                    if (stillMissing === 0) {
                        console.log(`🎉 [AI-GEN] All fields successfully fixed! Achieving 100% accuracy!`);
                    }
                    return fixedContent;
                }
            }
            else {
                console.log(`🎉 [AI-GEN] All ${Object.keys(clientData).length} fields validated successfully!`);
            }
            return generatedContent;
        }
        catch (error) {
            console.error("❌ [AI-GEN] OpenAI generation failed:", error);
            throw error;
        }
    },
    /**
     * Convert plain text to a properly formatted Word document
     */
    async convertToWordDocument(content, templateName) {
        try {
            console.log(`📝 [AI-GEN] Converting to Word document...`);
            // Split content into paragraphs
            const paragraphs = content.split('\n').map(line => {
                // Basic formatting detection
                const trimmed = line.trim();
                if (!trimmed) {
                    // Empty line
                    return new docx_1.Paragraph({
                        text: "",
                        spacing: { after: 200 }
                    });
                }
                // Check if it's a heading (all caps or numbered)
                const isHeading = /^[0-9]+\.|^[A-Z\s]+$/.test(trimmed) && trimmed.length < 100;
                return new docx_1.Paragraph({
                    children: [
                        new docx_1.TextRun({
                            text: line,
                            bold: isHeading,
                            size: isHeading ? 28 : 24, // 14pt for heading, 12pt for body
                        })
                    ],
                    spacing: { after: 200 }
                });
            });
            // Create document
            const doc = new docx_1.Document({
                sections: [{
                        properties: {},
                        children: paragraphs
                    }]
            });
            // Generate buffer
            const buffer = await docx_1.Packer.toBuffer(doc);
            console.log(`✅ [AI-GEN] Word document created (${buffer.length} bytes)`);
            return buffer;
        }
        catch (error) {
            console.error("❌ [AI-GEN] Error converting to Word document:", error);
            throw error;
        }
    },
    /**
     * Delete existing artifacts when regenerating
     */
    async deleteExistingArtifacts(intakeId) {
        try {
            const artifactsSnapshot = await db
                .collection("documentArtifacts")
                .where("intakeId", "==", intakeId)
                .get();
            const deletePromises = artifactsSnapshot.docs.map(async (doc) => {
                const artifact = doc.data();
                // Delete from storage
                try {
                    await storage.bucket().file(artifact.fileUrl).delete();
                }
                catch (error) {
                    console.error(`Error deleting file ${artifact.fileUrl}:`, error);
                }
                // Delete from Firestore
                await doc.ref.delete();
            });
            await Promise.all(deletePromises);
            console.log(`🗑️ [AI-GEN] Deleted ${artifactsSnapshot.size} existing artifacts`);
        }
        catch (error) {
            console.error("❌ [AI-GEN] Error deleting existing artifacts:", error);
        }
    },
};
//# sourceMappingURL=documentGeneratorAI.js.map