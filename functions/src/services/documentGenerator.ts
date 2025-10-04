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
  async generateDocuments(data: { intakeId: string; regenerate?: boolean }): Promise<ApiResponse<{ artifactIds: string[] }>> {
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

      const intake = { ...intakeDoc.data(), id: intakeId } as Intake;
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

      // If regenerating, delete existing artifacts
      if (regenerate) {
        await documentGenerator.deleteExistingArtifacts(intakeId);
      }

      // Generate documents for each template
      const artifactIds: string[] = [];
      
      for (const template of templates) {
        try {
          const artifactId = await documentGenerator.generateDocumentFromTemplate(template, intake);
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
        message: `Successfully ${regenerate ? 'regenerated' : 'generated'} ${artifactIds.length} documents`,
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
      console.log(`Generating document for template ${template.id} with client data:`, intake.clientData);
      console.log(`Template file type: ${template.fileType}`);
      
      let filledBuffer: Buffer;
      
      if (template.fileType === "docx") {
        filledBuffer = await documentGenerator.fillWordDocument(templateBuffer, intake.clientData);
      } else if (template.fileType === "pdf") {
        filledBuffer = await documentGenerator.fillPdfDocument(templateBuffer, intake.clientData);
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
      
      // Extract the main document XML to look for placeholders
      try {
        const documentXml = zip.files["word/document.xml"];
        if (documentXml) {
          const xmlContent = documentXml.asText();
          console.log("Document XML length:", xmlContent.length);
          
          // Look for placeholder patterns like {{fieldName}}
          const placeholderMatches = xmlContent.match(/\{\{[^}]+\}\}/g);
          if (placeholderMatches) {
            console.log("Found placeholders in template:", placeholderMatches);
          } else {
            console.log("NO PLACEHOLDERS FOUND in template XML!");
          }
          
          // Also check for simple text patterns that might contain field names
          const clientDataKeys = Object.keys(clientData);
          for (const key of clientDataKeys) {
            if (xmlContent.includes(key)) {
              console.log(`Found field name "${key}" in document XML`);
            }
          }
        } else {
          console.log("Could not find word/document.xml in template");
        }
      } catch (xmlError) {
        console.error("Error examining document XML:", xmlError);
      }
      
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        errorLogging: true,
      });

      // Prepare data for template - flatten nested objects and ensure all values are strings
      const templateData: Record<string, string> = {};
      for (const [key, value] of Object.entries(clientData)) {
        if (value !== null && value !== undefined) {
          templateData[key] = String(value);
          console.log(`Prepared template data: ${key} = "${templateData[key]}"`);
        } else {
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
              } else {
                console.log(`❌ Data value "${value}" NOT found in rendered document`);
              }
            }
            
            // Look for any remaining placeholders
            const remainingPlaceholders = renderedContent.match(/\{\{[^}]+\}\}/g);
            if (remainingPlaceholders) {
              console.log("⚠️ Unfilled placeholders still remain:", remainingPlaceholders);
            } else {
              console.log("✅ No unfilled placeholders found");
            }
          }
        } catch (debugError) {
          console.error("Error during post-render debugging:", debugError);
        }
        
      } catch (renderError) {
        console.error("Docxtemplater render error:", renderError);
        
        // Try to get more details about the error
        if (renderError && typeof renderError === 'object' && 'properties' in renderError) {
          console.error("Render errors:", (renderError as any).properties.errors);
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
        console.log("🔄 Attempting smart text replacement fallback...");
        return await this.fillWordDocumentWithSmartReplacement(templateBuffer, clientData);
      }

      // Generate the filled document
      const filledBuffer = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      console.log("Word document filled successfully with docxtemplater");
      return filledBuffer;
    } catch (error) {
      console.error("=== DOCXTEMPLATER FAILED ===");
      console.error("Error details:", error);
      console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
      
      // Try simpler text-based approach as fallback
      try {
        console.log("Attempting simpler text replacement fallback...");
        return await this.fillWordDocumentSimple(templateBuffer, clientData);
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        console.log("Returning original document");
        return templateBuffer;
      }
    }
  },

  async fillWordDocumentSimple(templateBuffer: Buffer, clientData: Record<string, any>): Promise<Buffer> {
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
            children: text.split('\n').map((line: string) => 
              new Paragraph({
                children: [new TextRun(line)],
              })
            ),
          }],
        });

        const buffer = await Packer.toBuffer(doc);
        console.log("Created new Word document with filled text");
        return buffer;
      } else {
        console.log("No replacements made, returning original");
        return templateBuffer;
      }
    } catch (error) {
      console.error("Simple Word filling failed:", error);
      throw error;
    }
  },

  async fillPdfDocument(templateBuffer: Buffer, clientData: Record<string, any>): Promise<Buffer> {
    // For PDF documents, we'll use pdf-lib for form filling
    try {
      console.log("Filling PDF document with client data:", Object.keys(clientData));
      
      const { PDFDocument } = require('pdf-lib');
      
      // Load the PDF template
      const pdfDoc = await PDFDocument.load(templateBuffer);
      const form = pdfDoc.getForm();
      
      // Get all form fields
      const fields = form.getFields();
      console.log("PDF form fields found:", fields.map((f: any) => f.getName()));

      // Fill form fields with client data
      let fieldsUpdated = 0;
      for (const field of fields) {
        const fieldName = field.getName();
        
        // Try to match field name with client data (case-insensitive)
        const clientValue = Object.entries(clientData).find(([key]) => 
          key.toLowerCase() === fieldName.toLowerCase()
        )?.[1];

        if (clientValue !== undefined && clientValue !== null) {
          try {
            if (field.constructor.name.includes('TextField')) {
              field.setText(String(clientValue));
              fieldsUpdated++;
              console.log(`Filled text field "${fieldName}" with "${clientValue}"`);
            } else if (field.constructor.name.includes('CheckBox')) {
              const isChecked = String(clientValue).toLowerCase() === 'true' || clientValue === '1' || clientValue === 'yes';
              if (isChecked) {
                field.check();
              } else {
                field.uncheck();
              }
              fieldsUpdated++;
              console.log(`Set checkbox "${fieldName}" to ${isChecked}`);
            }
          } catch (fieldError) {
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
    } catch (error) {
      console.error("Error filling PDF document:", error);
      console.error("Client data:", clientData);
      
      // Fallback: return original document
      console.log("Falling back to original PDF document due to error");
      return templateBuffer;
    }
  },

  // Helper function to create download URLs for generated documents
  async getDownloadUrl(data: { artifactId: string }): Promise<ApiResponse<{ downloadUrl: string }>> {
    try {
      const { artifactId } = data;
      
      if (!artifactId) {
        return { success: false, error: "Artifact ID is required" };
      }
      
      const artifactDoc = await db.collection("documentArtifacts").doc(artifactId).get();
      if (!artifactDoc.exists) {
        return { success: false, error: "Document not found" };
      }

      const artifact = artifactDoc.data() as DocumentArtifact;
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
    } catch (error) {
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
  async downloadDocumentFile(artifactId: string): Promise<ApiResponse<{ fileBuffer: Buffer; fileName: string; contentType: string }>> {
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
    } catch (error) {
      console.error("Error downloading document file:", error);
      return { success: false, error: `Failed to download document file: ${error instanceof Error ? error.message : "Unknown error"}` };
    }
  },

  async deleteExistingArtifacts(intakeId: string): Promise<void> {
    try {
      // Get all existing artifacts for this intake
      const artifactsQuery = await db.collection("documentArtifacts")
        .where("intakeId", "==", intakeId)
        .get();

      const deletePromises: Promise<void>[] = [];

      for (const doc of artifactsQuery.docs) {
        const artifact = doc.data() as DocumentArtifact;
        
        // Delete from storage if file exists
        if (artifact.fileUrl) {
          const file = storage.bucket().file(artifact.fileUrl);
          deletePromises.push(
            file.exists().then(([exists]) => {
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
            })
          );
        }

        // Delete document artifact record
        deletePromises.push(
          doc.ref.delete().then(() => {
            console.log(`Deleted artifact record: ${doc.id}`);
          }).catch(error => {
            console.error(`Error deleting artifact record ${doc.id}:`, error);
            // Don't throw - continue with other deletions
          })
        );
      }

      await Promise.all(deletePromises);
      console.log(`Successfully cleaned up existing artifacts for intake ${intakeId}`);
    } catch (error) {
      console.error("Error deleting existing artifacts:", error);
      // Don't throw - let regeneration continue
    }
  },

  async fillWordDocumentWithSmartReplacement(templateBuffer: Buffer, clientData: Record<string, any>): Promise<Buffer> {
    try {
      console.log("=== SMART TEXT REPLACEMENT APPROACH ===");
      
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
      
      // Define replacement patterns - these are common patterns in legal documents
      const replacementPatterns = [
        // Name patterns
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
        console.log("⚠️ No text patterns found to replace. Template may need manual placeholders.");
        console.log("📝 Consider adding placeholders like {{fullName}}, {{email}}, etc. to your template");
        
        // Try some generic replacements for common static text
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
        // Update the document XML in the zip
        zip.files["word/document.xml"] = {
          ...documentXml,
          asText: () => xmlContent,
          asBinary: () => xmlContent
        };
        
        // Generate updated document
        const updatedBuffer = zip.generate({
          type: 'nodebuffer',
          compression: 'DEFLATE',
        });
        
        console.log("✅ Smart text replacement completed successfully");
        return updatedBuffer;
      } else {
        console.log("❌ No replacements made, returning original document");
        return templateBuffer;
      }
      
    } catch (error) {
      console.error("Error in smart text replacement:", error);
      return templateBuffer;
    }
  },
};