interface Template {
    id: string;
    name: string;
    fileUrl: string;
    fileType: string;
    extractedFields: any[];
}
interface Intake {
    id: string;
    serviceId: string;
    clientData: Record<string, any>;
}
export declare const documentGeneratorAI: {
    /**
     * Main function: Generate documents using OpenAI instead of placeholder replacement
     */
    generateDocumentsFromIntake(intakeId: string, regenerate?: boolean): Promise<{
        success: boolean;
        error: string;
        data?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        data: {
            artifactIds: string[];
        };
        message: string;
        error?: undefined;
    }>;
    /**
     * Generate a single document using OpenAI
     */
    generateDocumentWithAI(template: Template, intake: Intake): Promise<string>;
    /**
     * Extract full content from template (Word or PDF)
     */
    extractTemplateContent(buffer: Buffer, fileType: string): Promise<string>;
    /**
     * Send template and data to OpenAI for intelligent document generation
     */
    generateWithOpenAI(templateContent: string, clientData: Record<string, any>, template: Template): Promise<string>;
    /**
     * Convert plain text to a properly formatted Word document
     */
    convertToWordDocument(content: string, templateName: string): Promise<Buffer>;
    /**
     * Delete existing artifacts when regenerating
     */
    deleteExistingArtifacts(intakeId: string): Promise<void>;
};
export {};
//# sourceMappingURL=documentGeneratorAI.d.ts.map