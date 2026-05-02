# Readeck Favorites Atom Feed Generator
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)]

Generate an Atom feed from your [Readeck](https://codeberg.org/readeck/readeck) favorited bookmarks.

## Features

- Generates a valid Atom feed from your Readeck favorites
- Direct links to source articles
- Intelligent caching to minimize API calls
- Docker and Docker Compose support
- Comprehensive unit tests
- Published date = when you favorited (not original article date)

## Prerequisites

- Node.js 18+ or Docker
- A [Readeck](https://codeberg.org/readeck/readeck) instance
- An API token from your Readeck instance

## Quick Start

### Local Development

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file from template:**
   ```bash
   cp .env.example .env
   ```

3. **Configure your Readeck API token:**
   ```bash
   # Edit .env and set READECK_TOKEN
   READECK_TOKEN=your-api-token-here
   READECK_URL=http://your-readeck-instance/api
   ```

4. **Run in development mode:**
   ```bash
   npm run dev
   ```

5. **Access the feed:**
   ```
   http://localhost:3000/feed.atom
   ```

### Docker Compose (Recommended)

1. **Clone repository:**
   ```bash
   cd readeck-fav-feed
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables in `.env`:**
   ```env
   READECK_TOKEN=your-api-token
   READECK_URL=http://readeck:8000/api  # or your instance URL
   PORT=3000
   CACHE_TTL_SECONDS=300
   ```

4. **Start the service:**
   ```bash
   docker-compose up -d
   ```

5. **View logs:**
   ```bash
   docker-compose logs -f readeck-feed
   ```

6. **Access the feed:**
   ```
   http://localhost:3000/feed.atom
   ```

### Docker (Manual)

```bash
# Build image
docker build -t readeck-feed .

# Run container
docker run \
  -e READECK_TOKEN=your-api-token \
  -e READECK_URL=http://readeck-instance/api \
  -p 3000:3000 \
  readeck-feed
```

## Configuration

All configuration is via environment variables. See `.env.example` for available options.

### Required

- **`READECK_TOKEN`** - Your Readeck API bearer token
  - Generate at: `https://your-readeck-instance/profile/tokens`

### Optional

- **`READECK_URL`** - Readeck API URL (default: `http://localhost:8000/api`)
- **`PORT`** - Server port (default: `3000`)
- **`CACHE_TTL_SECONDS`** - Feed cache TTL in seconds (default: `300`)
- **`FEED_TITLE`** - Feed title (default: `My Readeck Favourites`)
- **`FEED_DESCRIPTION`** - Feed description (default: `A feed of my bookmarked articles from Readeck`)
- **`FEED_LINK`** - Feed link/homepage (default: `https://readeck.local`)

## API Endpoints

### `GET /feed.atom`

Returns an Atom 1.0 feed of your marked bookmarks.

**Response Headers:**
- `Content-Type: application/atom+xml; charset=utf-8`
- `X-Cache: HIT | MISS | STALE` - Cache status

**Caching:**
- Responses are cached for `CACHE_TTL_SECONDS`
- Cache can serve stale content if the API is temporarily unavailable
- Each request checks the cache first before calling Readeck API

**Example:**
```bash
curl http://localhost:3000/feed.atom
```

### `GET /health`

Health check endpoint for container orchestration.

**Response:**
```json
{ "status": "ok" }
```
