"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceManager = void 0;
const admin = __importStar(require("firebase-admin"));
const uuid_1 = require("uuid");
// Initialize Firebase Admin if not already initialized (needed for module loading order)
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
exports.serviceManager = {
    async createService(data) {
        try {
            const { name, description, templateIds } = data;
            if (!name || !description || !templateIds || templateIds.length === 0) {
                return { success: false, error: "Missing required fields" };
            }
            // Verify all templates exist and are parsed
            const templateDocs = await Promise.all(templateIds.map(id => db.collection("templates").doc(id).get()));
            const templates = [];
            for (const doc of templateDocs) {
                if (!doc.exists) {
                    return { success: false, error: `Template ${doc.id} not found` };
                }
                const template = doc.data();
                if (template.status !== "parsed") {
                    return { success: false, error: `Template ${template.name} is not ready (status: ${template.status})` };
                }
                templates.push(template);
            }
            // Consolidate fields from all templates
            const masterFormJson = this.consolidateFields(templates);
            const serviceId = (0, uuid_1.v4)();
            const service = {
                id: serviceId,
                name,
                description,
                templateIds,
                masterFormJson,
                status: "draft",
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            await db.collection("services").doc(serviceId).set(service);
            return {
                success: true,
                data: { serviceId },
                message: "Service created successfully",
            };
        }
        catch (error) {
            console.error("Error creating service:", error);
            return { success: false, error: "Failed to create service" };
        }
    },
    async updateService(data) {
        try {
            const { serviceId, updates } = data;
            if (!serviceId) {
                return { success: false, error: "Service ID is required" };
            }
            const serviceDoc = await db.collection("services").doc(serviceId).get();
            if (!serviceDoc.exists) {
                return { success: false, error: "Service not found" };
            }
            // If templateIds are being updated, regenerate masterFormJson
            let updatedData = Object.assign(Object.assign({}, updates), { updatedAt: new Date() });
            if (updates.templateIds) {
                const templateDocs = await Promise.all(updates.templateIds.map(id => db.collection("templates").doc(id).get()));
                const templates = [];
                for (const doc of templateDocs) {
                    if (!doc.exists) {
                        return { success: false, error: `Template ${doc.id} not found` };
                    }
                    const template = doc.data();
                    if (template.status !== "parsed") {
                        return { success: false, error: `Template ${template.name} is not ready` };
                    }
                    templates.push(template);
                }
                updatedData.masterFormJson = this.consolidateFields(templates);
            }
            await db.collection("services").doc(serviceId).update(updatedData);
            return { success: true, message: "Service updated successfully" };
        }
        catch (error) {
            console.error("Error updating service:", error);
            return { success: false, error: "Failed to update service" };
        }
    },
    async deleteService(data) {
        try {
            const { serviceId } = data;
            if (!serviceId) {
                return { success: false, error: "Service ID is required" };
            }
            // Check if service has any active intakes
            const intakesQuery = await db.collection("intakes")
                .where("serviceId", "==", serviceId)
                .where("status", "in", ["opened", "in-progress", "submitted"])
                .limit(1)
                .get();
            if (!intakesQuery.empty) {
                return { success: false, error: "Cannot delete service with active intakes" };
            }
            await db.collection("services").doc(serviceId).delete();
            return { success: true, message: "Service deleted successfully" };
        }
        catch (error) {
            console.error("Error deleting service:", error);
            return { success: false, error: "Failed to delete service" };
        }
    },
    consolidateFields(templates) {
        const fieldMap = new Map();
        for (const template of templates) {
            for (const field of template.extractedFields) {
                const key = `${field.name.toLowerCase()}_${field.type}`;
                if (!fieldMap.has(key)) {
                    fieldMap.set(key, Object.assign(Object.assign({}, field), { id: (0, uuid_1.v4)() }));
                }
                else {
                    // If field already exists, merge options if applicable
                    const existingField = fieldMap.get(key);
                    if (field.options && existingField.options) {
                        const mergedOptions = Array.from(new Set([...existingField.options, ...field.options]));
                        existingField.options = mergedOptions;
                    }
                    // Keep the more restrictive required setting
                    existingField.required = existingField.required || field.required;
                    // Use the longer description if available
                    if (field.description && (!existingField.description || field.description.length > existingField.description.length)) {
                        existingField.description = field.description;
                    }
                }
            }
        }
        return Array.from(fieldMap.values()).sort((a, b) => {
            // Sort by field importance and type
            const typeOrder = ["text", "email", "number", "date", "select", "textarea", "checkbox", "radio"];
            const aIndex = typeOrder.indexOf(a.type);
            const bIndex = typeOrder.indexOf(b.type);
            if (aIndex !== bIndex) {
                return aIndex - bIndex;
            }
            return a.label.localeCompare(b.label);
        });
    },
};
//# sourceMappingURL=serviceManager.js.map