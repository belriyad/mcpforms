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

// Initialize Firestore
const db = admin.firestore();

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

// List intakes with optional status filter
export const listIntakes = functions.https.onCall(async (data, context) => {
  try {
    const { status } = data;
    
    console.log(`📋 Listing intakes${status ? ` with status: ${status}` : ''}`);
    
    let intakesQuery = db.collection("intakes");
    
    if (status) {
      intakesQuery = intakesQuery.where("status", "==", status) as any;
    }
    
    const snapshot = await intakesQuery.orderBy("submittedAt", "desc").get();
    
    const intakes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });
    
    console.log(`✅ Found ${intakes.length} intakes`);
    
    return {
      success: true,
      data: intakes,
    };
  } catch (error) {
    console.error("Error listing intakes:", error);
    return {
      success: false,
      error: `Failed to list intakes: ${(error as Error).message}`,
    };
  }
});

// Approve customization
export const approveCustomization = functions.https.onCall(async (data, context) => {
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
      reviewed_by: context.auth?.uid || "admin",
    });
    
    console.log(`✅ Customization approved for intake: ${intakeId}`);
    
    return {
      success: true,
      message: "Customization approved successfully",
    };
  } catch (error) {
    console.error("Error approving customization:", error);
    return {
      success: false,
      error: `Failed to approve customization: ${(error as Error).message}`,
    };
  }
});

// Reject customization
export const rejectCustomization = functions.https.onCall(async (data, context) => {
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
      reviewed_by: context.auth?.uid || "admin",
    });
    
    console.log(`❌ Customization rejected for intake: ${intakeId}`);
    
    return {
      success: true,
      message: "Customization rejected",
    };
  } catch (error) {
    console.error("Error rejecting customization:", error);
    return {
      success: false,
      error: `Failed to reject customization: ${(error as Error).message}`,
    };
  }
});

// Update template settings (including customization rules)
export const updateTemplateSettings = functions.https.onCall(async (data, context) => {
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
    
    const updates: any = {
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
  } catch (error) {
    console.error("Error updating template settings:", error);
    return {
      success: false,
      error: `Failed to update template settings: ${(error as Error).message}`,
    };
  }
});

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