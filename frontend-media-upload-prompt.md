# Frontend Implementation Guide: Meta Media Upload for Templates

## Overview
This guide explains how to implement media upload functionality for WhatsApp Business API templates in the frontend application. The backend now supports uploading images, videos, and documents to Meta's servers before creating templates.

## New API Endpoints

### 1. Upload Media to Meta
- **Endpoint:** `POST /templates/upload-media`
- **Content-Type:** `multipart/form-data`
- **Form Field:** `file` (the media file)
- **Response:** `{ mediaId: "string" }`
- **Authentication:** Bearer token required

### 2. Create Template (Updated)
- **Endpoint:** `POST /templates`
- **Content-Type:** `application/json`
- **Body:** Template creation data with `mediaId` in components
- **Authentication:** Bearer token required

## Implementation Steps

### Step 1: Upload Media Function
```javascript
const uploadMediaToMeta = async (file, token) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/templates/upload-media', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.mediaId;
  } catch (error) {
    console.error('Media upload error:', error);
    throw error;
  }
};
```

### Step 2: Create Template with Media
```javascript
const createTemplateWithMedia = async (templateData, mediaId, token) => {
  // Prepare template payload
  const payload = {
    name: templateData.name,
    category: templateData.category,
    language: templateData.language,
    wabaId: templateData.wabaId, // optional
    components: templateData.components.map(component => {
      // Add mediaId to header component if it has media
      if (component.type === 'HEADER' &&
          component.format &&
          component.format !== 'TEXT' &&
          mediaId) {
        return {
          ...component,
          mediaId: mediaId
        };
      }
      return component;
    })
  };

  try {
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Template creation failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Template creation error:', error);
    throw error;
  }
};
```

### Step 3: Complete Template Creation Flow
```javascript
const handleTemplateCreation = async (templateData, selectedFile, token) => {
  let mediaId = null;

  // Step 1: Upload media if file is selected
  if (selectedFile) {
    try {
      mediaId = await uploadMediaToMeta(selectedFile, token);
      console.log('Media uploaded successfully:', mediaId);
    } catch (error) {
      alert('Failed to upload media. Please try again.');
      return;
    }
  }

  // Step 2: Create template
  try {
    const result = await createTemplateWithMedia(templateData, mediaId, token);
    console.log('Template created successfully:', result);
    alert('Template created successfully!');
  } catch (error) {
    alert('Failed to create template. Please try again.');
  }
};
```

## UI Implementation

### Template Creation Component
```jsx
import React, { useState } from 'react';

const TemplateCreator = ({ token }) => {
  const [templateData, setTemplateData] = useState({
    name: '',
    category: 'MARKETING',
    language: 'en_US',
    components: []
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaId, setMediaId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleFileSelect = async (file) => {
    if (!file) return;

    setUploading(true);
    try {
      const id = await uploadMediaToMeta(file, token);
      setMediaId(id);
      setSelectedFile(file);
    } catch (error) {
      alert('Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      await handleTemplateCreation(templateData, selectedFile, token);
      // Reset form or redirect
    } catch (error) {
      // Error already handled in handleTemplateCreation
    } finally {
      setCreating(false);
    }
  };

  const hasMediaComponent = templateData.components.some(
    comp => comp.type === 'HEADER' &&
    comp.format &&
    comp.format !== 'TEXT'
  );

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Template Name:</label>
        <input
          type="text"
          value={templateData.name}
          onChange={(e) => setTemplateData({...templateData, name: e.target.value})}
          required
        />
      </div>

      <div>
        <label>Category:</label>
        <select
          value={templateData.category}
          onChange={(e) => setTemplateData({...templateData, category: e.target.value})}
        >
          <option value="MARKETING">Marketing</option>
          <option value="UTILITY">Utility</option>
          <option value="AUTHENTICATION">Authentication</option>
        </select>
      </div>

      {hasMediaComponent && (
        <div>
          <label>Upload Media:</label>
          <input
            type="file"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            accept="image/*,video/*,.pdf,.doc,.docx"
            disabled={uploading}
          />
          {uploading && <p>Uploading media...</p>}
          {mediaId && <p>✓ Media uploaded successfully</p>}
        </div>
      )}

      <button type="submit" disabled={creating || (hasMediaComponent && !mediaId)}>
        {creating ? 'Creating Template...' : 'Create Template'}
      </button>
    </form>
  );
};

export default TemplateCreator;
```

## File Validation Rules

### Images
- **Allowed formats:** JPG, JPEG, PNG
- **Maximum size:** 5MB
- **Resolution:** Up to 1920x1920 pixels recommended

### Videos
- **Allowed formats:** MP4
- **Maximum size:** 16MB
- **Duration:** Up to 30 seconds
- **Resolution:** Up to 1280x720 pixels

### Documents
- **Allowed formats:** PDF, DOC, DOCX
- **Maximum size:** 100MB

## Error Handling

### Media Upload Errors
- File too large
- Invalid file format
- Network errors
- Meta API errors

### Template Creation Errors
- Invalid template data
- Media ID not found
- Duplicate template name
- Meta API validation errors

## Best Practices

1. **Validate files on frontend** before uploading
2. **Show progress indicators** for uploads
3. **Allow retry** for failed uploads
4. **Clean up state** after successful operations
5. **Handle offline scenarios** gracefully
6. **Provide clear error messages** to users
7. **Test with different file types** and sizes

## API Response Examples

### Successful Media Upload
```json
{
  "mediaId": "1234567890123456"
}
```

### Successful Template Creation
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "order_update",
  "category": "UTILITY",
  "language": "en_US",
  "status": "PENDING",
  "components": [...],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Testing Checklist

- [ ] Upload image files (JPG, PNG)
- [ ] Upload video files (MP4)
- [ ] Upload document files (PDF, DOC)
- [ ] Create template without media
- [ ] Create template with media
- [ ] Handle upload failures
- [ ] Handle template creation failures
- [ ] Validate file size limits
- [ ] Test with different browsers
- [ ] Test on mobile devices

## Security Considerations

- Validate file types on both frontend and backend
- Implement file size limits
- Use HTTPS for all API calls
- Handle authentication properly
- Sanitize user inputs
- Implement rate limiting for uploads</content>
<parameter name="filePath">/Users/samratsinghtanwar/wspl/whatsbsp/backend/frontend-media-upload-prompt.md