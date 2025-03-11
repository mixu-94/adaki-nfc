# adaki-nfc

A dedicated backend service for secure NFC tag verification using SUM messages.

## Project Overview

adaki-nfc is a secure, dedicated backend service that verifies NFC tags by communicating with a separate Python-based sdm-backend. The service logs verification data to Supabase for analytics and tracking, and provides a secure API for consumption by a separate bonus application.

### Architecture

```
┌─────────────────┐     ┌───────────────┐     ┌──────────────┐
│                 │     │               │     │              │
│  Bonus App      │────▶│  adaki-nfc    │────▶│  sdm-backend │
│  (Separate App) │     │  (Node.js/TS) │     │  (Python)    │
│                 │     │               │     │              │
└─────────────────┘     └───────┬───────┘     └──────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │               │
                        │   Supabase    │
                        │   Database    │
                        │               │
                        └───────────────┘
```

## Features

- **Secure NFC Verification**: Verify NFC tags via SUM message decoding
- **Data Logging**: Store verification results in Supabase
- **API Key Authentication**: Secure API access with API key authentication
- **Rate Limiting**: Prevent abuse with configurable rate limiting
- **Tag Statistics**: Track tag usage and verification attempts
- **Docker Support**: Easy deployment with Docker and Docker Compose

## Tech Stack

- **Node.js**: Server runtime environment
- **TypeScript**: Type-safe development
- **Express.js**: Web framework
- **Supabase**: Data storage and analytics
- **Redis**: Caching (optional)
- **Docker**: Containerization
- **Jest**: Testing

## Prerequisites

- Node.js 18 or later
- npm or yarn
- Supabase account and project
- Redis (optional, for rate limiting)
- sdm-backend service (for verification)

## Installation

### Local Development

1. Clone the repository

   ```bash
   git clone https://github.com/your-username/adaki-nfc.git
   cd adaki-nfc
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`)

   ```bash
   cp .env.example .env
   # Edit .env to add your configuration
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

### Docker

1. Using Docker Compose for development

   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. For production

   ```bash
   # Build the Docker image
   docker build -t adaki-nfc:latest .

   # Run the container
   docker run -p 3000:3000 --env-file .env adaki-nfc:latest
   ```

## Environment Variables

| Variable               | Description                            | Default                  |
| ---------------------- | -------------------------------------- | ------------------------ |
| `PORT`                 | Server port                            | `3000`                   |
| `NODE_ENV`             | Environment (development/production)   | `development`            |
| `ALLOWED_ORIGINS`      | CORS allowed origins (comma-separated) | `*`                      |
| `SUPABASE_URL`         | Supabase project URL                   | Required                 |
| `SUPABASE_SERVICE_KEY` | Supabase service key                   | Required                 |
| `SDM_BACKEND_URL`      | SDM backend service URL                | `http://localhost:3001`  |
| `REDIS_URL`            | Redis URL (optional)                   | `redis://localhost:6379` |

## Database Setup

Before running the application, set up the Supabase database with the following schema:

```sql
-- Tags table to store information about verified tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_id TEXT UNIQUE NOT NULL,
  first_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verification_count INTEGER DEFAULT 1
);

-- Verifications table to log all verification attempts
CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_id TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys for client authentication
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_verifications_tag_id ON verifications(tag_id);
CREATE INDEX idx_verifications_created_at ON verifications(created_at);
CREATE INDEX idx_api_keys_key ON api_keys(key);
```

## API Documentation

See [API Documentation](src/docs/api.md) for details on available endpoints.

## Development

### Project Structure

```
src/
├── config/                # Configuration files
│   ├── supabase.ts        # Supabase client setup
│   ├── redis.ts           # Redis cache configuration
│   └── app.ts             # App configuration
├── controllers/           # API controllers
│   ├── auth.controller.ts # Authentication controller
│   └── nfc.controller.ts  # NFC verification controller
├── middleware/            # Express middlewares
│   ├── auth.middleware.ts # API key validation
│   ├── rate-limit.ts      # Rate limiting for security
│   └── error.middleware.ts# Error handling
├── services/              # Business logic
│   ├── auth.service.ts    # Authentication service
│   ├── nfc.service.ts     # NFC verification service
│   ├── sdm.service.ts     # SDM backend integration service
│   └── storage.service.ts # Supabase storage service
├── utils/                 # Helper functions
│   ├── logger.ts          # Logging utility
│   ├── crypto.ts          # Cryptography functions
│   └── validation.ts      # Input validation
├── types/                 # TypeScript type definitions
│   ├── nfc.types.ts       # NFC-related types
│   └── auth.types.ts      # Authentication types
├── routes/                # API routes
│   ├── auth.routes.ts     # Authentication routes
│   └── nfc.routes.ts      # NFC verification routes
├── tests/                 # Test files
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── docs/                  # Documentation files
│   └── api.md             # API documentation
└── app.ts                 # Main application file
```

### Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

## Security Considerations

- API keys should be kept secure and rotated regularly
- Use HTTPS in production
- Rate limiting prevents abuse
- API keys can be revoked if compromised
- Logs provide audit trail for all verification attempts

## License

This project is licensed under the MIT License - see the LICENSE file for details.
