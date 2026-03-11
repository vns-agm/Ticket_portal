# API Documentation

## Issue Management API

### Base URL
`/api/issues`

---

## Endpoints

### 1. Get All Issues
**GET** `/api/issues`

Returns all issues in the system.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "issue-1234567890-abc123",
      "assignedTo": "john.doe@example.com",
      "dueDate": "2024-12-31",
      "priority": "high",
      "description": "Issue description",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 2. Create New Issue
**POST** `/api/issues`

Creates a new issue.

**Request Body:**
```json
{
  "assignedTo": "john.doe@example.com",
  "dueDate": "2024-12-31",
  "priority": "high",
  "description": "Issue description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "issue-1234567890-abc123",
    "assignedTo": "john.doe@example.com",
    "dueDate": "2024-12-31",
    "priority": "high",
    "description": "Issue description",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3. Get Issue by Unique Key (ID)
**GET** `/api/issues/[id]`

Fetches a single issue by its unique identifier.

**Parameters:**
- `id` (string, required) - The unique issue ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "issue-1234567890-abc123",
    "assignedTo": "john.doe@example.com",
    "dueDate": "2024-12-31",
    "priority": "high",
    "description": "Issue description",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Issue with ID \"issue-123\" not found",
  "id": "issue-123"
}
```

---

### 4. Update Issue by Unique Key (ID)
**PUT** `/api/issues/[id]`

Updates an existing issue by its unique identifier.

**Parameters:**
- `id` (string, required) - The unique issue ID

**Request Body:**
```json
{
  "assignedTo": "jane.smith@example.com",
  "dueDate": "2024-12-31",
  "priority": "urgent",
  "description": "Updated issue description"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Issue updated successfully",
  "data": {
    "id": "issue-1234567890-abc123",
    "assignedTo": "jane.smith@example.com",
    "dueDate": "2024-12-31",
    "priority": "urgent",
    "description": "Updated issue description",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Issue with ID \"issue-123\" not found",
  "id": "issue-123"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "All fields are required: assignedTo, dueDate, priority, description"
}
```

---

### 5. Delete Issue by Unique Key (ID)
**DELETE** `/api/issues/[id]`

Deletes an issue by its unique identifier.

**Parameters:**
- `id` (string, required) - The unique issue ID

**Response:**
```json
{
  "success": true,
  "message": "Issue deleted successfully",
  "data": {
    "id": "issue-1234567890-abc123",
    "assignedTo": "john.doe@example.com",
    "dueDate": "2024-12-31",
    "priority": "high",
    "description": "Issue description",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "deletedId": "issue-1234567890-abc123"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Issue with ID \"issue-123\" not found",
  "id": "issue-123"
}
```

---

## Field Validations

### Priority
Must be one of: `low`, `medium`, `high`, `urgent` (case-insensitive)

### Due Date
Format: `YYYY-MM-DD` (e.g., "2024-12-31")

### Required Fields
All endpoints that create/update issues require:
- `assignedTo` (string)
- `dueDate` (string, format: YYYY-MM-DD)
- `priority` (string, one of: low, medium, high, urgent)
- `description` (string)

---

## Error Codes

- `400` - Bad Request (missing or invalid parameters)
- `404` - Not Found (issue with specified ID doesn't exist)
- `500` - Internal Server Error (server-side error)

---

## Example Usage

### Update an Issue
```javascript
const response = await fetch('/api/issues/issue-1234567890-abc123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    assignedTo: 'jane.smith@example.com',
    dueDate: '2024-12-31',
    priority: 'urgent',
    description: 'Updated description'
  })
});

const result = await response.json();
```

### Delete an Issue
```javascript
const response = await fetch('/api/issues/issue-1234567890-abc123', {
  method: 'DELETE'
});

const result = await response.json();
```

