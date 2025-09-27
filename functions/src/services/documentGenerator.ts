import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { Intake, Service, Template, DocumentArtifact, ApiResponse } from "../types";

// Initialize Firebase Admin if not already initialized (needed for module loading order)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();

export const documentGenerator = {
  async generateDocuments(data: { intakeId: string }): Promise<ApiResponse<{ artifactIds: string[] }>> {
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

      const intake = intakeDoc.data() as Intake;
      if (intake.status !== "approved") {
        return { success: false, error: "Intake must be approved before generating documents" };
      }

      // Get service and templates
      const serviceDoc = await db.collection("services").doc(intake.serviceId).get();
      if (!serviceDoc.exists) {
        return { success: false, error: "Service not found" };
      }

      const service = serviceDoc.data() as Service;
      const templateDocs = await Promise.all(
        service.templateIds.map(id => db.collection("templates").doc(id).get())
      );

      const templates: Template[] = [];
      for (const doc of templateDocs) {
        if (doc.exists) {
          templates.push(doc.data() as Template);
        }
      }

      if (templates.length === 0) {
        return { success: false, error: "No templates found for service" };
      }

      // Generate documents for each template
      const artifactIds: string[] = [];
      
      for (const template of templates) {
        try {
          const artifactId = await this.generateDocumentFromTemplate(template, intake);
          artifactIds.push(artifactId);
        } catch (error) {
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
    } catch (error) {
      console.error("Error generating documents:", error);
      return { success: false, error: "Failed to generate documents" };
    }
  },

  async generateDocumentFromTemplate(template: Template, intake: Intake): Promise<string> {
    const artifactId = uuidv4();
    
    try {
      // Create document artifact record
      const artifact: DocumentArtifact = {
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
      let filledBuffer: Buffer;
      
      if (template.fileType === "docx") {
        filledBuffer = await this.fillWordDocument(templateBuffer, intake.clientData);
      } else if (template.fileType === "pdf") {
        filledBuffer = await this.fillPdfDocument(templateBuffer, intake.clientData);
      } else {
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
    } catch (error) {
      console.error(`Error generating document for template ${template.id}:`, error);
      
      // Update artifact with error status
      await db.collection("documentArtifacts").doc(artifactId).update({
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      
      throw error;
    }
  },

  async fillWordDocument(templateBuffer: Buffer, clientData: Record<string, any>): Promise<Buffer> {
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
    } catch (error) {
      console.error("Error filling Word document:", error);
      throw new Error("Failed to fill Word document");
    }
  },

  async fillPdfDocument(templateBuffer: Buffer, clientData: Record<string, any>): Promise<Buffer> {
    // For PDF documents, we'll need to use a PDF manipulation library
    // In a production environment, you might want to use:
    // - pdf-lib
    // - PDFtk
    // - pdf2pic + canvas manipulation
    
    try {
      // For now, return the original buffer
      // TODO: Implement proper PDF form filling
      return templateBuffer;
    } catch (error) {
      console.error("Error filling PDF document:", error);
      throw new Error("Failed to fill PDF document");
    }
  },

  // Helper function to create download URLs for generated documents
  async getDownloadUrl(artifactId: string): Promise<ApiResponse<{ downloadUrl: string }>> {
    try {
      const artifactDoc = await db.collection("documentArtifacts").doc(artifactId).get();
      if (!artifactDoc.exists) {
        return { success: false, error: "Document not found" };
      }

      const artifact = artifactDoc.data() as DocumentArtifact;
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
    } catch (error) {
      console.error("Error generating download URL:", error);
      return { success: false, error: "Failed to generate download URL" };
    }
  },
};