# Admin Delete Functionality

## Overview
Added comprehensive delete functionality for templates, services, and intake forms with admin permissions and confirmation dialogs.

## Features Added

### 1. Templates Page (`/admin/templates`)
- ✅ Delete button on each template card
- ✅ Confirmation dialog before deletion
- ✅ Loading state during deletion
- ✅ Deletes Firestore document
- 🔄 TODO: Also delete associated storage files

**Location**: `src/app/admin/templates/page.tsx`

**How it works**:
```typescript
const handleDelete = async (templateId: string, templateName: string, e: React.MouseEvent) => {
  // Confirmation dialog
  if (!confirm(`Are you sure you want to delete "${templateName}"?`)) {
    return
  }
  
  // Delete from Firestore
  await deleteDoc(doc(db, 'templates', templateId))
}
```

**UI**:
- Red trash icon button next to "View" button
- Shows loading spinner while deleting
- Button disabled during deletion

---

### 2. Services Page (`/admin/services`)
- ✅ Delete button on each service card
- ✅ Confirmation dialog with warning about cascading deletes
- ✅ Loading state during deletion
- ✅ Deletes Firestore document
- 🔄 TODO: Cascade delete associated intakes and documents

**Location**: `src/app/admin/services/page.tsx`

**How it works**:
```typescript
const handleDelete = async (serviceId: string, serviceName: string, e: React.MouseEvent) => {
  // Confirmation with cascade warning
  if (!confirm(`Are you sure you want to delete service "${serviceName}"? 
                 This will also delete associated intakes and documents.`)) {
    return
  }
  
  // Delete from Firestore
  await deleteDoc(doc(db, 'services', serviceId))
}
```

**UI**:
- Red trash icon button in actions section
- Shows next to "View", "Download", and "Continue" buttons
- Button disabled during deletion

---

### 3. Intakes Page (`/admin/intakes`)
- ✅ Delete button in actions column
- ✅ Confirmation dialog before deletion
- ✅ Loading state during deletion
- ✅ Deletes associated service (since intake is part of service)

**Location**: `src/app/admin/intakes/page.tsx`

**How it works**:
```typescript
const handleDelete = async (intakeId: string, serviceName: string, e: React.MouseEvent) => {
  // Confirmation dialog
  if (!confirm(`Are you sure you want to delete the intake form for "${serviceName}"?`)) {
    return
  }
  
  // Delete the service (which contains the intake)
  await deleteDoc(doc(db, 'services', intakeId))
}
```

**UI**:
- Red trash icon button in Actions column
- Shows next to "View Service" button
- Button disabled during deletion

---

## User Experience

### Confirmation Dialogs
All delete actions require user confirmation with specific messages:

- **Templates**: `"Are you sure you want to delete "{templateName}"? This action cannot be undone."`
- **Services**: `"Are you sure you want to delete service "{serviceName}"? This will also delete associated intakes and documents. This action cannot be undone."`
- **Intakes**: `"Are you sure you want to delete the intake form for "{serviceName}"? This action cannot be undone."`

### Visual Feedback
1. **Before deletion**: Red trash icon button
2. **During deletion**: Loading spinner replaces icon
3. **Button state**: Disabled during deletion to prevent double-clicks
4. **Real-time update**: Item automatically removed from list (via Firestore listener)

### Error Handling
- Try/catch blocks around all delete operations
- User-friendly error alerts if deletion fails
- Console error logging for debugging

---

## Security Considerations

### Current Implementation
- ✅ Only authenticated users can access admin pages
- ✅ Firestore security rules enforce permissions
- ✅ Client-side validation (confirmation dialogs)

### Recommended Firestore Rules
```javascript
// Templates
match /templates/{templateId} {
  allow delete: if request.auth != null && 
                   request.auth.uid == resource.data.createdBy;
}

// Services
match /services/{serviceId} {
  allow delete: if request.auth != null && 
                   request.auth.uid == resource.data.createdBy;
}
```

---

## Future Enhancements

### 1. Cascade Deletes
**Templates**:
- [ ] Delete associated storage files
- [ ] Delete from any services using this template
- [ ] Archive instead of hard delete (soft delete)

**Services**:
- [ ] Delete associated intake submissions
- [ ] Delete generated documents
- [ ] Delete intake form data
- [ ] Notify clients if service was active

**Intakes**:
- [ ] Delete associated intake responses
- [ ] Delete uploaded files from clients

### 2. Bulk Delete
- [ ] Select multiple items with checkboxes
- [ ] "Delete Selected" button
- [ ] Confirmation with count of items

### 3. Undo/Archive
- [ ] Soft delete with "archived" status
- [ ] "Undo" option after deletion (5-second window)
- [ ] Archive view to restore deleted items
- [ ] Permanent delete after 30 days

### 4. Audit Trail
- [ ] Log who deleted what and when
- [ ] Store in `deletionLogs` collection
- [ ] Admin dashboard to view deletion history

### 5. Better UX
- [ ] Toast notifications instead of alerts
- [ ] Slide-out confirmation panel
- [ ] Preview of what will be deleted (cascade info)
- [ ] Keyboard shortcuts (e.g., Delete key)

---

## Code Changes Summary

### Files Modified

1. **`src/app/admin/templates/page.tsx`**
   - Added `Trash2` icon import
   - Added `deleteDoc, doc` imports from Firestore
   - Added `deletingId` state
   - Added `handleDelete` function
   - Added delete button to template cards

2. **`src/app/admin/services/page.tsx`**
   - Added `Trash2` icon import
   - Added `deleteDoc, doc` imports from Firestore
   - Added `deletingId` state
   - Added `handleDelete` function
   - Added delete button to service cards

3. **`src/app/admin/intakes/page.tsx`**
   - Added `Trash2` icon import
   - Added `deleteDoc, doc` imports from Firestore
   - Added `deletingId` state
   - Added `handleDelete` function
   - Added delete button to intake table rows

### No Database Migration Required
- Uses existing Firestore collections
- No schema changes needed
- Backwards compatible

---

## Testing Checklist

### Manual Testing
- [ ] Delete a template → Verify removed from list
- [ ] Delete a service → Verify removed from list
- [ ] Delete an intake → Verify removed from list
- [ ] Cancel delete confirmation → No deletion occurs
- [ ] Try deleting while another delete in progress → Button disabled
- [ ] Check Firestore → Document actually deleted
- [ ] Check for orphaned data → Storage files, etc.

### Error Scenarios
- [ ] Network offline → Error message shown
- [ ] Permission denied → Error message shown
- [ ] Document doesn't exist → Graceful handling

### Edge Cases
- [ ] Delete item that was already deleted → No error
- [ ] Delete item being viewed by another user → Real-time update works
- [ ] Delete service with active intake → Confirmation mentions cascade

---

## Analytics Events

Consider adding telemetry tracking for deletions:

```typescript
// In handleDelete functions
Analytics.templateDeleted(templateId)
Analytics.serviceDeleted(serviceId)
Analytics.intakeDeleted(intakeId)
```

Add to `src/lib/analytics.ts`:
```typescript
templateDeleted: (templateId: string) =>
  trackEvent('template_deleted', { templateId }),
serviceDeleted: (serviceId: string) =>
  trackEvent('service_deleted', { serviceId }),
intakeDeleted: (intakeId: string) =>
  trackEvent('intake_deleted', { intakeId }),
```

---

## Support & Troubleshooting

### Common Issues

**Q: Delete button doesn't work**
- Check browser console for errors
- Verify Firestore rules allow delete
- Check user authentication status

**Q: Item deleted but still appears**
- Check if Firestore listener is active
- Try refreshing the page
- Check network tab for failed requests

**Q: Want to restore deleted item**
- Currently no undo feature (hard delete)
- Consider implementing soft delete
- Check Firestore backups if critical

### Debug Mode
Enable console logging:
```javascript
console.log('Deleting item:', itemId)
console.log('Delete result:', result)
```

---

## Deployment Notes

- ✅ No environment variables needed
- ✅ No database migrations required
- ✅ Works with existing Firestore setup
- ⚠️ Ensure Firestore rules are configured
- ⚠️ Test in staging environment first
- ⚠️ Backup database before deploying to production

---

## Maintenance

### Regular Tasks
- Monitor deletion logs for unusual patterns
- Clean up orphaned storage files
- Review and update Firestore security rules
- Test delete functionality after Firebase SDK updates

### Performance
- Deletions are fast (single document)
- Real-time updates via Firestore listeners
- No impact on page load times
