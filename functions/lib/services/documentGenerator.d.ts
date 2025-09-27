import { Intake, Template, ApiResponse } from "../types";
export declare const documentGenerator: {
    generateDocuments(data: {
        intakeId: string;
    }): Promise<ApiResponse<{
        artifactIds: string[];
    }>>;
    generateDocumentFromTemplate(template: Template, intake: Intake): Promise<string>;
    fillWordDocument(templateBuffer: Buffer, clientData: Record<string, any>): Promise<Buffer>;
    fillPdfDocument(templateBuffer: Buffer, clientData: Record<string, any>): Promise<Buffer>;
    getDownloadUrl(artifactId: string): Promise<ApiResponse<{
        downloadUrl: string;
    }>>;
};
//# sourceMappingURL=documentGenerator.d.ts.map