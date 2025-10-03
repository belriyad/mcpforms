import { Intake, Template, ApiResponse } from "../types";
export declare const documentGenerator: {
    generateDocuments(data: {
        intakeId: string;
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
};
//# sourceMappingURL=documentGenerator.d.ts.map