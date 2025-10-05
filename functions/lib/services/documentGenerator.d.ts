import { Intake, Template, ApiResponse } from "../types";
import { PlaceholderField } from "../types/versioning";
export declare const documentGenerator: {
    generateDocuments(data: {
        intakeId: string;
        regenerate?: boolean;
        useAI?: boolean;
    }): Promise<ApiResponse<{
        artifactIds: string[];
    }>>;
    generateDocumentFromTemplate(template: Template, intake: Intake, overrideSections?: Array<{
        content: string;
        insertAfter: string;
        placeholders: PlaceholderField[];
    }>, effectiveSchema?: PlaceholderField[]): Promise<string>;
    fillWordDocument(templateBuffer: Buffer, clientData: Record<string, any>, template?: any, overrideSections?: Array<{
        content: string;
        insertAfter: string;
        placeholders: PlaceholderField[];
    }>, effectiveSchema?: PlaceholderField[]): Promise<Buffer>;
    fillWordDocumentSimple(templateBuffer: Buffer, clientData: Record<string, any>): Promise<Buffer>;
    fillPdfDocument(templateBuffer: Buffer, clientData: Record<string, any>, overrideSections?: Array<{
        content: string;
        insertAfter: string;
        placeholders: PlaceholderField[];
    }>, effectiveSchema?: PlaceholderField[]): Promise<Buffer>;
    getDownloadUrl(data: {
        artifactId: string;
    }): Promise<ApiResponse<{
        downloadUrl: string;
    }>>;
    downloadDocumentFile(artifactId: string): Promise<ApiResponse<{
        fileBuffer: Buffer;
        fileName: string;
        contentType: string;
    }>>;
    deleteExistingArtifacts(intakeId: string): Promise<void>;
    fillWordDocumentWithSmartReplacement(templateBuffer: Buffer, clientData: Record<string, any>): Promise<Buffer>;
    fillWordDocumentWithAIInsertionPoints(templateBuffer: Buffer, clientData: Record<string, any>, insertionPoints: any[]): Promise<Buffer>;
    getFieldPatterns(fieldName: string): RegExp[];
    findSmartFieldMapping(templateFieldName: string, clientData: Record<string, any>): string | null;
    /**
     * Insert customer override sections into a DOCX document
     * @param zip - PizZip instance containing the document
     * @param overrideSections - Array of override sections to insert
     * @param clientData - Client data for placeholder replacement
     */
    insertOverrideSections(zip: any, overrideSections: Array<{
        content: string;
        insertAfter: string;
        placeholders: PlaceholderField[];
    }>, clientData: Record<string, any>): Promise<void>;
    /**
     * Convert plain text to DOCX XML format
     * @param text - Plain text to convert
     * @returns DOCX XML string
     */
    convertTextToDocxXml(text: string): string;
};
//# sourceMappingURL=documentGenerator.d.ts.map