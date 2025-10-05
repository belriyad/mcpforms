import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import { templateParser } from "./services/templateParser";
import { serviceManager } from "./services/serviceManager";
import { intakeManager } from "./services/intakeManager";
import { documentGenerator } from "./services/documentGenerator";
import { documentGeneratorAI } from "./services/documentGeneratorAI";
import * as templateEditorAPI from "./services/templateEditorAPI";
import * as intakeCustomizationAPI from "./services/intakeCustomizationAPI";



// Template Upload and AI Parsing
export const uploadTemplateAndParse = functions
  .runWith({
    secrets: ["OPENAI_API_KEY"],
    memory: "512MB",
    timeoutSeconds: 120
  })
  .https.onCall(templateParser.uploadAndParse);

export const processUploadedTemplate = functions
  .runWith({
    secrets: ["OPENAI_API_KEY"],
    memory: "1GB",
    timeoutSeconds: 300
  })
  .https.onCall(templateParser.processUploadedTemplate);

// Service Request Management
export const createServiceRequest = functions.https.onCall(serviceManager.createService);
export const updateServiceRequest = functions.https.onCall(serviceManager.updateService);
export const deleteServiceRequest = functions.https.onCall(serviceManager.deleteService);

// Intake Form Management
export const generateIntakeLink = functions.https.onCall(intakeManager.generateIntakeLink);
export const generateIntakeLinkWithOverrides = functions.https.onCall(intakeManager.generateIntakeLinkWithOverrides);
export const getIntakeFormSchema = functions.https.onCall(intakeManager.getIntakeFormSchema);
export const submitIntakeForm = functions.https.onCall(intakeManager.submitIntakeForm);
export const approveIntakeForm = functions.https.onCall(intakeManager.approveIntakeForm);

// Document Generation
export const generateDocumentsFromIntake = functions.https.onCall(documentGenerator.generateDocuments);
export const getDocumentDownloadUrl = functions.https.onCall(documentGenerator.getDownloadUrl);

// Document Generation (AI-Powered - New Approach)
export const generateDocumentsWithAI = functions
  .runWith({
    secrets: ["OPENAI_API_KEY"],
    memory: "1GB",
    timeoutSeconds: 300
  })
  .https.onCall(async (data, context) => {
    const { intakeId, regenerate } = data;
    return await documentGeneratorAI.generateDocumentsFromIntake(intakeId, regenerate);
  });

// HTTP endpoint for downloading documents
export const downloadDocument = functions.https.onRequest(async (req, res) => {
  try {
    const artifactId = req.path.split('/').pop();
    
    if (!artifactId) {
      res.status(400).send('Artifact ID is required');
      return;
    }

    const result = await documentGenerator.downloadDocumentFile(artifactId);
    
    if (!result.success) {
      res.status(404).send(result.error);
      return;
    }

    // Set headers for file download
    res.set({
      'Content-Type': result.data!.contentType,
      'Content-Disposition': `attachment; filename="${result.data!.fileName}"`,
      'Content-Length': result.data!.fileBuffer.length.toString()
    });

    res.send(result.data!.fileBuffer);
  } catch (error) {
    console.error('Error in downloadDocument endpoint:', error);
    res.status(500).send('Internal server error');
  }
});

// HTTP endpoints for public intake forms
const app = express();
app.use(cors({ origin: true }));
app.use("/", intakeManager.intakeFormAPI);
export const intakeFormAPI = functions.https.onRequest(app);

// ============================================================================
// TEMPLATE EDITOR APIs
// ============================================================================

export const listTemplates = functions.https.onCall(templateEditorAPI.listTemplates);
export const getTemplateWithPlaceholders = functions.https.onCall(templateEditorAPI.getTemplateWithPlaceholders);

export const suggestPlaceholdersAI = functions
  .runWith({
    secrets: ["OPENAI_API_KEY"],
    memory: "512MB",
    timeoutSeconds: 60
  })
  .https.onCall(templateEditorAPI.suggestPlaceholdersAI);

export const saveTemplateDraft = functions.https.onCall(templateEditorAPI.saveTemplateDraft);
export const approveTemplateVersion = functions.https.onCall(templateEditorAPI.approveTemplateVersion);
export const rollbackTemplate = functions.https.onCall(templateEditorAPI.rollbackTemplate);

export const acquireTemplateLock = functions.https.onCall(templateEditorAPI.acquireTemplateLock);
export const releaseTemplateLock = functions.https.onCall(templateEditorAPI.releaseTemplateLock);
export const refreshTemplateLock = functions.https.onCall(templateEditorAPI.refreshTemplateLock);
export const checkTemplateLock = functions.https.onCall(templateEditorAPI.checkTemplateLock);

export const getTemplateVersionHistory = functions.https.onCall(templateEditorAPI.getTemplateVersionHistory);
export const getTemplateAuditTrail = functions.https.onCall(templateEditorAPI.getTemplateAuditTrail);
export const validatePlaceholders = functions.https.onCall(templateEditorAPI.validatePlaceholders);

// ============================================================================
// INTAKE CUSTOMIZATION APIs
// ============================================================================

export const generateCustomClauseAI = functions
  .runWith({
    secrets: ["OPENAI_API_KEY"],
    memory: "512MB",
    timeoutSeconds: 60
  })
  .https.onCall(intakeCustomizationAPI.generateCustomClauseAI);

export const createCustomerOverride = functions.https.onCall(intakeCustomizationAPI.createCustomerOverride);
export const validateCustomerOverride = functions.https.onCall(intakeCustomizationAPI.validateCustomerOverride);
export const reviewOverride = functions.https.onCall(intakeCustomizationAPI.reviewOverride);

export const getOverrides = functions.https.onCall(intakeCustomizationAPI.getOverrides);
export const getEffectiveSchema = functions.https.onCall(intakeCustomizationAPI.getEffectiveSchema);
export const freezeIntakeVersion = functions.https.onCall(intakeCustomizationAPI.freezeIntakeVersion);
export const getOverrideSections = functions.https.onCall(intakeCustomizationAPI.getOverrideSections);
export const hasPendingOverrides = functions.https.onCall(intakeCustomizationAPI.hasPendingOverrides);

export const startIntakeWithOverrides = functions.https.onCall(intakeCustomizationAPI.startIntakeWithOverrides);
export const getIntakeWithOverrides = functions.https.onCall(intakeCustomizationAPI.getIntakeWithOverrides);

// ============================================================================
// STORAGE TRIGGERS
// ============================================================================

// Storage triggers
export const onTemplateUploaded = functions
  .runWith({
    secrets: ["OPENAI_API_KEY"],
    memory: "1GB",
    timeoutSeconds: 540
  })
  .storage.object().onFinalize(templateParser.onTemplateUploaded);

// Firestore triggers
export const onIntakeStatusChange = functions.firestore
  .document("intakes/{intakeId}")
  .onUpdate(intakeManager.onIntakeStatusChange);