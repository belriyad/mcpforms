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
  if (!apiKey) {
    throw new Error("OpenAI API key not found in environment variables");
  }
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
      
      // Generate signed upload URL
      const file = storage.bucket().file(filePath);
      const [uploadUrl] = await file.getSignedUrl({
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: fileType === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

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
    } catch (error) {
      console.error("Error in uploadAndParse:", error);
      return { success: false, error: "Failed to generate upload URL" };
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
      const prompt = `
Analyze the following document text and extract all form fields that would be needed for an intake form. 
Return a JSON object with a "fields" array containing field objects with the following structure:
- name: string (field identifier, camelCase, no spaces)
- type: string (one of: text, email, number, date, select, textarea, checkbox, radio)
- label: string (human-readable field label)
- description: string (optional description of what this field is for)
- required: boolean (whether this field is required)
- options: string[] (only for select, radio, checkbox types)

Focus on identifying:
1. Personal information fields (name, email, phone, address, etc.)
2. Business information fields (company name, business type, etc.)
3. Document-specific fields (amounts, dates, descriptions, etc.)
4. Selection fields (dropdowns, checkboxes, radio buttons)

Document text:
${text}

Return only valid JSON with no additional text or formatting.
`;

      const openaiClient = getOpenAIClient();
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing documents and extracting form field requirements. Always return valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const parsedResponse: OpenAIFieldExtractionResponse = JSON.parse(content);
      
      // Convert to FormField format
      const formFields: FormField[] = parsedResponse.fields.map(field => ({
        id: uuidv4(),
        name: field.name,
        type: field.type as FormField["type"],
        label: field.label,
        description: field.description,
        required: field.required,
        options: field.options,
        placeholder: this.generatePlaceholder(field.type, field.label),
      }));

      return formFields;
    } catch (error) {
      console.error("Error extracting fields with AI:", error);
      throw new Error("Failed to extract fields using AI");
    }
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
};