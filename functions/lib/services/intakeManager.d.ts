import * as functions from "firebase-functions";
import { ApiResponse, GenerateIntakeLinkRequest, SubmitIntakeRequest } from "../types";
export declare const intakeManager: {
    generateIntakeLink(data: GenerateIntakeLinkRequest): Promise<ApiResponse<{
        intakeId: string;
        intakeUrl: string;
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