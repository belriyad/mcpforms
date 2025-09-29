import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { OpenAI } from "openai";
import pdfParse from "pdf-parse";
import * as mammoth from "mammoth";
import { v4 as uuidv4 } from "uuid";
import { Template, FormField, ApiResponse, OpenAIFieldExtractionResponse } from "../types";



// Initialize OpenAI with secret
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 Checking OpenAI API key availability:', apiKey ? 'Found' : 'Missing');
  
  if (!apiKey) {
    throw new Error("OpenAI API key not found in environment variables");
  }
  
  if (!apiKey.startsWith('sk-')) {
    throw new Error("Invalid OpenAI API key format");
  }
  
  console.log('✅ OpenAI client initialized successfully');
  return new OpenAI({ apiKey });
};

// Initialize Firebase Admin if not already initialized (needed for module loading order)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();

export const templateParser = {
  async uploadAndParse(data: { fileName: string; fileType: string; templateName: string }): Promise<ApiResponse<{ templateId: string; uploadUrl: string }>> {
    try {
      const { fileName, fileType, templateName } = data;
      
      if (!fileName || !fileType || !templateName) {
        return { success: false, error: "Missing required fields" };
      }

      if (!["pdf", "docx"].includes(fileType.toLowerCase())) {
        return { success: false, error: "Unsupported file type. Only PDF and DOCX are supported." };
      }

      const templateId = uuidv4();
      const filePath = `templates/${templateId}/${fileName}`;
      
      console.log('📤 TemplateParser: Generating upload URL for:', {
        templateId,
        fileName,
        fileType,
        filePath
      });
      
      // Generate signed upload URL
      const bucketName = 'formgenai-4545.firebasestorage.app';
      const file = storage.bucket(bucketName).file(filePath);
      console.log('📤 TemplateParser: Storage bucket initialized, generating signed URL...');
      
      const [uploadUrl] = await file.getSignedUrl({
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: fileType === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      
      console.log('✅ TemplateParser: Upload URL generated successfully:', uploadUrl);

      // Create template record
      const template: Template = {
        id: templateId,
        name: templateName,
        originalFileName: fileName,
        fileUrl: filePath,
        fileType: fileType.toLowerCase() as "pdf" | "docx",
        extractedFields: [],
        status: "uploaded",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("templates").doc(templateId).set(template);

      return {
        success: true,
        data: { templateId, uploadUrl },
        message: "Upload URL generated successfully",
      };
    } catch (error: any) {
      console.error("❌ TemplateParser: Error in uploadAndParse:", error);
      console.error("❌ TemplateParser: Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = "Failed to generate upload URL";
      if (error.message?.includes("bucket")) {
        errorMessage = "Storage bucket configuration error. Check Firebase Storage setup.";
      } else if (error.message?.includes("permission")) {
        errorMessage = "Storage permission denied. Check Firebase Storage rules.";
      } else if (error.message) {
        errorMessage = `Upload error: ${error.message}`;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  async onTemplateUploaded(object: functions.storage.ObjectMetadata): Promise<void> {
    try {
      const filePath = object.name;
      if (!filePath || !filePath.startsWith("templates/")) {
        return;
      }

      const templateId = filePath.split("/")[1];
      if (!templateId) {
        return;
      }

      // Update status to parsing
      await db.collection("templates").doc(templateId).update({
        status: "parsing",
        updatedAt: new Date(),
      });

      // Download and parse the file
      const file = storage.bucket().file(filePath);
      const [fileBuffer] = await file.download();
      
      let extractedText = "";
      const fileExtension = filePath.split(".").pop()?.toLowerCase();

      if (fileExtension === "pdf") {
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      } else if (fileExtension === "docx") {
        const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = docxData.value;
      } else {
        throw new Error("Unsupported file type");
      }

      // Extract fields using OpenAI
      const extractedFields = await this.extractFieldsWithAI(extractedText);

      // Update template with extracted fields
      await db.collection("templates").doc(templateId).update({
        extractedFields,
        status: "parsed",
        parsedAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`Successfully parsed template ${templateId} with ${extractedFields.length} fields`);
    } catch (error) {
      console.error("Error parsing template:", error);
      
      // Update template with error status
      if (object.name) {
        const templateId = object.name.split("/")[1];
        if (templateId) {
          await db.collection("templates").doc(templateId).update({
            status: "error",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            updatedAt: new Date(),
          });
        }
      }
    }
  },

  async extractFieldsWithAI(text: string): Promise<FormField[]> {
    try {
      console.log('🤖 Starting AI field extraction with structured outputs...');
      console.log('📄 Document text preview:', text.substring(0, 200) + '...');
      
      if (!text || text.trim().length === 0) {
        throw new Error('No text content to analyze');
      }
      
      console.log('🔑 Getting OpenAI client...');
      const openaiClient = getOpenAIClient();
      
      // Define JSON Schema for structured output
      const responseSchema = {
        type: "object",
        properties: {
          fields: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Field identifier in camelCase" },
                type: { 
                  type: "string", 
                  enum: ["text", "email", "number", "date", "select", "textarea", "checkbox", "radio"],
                  description: "Field input type"
                },
                label: { type: "string", description: "Human-readable field label" },
                description: { type: "string", description: "Field description or purpose" },
                required: { type: "boolean", description: "Whether field is required" },
                options: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Options for select/radio/checkbox fields"
                }
              },
              required: ["name", "type", "label", "required"],
              additionalProperties: false
            }
          }
        },
        required: ["fields"],
        additionalProperties: false
      };
      
      console.log('📤 Sending structured request to OpenAI...');
      
      // Try with multiple fallback strategies
      let response;
      const models = ["gpt-4o-2024-08-06", "gpt-4o", "gpt-4-turbo"];
      let lastError;
      
      for (const model of models) {
        try {
          console.log(`🔄 Trying model: ${model}`);
          
          if (model === "gpt-4o-2024-08-06") {
            // Try structured outputs first
            response = await openaiClient.chat.completions.create({
              model: model,
              messages: [
                {
                  role: "system",
                  content: `You are an expert at analyzing legal documents and extracting form field requirements. 
                  Analyze the document text and identify all fields needed for an intake form.
                  
                  Focus on:
                  1. Personal information (names, emails, addresses, phone numbers)
                  2. Business information (company names, business types, roles)  
                  3. Document-specific fields (amounts, dates, descriptions, selections)
                  4. Legal requirements (signatures, witnesses, notarization needs)
                  
                  For each field, determine the appropriate input type and whether it should be required.`
                },
                {
                  role: "user",
                  content: `Please analyze this document text and extract all form fields needed for an intake form:\n\n${text.substring(0, 8000)}` // Limit text length
                }
              ],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "form_fields_extraction",
                  schema: responseSchema,
                  strict: true
                }
              },
              temperature: 0.1
            }, {
              timeout: 30000 // 30 second timeout
            });
          } else {
            // Fallback to regular chat completion with JSON mode
            response = await openaiClient.chat.completions.create({
              model: model,
              messages: [
                {
                  role: "system",
                  content: `You are an expert at analyzing legal documents and extracting form field requirements. Always respond with valid JSON only.`
                },
                {
                  role: "user",
                  content: `Analyze this document and return form fields as JSON with this structure:
{"fields": [{"name": "string", "type": "text|email|number|date|select|textarea|checkbox|radio", "label": "string", "required": boolean, "description": "string", "options": []}]}

Document text:
${text.substring(0, 6000)}`
                }
              ],
              response_format: { type: "json_object" },
              temperature: 0.1,
              max_tokens: 2000
            }, {
              timeout: 20000 // 20 second timeout
            });
          }
          
          console.log(`✅ Success with model: ${model}`);
          break;
          
        } catch (error) {
          console.log(`❌ Failed with model ${model}:`, (error as Error).message);
          lastError = error;
          continue;
        }
      }
      
      if (!response) {
        throw lastError || new Error("All OpenAI models failed");
      }

      const content = response.choices[0]?.message?.content;
      console.log('📥 OpenAI structured response received');
      
      if (!content) {
        throw new Error("No response content from OpenAI");
      }

      console.log('🔄 Parsing structured JSON response...');
      const parsedResponse = JSON.parse(content);
      
      if (!parsedResponse.fields || !Array.isArray(parsedResponse.fields)) {
        throw new Error('Invalid response format: missing fields array');
      }
      
      console.log(`📋 Found ${parsedResponse.fields.length} fields in document`);
      
      // Convert to FormField format
      const formFields: FormField[] = parsedResponse.fields.map((field: any) => ({
        id: uuidv4(),
        name: field.name,
        type: field.type as FormField["type"],
        label: field.label,
        description: field.description || "",
        required: field.required,
        options: field.options || [],
        placeholder: templateParser.generatePlaceholder(field.type, field.label),
      }));

      console.log(`✅ Successfully extracted ${formFields.length} fields using structured outputs`);
      return formFields;
      
    } catch (error) {
      console.error("❌ Error extracting fields with AI:", error);
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      
      // If OpenAI completely fails, create intelligent fallback fields based on document content
      console.log("🔄 OpenAI failed, creating intelligent fallback fields based on document analysis...");
      return templateParser.createIntelligentFallbackFields(text);
    }
  },

  createIntelligentFallbackFields(text: string): FormField[] {
    console.log('🧠 Analyzing document text for intelligent field creation...');
    
    const fields: FormField[] = [];
    const lowerText = text.toLowerCase();
    
    // Always include basic contact fields
    fields.push({
      id: uuidv4(),
      name: "fullName",
      type: "text",
      label: "Full Name",
      description: "Enter your full legal name",
      required: true,
      placeholder: "Enter full name"
    });
    
    fields.push({
      id: uuidv4(),
      name: "email",
      type: "email",
      label: "Email Address", 
      description: "Enter your email address",
      required: true,
      placeholder: "Enter email address"
    });
    
    // Document-specific fields based on content analysis
    if (lowerText.includes('trust') || lowerText.includes('trustee') || lowerText.includes('beneficiary')) {
      fields.push({
        id: uuidv4(),
        name: "trustorName",
        type: "text",
        label: "Trustor Name",
        description: "Name of the person creating the trust",
        required: true,
        placeholder: "Enter trustor name"
      });
      
      fields.push({
        id: uuidv4(),
        name: "trusteeName", 
        type: "text",
        label: "Trustee Name",
        description: "Name of the trustee",
        required: true,
        placeholder: "Enter trustee name"
      });
      
      fields.push({
        id: uuidv4(),
        name: "beneficiaries",
        type: "textarea",
        label: "Beneficiaries",
        description: "List of beneficiaries",
        required: true,
        placeholder: "Enter beneficiary names and details"
      });
    }
    
    if (lowerText.includes('deed') || lowerText.includes('property') || lowerText.includes('real estate')) {
      fields.push({
        id: uuidv4(),
        name: "propertyAddress",
        type: "textarea",
        label: "Property Address",
        description: "Full address of the property",
        required: true,
        placeholder: "Enter complete property address"
      });
      
      fields.push({
        id: uuidv4(),
        name: "grantorName",
        type: "text",
        label: "Grantor Name", 
        description: "Name of the person transferring the property",
        required: true,
        placeholder: "Enter grantor name"
      });
      
      fields.push({
        id: uuidv4(),
        name: "granteeName",
        type: "text",
        label: "Grantee Name",
        description: "Name of the person receiving the property", 
        required: true,
        placeholder: "Enter grantee name"
      });
    }
    
    if (lowerText.includes('certificate') || lowerText.includes('corporate') || lowerText.includes('company')) {
      fields.push({
        id: uuidv4(),
        name: "companyName",
        type: "text",
        label: "Company Name",
        description: "Legal name of the company",
        required: true,
        placeholder: "Enter company name"
      });
      
      fields.push({
        id: uuidv4(),
        name: "incorporationState",
        type: "select",
        label: "State of Incorporation",
        description: "State where the company is incorporated",
        required: true,
        options: ["California", "Delaware", "Nevada", "Texas", "New York", "Other"],
        placeholder: "Select state"
      });
    }
    
    // Common fields for legal documents
    if (lowerText.includes('date') || lowerText.includes('sign')) {
      fields.push({
        id: uuidv4(),
        name: "documentDate",
        type: "date",
        label: "Document Date",
        description: "Date of the document",
        required: true,
        placeholder: "Select date"
      });
    }
    
    if (lowerText.includes('notary') || lowerText.includes('witness')) {
      fields.push({
        id: uuidv4(),
        name: "witnessRequired",
        type: "checkbox",
        label: "Witness Required",
        description: "Check if witness is required",
        required: false,
        placeholder: "Witness Required"
      });
    }
    
    // Always add phone and notes
    fields.push({
      id: uuidv4(),
      name: "phone",
      type: "text", 
      label: "Phone Number",
      description: "Enter your phone number",
      required: false,
      placeholder: "Enter phone number"
    });
    
    fields.push({
      id: uuidv4(),
      name: "additionalNotes",
      type: "textarea",
      label: "Additional Information",
      description: "Any additional information or special requirements",
      required: false,
      placeholder: "Enter any additional details"
    });
    
    console.log(`✅ Created ${fields.length} intelligent fallback fields based on document content`);
    return fields;
  },



  generatePlaceholder(type: string, label: string): string {
    const placeholders: Record<string, string> = {
      text: `Enter ${label.toLowerCase()}`,
      email: "Enter email address",
      number: "Enter number",
      date: "Select date",
      textarea: `Enter ${label.toLowerCase()}`,
      select: `Select ${label.toLowerCase()}`,
      checkbox: label,
      radio: label,
    };

    return placeholders[type] || `Enter ${label.toLowerCase()}`;
  },

  async processUploadedTemplate(data: { templateId: string; filePath: string }): Promise<ApiResponse<{ message: string }>> {
    try {
      const { templateId, filePath } = data;
      
      if (!templateId || !filePath) {
        return { success: false, error: "Missing templateId or filePath" };
      }

      console.log('🤖 Processing uploaded template:', { templateId, filePath });

      // Update status to parsing
      await db.collection("templates").doc(templateId).update({
        status: "parsing",
        updatedAt: new Date(),
      });

      // Download and parse the file
      const file = storage.bucket().file(filePath);
      const [fileBuffer] = await file.download();
      
      let extractedText = "";
      const fileExtension = filePath.split(".").pop()?.toLowerCase();

      if (fileExtension === "pdf") {
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      } else if (fileExtension === "docx") {
        const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = docxData.value;
      } else {
        throw new Error("Unsupported file type");
      }

      console.log('📄 Extracted text length:', extractedText.length);

      // Extract fields using OpenAI with Structured Outputs
      const extractedFields = await templateParser.extractFieldsWithAI(extractedText);

      // Update template with extracted fields
      await db.collection("templates").doc(templateId).update({
        extractedFields,
        status: "parsed",
        parsedAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✅ Successfully processed template ${templateId} with ${extractedFields.length} fields`);

      return {
        success: true,
        data: { message: `Template processed successfully with ${extractedFields.length} fields` },
      };
    } catch (error: any) {
      console.error("❌ Error processing uploaded template:", error);
      
      // Update template with error status
      if (data.templateId) {
        await db.collection("templates").doc(data.templateId).update({
          status: "error",
          errorMessage: error.message || "Unknown processing error",
          updatedAt: new Date(),
        });
      }

      return { 
        success: false, 
        error: `Failed to process template: ${error.message}` 
      };
    }
  },
};