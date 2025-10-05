import * as functions from "firebase-functions";
import { FormField, ApiResponse } from "../types";
export declare const templateParser: {
    uploadAndParse(data: {
        fileName: string;
        fileType: string;
        templateName: string;
    }): Promise<ApiResponse<{
        templateId: string;
        uploadUrl: string;
    }>>;
    onTemplateUploaded(object: functions.storage.ObjectMetadata): Promise<void>;
    extractFieldsWithAI(text: string): Promise<FormField[]>;
    createIntelligentFallbackFields(text: string): FormField[];
    generatePlaceholder(type: string, label: string): string;
    processUploadedTemplate(data: {
        templateId: string;
        filePath: string;
    }): Promise<ApiResponse<{
        message: string;
    }>>;
    identifyInsertionPoints(text: string, openaiClient: any): Promise<any[]>;
    extractFieldsAndInsertionPoints(text: string): Promise<{
        fields: FormField[];
        insertionPoints: any[];
    }>;
};
//# sourceMappingURL=templateParser.d.ts.map