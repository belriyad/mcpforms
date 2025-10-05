import { AIPlaceholderSuggestion, PlaceholderField } from "../types/versioning";
export declare const aiPlaceholderService: {
    /**
     * Suggest placeholders from template content using AI with Structured Outputs
     */
    suggestPlaceholders(templateContent: string, fileType: "docx" | "pdf", existingPlaceholders?: PlaceholderField[]): Promise<AIPlaceholderSuggestion>;
    /**
     * Generate custom clause with new placeholders (for customer overrides)
     */
    generateCustomClause(customerRequest: string, templateContext: string, existingPlaceholders: PlaceholderField[]): Promise<{
        section_text: string;
        section_title: string;
        new_placeholders: PlaceholderField[];
        reasoning: string;
        warnings?: string[];
    }>;
};
//# sourceMappingURL=aiPlaceholderService.d.ts.map