export interface Placeholder {
  field_key: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
  locations?: Array<{
    page?: number;
    section?: string;
    xpath?: string;
    anchor?: string;
  }>;
  confidence?: number;
}

export interface Template {
  id: string;
  name: string;
  originalFileName: string;
  fileType: 'pdf' | 'docx';
  status: string;
  currentVersion?: number;
  etag?: string;
  createdAt: Date;
  updatedAt: Date;
  editorLock?: {
    userId: string;
    acquiredAt: Date;
    expiresAt: Date;
  };
}

export interface TemplateVersion {
  versionNumber: number;
  etag: string;
  createdAt: Date;
  createdBy: string;
  message?: string;
  placeholders: Placeholder[];
}
