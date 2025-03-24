# adaki-nfc

Backend service for NFC tag verification using SUM messages.

## Overview

adaki-nfc is a dedicated backend service that:

- Verifies NFC tags by communicating with the separate Python-based sdm-backend
- Logs verification data to Supabase for analytics and tracking
- Provides a secure API for applications to consume
- Maintains high security standards as a critical verification service

## Project Structure

```
src/
├── config/               # Configuration files
├── controllers/          # API controllers
├── middleware/           # Express middlewares
├── services/             # Business logic
├── utils/                # Helper functions
├── types/                # TypeScript type definitions
├── routes/               # API routes
└── app.ts               # Main application file
```

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Redis (running on port 6379)
- Supabase account with appropriate tables
- sdm-backend service (running on port 5000)

## Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/adaki-nfc.git
cd adaki-nfc
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Build the project:

```bash
npm run build
```

5. Start the server:

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

## API Endpoints

### Verify NFC Tag

- **URL**: `/api/nfc/verify`
- **Method**: `POST`
- **Auth**: API Key required (x-api-key header)
- **Body**:

```json
{
  "sumMessage": {
    "id": "tag-id-123",
    "data": "encoded-data-string"
  }
}
```

- **Response**:

```json
{
  "success": true,
  "data": {
    "tagId": "tag-id-123",
    "isValid": true,
    "redirectUrl": "https://example.com/product/123",
    "metadata": {}
  },
  "message": "NFC tag successfully verified",
  "timestamp": "2023-04-01T12:34:56.789Z"
}
```

### Redirect Handler

- **URL**: `/api/nfc/redirect`
- **Method**: `POST`
- **Auth**: None (optional API key)
- **Body**: Same as verify endpoint
- **Response**: Redirects to the URL associated with the tag

## Database Tables

The project uses the following Supabase tables:

### nfc_verify.tags

- `id`: UUID (Primary Key)
- `tag_id`: Text (Unique)
- `first_verified_at`: Timestamp
- `last_verified_at`: Timestamp
- `verification_count`: Integer
- `redirect_url`: Text
- `is_active`: Boolean

### nfc_verify.verifications

- `id`: UUID (Primary Key)
- `tag_id`: Text
- `success`: Boolean
- `metadata`: JSONB
- `ip_address`: Text
- `user_agent`: Text
- `created_at`: Timestamp
- `geolocation`: JSONB

### nfc_verify.api_keys

- `id`: UUID (Primary Key)
- `name`: Text
- `key`: Text (Unique)
- `is_active`: Boolean
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `expires_at`: Timestamp

## License

[MIT](LICENSE)
