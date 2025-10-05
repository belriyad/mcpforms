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
exports.onIntakeStatusChange = exports.onTemplateUploaded = exports.getIntakeWithOverrides = exports.startIntakeWithOverrides = exports.hasPendingOverrides = exports.getOverrideSections = exports.freezeIntakeVersion = exports.getEffectiveSchema = exports.getOverrides = exports.reviewOverride = exports.validateCustomerOverride = exports.createCustomerOverride = exports.generateCustomClauseAI = exports.validatePlaceholders = exports.getTemplateAuditTrail = exports.getTemplateVersionHistory = exports.checkTemplateLock = exports.refreshTemplateLock = exports.releaseTemplateLock = exports.acquireTemplateLock = exports.rollbackTemplate = exports.approveTemplateVersion = exports.saveTemplateDraft = exports.suggestPlaceholdersAI = exports.getTemplateWithPlaceholders = exports.listTemplates = exports.intakeFormAPI = exports.downloadDocument = exports.generateDocumentsWithAI = exports.getDocumentDownloadUrl = exports.generateDocumentsFromIntake = exports.approveIntakeForm = exports.submitIntakeForm = exports.getIntakeFormSchema = exports.generateIntakeLinkWithOverrides = exports.generateIntakeLink = exports.deleteServiceRequest = exports.updateServiceRequest = exports.createServiceRequest = exports.processUploadedTemplate = exports.uploadTemplateAndParse = void 0;
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const templateParser_1 = require("./services/templateParser");
const serviceManager_1 = require("./services/serviceManager");
const intakeManager_1 = require("./services/intakeManager");
const documentGenerator_1 = require("./services/documentGenerator");
const documentGeneratorAI_1 = require("./services/documentGeneratorAI");
const templateEditorAPI = __importStar(require("./services/templateEditorAPI"));
const intakeCustomizationAPI = __importStar(require("./services/intakeCustomizationAPI"));
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