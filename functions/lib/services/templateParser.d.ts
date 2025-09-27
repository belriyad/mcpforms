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
    generatePlaceholder(type: string, label: string): string;
};
//# sourceMappingURL=templateParser.d.ts.map