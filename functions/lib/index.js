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
exports.onIntakeStatusChange = exports.onTemplateUploaded = exports.intakeFormAPI = exports.downloadDocument = exports.getDocumentDownloadUrl = exports.generateDocumentsFromIntake = exports.approveIntakeForm = exports.submitIntakeForm = exports.generateIntakeLink = exports.deleteServiceRequest = exports.updateServiceRequest = exports.createServiceRequest = exports.processUploadedTemplate = exports.uploadTemplateAndParse = void 0;
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const templateParser_1 = require("./services/templateParser");
const serviceManager_1 = require("./services/serviceManager");
const intakeManager_1 = require("./services/intakeManager");
const documentGenerator_1 = require("./services/documentGenerator");
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
exports.submitIntakeForm = functions.https.onCall(intakeManager_1.intakeManager.submitIntakeForm);
exports.approveIntakeForm = functions.https.onCall(intakeManager_1.intakeManager.approveIntakeForm);
// Document Generation
exports.generateDocumentsFromIntake = functions.https.onCall(documentGenerator_1.documentGenerator.generateDocuments);
exports.getDocumentDownloadUrl = functions.https.onCall(documentGenerator_1.documentGenerator.getDownloadUrl);
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