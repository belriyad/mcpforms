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
exports.onIntakeStatusChange = exports.onTemplateUploaded = exports.getIntakeWithOverrides = exports.startIntakeWithOverrides = exports.hasPendingOverrides = exports.getOverrideSections = exports.freezeIntakeVersion = exports.getEffectiveSchema = exports.getOverrides = exports.reviewOverride = exports.validateCustomerOverride = exports.createCustomerOverride = exports.generateCustomClauseAI = exports.validatePlaceholders = exports.getTemplateAuditTrail = exports.getTemplateVersionHistory = exports.checkTemplateLock = exports.refreshTemplateLock = exports.releaseTemplateLock = exports.acquireTemplateLock = exports.rollbackTemplate = exports.approveTemplateVersion = exports.saveTemplateDraft = exports.suggestPlaceholdersAI = exports.getTemplateWithPlaceholders = exports.listTemplates = exports.updateTemplateSettings = exports.rejectCustomization = exports.approveCustomization = exports.listIntakes = exports.intakeFormAPI = exports.downloadDocument = exports.generateDocumentsWithAI = exports.getDocumentDownloadUrl = exports.generateDocumentsFromIntake = exports.approveIntakeForm = exports.submitIntakeForm = exports.getIntakeFormSchema = exports.generateIntakeLinkWithOverrides = exports.generateIntakeLink = exports.deleteServiceRequest = exports.updateServiceRequest = exports.createServiceRequest = exports.processUploadedTemplate = exports.uploadTemplateAndParse = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const templateParser_1 = require("./services/templateParser");
const serviceManager_1 = require("./services/serviceManager");
const intakeManager_1 = require("./services/intakeManager");
const documentGenerator_1 = require("./services/documentGenerator");
const documentGeneratorAI_1 = require("./services/documentGeneratorAI");
const templateEditorAPI = __importStar(require("./services/templateEditorAPI"));
const intakeCustomizationAPI = __importStar(require("./services/intakeCustomizationAPI"));
// Initialize Firestore
const db = admin.firestore();
// Template Upload and AI Parsing
exports.uploadTemplateAndParse = functions
    .runWith({
    secrets: ["OPENAI_API_KEY"],
    memory: "512MB",
    timeoutSeconds: 120
})
    .https.onCall(templateParser_1.templateParser.uploadAndParse);
exports.processUploadedTemplate = functions
    .runWith({
    secrets: ["OPENAI_API_KEY"],
    memory: "1GB",
    timeoutSeconds: 300
})
    .https.onCall(templateParser_1.templateParser.processUploadedTemplate);
// Service Request Management
exports.createServiceRequest = functions.https.onCall(serviceManager_1.serviceManager.createService);
exports.updateServiceRequest = functions.https.onCall(serviceManager_1.serviceManager.updateService);
exports.deleteServiceRequest = functions.https.onCall(serviceManager_1.serviceManager.deleteService);
// Intake Form Management
exports.generateIntakeLink = functions.https.onCall(intakeManager_1.intakeManager.generateIntakeLink);
exports.generateIntakeLinkWithOverrides = functions.https.onCall(intakeManager_1.intakeManager.generateIntakeLinkWithOverrides);
exports.getIntakeFormSchema = functions.https.onCall(intakeManager_1.intakeManager.getIntakeFormSchema);
exports.submitIntakeForm = functions.https.onCall(intakeManager_1.intakeManager.submitIntakeForm);
exports.approveIntakeForm = functions.https.onCall(intakeManager_1.intakeManager.approveIntakeForm);
// Document Generation
exports.generateDocumentsFromIntake = functions.https.onCall(documentGenerator_1.documentGenerator.generateDocuments);
exports.getDocumentDownloadUrl = functions.https.onCall(documentGenerator_1.documentGenerator.getDownloadUrl);
// Document Generation (AI-Powered - New Approach)
exports.generateDocumentsWithAI = functions
    .runWith({
    secrets: ["OPENAI_API_KEY"],
    memory: "1GB",
    timeoutSeconds: 300
})
    .https.onCall(async (data, context) => {
    const { intakeId, regenerate } = data;
    return await documentGeneratorAI_1.documentGeneratorAI.generateDocumentsFromIntake(intakeId, regenerate);
});
// HTTP endpoint for downloading documents
exports.downloadDocument = functions.https.onRequest(async (req, res) => {
    try {
        const artifactId = req.path.split('/').pop();
        if (!artifactId) {
            res.status(400).send('Artifact ID is required');
            return;
        }
        const result = await documentGenerator_1.documentGenerator.downloadDocumentFile(artifactId);
        if (!result.success) {
            res.status(404).send(result.error);
            return;
        }
        // Set headers for file download
        res.set({
            'Content-Type': result.data.contentType,
            'Content-Disposition': `attachment; filename="${result.data.fileName}"`,
            'Content-Length': result.data.fileBuffer.length.toString()
        });
        res.send(result.data.fileBuffer);
    }
    catch (error) {
        console.error('Error in downloadDocument endpoint:', error);
        res.status(500).send('Internal server error');
    }
});
// HTTP endpoints for public intake forms
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use("/", intakeManager_1.intakeManager.intakeFormAPI);
exports.intakeFormAPI = functions.https.onRequest(app);
// List intakes with optional status filter
exports.listIntakes = functions.https.onCall(async (data, context) => {
    try {
        const { status } = data;
        console.log(`📋 Listing intakes${status ? ` with status: ${status}` : ''}`);
        let intakesQuery = db.collection("intakes");
        if (status) {
            intakesQuery = intakesQuery.where("status", "==", status);
        }
        const snapshot = await intakesQuery.orderBy("submittedAt", "desc").get();
        const intakes = snapshot.docs.map(doc => {
            const data = doc.data();
            return Object.assign(Object.assign({ id: doc.id }, data), { submittedAt: data.submittedAt, createdAt: data.createdAt, updatedAt: data.updatedAt });
        });
        console.log(`✅ Found ${intakes.length} intakes`);
        return {
            success: true,
            data: intakes,
        };
    }
    catch (error) {
        console.error("Error listing intakes:", error);
        return {
            success: false,
            error: `Failed to list intakes: ${error.message}`,
        };
    }
});
// Approve customization
exports.approveCustomization = functions.https.onCall(async (data, context) => {
    var _a;
    try {
        const { intakeId } = data;
        if (!intakeId) {
            return { success: false, error: "Missing intakeId" };
        }
        console.log(`✅ Approving customization for intake: ${intakeId}`);
        const intakeRef = db.collection("intakes").doc(intakeId);
        const intakeDoc = await intakeRef.get();
        if (!intakeDoc.exists) {
            return { success: false, error: "Intake not found" };
        }
        await intakeRef.update({
            status: "approved",
            approvedAt: new Date(),
            updatedAt: new Date(),
            reviewed_by: ((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid) || "admin",
        });
        console.log(`✅ Customization approved for intake: ${intakeId}`);
        return {
            success: true,
            message: "Customization approved successfully",
        };
    }
    catch (error) {
        console.error("Error approving customization:", error);
        return {
            success: false,
            error: `Failed to approve customization: ${error.message}`,
        };
    }
});
// Reject customization
exports.rejectCustomization = functions.https.onCall(async (data, context) => {
    var _a;
    try {
        const { intakeId, reason } = data;
        if (!intakeId || !reason) {
            return { success: false, error: "Missing intakeId or reason" };
        }
        console.log(`❌ Rejecting customization for intake: ${intakeId}`);
        const intakeRef = db.collection("intakes").doc(intakeId);
        const intakeDoc = await intakeRef.get();
        if (!intakeDoc.exists) {
            return { success: false, error: "Intake not found" };
        }
        await intakeRef.update({
            status: "rejected",
            rejectedAt: new Date(),
            updatedAt: new Date(),
            rejection_reason: reason,
            reviewed_by: ((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid) || "admin",
        });
        console.log(`❌ Customization rejected for intake: ${intakeId}`);
        return {
            success: true,
            message: "Customization rejected",
        };
    }
    catch (error) {
        console.error("Error rejecting customization:", error);
        return {
            success: false,
            error: `Failed to reject customization: ${error.message}`,
        };
    }
});
// Update template settings (including customization rules)
exports.updateTemplateSettings = functions.https.onCall(async (data, context) => {
    try {
        const { templateId, default_customization_rules } = data;
        if (!templateId) {
            return { success: false, error: "Missing templateId" };
        }
        console.log(`⚙️ Updating template settings for: ${templateId}`);
        const templateRef = db.collection("templates").doc(templateId);
        const templateDoc = await templateRef.get();
        if (!templateDoc.exists) {
            return { success: false, error: "Template not found" };
        }
        const updates = {
            updatedAt: new Date(),
        };
        if (default_customization_rules !== undefined) {
            updates.default_customization_rules = default_customization_rules;
        }
        await templateRef.update(updates);
        console.log(`✅ Template settings updated for: ${templateId}`);
        return {
            success: true,
            message: "Template settings updated successfully",
        };
    }
    catch (error) {
        console.error("Error updating template settings:", error);
        return {
            success: false,
            error: `Failed to update template settings: ${error.message}`,
        };
    }
});
// ============================================================================
// TEMPLATE EDITOR APIs
// ============================================================================
exports.listTemplates = functions.https.onCall(templateEditorAPI.listTemplates);
exports.getTemplateWithPlaceholders = functions.https.onCall(templateEditorAPI.getTemplateWithPlaceholders);
exports.suggestPlaceholdersAI = functions
    .runWith({
    secrets: ["OPENAI_API_KEY"],
    memory: "512MB",
    timeoutSeconds: 60
})
    .https.onCall(templateEditorAPI.suggestPlaceholdersAI);
exports.saveTemplateDraft = functions.https.onCall(templateEditorAPI.saveTemplateDraft);
exports.approveTemplateVersion = functions.https.onCall(templateEditorAPI.approveTemplateVersion);
exports.rollbackTemplate = functions.https.onCall(templateEditorAPI.rollbackTemplate);
exports.acquireTemplateLock = functions.https.onCall(templateEditorAPI.acquireTemplateLock);
exports.releaseTemplateLock = functions.https.onCall(templateEditorAPI.releaseTemplateLock);
exports.refreshTemplateLock = functions.https.onCall(templateEditorAPI.refreshTemplateLock);
exports.checkTemplateLock = functions.https.onCall(templateEditorAPI.checkTemplateLock);
exports.getTemplateVersionHistory = functions.https.onCall(templateEditorAPI.getTemplateVersionHistory);
exports.getTemplateAuditTrail = functions.https.onCall(templateEditorAPI.getTemplateAuditTrail);
exports.validatePlaceholders = functions.https.onCall(templateEditorAPI.validatePlaceholders);
// ============================================================================
// INTAKE CUSTOMIZATION APIs
// ============================================================================
exports.generateCustomClauseAI = functions
    .runWith({
    secrets: ["OPENAI_API_KEY"],
    memory: "512MB",
    timeoutSeconds: 60
})
    .https.onCall(intakeCustomizationAPI.generateCustomClauseAI);
exports.createCustomerOverride = functions.https.onCall(intakeCustomizationAPI.createCustomerOverride);
exports.validateCustomerOverride = functions.https.onCall(intakeCustomizationAPI.validateCustomerOverride);
exports.reviewOverride = functions.https.onCall(intakeCustomizationAPI.reviewOverride);
exports.getOverrides = functions.https.onCall(intakeCustomizationAPI.getOverrides);
exports.getEffectiveSchema = functions.https.onCall(intakeCustomizationAPI.getEffectiveSchema);
exports.freezeIntakeVersion = functions.https.onCall(intakeCustomizationAPI.freezeIntakeVersion);
exports.getOverrideSections = functions.https.onCall(intakeCustomizationAPI.getOverrideSections);
exports.hasPendingOverrides = functions.https.onCall(intakeCustomizationAPI.hasPendingOverrides);
exports.startIntakeWithOverrides = functions.https.onCall(intakeCustomizationAPI.startIntakeWithOverrides);
exports.getIntakeWithOverrides = functions.https.onCall(intakeCustomizationAPI.getIntakeWithOverrides);
// ============================================================================
// STORAGE TRIGGERS
// ============================================================================
// Storage triggers
exports.onTemplateUploaded = functions
    .runWith({
    secrets: ["OPENAI_API_KEY"],
    memory: "1GB",
    timeoutSeconds: 540
})
    .storage.object().onFinalize(templateParser_1.templateParser.onTemplateUploaded);
// Firestore triggers
exports.onIntakeStatusChange = functions.firestore
    .document("intakes/{intakeId}")
    .onUpdate(intakeManager_1.intakeManager.onIntakeStatusChange);
//# sourceMappingURL=index.js.map