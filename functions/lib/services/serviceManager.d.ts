import { Service, Template, FormField, ApiResponse, CreateServiceRequest } from "../types";
export declare const serviceManager: {
    createService(data: CreateServiceRequest): Promise<ApiResponse<{
        serviceId: string;
    }>>;
    updateService(data: {
        serviceId: string;
        updates: Partial<Service>;
    }): Promise<ApiResponse>;
    deleteService(data: {
        serviceId: string;
    }): Promise<ApiResponse>;
    consolidateFields(templates: Template[]): FormField[];
};
//# sourceMappingURL=serviceManager.d.ts.map