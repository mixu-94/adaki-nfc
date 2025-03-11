# adaki-nfc API Documentation

This document describes the API endpoints for the adaki-nfc service, which provides secure NFC tag verification.

## Authentication

All API endpoints are protected with API key authentication. Include your API key in the request headers:

```
X-API-Key: your-api-key
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

Common error codes:

- `MISSING_API_KEY`: No API key provided
- `INVALID_API_KEY`: Invalid or inactive API key
- `EXPIRED_API_KEY`: API key has expired
- `INVALID_FORMAT`: Request data format is invalid
- `VERIFICATION_FAILED`: NFC tag verification failed
- `NOT_FOUND`: Requested resource not found
- `SERVER_ERROR`: Unexpected server error

## Rate Limiting

API requests are rate-limited to prevent abuse. The current limits are:

- 100 requests per 15-minute window in production
- 1000 requests per 15-minute window in development

When a rate limit is exceeded, the API will respond with status code 429.

## Endpoints

### NFC Verification

#### Verify NFC Tag

```
POST /api/nfc/verify
```

Verifies an NFC tag using a SUM message.

**Request Body:**

```json
{
  "sumMessage": {
    "type": "string",
    "data": "string",
    "signature": "string" // Optional
  }
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "tagId": "string",
    "isValid": true,
    "metadata": {},
    "verifiedAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "NFC tag successfully verified",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**

- 400 Bad Request: Invalid SUM message format
- 401 Unauthorized: Verification failed or invalid API key
- 429 Too Many Requests: Rate limit exceeded

#### Get Tag Statistics

```
GET /api/nfc/stats/:tagId
```

Retrieves statistics for a specific tag.

**URL Parameters:**

- `tagId`: ID of the tag to get statistics for

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "tag_id": "string",
    "first_verified_at": "2023-01-01T00:00:00.000Z",
    "last_verified_at": "2023-01-01T00:00:00.000Z",
    "verification_count": 0
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**

- 400 Bad Request: Missing tag ID
- 401 Unauthorized: Invalid API key
- 404 Not Found: Tag not found
- 429 Too Many Requests: Rate limit exceeded

### API Key Management

#### Create API Key

```
POST /api/auth/keys
```

Creates a new API key.

**Request Body:**

```json
{
  "name": "string",
  "expiresAt": "2023-01-01T00:00:00.000Z" // Optional
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "key": "string",
    "name": "string",
    "expiresAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "API key created successfully. Store this key securely as it won't be shown again.",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**

- 400 Bad Request: Invalid name or date format
- 401 Unauthorized: Invalid API key
- 429 Too Many Requests: Rate limit exceeded

#### Revoke API Key

```
DELETE /api/auth/keys/:id
```

Revokes an API key.

**URL Parameters:**

- `id`: ID of the API key to revoke

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "API key revoked successfully",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**

- 400 Bad Request: Missing key ID
- 401 Unauthorized: Invalid API key
- 404 Not Found: API key not found
- 429 Too Many Requests: Rate limit exceeded

## Health Check

```
GET /health
```

Checks the health of the service.

**Success Response (200 OK):**

```json
{
  "status": "ok",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

No authentication is required for the health check endpoint.
