import * as functions from "firebase-functions";
import { ApiResponse, GenerateIntakeLinkRequest, SubmitIntakeRequest } from "../types";
import { PlaceholderField } from "../types/versioning";
export declare const intakeManager: {
    generateIntakeLink(data: GenerateIntakeLinkRequest): Promise<ApiResponse<{
        intakeId: string;
        intakeUrl: string;
    }>>;
    /**
     * Generate intake link with customer overrides and frozen template versions
     * @param data - Request data with serviceId, customerId, templateIds, and override options
     * @returns ApiResponse with intakeId and intakeUrl
     */
    generateIntakeLinkWithOverrides(data: {
        serviceId: string;
        customerId: string;
        templateIds?: string[];
        useApprovedVersions?: boolean;
        clientEmail?: string;
        expiresInDays?: number;
        overrideId?: string;
    }): Promise<ApiResponse<{
        intakeId: string;
        intakeUrl: string;
    }>>;
    /**
     * Get the form schema for an intake, including customer overrides
     * @param intakeId - Intake ID
     * @returns ApiResponse with form fields (merged schema)
     */
    getIntakeFormSchema(intakeId: string): Promise<ApiResponse<{
        formFields: PlaceholderField[];
    }>>;
    submitIntakeForm(data: SubmitIntakeRequest): Promise<ApiResponse>;
    approveIntakeForm(data: {
        intakeId: string;
        approved: boolean;
        notes?: string;
    }): Promise<ApiResponse>;
    intakeFormAPI: import("express-serve-static-core").Router;
    onIntakeStatusChange(change: functions.Change<functions.firestore.QueryDocumentSnapshot>): Promise<void>;
};
//# sourceMappingURL=intakeManager.d.ts.map