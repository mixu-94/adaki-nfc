# Docker Setup Guide for adaki-nfc

This guide will help you set up and run the adaki-nfc service and its dependencies using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system
- Git repository access for both adaki-nfc and sdm-backend

## Directory Structure

For the docker-compose setup to work, your repositories should be organized as follows:

```
parent-directory/
├── adaki-nfc/         # This repository
└── sdm-backend/       # The SDM backend repository
```

## Setup Steps

### 1. Clone Repositories

```bash
# Create a parent directory
mkdir adaki-services
cd adaki-services

# Clone both repositories
git clone https://github.com/yourusername/adaki-nfc.git
git clone https://github.com/yourusername/sdm-backend.git
```

### 2. Configure Environment Variables

Create a `.env` file in the adaki-nfc directory:

```bash
cd adaki-nfc
cp .env.example .env
```

Edit the `.env` file with your Supabase credentials and other required variables:

```
# Server configuration
PORT=3000
NODE_ENV=production

# Supabase configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key

# Redis configuration - this will be handled by docker-compose
REDIS_URL=redis://redis:6379

# SDM Backend configuration - this will be handled by docker-compose
SDM_BACKEND_URL=http://sdm-backend:5000

# Logging
LOG_LEVEL=info
```

### 3. Build and Run with Docker Compose

From the adaki-nfc directory:

```bash
docker-compose up -d
```

This will:
- Build the adaki-nfc service
- Build the sdm-backend service
- Start a Redis container
- Connect all services to the same network

### 4. Verify Services are Running

```bash
docker-compose ps
```

You should see all three services running:
- adaki-nfc
- sdm-backend
- redis

### 5. View Logs

```bash
# View logs for all services
docker-compose logs

# View logs for a specific service
docker-compose logs adaki-nfc

# Follow logs
docker-compose logs -f
```

## Alternative Setup: SDM Backend as a Submodule

If you prefer to keep the SDM backend code within your adaki-nfc repository, you can set it up as a Git submodule:

```bash
# From the adaki-nfc repository root
git submodule add https://github.com/yourusername/sdm-backend.git sdm-backend
```

Then update the docker-compose.yml file to use the local path:

```yaml
sdm-backend:
  build:
    context: ./sdm-backend  # Local subdirectory instead of sibling
```

## Production Deployment Considerations

For production deployments, consider:

1. Using Docker Swarm or Kubernetes for orchestration
2. Implementing proper secrets management
3. Setting up monitoring and logging
4. Using a more robust Redis configuration with persistence
5. Implementing automated backups

## Troubleshooting

### Services Can't Connect to Each Other

Make sure all services are on the same Docker network. The docker-compose.yml file should create a common network automatically.

### Redis Connection Issues

If adaki-nfc can't connect to Redis, ensure:
- Redis is running
- The REDIS_URL environment variable is correct
- The Redis port is properly exposed

### SDM Backend Connection Issues

If adaki-nfc can't connect to the SDM backend, check:
- The SDM backend is running
- The SDM_BACKEND_URL environment variable is correct
- The SDM backend port is properly exposed

## Stopping Services

```bash
docker-compose down
```

To remove all data (including Redis volumes):

```bash
docker-compose down -v
```
