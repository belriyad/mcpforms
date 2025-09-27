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
            const intake = intakeDoc.data();
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
                    const artifactId = await this.generateDocumentFromTemplate(template, intake);
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
            let filledBuffer;
            if (template.fileType === "docx") {
                filledBuffer = await this.fillWordDocument(templateBuffer, intake.clientData);
            }
            else if (template.fileType === "pdf") {
                filledBuffer = await this.fillPdfDocument(templateBuffer, intake.clientData);
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
        // For Word documents, we'll use a simple text replacement approach
        // In a production environment, you might want to use libraries like:
        // - docx-templates
        // - pizzip + docxtemplater
        // - officegen
        try {
            const mammoth = require("mammoth");
            // Extract text from template
            const result = await mammoth.extractRawText({ buffer: templateBuffer });
            let text = result.value;
            // Replace placeholders with client data
            // Look for patterns like {{fieldName}} or [fieldName]
            for (const [key, value] of Object.entries(clientData)) {
                const patterns = [
                    new RegExp(`\\{\\{${key}\\}\\}`, "gi"),
                    new RegExp(`\\[${key}\\]`, "gi"),
                    new RegExp(`\\$\\{${key}\\}`, "gi"),
                ];
                for (const pattern of patterns) {
                    text = text.replace(pattern, String(value || ""));
                }
            }
            // For now, return the original buffer
            // TODO: Implement proper Word document templating
            return templateBuffer;
        }
        catch (error) {
            console.error("Error filling Word document:", error);
            throw new Error("Failed to fill Word document");
        }
    },
    async fillPdfDocument(templateBuffer, clientData) {
        // For PDF documents, we'll need to use a PDF manipulation library
        // In a production environment, you might want to use:
        // - pdf-lib
        // - PDFtk
        // - pdf2pic + canvas manipulation
        try {
            // For now, return the original buffer
            // TODO: Implement proper PDF form filling
            return templateBuffer;
        }
        catch (error) {
            console.error("Error filling PDF document:", error);
            throw new Error("Failed to fill PDF document");
        }
    },
    // Helper function to create download URLs for generated documents
    async getDownloadUrl(artifactId) {
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
            const [downloadUrl] = await file.getSignedUrl({
                action: "read",
                expires: Date.now() + 60 * 60 * 1000, // 1 hour
            });
            return {
                success: true,
                data: { downloadUrl },
                message: "Download URL generated successfully",
            };
        }
        catch (error) {
            console.error("Error generating download URL:", error);
            return { success: false, error: "Failed to generate download URL" };
        }
    },
};
//# sourceMappingURL=documentGenerator.js.map