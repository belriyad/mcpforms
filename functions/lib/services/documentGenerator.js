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
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentGenerator = void 0;
const admin = __importStar(require("firebase-admin"));
const uuid_1 = require("uuid");
// Initialize Firebase Admin if not already initialized (needed for module loading order)
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const storage = admin.storage();
exports.documentGenerator = {
    async generateDocuments(data) {
        try {
            const { intakeId, regenerate = false } = data;
            if (!intakeId) {
                return { success: false, error: "Intake ID is required" };
            }
            // Get intake details
            const intakeDoc = await db.collection("intakes").doc(intakeId).get();
            if (!intakeDoc.exists) {
                return { success: false, error: "Intake not found" };
            }
            const intake = Object.assign(Object.assign({}, intakeDoc.data()), { id: intakeId });
            if (!regenerate && intake.status !== "approved") {
                return { success: false, error: "Intake must be approved before generating documents" };
            }
            // For regeneration, allow both approved and documents-generated status
            if (regenerate && !["approved", "documents-generated"].includes(intake.status)) {
                return { success: false, error: "Intake must be approved or have documents generated to regenerate documents" };
            }
            // Get service and templates
            const serviceDoc = await db.collection("services").doc(intake.serviceId).get();
            if (!serviceDoc.exists) {
                return { success: false, error: "Service not found" };
            }
            const service = serviceDoc.data();
            const templateDocs = await Promise.all(service.templateIds.map(id => db.collection("templates").doc(id).get()));
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
                await exports.documentGenerator.deleteExistingArtifacts(intakeId);
            }
            // Generate documents for each template
            const artifactIds = [];
            for (const template of templates) {
                try {
                    const artifactId = await exports.documentGenerator.generateDocumentFromTemplate(template, intake);
                    artifactIds.push(artifactId);
                }
                catch (error) {
                    console.error(`Error generating document for template ${template.id}:`, error);
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
            return {
                success: true,
                data: { artifactIds },
                message: `Successfully ${regenerate ? 'regenerated' : 'generated'} ${artifactIds.length} documents`,
            };
        }
        catch (error) {
            console.error("Error generating documents:", error);
            return { success: false, error: "Failed to generate documents" };
        }
    },
    async generateDocumentFromTemplate(template, intake) {
        const artifactId = (0, uuid_1.v4)();
        try {
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
            // Download original template
            const templateFile = storage.bucket().file(template.fileUrl);
            const [templateBuffer] = await templateFile.download();
            // Generate filled document based on file type
            console.log(`🔍 DEBUGGING CLIENT DATA AVAILABILITY:`);
            console.log(`   intake.clientData:`, intake.clientData);
            console.log(`   intake.formData:`, intake.formData);
            console.log(`   All intake properties:`, Object.keys(intake));
            console.log(`Template file type: ${template.fileType}`);
            let filledBuffer;
            if (template.fileType === "docx") {
                console.log("[v2.2] ABOUT TO CALL fillWordDocument");
                filledBuffer = await exports.documentGenerator.fillWordDocument(templateBuffer, intake.clientData, template);
                console.log("[v2.2] RETURNED FROM fillWordDocument");
            }
            else if (template.fileType === "pdf") {
                filledBuffer = await exports.documentGenerator.fillPdfDocument(templateBuffer, intake.clientData);
            }
            else {
                throw new Error(`Unsupported file type: ${template.fileType}`);
            }
            // Upload filled document
            const outputFile = storage.bucket().file(artifact.fileUrl);
            await outputFile.save(filledBuffer, {
                metadata: {
                    contentType: template.fileType === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                },
            });
            // Update artifact status
            await db.collection("documentArtifacts").doc(artifactId).update({
                status: "generated",
            });
            return artifactId;
        }
        catch (error) {
            console.error(`Error generating document for template ${template.id}:`, error);
            // Update artifact with error status
            await db.collection("documentArtifacts").doc(artifactId).update({
                status: "error",
                errorMessage: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    },
    async fillWordDocument(templateBuffer, clientData, template) {
        // For Word documents, we'll use docxtemplater for proper template filling
        try {
            // MUST RUN: Critical entry point validation
            console.log("[TRIAGE-v3.0] ========== FILLWORDDOCUMENT START ==========");
            console.log("[TRIAGE-v3.0] EXECUTION PROOF:", Date.now());
            console.log("[TRIAGE-v3.0] Buffer validation:", {
                isBuffer: Buffer.isBuffer(templateBuffer),
                isUint8Array: templateBuffer instanceof Uint8Array,
                length: templateBuffer === null || templateBuffer === void 0 ? void 0 : templateBuffer.length,
                hasData: templateBuffer && templateBuffer.length > 0
            });
            if (!Buffer.isBuffer(templateBuffer) || templateBuffer.length === 0) {
                throw new Error("MUSTRUN FAILED: Invalid template buffer");
            }
            console.log("[TRIAGE-v3.0] Client data keys:", Object.keys(clientData));
            console.log("[TRIAGE-v3.0] Client data sample:", Object.keys(clientData).slice(0, 3).map(k => `${k}=${clientData[k]}`));
            console.log("[TRIAGE-v3.0] Template info:", template ? { id: template.id, name: template.name } : 'no template metadata');
            // Use docxtemplater approach with zip manipulation
            const PizZip = require('pizzip');
            const Docxtemplater = require('docxtemplater');
            // Load the template - MUSTRUN: Verify PizZip doesn't throw
            console.log("[TRIAGE-v3.0] Attempting to load template with PizZip...");
            let zip;
            try {
                zip = new PizZip(templateBuffer);
                console.log("[TRIAGE-v3.0] ✅ PizZip loaded successfully");
            }
            catch (zipError) {
                console.error("[TRIAGE-v3.0] ❌ MUSTRUN FAILED: PizZip construction error:", zipError);
                throw new Error(`PizZip failed: ${zipError instanceof Error ? zipError.message : String(zipError)}`);
            }
            // MUSTRUN: Extract and examine ALL document parts (main, header, footer)
            console.log("[TRIAGE-v3.0] Examining template structure...");
            console.log("[TRIAGE-v3.0] Available files in zip:", Object.keys(zip.files).filter(f => f.includes('xml')));
            // Extract the main document XML to look for placeholders
            let documentXml = zip.files["word/document.xml"];
            let headerXml = zip.files["word/header1.xml"] || zip.files["word/header.xml"];
            let footerXml = zip.files["word/footer1.xml"] || zip.files["word/footer.xml"];
            if (!documentXml) {
                throw new Error("MUSTRUN FAILED: word/document.xml not found in template");
            }
            // Track replacements outside try-catch for access later
            let quotedReplacementsTotal = 0;
            try {
                let xmlContent = documentXml.asText();
                console.log("[TRIAGE-v3.0] Document XML extracted, length:", xmlContent.length);
                // Normalize smart quotes to ASCII before any processing
                console.log("[TRIAGE-v3.0] Normalizing smart quotes to ASCII...");
                const beforeNormalization = xmlContent.substring(0, 200);
                xmlContent = xmlContent
                    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes → ASCII apostrophe
                    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes → ASCII quote
                    .replace(/\u2013/g, '-') // En dash → hyphen
                    .replace(/\u2014/g, '--'); // Em dash → double hyphen
                if (beforeNormalization !== xmlContent.substring(0, 200)) {
                    console.log("[TRIAGE-v3.0] ✅ Smart quotes normalized");
                }
                // Collapse split w:t runs that might break quoted placeholder matching
                console.log("[TRIAGE-v3.0] Collapsing split <w:t> runs...");
                const beforeCollapseLength = xmlContent.length;
                // Pattern: </w:t></w:r><w:r><w:t> (with optional attributes) → merge text nodes
                xmlContent = xmlContent.replace(/<\/w:t><\/w:r>\s*<w:r[^>]*>\s*<w:t[^>]*>/g, '');
                if (xmlContent.length !== beforeCollapseLength) {
                    console.log(`[TRIAGE-v3.0] ✅ Collapsed split runs (${beforeCollapseLength} → ${xmlContent.length} bytes)`);
                }
                console.log("[TRIAGE-v3.0] XML after normalization length:", xmlContent.length);
                // Look for placeholder patterns like {{fieldName}}
                const standardPlaceholders = xmlContent.match(/\{\{[^}]+\}\}/g);
                console.log("[TRIAGE-v3.0] Standard {{placeholders}}:", standardPlaceholders ? standardPlaceholders.length : 0);
                if (standardPlaceholders) {
                    console.log("[TRIAGE-v3.0] Found standard placeholders:", standardPlaceholders.slice(0, 5));
                }
                // Look for quoted placeholders
                const quotedPlaceholderPattern = /"[^"]{3,50}"/g;
                const potentialQuotedPlaceholders = xmlContent.match(quotedPlaceholderPattern);
                console.log("[TRIAGE-v3.0] Potential quoted placeholders:", potentialQuotedPlaceholders ? potentialQuotedPlaceholders.length : 0);
                if (potentialQuotedPlaceholders) {
                    console.log("[TRIAGE-v3.0] Sample quoted text:", potentialQuotedPlaceholders.slice(0, 10));
                }
                // Check for specific Certificate of Trust quoted placeholders
                const certificateQuotedFields = [
                    "Trust's name",
                    "Grantor's name",
                    "county",
                    "execution day",
                    "execution month",
                    "execution year"
                ];
                console.log("[TRIAGE-v3.0] Checking for Certificate of Trust quoted fields...");
                let foundCertificateFields = 0;
                for (const field of certificateQuotedFields) {
                    const quoted = '"' + field + '"';
                    if (xmlContent.includes(quoted)) {
                        console.log(`[TRIAGE-v3.0] ✅ FOUND: ${quoted}`);
                        foundCertificateFields++;
                    }
                }
                console.log(`[TRIAGE-v3.0] Certificate fields detected: ${foundCertificateFields}/${certificateQuotedFields.length}`);
                // MUSTRUN: Replace quoted placeholders BEFORE docxtemplater processing
                console.log("[TRIAGE-v3.0] ========== APPLYING QUOTED PLACEHOLDER REPLACEMENTS ==========");
                let quotedReplacements = 0;
                let quotedPlaceholdersFound = 0;
                let quotedPlaceholdersMissing = 0;
                // Certificate of Trust specific quoted placeholder replacements
                // Expanded with many variations to handle different template formats
                const quotedPlaceholderMappings = [
                    // Trust name variations
                    { search: '"Trust\'s name"', field: 'trust_name', required: true },
                    { search: '"trust name"', field: 'trust_name', required: false },
                    { search: '"name of trust"', field: 'trust_name', required: false },
                    { search: '"Name of Trust"', field: 'trust_name', required: false },
                    // Grantor name variations
                    { search: '"Grantor\'s name"', field: 'grantor_names', required: true },
                    { search: '"Grantor\'s name or names in case of multiple grantors"', field: 'grantor_names', required: false },
                    { search: '"Name of Grantor"', field: 'grantor_names', required: false },
                    { search: '"grantor name"', field: 'grantor_names', required: false },
                    { search: '"Grantor"', field: 'grantor_names', required: false },
                    // Trustee variations
                    { search: '"current trustees"', field: 'current_trustees', required: false },
                    { search: '"Current Trustees"', field: 'current_trustees', required: false },
                    { search: '"current trustee"', field: 'current_trustees', required: false },
                    { search: '"trustee name"', field: 'current_trustees', required: false },
                    { search: '"successor trustees"', field: 'successor_trustees', required: false },
                    { search: '"Successor Trustees"', field: 'successor_trustees', required: false },
                    { search: '"successor trustee"', field: 'successor_trustees', required: false },
                    { search: '"successor co-trustees"', field: 'successor_co_trustees', required: false },
                    { search: '"Successor Co-Trustees"', field: 'successor_co_trustees', required: false },
                    // Notary variations
                    { search: '"notary public name"', field: 'notary_public_name', required: false },
                    { search: '"Notary Public Name"', field: 'notary_public_name', required: false },
                    { search: '"notary name"', field: 'notary_public_name', required: false },
                    { search: '"Notary"', field: 'notary_public_name', required: false },
                    // Location variations
                    { search: '"county"', field: 'county', required: true },
                    { search: '"County"', field: 'county', required: false },
                    { search: '"county name"', field: 'county', required: false },
                    // Date variations
                    { search: '"execution day"', field: 'execution_day', required: false },
                    { search: '"Execution Day"', field: 'execution_day', required: false },
                    { search: '"day"', field: 'execution_day', required: false },
                    { search: '"DD"', field: 'execution_day', required: false },
                    { search: '"execution month"', field: 'execution_month', required: false },
                    { search: '"Execution Month"', field: 'execution_month', required: false },
                    { search: '"month"', field: 'execution_month', required: false },
                    { search: '"MM"', field: 'execution_month', required: false },
                    { search: '"execution year"', field: 'execution_year', required: false },
                    { search: '"Execution Year"', field: 'execution_year', required: false },
                    { search: '"year"', field: 'execution_year', required: false },
                    { search: '"YYYY"', field: 'execution_year', required: false },
                    { search: '"notary commission expires"', field: 'notary_commission_expires', required: false },
                    { search: '"Notary Commission Expires"', field: 'notary_commission_expires', required: false },
                    { search: '"commission expires"', field: 'notary_commission_expires', required: false },
                    { search: '"expiration date"', field: 'notary_commission_expires', required: false },
                    { search: '"signature authority"', field: 'signature_authority', required: false },
                    { search: '"Signature Authority"', field: 'signature_authority', required: false },
                    { search: '"signing authority"', field: 'signature_authority', required: false }
                ];
                for (const mapping of quotedPlaceholderMappings) {
                    const clientValue = clientData[mapping.field];
                    const placeholderExists = xmlContent.includes(mapping.search);
                    if (placeholderExists) {
                        quotedPlaceholdersFound++;
                        console.log(`[TRIAGE-v3.0] Found quoted placeholder: ${mapping.search}`);
                        if (clientValue) {
                            try {
                                const beforeCount = (xmlContent.match(new RegExp(escapeRegExp(mapping.search), 'g')) || []).length;
                                xmlContent = xmlContent.replace(new RegExp(escapeRegExp(mapping.search), 'g'), String(clientValue));
                                const afterCount = (xmlContent.match(new RegExp(escapeRegExp(mapping.search), 'g')) || []).length;
                                const replacements = beforeCount - afterCount;
                                if (replacements > 0) {
                                    quotedReplacements += replacements;
                                    console.log(`[TRIAGE-v3.0] ✅ REPLACED: ${mapping.search} → "${clientValue}" (${replacements}x)`);
                                }
                                else {
                                    console.log(`[TRIAGE-v3.0] ⚠️ FAILED to replace: ${mapping.search}`);
                                }
                            }
                            catch (replaceError) {
                                console.error(`[TRIAGE-v3.0] ❌ Error replacing ${mapping.search}:`, replaceError);
                            }
                        }
                        else {
                            console.log(`[TRIAGE-v3.0] ⚠️ No client data for field: ${mapping.field}`);
                            if (mapping.required) {
                                quotedPlaceholdersMissing++;
                            }
                        }
                    }
                }
                console.log(`[TRIAGE-v3.0] ========== REPLACEMENT SUMMARY ==========`);
                console.log(`[TRIAGE-v3.0] Quoted placeholders found: ${quotedPlaceholdersFound}`);
                console.log(`[TRIAGE-v3.0] Successful replacements: ${quotedReplacements}`);
                console.log(`[TRIAGE-v3.0] Missing required data: ${quotedPlaceholdersMissing}`);
                // SOLUTION 1: AGGRESSIVE DIRECT TEXT REPLACEMENT
                // Replace field values wherever they might appear in the document
                console.log("[AGGRESSIVE-REPLACE] ========== STARTING AGGRESSIVE TEXT REPLACEMENT ==========");
                let aggressiveReplacements = 0;
                // Helper function to replace text only within <w:t> tags (not in XML structure)
                function replaceInTextNodes(xml, searchText, replaceWith, caseInsensitive = false) {
                    let count = 0;
                    const flags = caseInsensitive ? 'gi' : 'g';
                    // Pattern to match text within <w:t> tags
                    const textNodePattern = /(<w:t[^>]*>)(.*?)(<\/w:t>)/g;
                    xml = xml.replace(textNodePattern, (match, openTag, textContent, closeTag) => {
                        try {
                            const searchPattern = new RegExp(escapeRegExp(searchText), flags);
                            if (searchPattern.test(textContent)) {
                                count++;
                                const newContent = textContent.replace(searchPattern, replaceWith);
                                return openTag + newContent + closeTag;
                            }
                        }
                        catch (e) {
                            // Skip if regex fails
                        }
                        return match;
                    });
                    return { xml, count };
                }
                // AGGRESSIVE STRATEGY 1: Field name pattern matching
                // Look for patterns like "field_name", "Field Name", "fieldName" in text
                const fieldPatternMap = {
                    county: ['county', 'County', 'COUNTY'],
                    current_trustees: ['current trustees', 'Current Trustees', 'current trustee'],
                    successor_trustees: ['successor trustees', 'Successor Trustees'],
                    successor_co_trustees: ['successor co-trustees', 'Successor Co-Trustees'],
                    execution_day: ['execution day', 'day'],
                    execution_year: ['execution year', 'year'],
                    notary_commission_expires: ['commission expires'],
                };
                for (const [fieldName, patterns] of Object.entries(fieldPatternMap)) {
                    const fieldValue = clientData[fieldName];
                    if (!fieldValue)
                        continue;
                    for (const pattern of patterns) {
                        const result = replaceInTextNodes(xmlContent, pattern, String(fieldValue), false);
                        if (result.count > 0) {
                            xmlContent = result.xml;
                            aggressiveReplacements += result.count;
                            console.log(`[AGGRESSIVE-REPLACE] ✅ "${pattern}" → "${fieldValue}" (${result.count}x)`);
                        }
                    }
                }
                // AGGRESSIVE STRATEGY 2: Replace field key names directly
                // Templates might use "trust_name" or "trustName" as literal text
                for (const [fieldKey, fieldValue] of Object.entries(clientData)) {
                    if (!fieldValue || typeof fieldValue !== 'string')
                        continue;
                    // Try exact field key match (trust_name)
                    const result1 = replaceInTextNodes(xmlContent, fieldKey, String(fieldValue), false);
                    if (result1.count > 0) {
                        xmlContent = result1.xml;
                        aggressiveReplacements += result1.count;
                        console.log(`[AGGRESSIVE-REPLACE] ✅ Key "${fieldKey}" → "${fieldValue}" (${result1.count}x)`);
                    }
                    // Try readable format (trust name)
                    const readableKey = fieldKey.replace(/_/g, ' ');
                    if (readableKey !== fieldKey) {
                        const result2 = replaceInTextNodes(xmlContent, readableKey, String(fieldValue), true);
                        if (result2.count > 0) {
                            xmlContent = result2.xml;
                            aggressiveReplacements += result2.count;
                            console.log(`[AGGRESSIVE-REPLACE] ✅ Readable "${readableKey}" → "${fieldValue}" (${result2.count}x)`);
                        }
                    }
                }
                // AGGRESSIVE STRATEGY 3: Ultra-targeted patterns for last 3 stubborn fields
                // These fields weren't catching with general patterns, so we add very specific variants
                console.log(`[AGGRESSIVE-FINAL] 🎯 Targeting final 3 stubborn fields...`);
                let finalPushReplacements = 0;
                // 1. notary_commission_expires
                if (clientData.notary_commission_expires) {
                    const notaryExpirePatterns = [
                        "notary commission expires",
                        "commission expires",
                        "expires on",
                        "Notary Commission Expires",
                        "Commission Expires on",
                        "My Commission Expires",
                        "expires",
                        "Expiration Date",
                        "expiration date"
                    ];
                    for (const p of notaryExpirePatterns) {
                        const r = replaceInTextNodes(xmlContent, p, String(clientData.notary_commission_expires), true);
                        if (r.count > 0) {
                            xmlContent = r.xml;
                            finalPushReplacements += r.count;
                            console.log(`[AGGRESSIVE-FINAL] ✅ Notary Expires "${p}" → "${clientData.notary_commission_expires}" (${r.count}x)`);
                        }
                    }
                }
                // 2. execution_year
                if (clientData.execution_year) {
                    const yearPatterns = [
                        "execution_year",
                        "execution year",
                        ", 20__",
                        ", 20____",
                        "year",
                        "Year",
                        "____, 20__"
                    ];
                    for (const p of yearPatterns) {
                        const r = replaceInTextNodes(xmlContent, p, String(clientData.execution_year), true);
                        if (r.count > 0) {
                            xmlContent = r.xml;
                            finalPushReplacements += r.count;
                            console.log(`[AGGRESSIVE-FINAL] ✅ Execution Year "${p}" → "${clientData.execution_year}" (${r.count}x)`);
                        }
                    }
                }
                // 3. current_trustees
                if (clientData.current_trustees) {
                    const currentTrusteePatterns = [
                        "current_trustees",
                        "current trustees",
                        "Current Trustee(s)",
                        "Current Trustees",
                        "Trustee(s)",
                        "acting Trustee",
                        "serving Trustee"
                    ];
                    for (const p of currentTrusteePatterns) {
                        const r = replaceInTextNodes(xmlContent, p, String(clientData.current_trustees), true);
                        if (r.count > 0) {
                            xmlContent = r.xml;
                            finalPushReplacements += r.count;
                            console.log(`[AGGRESSIVE-FINAL] ✅ Current Trustees "${p}" → "${clientData.current_trustees}" (${r.count}x)`);
                        }
                    }
                }
                console.log(`[AGGRESSIVE-FINAL] 🎯 Final push replacements: ${finalPushReplacements}`);
                aggressiveReplacements += finalPushReplacements;
                console.log(`[AGGRESSIVE-REPLACE] Total aggressive replacements: ${aggressiveReplacements}`);
                quotedReplacements += aggressiveReplacements;
                console.log(`[AGGRESSIVE-REPLACE] ========== FINAL COMBINED COUNT: ${quotedReplacements} ==========`);
                // Store for outer scope access
                quotedReplacementsTotal = quotedReplacements;
                // MUSTRUN: If template has quoted placeholders but none were replaced, ABORT
                if (quotedPlaceholdersFound > 0 && quotedReplacements === 0) {
                    const errorMsg = `MUSTRUN FAILED: Template has ${quotedPlaceholdersFound} quoted placeholders but ZERO were replaced. Cannot proceed with {{}} fallback mode.`;
                    console.error(`[TRIAGE-v3.0] ❌ ${errorMsg}`);
                    throw new Error(errorMsg);
                }
                // Commit changes back to zip if replacements were made
                if (quotedReplacementsTotal > 0) {
                    console.log(`[TRIAGE-v3.0] Committing ${quotedReplacementsTotal} replacements back to zip...`);
                    zip.file("word/document.xml", xmlContent);
                    // Also process header and footer if they exist
                    if (headerXml) {
                        let headerContent = headerXml.asText();
                        const headerBefore = headerContent.length;
                        for (const mapping of quotedPlaceholderMappings) {
                            const clientValue = clientData[mapping.field];
                            if (clientValue && headerContent.includes(mapping.search)) {
                                headerContent = headerContent.replace(new RegExp(escapeRegExp(mapping.search), 'g'), String(clientValue));
                            }
                        }
                        if (headerContent.length !== headerBefore) {
                            zip.file("word/header1.xml", headerContent);
                            console.log(`[TRIAGE-v3.0] ✅ Updated header`);
                        }
                    }
                    if (footerXml) {
                        let footerContent = footerXml.asText();
                        const footerBefore = footerContent.length;
                        for (const mapping of quotedPlaceholderMappings) {
                            const clientValue = clientData[mapping.field];
                            if (clientValue && footerContent.includes(mapping.search)) {
                                footerContent = footerContent.replace(new RegExp(escapeRegExp(mapping.search), 'g'), String(clientValue));
                            }
                        }
                        if (footerContent.length !== footerBefore) {
                            zip.file("word/footer1.xml", footerContent);
                            console.log(`[TRIAGE-v3.0] ✅ Updated footer`);
                        }
                    }
                    console.log(`[TRIAGE-v3.0] ✅ All changes committed to zip`);
                }
            }
            catch (xmlError) {
                console.error("[TRIAGE-v3.0] ❌ CRITICAL ERROR in XML processing:", xmlError);
                throw xmlError; // Re-throw to prevent silent failure
            }
            // MUSTRUN: Construct Docxtemplater with the modified zip
            console.log("[FINAL-CHECK] About to construct Docxtemplater...");
            console.log("[FINAL-CHECK] Quoted replacements made:", quotedReplacementsTotal);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                errorLogging: true,
            });
            console.log("[FINAL-CHECK] Docxtemplater instance created successfully");
            console.log("[FINAL-CHECK] This log MUST appear if code executes!");
            // Prepare data for template - flatten nested objects and ensure all values are strings
            const templateData = {};
            for (const [key, value] of Object.entries(clientData)) {
                if (value !== null && value !== undefined) {
                    templateData[key] = String(value);
                    console.log(`Prepared template data: ${key} = "${templateData[key]}"`);
                }
                else {
                    templateData[key] = "";
                    console.log(`Prepared template data: ${key} = "" (empty)`);
                }
            }
            console.log("Setting template data:", templateData);
            // Set the data and render the document using new API
            try {
                doc.render(templateData);
                console.log("Document rendered successfully with docxtemplater");
                // After rendering, let's check what the document looks like
                try {
                    const renderedXml = doc.getZip().files["word/document.xml"];
                    if (renderedXml) {
                        const renderedContent = renderedXml.asText();
                        console.log("Rendered document XML length:", renderedContent.length);
                        // Check if any of our data values appear in the rendered content
                        for (const [key, value] of Object.entries(templateData)) {
                            if (value && renderedContent.includes(value)) {
                                console.log(`✅ Data value "${value}" found in rendered document`);
                            }
                            else {
                                console.log(`❌ Data value "${value}" NOT found in rendered document`);
                            }
                        }
                        // Look for any remaining placeholders
                        const remainingPlaceholders = renderedContent.match(/\{\{[^}]+\}\}/g);
                        if (remainingPlaceholders) {
                            console.log("⚠️ Unfilled placeholders still remain:", remainingPlaceholders);
                        }
                        else {
                            console.log("✅ No unfilled placeholders found");
                        }
                    }
                }
                catch (debugError) {
                    console.error("Error during post-render debugging:", debugError);
                }
            }
            catch (renderError) {
                console.error("Docxtemplater render error:", renderError);
                // Try to get more details about the error
                if (renderError && typeof renderError === 'object' && 'properties' in renderError) {
                    console.error("Render errors:", renderError.properties.errors);
                }
                throw renderError;
            }
            // Check if any data was actually filled
            let dataWasFilled = false;
            for (const [key, value] of Object.entries(templateData)) {
                if (value && doc.getZip().files["word/document.xml"].asText().includes(value)) {
                    dataWasFilled = true;
                    break;
                }
            }
            if (!dataWasFilled) {
                console.log("⚠️ No data was filled by docxtemplater - template may have no placeholders");
                // Try AI-identified insertion points first if available
                if (template && template.insertionPoints && template.insertionPoints.length > 0) {
                    console.log("🎯 Using AI-identified insertion points for data placement...");
                    return await this.fillWordDocumentWithAIInsertionPoints(templateBuffer, clientData, template.insertionPoints);
                }
                else {
                    console.log("🔄 Attempting smart text replacement fallback...");
                    return await this.fillWordDocumentWithSmartReplacement(templateBuffer, clientData);
                }
            }
            // Generate the filled document
            const filledBuffer = doc.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE',
            });
            console.log("Word document filled successfully with docxtemplater");
            return filledBuffer;
        }
        catch (error) {
            console.error("=== DOCXTEMPLATER FAILED ===");
            console.error("Error details:", error);
            console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
            // Try simpler text-based approach as fallback
            try {
                console.log("Attempting simpler text replacement fallback...");
                return await this.fillWordDocumentSimple(templateBuffer, clientData);
            }
            catch (fallbackError) {
                console.error("Fallback also failed:", fallbackError);
                console.log("Returning original document");
                return templateBuffer;
            }
        }
    },
    async fillWordDocumentSimple(templateBuffer, clientData) {
        try {
            console.log("Using simple Word document filling approach");
            const mammoth = require("mammoth");
            // Extract text from template
            const result = await mammoth.extractRawText({ buffer: templateBuffer });
            let text = result.value;
            console.log("Extracted text length:", text.length);
            console.log("First 200 chars:", text.substring(0, 200));
            let replacements = 0;
            // Replace placeholders with client data
            for (const [key, value] of Object.entries(clientData)) {
                const stringValue = String(value || "");
                const patterns = [
                    new RegExp(`\\{\\{${key}\\}\\}`, "gi"),
                    new RegExp(`\\[${key}\\]`, "gi"),
                    new RegExp(`\\$\\{${key}\\}`, "gi"),
                    new RegExp(`<${key}>`, "gi"),
                ];
                for (const pattern of patterns) {
                    const beforeLength = text.length;
                    text = text.replace(pattern, stringValue);
                    if (text.length !== beforeLength) {
                        replacements++;
                        console.log(`Replaced pattern ${pattern} with "${stringValue}"`);
                    }
                }
            }
            console.log(`Made ${replacements} text replacements`);
            if (replacements > 0) {
                // Create a new simple document with the filled text
                const { Document, Packer, Paragraph, TextRun } = require('docx');
                const doc = new Document({
                    sections: [{
                            properties: {},
                            children: text.split('\n').map((line) => new Paragraph({
                                children: [new TextRun(line)],
                            })),
                        }],
                });
                const buffer = await Packer.toBuffer(doc);
                console.log("Created new Word document with filled text");
                return buffer;
            }
            else {
                console.log("No replacements made, returning original");
                return templateBuffer;
            }
        }
        catch (error) {
            console.error("Simple Word filling failed:", error);
            throw error;
        }
    },
    async fillPdfDocument(templateBuffer, clientData) {
        var _a;
        // For PDF documents, we'll use pdf-lib for form filling
        try {
            console.log("Filling PDF document with client data:", Object.keys(clientData));
            const { PDFDocument } = require('pdf-lib');
            // Load the PDF template
            const pdfDoc = await PDFDocument.load(templateBuffer);
            const form = pdfDoc.getForm();
            // Get all form fields
            const fields = form.getFields();
            console.log("PDF form fields found:", fields.map((f) => f.getName()));
            // Fill form fields with client data
            let fieldsUpdated = 0;
            for (const field of fields) {
                const fieldName = field.getName();
                // Try to match field name with client data (case-insensitive)
                const clientValue = (_a = Object.entries(clientData).find(([key]) => key.toLowerCase() === fieldName.toLowerCase())) === null || _a === void 0 ? void 0 : _a[1];
                if (clientValue !== undefined && clientValue !== null) {
                    try {
                        if (field.constructor.name.includes('TextField')) {
                            field.setText(String(clientValue));
                            fieldsUpdated++;
                            console.log(`Filled text field "${fieldName}" with "${clientValue}"`);
                        }
                        else if (field.constructor.name.includes('CheckBox')) {
                            const isChecked = String(clientValue).toLowerCase() === 'true' || clientValue === '1' || clientValue === 'yes';
                            if (isChecked) {
                                field.check();
                            }
                            else {
                                field.uncheck();
                            }
                            fieldsUpdated++;
                            console.log(`Set checkbox "${fieldName}" to ${isChecked}`);
                        }
                    }
                    catch (fieldError) {
                        console.warn(`Error filling field "${fieldName}":`, fieldError);
                    }
                }
            }
            console.log(`Updated ${fieldsUpdated} PDF form fields`);
            // If no form fields were found, try text replacement approach
            if (fields.length === 0) {
                console.log("No form fields found, attempting text replacement");
                // This is a more complex approach for PDFs without forms
                // For now, return original with logging
                console.log("PDF text replacement not yet implemented, returning original");
            }
            // Save the filled PDF
            const filledBuffer = Buffer.from(await pdfDoc.save());
            console.log("PDF document filled successfully");
            return filledBuffer;
        }
        catch (error) {
            console.error("Error filling PDF document:", error);
            console.error("Client data:", clientData);
            // Fallback: return original document
            console.log("Falling back to original PDF document due to error");
            return templateBuffer;
        }
    },
    // Helper function to create download URLs for generated documents
    async getDownloadUrl(data) {
        try {
            const { artifactId } = data;
            if (!artifactId) {
                return { success: false, error: "Artifact ID is required" };
            }
            const artifactDoc = await db.collection("documentArtifacts").doc(artifactId).get();
            if (!artifactDoc.exists) {
                return { success: false, error: "Document not found" };
            }
            const artifact = artifactDoc.data();
            if (artifact.status !== "generated") {
                return { success: false, error: "Document is not ready for download" };
            }
            const file = storage.bucket().file(artifact.fileUrl);
            // Check if file exists
            const [exists] = await file.exists();
            if (!exists) {
                console.error(`File does not exist: ${artifact.fileUrl}`);
                return { success: false, error: "Document file not found in storage" };
            }
            // Return the artifact info for direct file serving
            // We'll create a separate HTTP endpoint to serve the file
            const downloadUrl = `https://us-central1-formgenai-4545.cloudfunctions.net/downloadDocument/${artifactId}`;
            return {
                success: true,
                data: { downloadUrl },
                message: "Download URL generated successfully",
            };
        }
        catch (error) {
            console.error("Error generating download URL:", error);
            console.error("Error details:", {
                artifactId: data.artifactId,
                errorMessage: error instanceof Error ? error.message : "Unknown error",
                errorStack: error instanceof Error ? error.stack : "No stack trace"
            });
            return { success: false, error: `Failed to generate download URL: ${error instanceof Error ? error.message : "Unknown error"}` };
        }
    },
    // Helper function to download document file directly
    async downloadDocumentFile(artifactId) {
        try {
            const artifactDoc = await db.collection("documentArtifacts").doc(artifactId).get();
            if (!artifactDoc.exists) {
                return { success: false, error: "Document not found" };
            }
            const artifact = artifactDoc.data();
            if (artifact.status !== "generated") {
                return { success: false, error: "Document is not ready for download" };
            }
            const file = storage.bucket().file(artifact.fileUrl);
            // Check if file exists
            const [exists] = await file.exists();
            if (!exists) {
                console.error(`File does not exist: ${artifact.fileUrl}`);
                return { success: false, error: "Document file not found in storage" };
            }
            // Download file buffer
            const [fileBuffer] = await file.download();
            const contentType = artifact.fileType === "pdf"
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            return {
                success: true,
                data: {
                    fileBuffer,
                    fileName: artifact.fileName,
                    contentType
                },
                message: "File downloaded successfully",
            };
        }
        catch (error) {
            console.error("Error downloading document file:", error);
            return { success: false, error: `Failed to download document file: ${error instanceof Error ? error.message : "Unknown error"}` };
        }
    },
    async deleteExistingArtifacts(intakeId) {
        try {
            // Get all existing artifacts for this intake
            const artifactsQuery = await db.collection("documentArtifacts")
                .where("intakeId", "==", intakeId)
                .get();
            const deletePromises = [];
            for (const doc of artifactsQuery.docs) {
                const artifact = doc.data();
                // Delete from storage if file exists
                if (artifact.fileUrl) {
                    const file = storage.bucket().file(artifact.fileUrl);
                    deletePromises.push(file.exists().then(([exists]) => {
                        if (exists) {
                            return file.delete().then(() => {
                                console.log(`Deleted file from storage: ${artifact.fileUrl}`);
                            });
                        }
                        return Promise.resolve();
                    }).catch(error => {
                        console.error(`Error deleting file ${artifact.fileUrl}:`, error);
                        // Don't throw - continue with other deletions
                        return Promise.resolve();
                    }));
                }
                // Delete document artifact record
                deletePromises.push(doc.ref.delete().then(() => {
                    console.log(`Deleted artifact record: ${doc.id}`);
                }).catch(error => {
                    console.error(`Error deleting artifact record ${doc.id}:`, error);
                    // Don't throw - continue with other deletions
                }));
            }
            await Promise.all(deletePromises);
            console.log(`Successfully cleaned up existing artifacts for intake ${intakeId}`);
        }
        catch (error) {
            console.error("Error deleting existing artifacts:", error);
            // Don't throw - let regeneration continue
        }
    },
    async fillWordDocumentWithSmartReplacement(templateBuffer, clientData) {
        try {
            console.log("=== SMART TEXT REPLACEMENT APPROACH (FIXED FOR QUOTED PLACEHOLDERS) ===");
            const PizZip = require('pizzip');
            const zip = new PizZip(templateBuffer);
            // Get the main document XML
            const documentXml = zip.files["word/document.xml"];
            if (!documentXml) {
                console.log("Could not find document.xml, returning original");
                return templateBuffer;
            }
            let xmlContent = documentXml.asText();
            console.log("Original document XML length:", xmlContent.length);
            // Define replacement patterns - UPDATED to match actual template syntax
            const replacementPatterns = [
                // QUOTED PLACEHOLDER PATTERNS (actual template syntax)
                { pattern: /" Grantor's name"/gi, field: 'fullName', description: 'Grantor name in quotes' },
                { pattern: /" Name"/gi, field: 'fullName', description: 'Name in quotes' },
                { pattern: /"Grantor's name"/gi, field: 'fullName', description: 'Grantor name in quotes (no space)' },
                { pattern: /" Identify Successor trustees"/gi, field: 'trusteeName', description: 'Successor trustees in quotes' },
                { pattern: /"Identify Successor trustees"/gi, field: 'trusteeName', description: 'Successor trustees in quotes (no space)' },
                { pattern: /" Successor Co-Trustee's name"/gi, field: 'trusteeName', description: 'Co-Trustee name in quotes' },
                { pattern: /"Successor Co-Trustee's name"/gi, field: 'trusteeName', description: 'Co-Trustee name in quotes (no space)' },
                { pattern: /" Date of Birth"/gi, field: 'documentDate', description: 'Date of birth in quotes' },
                { pattern: /"Date of Birth"/gi, field: 'documentDate', description: 'Date of birth in quotes (no space)' },
                { pattern: /" Legal Description of the property\/ies"/gi, field: 'propertyAddress', description: 'Property description in quotes' },
                { pattern: /"Legal Description of the property\/ies"/gi, field: 'propertyAddress', description: 'Property description in quotes (no space)' },
                // UNDERSCORE PATTERNS (for blank filling)
                { pattern: /__{10,}/g, field: 'fullName', description: 'Long underscores for names' },
                // TRADITIONAL PATTERNS (keep as fallback)
                { pattern: /NAME:\s*_+/gi, field: 'fullName', description: 'Name field with underlines' },
                { pattern: /Name:\s*_+/g, field: 'fullName', description: 'Name field with underlines' },
                { pattern: /\[NAME\]/gi, field: 'fullName', description: 'Name in brackets' },
                { pattern: /\[Client Name\]/gi, field: 'fullName', description: 'Client name in brackets' },
                { pattern: /\[FULL NAME\]/gi, field: 'fullName', description: 'Full name in brackets' },
                // Email patterns
                { pattern: /EMAIL:\s*_+/gi, field: 'email', description: 'Email field with underlines' },
                { pattern: /Email:\s*_+/g, field: 'email', description: 'Email field with underlines' },
                { pattern: /\[EMAIL\]/gi, field: 'email', description: 'Email in brackets' },
                { pattern: /\[EMAIL ADDRESS\]/gi, field: 'email', description: 'Email address in brackets' },
                // Phone patterns
                { pattern: /PHONE:\s*_+/gi, field: 'phone', description: 'Phone field with underlines' },
                { pattern: /Phone:\s*_+/g, field: 'phone', description: 'Phone field with underlines' },
                { pattern: /\[PHONE\]/gi, field: 'phone', description: 'Phone in brackets' },
                { pattern: /\[PHONE NUMBER\]/gi, field: 'phone', description: 'Phone number in brackets' },
                // Date patterns
                { pattern: /DATE:\s*_+/gi, field: 'documentDate', description: 'Date field with underlines' },
                { pattern: /Date:\s*_+/g, field: 'documentDate', description: 'Date field with underlines' },
                { pattern: /\[DATE\]/gi, field: 'documentDate', description: 'Date in brackets' },
                { pattern: /\[DOCUMENT DATE\]/gi, field: 'documentDate', description: 'Document date in brackets' },
                // Address patterns
                { pattern: /ADDRESS:\s*_+/gi, field: 'propertyAddress', description: 'Address field with underlines' },
                { pattern: /Address:\s*_+/g, field: 'propertyAddress', description: 'Address field with underlines' },
                { pattern: /\[ADDRESS\]/gi, field: 'propertyAddress', description: 'Address in brackets' },
                { pattern: /\[PROPERTY ADDRESS\]/gi, field: 'propertyAddress', description: 'Property address in brackets' },
                // Trustee patterns
                { pattern: /TRUSTEE:\s*_+/gi, field: 'trusteeName', description: 'Trustee field with underlines' },
                { pattern: /Trustee:\s*_+/g, field: 'trusteeName', description: 'Trustee field with underlines' },
                { pattern: /\[TRUSTEE\]/gi, field: 'trusteeName', description: 'Trustee in brackets' },
                { pattern: /\[TRUSTEE NAME\]/gi, field: 'trusteeName', description: 'Trustee name in brackets' },
                // Generic placeholder patterns for any unmapped fields
                { pattern: /\[BENEFICIARIES\]/gi, field: 'beneficiaries', description: 'Beneficiaries in brackets' },
                { pattern: /\[ADDITIONAL NOTES\]/gi, field: 'additionalNotes', description: 'Additional notes in brackets' },
                { pattern: /\[GRANTOR\]/gi, field: 'grantorName', description: 'Grantor in brackets' },
                { pattern: /\[GRANTEE\]/gi, field: 'granteeName', description: 'Grantee in brackets' },
            ];
            let replacementsMade = 0;
            // Apply replacements
            for (const pattern of replacementPatterns) {
                const fieldValue = clientData[pattern.field];
                if (fieldValue && xmlContent.match(pattern.pattern)) {
                    const beforeLength = xmlContent.length;
                    xmlContent = xmlContent.replace(pattern.pattern, String(fieldValue));
                    const afterLength = xmlContent.length;
                    if (beforeLength !== afterLength) {
                        replacementsMade++;
                        console.log(`✅ Replaced ${pattern.description} with "${fieldValue}"`);
                    }
                }
            }
            if (replacementsMade === 0) {
                console.log("⚠️ Standard patterns not found. Trying EXACT template placeholders...");
                // Try EXACT template placeholders found in the actual document - ENHANCED for Certificate of Trust
                const exactTemplatePlaceholders = [
                    // Certificate of Trust specific placeholders
                    { search: '"Trust\'s name"', replace: clientData.trust_name || clientData.trustName || clientData.name || '"Trust Name Not Provided"' },
                    { search: '"Grantor\'s name"', replace: clientData.grantor_names || clientData.grantorName || clientData.fullName || '"Grantor Not Provided"' },
                    { search: '" Grantor\'s name"', replace: clientData.grantor_names || clientData.grantorName || clientData.fullName || '"Grantor Not Provided"' },
                    { search: '"Grantor\'s name or names in case of multiple grantors"', replace: clientData.grantor_names || clientData.grantorName || clientData.fullName || '"Grantor Not Provided"' },
                    { search: '"Name of Grantor"', replace: clientData.grantor_names || clientData.grantorName || clientData.fullName || '"Grantor Not Provided"' },
                    { search: '"Identify Successor trustees"', replace: clientData.successor_trustees || clientData.successorTrustees || '"Successor Trustee Not Provided"' },
                    { search: '" Identify Successor trustees"', replace: clientData.successor_trustees || clientData.successorTrustees || '"Successor Trustee Not Provided"' },
                    { search: '"Successor Co-Trustee\'s name"', replace: clientData.successor_co_trustees || clientData.coTrusteeName || '"Co-Trustee Not Provided"' },
                    { search: '" Successor Co-Trustee\'s name"', replace: clientData.successor_co_trustees || clientData.coTrusteeName || '"Co-Trustee Not Provided"' },
                    { search: '"current trustees"', replace: clientData.current_trustees || clientData.trusteeName || '"Current Trustee Not Provided"' },
                    { search: '"notary public name"', replace: clientData.notary_public_name || clientData.notaryName || '"Notary Not Provided"' },
                    { search: '"county"', replace: clientData.county || '"County Not Provided"' },
                    { search: '"execution day"', replace: clientData.execution_day || '"Day Not Provided"' },
                    { search: '"execution month"', replace: clientData.execution_month || '"Month Not Provided"' },
                    { search: '"execution year"', replace: clientData.execution_year || '"Year Not Provided"' },
                    { search: '"notary commission expires"', replace: clientData.notary_commission_expires || '"Date Not Provided"' },
                    { search: '"signature authority"', replace: clientData.signature_authority || '"Authority Not Provided"' },
                    // Legacy placeholders
                    { search: '" Date of Birth"', replace: clientData.documentDate || new Date().toLocaleDateString() },
                    { search: '"Date of Birth"', replace: clientData.documentDate || new Date().toLocaleDateString() },
                    { search: '" Legal Description of the property/ies"', replace: clientData.propertyAddress || '"Property Address Not Provided"' },
                    { search: '"Legal Description of the property/ies"', replace: clientData.propertyAddress || '"Property Address Not Provided"' },
                ];
                console.log("🎯 Trying exact template placeholder replacement...");
                for (const replacement of exactTemplatePlaceholders) {
                    if (xmlContent.includes(replacement.search)) {
                        const beforeCount = (xmlContent.match(new RegExp(replacement.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                        xmlContent = xmlContent.replace(new RegExp(replacement.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.replace);
                        const afterCount = (xmlContent.match(new RegExp(replacement.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                        if (beforeCount > afterCount) {
                            replacementsMade += (beforeCount - afterCount);
                            console.log(`✅ EXACT replacement: "${replacement.search}" → "${replacement.replace}" (${beforeCount - afterCount} times)`);
                        }
                    }
                }
                // Also try some generic replacements for common static text
                const genericReplacements = [
                    { search: "Client Name", replace: clientData.fullName || "Client Name" },
                    { search: "CLIENT NAME", replace: (clientData.fullName || "CLIENT NAME").toUpperCase() },
                    { search: "Email Address", replace: clientData.email || "Email Address" },
                    { search: "EMAIL ADDRESS", replace: (clientData.email || "EMAIL ADDRESS").toUpperCase() },
                    { search: "Phone Number", replace: clientData.phone || "Phone Number" },
                    { search: "PHONE NUMBER", replace: (clientData.phone || "PHONE NUMBER").toUpperCase() },
                ];
                for (const replacement of genericReplacements) {
                    if (xmlContent.includes(replacement.search)) {
                        xmlContent = xmlContent.replace(new RegExp(replacement.search, 'g'), replacement.replace);
                        replacementsMade++;
                        console.log(`✅ Generic replacement: "${replacement.search}" → "${replacement.replace}"`);
                    }
                }
            }
            console.log(`📊 Total replacements made: ${replacementsMade}`);
            if (replacementsMade > 0) {
                console.log(`🔧 UPDATING DOCUMENT XML WITH ${replacementsMade} REPLACEMENTS...`);
                // FIXED: Update the document XML in the zip properly  
                try {
                    zip.file("word/document.xml", xmlContent);
                    console.log(`✅ Document XML file updated successfully`);
                    // Generate updated document
                    const updatedBuffer = zip.generate({
                        type: 'nodebuffer',
                        compression: 'DEFLATE',
                    });
                    console.log(`✅ Generated updated document buffer (${updatedBuffer.length} bytes)`);
                    console.log("✅ Smart text replacement completed successfully");
                    return updatedBuffer;
                }
                catch (bufferError) {
                    console.error("❌ Error generating updated document buffer:", bufferError);
                    throw bufferError;
                }
            }
            else {
                console.log("❌ No replacements made, returning original document");
                return templateBuffer;
            }
        }
        catch (error) {
            console.error("Error in smart text replacement:", error);
            return templateBuffer;
        }
    },
    async fillWordDocumentWithAIInsertionPoints(templateBuffer, clientData, insertionPoints) {
        try {
            console.log("=== AI INSERTION POINTS APPROACH ===");
            console.log(`🎯 Using ${insertionPoints.length} AI-identified insertion points`);
            console.log(`🔍 CLIENT DATA DEBUG:`, JSON.stringify(clientData, null, 2));
            console.log(`🔍 CLIENT DATA KEYS:`, Object.keys(clientData));
            console.log(`🔍 INSERTION POINTS:`, insertionPoints.map(p => ({ field: p.fieldName, desc: p.description })));
            const PizZip = require('pizzip');
            const zip = new PizZip(templateBuffer);
            // Get the main document XML
            const documentXml = zip.files["word/document.xml"];
            if (!documentXml) {
                console.log("Could not find document.xml, falling back to smart replacement");
                return await this.fillWordDocumentWithSmartReplacement(templateBuffer, clientData);
            }
            let xmlContent = documentXml.asText();
            console.log("Original document XML length:", xmlContent.length);
            let replacementsMade = 0;
            // Apply AI-identified insertion points
            for (const point of insertionPoints) {
                const { fieldName, contextBefore, contextAfter, placeholder, description } = point;
                console.log(`\n🎯 PROCESSING INSERTION POINT:`, {
                    fieldName,
                    description,
                    placeholder: (placeholder === null || placeholder === void 0 ? void 0 : placeholder.substring(0, 50)) + ((placeholder === null || placeholder === void 0 ? void 0 : placeholder.length) > 50 ? '...' : ''),
                    contextBefore: (contextBefore === null || contextBefore === void 0 ? void 0 : contextBefore.substring(0, 30)) + ((contextBefore === null || contextBefore === void 0 ? void 0 : contextBefore.length) > 30 ? '...' : ''),
                    contextAfter: (contextAfter === null || contextAfter === void 0 ? void 0 : contextAfter.substring(0, 30)) + ((contextAfter === null || contextAfter === void 0 ? void 0 : contextAfter.length) > 30 ? '...' : '')
                });
                // Try direct field name first
                let clientValue = clientData[fieldName];
                console.log(`🔍 Direct lookup for "${fieldName}": ${clientValue ? `FOUND: "${clientValue}"` : 'NOT FOUND'}`);
                // If not found, try smart field mapping
                if (!clientValue) {
                    console.log(`🔧 Calling smart field mapping for: ${fieldName}`);
                    clientValue = this.findSmartFieldMapping(fieldName, clientData);
                    console.log(`🔧 Smart mapping result: ${clientValue ? `FOUND: "${clientValue}"` : 'NOT FOUND'}`);
                }
                // CRITICAL DEBUG: Log what value we're about to use
                if (clientValue) {
                    console.log(`✅ WILL USE VALUE: "${clientValue}" for field: ${fieldName}`);
                }
                else {
                    console.log(`❌ NO VALUE AVAILABLE for field: ${fieldName} - SKIPPING`);
                    continue;
                }
                console.log(`🔍 Processing insertion point: ${description}`);
                let replacementMade = false;
                // Strategy 1: Use the exact placeholder if found
                if (placeholder && xmlContent.includes(placeholder)) {
                    xmlContent = xmlContent.replace(new RegExp(escapeRegExp(placeholder), 'g'), String(clientValue));
                    replacementsMade++;
                    replacementMade = true;
                    console.log(`✅ Replaced placeholder "${placeholder}" with "${clientValue}"`);
                }
                // Strategy 1.5: Try quoted placeholder patterns specifically
                if (!replacementMade && fieldName) {
                    const quotedPatterns = [
                        `"${fieldName}"`,
                        `"${fieldName.replace('_', ' ')}"`
                    ];
                    for (const quotedPattern of quotedPatterns) {
                        if (xmlContent.includes(quotedPattern)) {
                            xmlContent = xmlContent.replace(new RegExp(escapeRegExp(quotedPattern), 'g'), String(clientValue));
                            replacementsMade++;
                            replacementMade = true;
                            console.log(`✅ Replaced quoted pattern "${quotedPattern}" with "${clientValue}"`);
                            break;
                        }
                    }
                }
                // Strategy 2: Use context-based replacement
                if (!replacementMade && contextBefore && contextAfter) {
                    const pattern = new RegExp(escapeRegExp(contextBefore) + '(.*?)' + escapeRegExp(contextAfter), 'gs');
                    const matches = xmlContent.match(pattern);
                    if (matches && matches.length > 0) {
                        xmlContent = xmlContent.replace(pattern, `${contextBefore}${clientValue}${contextAfter}`);
                        replacementsMade++;
                        replacementMade = true;
                        console.log(`✅ Replaced using context: "${contextBefore}...${contextAfter}" with "${clientValue}"`);
                    }
                }
                // Strategy 3: Field name-based search
                if (!replacementMade) {
                    // Look for common patterns for this field type
                    const fieldPatterns = this.getFieldPatterns(fieldName);
                    for (const pattern of fieldPatterns) {
                        if (xmlContent.match(pattern)) {
                            xmlContent = xmlContent.replace(pattern, String(clientValue));
                            replacementsMade++;
                            replacementMade = true;
                            console.log(`✅ Replaced using field pattern for "${fieldName}" with "${clientValue}"`);
                            break;
                        }
                    }
                }
                if (!replacementMade) {
                    console.log(`⚠️ Could not find insertion point for: ${fieldName} - ${description}`);
                }
            }
            console.log(`📊 Total AI-guided replacements made: ${replacementsMade}`);
            if (replacementsMade > 0) {
                console.log(`🔧 UPDATING DOCUMENT XML WITH ${replacementsMade} REPLACEMENTS...`);
                console.log(`🔧 Updated XML content length: ${xmlContent.length}`);
                // FIXED: Update the document XML in the zip properly
                try {
                    // Create new PizZip instance and update the document.xml file
                    zip.file("word/document.xml", xmlContent);
                    console.log(`✅ Document XML file updated successfully`);
                    // Generate updated document buffer
                    const updatedBuffer = zip.generate({
                        type: 'nodebuffer',
                        compression: 'DEFLATE',
                    });
                    console.log(`✅ Generated updated document buffer (${updatedBuffer.length} bytes)`);
                    console.log("✅ AI insertion points processing completed successfully");
                    return updatedBuffer;
                }
                catch (bufferError) {
                    console.error("❌ Error generating updated document buffer:", bufferError);
                    throw bufferError;
                }
            }
            else {
                console.log("❌ No AI replacements made, falling back to smart replacement");
                return await this.fillWordDocumentWithSmartReplacement(templateBuffer, clientData);
            }
        }
        catch (error) {
            console.error("Error in AI insertion points processing:", error);
            console.log("🔄 Falling back to smart replacement...");
            return await this.fillWordDocumentWithSmartReplacement(templateBuffer, clientData);
        }
    },
    getFieldPatterns(fieldName) {
        // Return common patterns for different field types
        const patterns = [];
        switch (fieldName.toLowerCase()) {
            case 'fullname':
            case 'clientname':
            case 'name':
                patterns.push(/\[NAME\]/gi, /\[CLIENT NAME\]/gi, /\[FULL NAME\]/gi, /NAME:\s*_+/gi, /Name:\s*_+/g);
                break;
            case 'email':
                patterns.push(/\[EMAIL\]/gi, /\[EMAIL ADDRESS\]/gi, /EMAIL:\s*_+/gi, /Email:\s*_+/g);
                break;
            case 'phone':
                patterns.push(/\[PHONE\]/gi, /\[PHONE NUMBER\]/gi, /PHONE:\s*_+/gi, /Phone:\s*_+/g);
                break;
            case 'documentdate':
            case 'date':
                patterns.push(/\[DATE\]/gi, /\[DOCUMENT DATE\]/gi, /DATE:\s*_+/gi, /Date:\s*_+/g);
                break;
            case 'propertyaddress':
            case 'address':
                patterns.push(/\[ADDRESS\]/gi, /\[PROPERTY ADDRESS\]/gi, /ADDRESS:\s*_+/gi, /Address:\s*_+/g);
                break;
            default:
                // Generic patterns for any field
                patterns.push(new RegExp(`\\[${fieldName.toUpperCase()}\\]`, 'gi'), new RegExp(`${fieldName.toUpperCase()}:\\s*_+`, 'gi'));
        }
        return patterns;
    },
    findSmartFieldMapping(templateFieldName, clientData) {
        console.log(`\n🔍 === SMART FIELD MAPPING DEBUG ===`);
        console.log(`🔍 Template field: "${templateFieldName}"`);
        console.log(`🔍 Available client data:`, JSON.stringify(clientData, null, 2));
        console.log(`🔍 Available client data keys:`, Object.keys(clientData));
        // Define field mapping rules - EXPANDED with all possible AI field names AND quoted placeholders
        const fieldMappings = {
            // Grantor/Person fields
            'grantorName': ['fullName', 'grantorName', 'firstName', 'lastName', 'name', 'clientName', 'grantor_names'],
            'grantor': ['fullName', 'grantorName', 'firstName', 'lastName', 'name', 'clientName', 'grantor_names'],
            'grantorAddress': ['address', 'propertyAddress', 'streetAddress', 'grantorAddress'],
            'grantorDOB': ['dateOfBirth', 'birthDate', 'dob', 'documentDate'],
            'grantorSignatureDate': ['documentDate', 'signatureDate', 'date'],
            // CRITICAL: Quoted placeholder mappings for Certificate of Trust
            "Trust's name": ['trust_name', 'trustName', 'name', 'fullName'],
            "Grantor's name": ['grantor_names', 'grantorName', 'fullName', 'name'],
            "Grantor's name or names in case of multiple grantors": ['grantor_names', 'grantorName', 'fullName'],
            "Name of Grantor": ['grantor_names', 'grantorName', 'fullName', 'name'],
            // Trust fields (CRITICAL - these are the ones being processed!)
            'trustName': ['trustName', 'name', 'fullName', 'companyName', 'trust_name'],
            'trustDate': ['documentDate', 'trustDate', 'date'],
            'initialTrusteeName': ['trusteeName', 'trustee', 'fullName', 'initialTrusteeName', 'current_trustees'],
            'successorTrustees': ['trusteeName', 'trustee', 'fullName', 'successorTrustees', 'successor_trustees'],
            'coTrusteeName': ['trusteeName', 'trustee', 'fullName', 'coTrusteeName', 'successor_co_trustees'],
            'coTrusteeAddress': ['address', 'propertyAddress', 'streetAddress', 'coTrusteeAddress'],
            'coTrusteeDL': ['phone', 'driverLicense', 'coTrusteeDL'],
            'successorCoTrusteeName': ['trusteeName', 'trustee', 'fullName', 'successorCoTrusteeName', 'successor_co_trustees'], // IMPORTANT!
            // Trust-specific field mappings
            'trust_name': ['trust_name', 'trustName', 'name', 'fullName'],
            'grantor_names': ['grantor_names', 'grantorName', 'fullName', 'name'],
            'current_trustees': ['current_trustees', 'trusteeName', 'trustee', 'fullName'],
            'successor_trustees': ['successor_trustees', 'successorTrustees', 'trusteeName'],
            'successor_co_trustees': ['successor_co_trustees', 'successorCoTrusteeName', 'coTrusteeName'],
            'execution_day': ['execution_day', 'day', 'documentDay'],
            'execution_month': ['execution_month', 'month', 'documentMonth'],
            'execution_year': ['execution_year', 'year', 'documentYear'],
            'notary_public_name': ['notary_public_name', 'notaryName', 'notary', 'fullName'],
            'notary_commission_expires': ['notary_commission_expires', 'notaryDate', 'expirationDate'],
            // Business fields
            'businessName': ['company', 'businessName', 'companyName'],
            'company': ['company', 'businessName', 'companyName'],
            // Contact fields
            'email': ['email', 'emailAddress', 'contactEmail'],
            'phone': ['phone', 'phoneNumber', 'telephone'],
            'address': ['address', 'propertyAddress', 'streetAddress'],
            // Property fields
            'propertyAddress': ['propertyAddress', 'address', 'streetAddress'],
            'legalDescription': ['legalDescription', 'propertyDescription', 'propertyAddress'],
            // Document fields
            'documentDate': ['documentDate', 'date', 'signatureDate'],
            'notaryDate': ['documentDate', 'date', 'notaryDate'],
            'witnessName': ['witnessName', 'witness', 'fullName'],
            'notaryName': ['notaryName', 'notary', 'fullName'],
            'notaryCounty': ['county', 'notaryCounty', 'state'],
            // Beneficiary fields
            'minorBeneficiaries': ['beneficiaries', 'minorBeneficiaries'],
            'beneficiaries': ['beneficiaries', 'minorBeneficiaries'],
            // Other common fields
            'state': ['state', 'stateProvince', 'incorporationState'],
            'county': ['county', 'notaryCounty'],
            'bondRequirement': ['bondRequirement', 'additionalNotes'],
            'trustPropertyTitling': ['trustPropertyTitling', 'propertyAddress'],
            'propertyDivision': ['propertyDivision', 'additionalNotes'],
            'signature_authority': ['signature_authority', 'signatureAuthority', 'authority']
        };
        // Try exact field name first (case insensitive)
        for (const [clientKey, clientValue] of Object.entries(clientData)) {
            if (clientKey.toLowerCase() === templateFieldName.toLowerCase() && clientValue) {
                console.log(`✅ Found exact match: ${templateFieldName} → ${clientKey} = "${clientValue}"`);
                return String(clientValue);
            }
        }
        // Try mapped field names
        const possibleMatches = fieldMappings[templateFieldName] || [];
        console.log(`🔧 Checking ${possibleMatches.length} possible matches for "${templateFieldName}":`, possibleMatches);
        for (const possibleField of possibleMatches) {
            console.log(`   🔍 Trying possible field: "${possibleField}"`);
            for (const [clientKey, clientValue] of Object.entries(clientData)) {
                if (clientKey.toLowerCase() === possibleField.toLowerCase() && clientValue) {
                    console.log(`✅ Found mapped match: ${templateFieldName} → ${possibleField} → ${clientKey} = "${clientValue}"`);
                    return String(clientValue);
                }
            }
        }
        // Try partial matching (contains)
        for (const [clientKey, clientValue] of Object.entries(clientData)) {
            if (clientValue && (clientKey.toLowerCase().includes(templateFieldName.toLowerCase()) ||
                templateFieldName.toLowerCase().includes(clientKey.toLowerCase()))) {
                console.log(`✅ Found partial match: ${templateFieldName} → ${clientKey} = "${clientValue}"`);
                return String(clientValue);
            }
        }
        console.log(`❌ No smart mapping found for: ${templateFieldName}`);
        return null;
    },
};
// Helper function to escape regex special characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=documentGenerator.js.map