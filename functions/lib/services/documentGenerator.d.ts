import { Intake, Template, ApiResponse } from "../types";
export declare const documentGenerator: {
    generateDocuments(data: {
        intakeId: string;
        regenerate?: boolean;
    }): Promise<ApiResponse<{
        artifactIds: string[];
    }>>;
    generateDocumentFromTemplate(template: Template, intake: Intake): Promise<string>;
    fillWordDocument(templateBuffer: Buffer, clientData: Record<string, any>): Promise<Buffer>;
    fillWordDocumentSimple(templateBuffer: Buffer, clientData: Record<string, any>): Promise<Buffer>;
    fillPdfDocument(templateBuffer: Buffer, clientData: Record<string, any>): Promise<Buffer>;
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
};
//# sourceMappingURL=documentGenerator.d.ts.map