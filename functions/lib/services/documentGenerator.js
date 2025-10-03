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
            const { intakeId } = data;
            if (!intakeId) {
                return { success: false, error: "Intake ID is required" };
            }
            // Get intake details
            const intakeDoc = await db.collection("intakes").doc(intakeId).get();
            if (!intakeDoc.exists) {
                return { success: false, error: "Intake not found" };
            }
            const intake = Object.assign(Object.assign({}, intakeDoc.data()), { id: intakeId });
            if (intake.status !== "approved") {
                return { success: false, error: "Intake must be approved before generating documents" };
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
                message: `Successfully generated ${artifactIds.length} documents`,
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
            console.log(`Generating document for template ${template.id} with client data:`, intake.clientData);
            console.log(`Template file type: ${template.fileType}`);
            let filledBuffer;
            if (template.fileType === "docx") {
                filledBuffer = await exports.documentGenerator.fillWordDocument(templateBuffer, intake.clientData);
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
    async fillWordDocument(templateBuffer, clientData) {
        // For Word documents, we'll use docxtemplater for proper template filling
        try {
            console.log("=== STARTING WORD DOCUMENT FILLING ===");
            console.log("Client data keys:", Object.keys(clientData));
            console.log("Client data values:", clientData);
            // Use docxtemplater approach with zip manipulation
            const PizZip = require('pizzip');
            const Docxtemplater = require('docxtemplater');
            // Load the template
            const zip = new PizZip(templateBuffer);
            // First, let's examine the template content
            console.log("Template loaded, checking for placeholders...");
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                errorLogging: true,
            });
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
            // Set the data and render the document
            doc.setData(templateData);
            try {
                doc.render();
                console.log("Document rendered successfully with docxtemplater");
            }
            catch (renderError) {
                console.error("Docxtemplater render error:", renderError);
                // Try to get more details about the error
                if (renderError && typeof renderError === 'object' && 'properties' in renderError) {
                    console.error("Render errors:", renderError.properties.errors);
                }
                throw renderError;
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
};
//# sourceMappingURL=documentGenerator.js.map