export interface Template {
    id: string;
    name: string;
    originalFileName: string;
    fileUrl: string;
    fileType: "pdf" | "docx";
    extractedFields: FormField[];
    insertionPoints?: InsertionPoint[];
    status: "uploaded" | "parsing" | "parsed" | "error";
    createdAt: Date;
    updatedAt: Date;
    parsedAt?: Date;
    errorMessage?: string;
    etag?: string;
    currentVersion?: number;
    default_customization_rules?: CustomizationRules;
}
export interface InsertionPoint {
    fieldName: string;
    dataType: string;
    contextBefore: string;
    contextAfter: string;
    placeholder: string;
    description: string;
}
export interface FormField {
    id: string;
    name: string;
    type: "text" | "email" | "number" | "date" | "select" | "textarea" | "checkbox" | "radio";
    label: string;
    description?: string;
    required: boolean;
    options?: string[];
    validation?: FieldValidation;
    placeholder?: string;
}
export interface FieldValidation {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
}
export interface CustomizationRules {
    allow_custom_fields: boolean;
    allow_custom_clauses: boolean;
    require_approval: boolean;
    allowed_field_types: string[];
    max_custom_fields: number;
    max_custom_clauses: number;
}
export interface Service {
    id: string;
    name: string;
    description: string;
    templateIds: string[];
    masterFormJson: FormField[];
    status: "draft" | "active" | "inactive";
    createdAt: Date;
    updatedAt: Date;
    customization_enabled: boolean;
    customization_rules: CustomizationRules | null;
}
export interface Intake {
    id: string;
    serviceId: string;
    serviceName: string;
    linkToken: string;
    clientData: Record<string, any>;
    status: "link-generated" | "opened" | "in-progress" | "submitted" | "pending-approval" | "approved" | "rejected" | "documents-generated";
    createdAt: Date;
    updatedAt: Date;
    submittedAt?: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    clientEmail?: string;
    clientName?: string;
    expiresAt?: Date;
    has_customizations?: boolean;
    custom_fields?: any[];
    custom_clauses?: any[];
    rejection_reason?: string;
    reviewed_by?: string;
    versionSnapshot?: {
        templateVersions: Record<string, number>;
        effectiveSchema?: any[];
        overrideId?: string;
        frozenAt: Date;
        frozenBy?: string;
    };
}
export interface DocumentArtifact {
    id: string;
    intakeId: string;
    templateId: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    generatedAt: Date;
    status: "generating" | "generated" | "error";
    errorMessage?: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface UploadTemplateRequest {
    fileName: string;
    fileType: string;
    templateName: string;
}
export interface CreateServiceRequest {
    name: string;
    description: string;
    templateIds: string[];
    customization?: CustomizationRules | null;
}
export interface GenerateIntakeLinkRequest {
    serviceId: string;
    clientEmail?: string;
    expiresInDays?: number;
}
export interface SubmitIntakeRequest {
    intakeId: string;
    formData: Record<string, any>;
    clientInfo?: {
        name: string;
        email: string;
    };
}
export interface OpenAIFieldExtractionResponse {
    fields: {
        name: string;
        type: string;
        label: string;
        description?: string;
        required: boolean;
        options?: string[];
    }[];
}
//# sourceMappingURL=index.d.ts.map