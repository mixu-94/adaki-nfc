# adaki-nfc

A backend service for NFC tag verification using SUM (Secure Unique Message) protocol with Supabase integration for data persistence.

## System Overview

adaki-nfc is a dedicated Node.js backend service that:

1. **Verifies NFC tags** by communicating with a separate Python-based SDM backend service
2. **Logs verification data** to Supabase for analytics and tracking
3. **Provides a secure API** for client applications to consume
4. **Handles redirect functionality** for verified NFC tags

The system follows a microservices architecture:

- adaki-nfc: Node.js service handling API requests, verification routing, and data logging
- sdm-backend: External Python service responsible for cryptographic verification of SUM messages
- Supabase: PostgreSQL database with RESTful API for data storage

## Core Functionality

### 1. NFC Tag Verification

The system provides two primary endpoints for NFC tag verification:

- **API Verification** (`/api/nfc/verify`): For programmatic use by client applications
- **Redirect Handling** (`/api/nfc/redirect`): For direct use from NFC tag reads, which redirects to configured URLs

When an NFC tag is scanned:

1. The SUM message (containing tag ID, data, and signature) is sent to the verification endpoint
2. The system validates the format of the message
3. The message is forwarded to the SDM backend for cryptographic verification
4. The verification is logged to Supabase
5. The system returns a verification result or redirects to the appropriate URL

### 2. Data Persistence

All verification attempts are recorded in Supabase with:

- Tag ID
- Verification result (success/failure)
- Timestamp
- IP address
- User agent
- Associated metadata

Additionally, the system maintains a tags table with:

- First verification timestamp
- Last verification timestamp
- Verification count
- Configured redirect URL

### 3. Security

The system implements several security measures:

- API key authentication for protected endpoints
- Redis-based caching to improve performance and reduce load
- Rate limiting to prevent abuse
- Proper error handling and logging

## Technical Architecture

### Database Schema

The system uses three primary tables in Supabase:

1. **tags**: Records information about verified NFC tags

   - `id`: UUID primary key
   - `tag_id`: Unique identifier for the tag
   - `first_verified_at`: When the tag was first verified
   - `last_verified_at`: When the tag was last verified
   - `verification_count`: How many times the tag has been verified
   - `redirect_url`: URL to redirect to when the tag is scanned
   - `is_active`: Whether the tag is active

2. **verifications**: Logs all verification attempts

   - `id`: UUID primary key
   - `tag_id`: ID of the NFC tag
   - `success`: Whether verification succeeded
   - `metadata`: Additional data from verification (JSONB)
   - `ip_address`: Client IP address
   - `user_agent`: Client user agent
   - `created_at`: Timestamp of verification
   - `geolocation`: Location data if available (JSONB)

3. **api_keys**: Manages API keys for client authentication
   - `id`: UUID primary key
   - `name`: Name of the key
   - `key`: The actual API key (unique)
   - `is_active`: Whether the key is active
   - `created_at`: When the key was created
   - `updated_at`: When the key was last updated
   - `expires_at`: Optional expiration date

### API Endpoints

#### 1. Verify NFC Tag (API)

- **URL**: `/api/nfc/verify`
- **Method**: `POST`
- **Auth**: API Key required (x-api-key header)
- **Body**: JSON containing SUM message with tag ID, data, and optional signature
- **Response**: JSON with verification result, including tag ID, validity, and redirect URL

#### 2. Redirect Handler

- **URL**: `/api/nfc/redirect`
- **Method**: `POST`
- **Auth**: None (optional API key)
- **Body**: SUM message
- **Response**: HTTP redirect to the configured URL for the tag

### Service Components

#### 1. NFC Controller

Handles HTTP requests and responses for NFC tag verification.

#### 2. NFC Service

Contains the business logic for verification, including:

- Redis cache management
- Communication with SDM backend
- Coordinating the verification workflow

#### 3. SDM Service

Manages communication with the SDM backend service for cryptographic verification.

#### 4. Storage Service

Handles all database operations with Supabase, including:

- Logging verification attempts
- Updating tag information
- Retrieving redirect URLs

#### 5. Redis Integration

Provides caching for:

- API key validation
- Successful verification results

## Use Cases

### 1. Product Authentication

Verify the authenticity of products by embedding NFC tags and allowing consumers to scan them.

### 2. Access Control

Use NFC tags as access tokens for physical or digital resources.

### 3. Marketing Campaigns

Create interactive marketing experiences where scanning an NFC tag redirects to specific campaign pages.

### 4. Event Ticketing

Validate tickets or credentials at events using NFC tags.

## Integration Points

### 1. Client Applications

Mobile apps or web applications can use the API to verify NFC tags programmatically.

### 2. SDM Backend

External Python service that performs the cryptographic verification of SUM messages.

### 3. Supabase

PostgreSQL database with RESTful API for data persistence.

### 4. Redis

Optional caching layer for improved performance.

## Development and Deployment

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Redis server (optional)
- Supabase account with properly configured tables
- SDM backend service

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `SUPABASE_URL`: URL of your Supabase project
- `SUPABASE_KEY`: Service key for Supabase
- `REDIS_URL`: Redis connection URL (optional)
- `SDM_BACKEND_URL`: URL of the SDM backend service
- `LOG_LEVEL`: Logging level (default: info)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/adaki-nfc.git
cd adaki-nfc

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm start
```

### Docker Deployment

```bash
# Build the image
docker build -t adaki-nfc .

# Run the container
docker run -p 3000:3000 --env-file .env adaki-nfc
```

## Extending the System

The system is designed to be extended in several ways:

1. **Custom Verification Logic**: Modify the NFC service to include additional verification steps.
2. **Additional API Endpoints**: Add new routes for specific use cases.
3. **Analytics Integration**: Connect with analytics platforms to track verification patterns.
4. **Frontend Applications**: Build user interfaces that consume the API.

Frontend applications would typically handle:

- User interfaces for NFC scanning
- Consent flows for additional data collection
- User authentication and authorization
- Displaying verification results
- Any location-based features or user interactions

## Security Considerations

1. **API Keys**: Protect sensitive endpoints with API keys stored in the database.
2. **HTTPS**: Always deploy in production with HTTPS.
3. **Rate Limiting**: Implement rate limiting to prevent abuse.
4. **Input Validation**: Validate all input data to prevent injection attacks.
5. **Error Handling**: Use proper error handling to avoid information leakage.

## Compliance and Privacy

When extending the system, consider:

1. **GDPR Compliance**: Ensure any personal data collection follows GDPR guidelines.
2. **Data Minimization**: Only collect necessary data.
3. **User Consent**: Implement proper consent mechanisms in frontend applications.
4. **Data Retention**: Define and enforce data retention policies.

For location-based features or collecting additional user data, these elements should be implemented in frontend applications with proper consent flows, not directly in this backend service.
