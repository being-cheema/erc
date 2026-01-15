# Erode Runners Club - Complete Self-Hosting Migration Guide

This comprehensive guide explains how to migrate the Erode Runners Club app from Lovable Cloud to a fully self-hosted environment with zero dependencies on Lovable infrastructure.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Export](#2-project-export)
3. [Local Development Setup](#3-local-development-setup)
4. [Database Migration](#4-database-migration)
5. [Backend API Setup](#5-backend-api-setup)
6. [Frontend Configuration](#6-frontend-configuration)
7. [Strava OAuth Configuration](#7-strava-oauth-configuration)
8. [Deployment Options](#8-deployment-options)
9. [Mobile App Build & Release](#9-mobile-app-build--release)
10. [Maintenance & Updates](#10-maintenance--updates)

---

## 1. Prerequisites

### Required Software
- **Node.js 18+** - JavaScript runtime
- **PostgreSQL 15+** - Database server
- **Git** - Version control
- **Docker & Docker Compose** (recommended) - Container deployment

### For Mobile Development
- **Android Studio** - For Android builds (any OS)
- **Xcode 15+** - For iOS builds (macOS only)
- **Java JDK 17** - Required for Android builds

### Accounts Needed
- **Strava Developer Account** - https://developers.strava.com
- **Apple Developer Account** ($99/year) - For iOS App Store
- **Google Play Developer Account** ($25 one-time) - For Play Store

---

## 2. Project Export

### 2.1 Export from Lovable
1. Open your project in Lovable
2. Click **"Export to GitHub"** button
3. Choose your GitHub account and repository name
4. Wait for export to complete

### 2.2 Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/erode-runners-club.git
cd erode-runners-club
```

### 2.3 Project Structure Overview
```
erode-runners-club/
├── src/                    # React frontend source
├── public/                 # Static assets
├── supabase/
│   ├── functions/          # Edge functions (need conversion)
│   └── migrations/         # Database migrations
├── capacitor.config.ts     # Mobile app configuration
├── package.json
└── vite.config.ts
```

---

## 3. Local Development Setup

### 3.1 Install Dependencies
```bash
npm install
```

### 3.2 Add Native Platforms
```bash
# Add Android
npx cap add android

# Add iOS (Mac only)
npx cap add ios
```

### 3.3 Build and Sync
```bash
npm run build
npx cap sync
```

### 3.4 Run on Device/Emulator
```bash
# Android
npx cap run android

# iOS (requires Mac with Xcode)
npx cap run ios

# Open in IDE for debugging
npx cap open android
npx cap open ios
```

---

## 4. Database Migration

### Option A: Use Supabase (Easiest)

If you want to keep using Supabase but with your own account:

1. Create account at https://supabase.com
2. Create new project
3. Go to **Settings > Database** and note connection string
4. Apply migrations:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply all migrations
supabase db push
```

5. Go to **Settings > API** and copy:
   - Project URL
   - Anon/Public Key
   - Service Role Key (for edge functions)

### Option B: Self-Hosted PostgreSQL

#### Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Create Database
```bash
sudo -u postgres psql

-- In PostgreSQL shell:
CREATE USER erode_runners WITH PASSWORD 'your-secure-password-here';
CREATE DATABASE erode_runners OWNER erode_runners;
GRANT ALL PRIVILEGES ON DATABASE erode_runners TO erode_runners;
\q
```

#### Apply Migrations

Find all migration files in `supabase/migrations/` and apply them in order:

```bash
# Connect to database
psql -U erode_runners -d erode_runners -h localhost

# Apply each migration file in order
\i supabase/migrations/20240101000000_initial.sql
\i supabase/migrations/20240102000000_add_activities.sql
# ... continue for all migration files
```

#### Database Schema Reference

Key tables created by migrations:
- `profiles` - User profiles with Strava tokens
- `activities` - Synced running activities
- `achievements` - Badge definitions
- `user_achievements` - Unlocked badges per user
- `monthly_leaderboard` - Monthly rankings
- `races` - Upcoming race events
- `training_plans` - Training programs

---

## 5. Backend API Setup

The Lovable Edge Functions need to be converted to a standalone Express.js server.

### 5.1 Create Server Directory

```bash
mkdir -p server/src/routes
mkdir -p server/src/lib
```

### 5.2 Server Package.json

Create `server/package.json`:
```json
{
  "name": "erode-runners-api",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/pg": "^8.10.9",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

### 5.3 TypeScript Configuration

Create `server/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

### 5.4 Main Server Entry Point

Create `server/src/index.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { stravaAuthRouter } from './routes/strava-auth.js';
import { syncStravaRouter } from './routes/sync-strava.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes (replaces Supabase Edge Functions)
app.use('/functions/v1/strava-auth', stravaAuthRouter);
app.use('/functions/v1/sync-strava', syncStravaRouter);

app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
});
```

### 5.5 Database Connection

Create `server/src/lib/db.ts`:
```typescript
import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}
```

### 5.6 Strava Auth Route

Create `server/src/routes/strava-auth.ts`:
```typescript
import { Router } from 'express';
import { query } from '../lib/db.js';
import jwt from 'jsonwebtoken';

export const stravaAuthRouter = Router();

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET!;

// Generate Strava authorization URL
stravaAuthRouter.get('/authorize', (req, res) => {
  const redirectUri = `${FRONTEND_URL}/strava-callback`;
  const scope = 'read,activity:read_all,profile:read_all';
  
  const authUrl = `https://www.strava.com/oauth/authorize?` +
    `client_id=${STRAVA_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${scope}`;
  
  res.json({ url: authUrl });
});

// Exchange code for tokens
stravaAuthRouter.post('/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    // Exchange code for Strava tokens
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code');
    }
    
    const tokenData = await tokenResponse.json();
    const { athlete, access_token, refresh_token, expires_at } = tokenData;
    
    // Upsert user profile
    const result = await query(`
      INSERT INTO profiles (
        user_id, strava_id, display_name, avatar_url, city, country,
        strava_access_token, strava_refresh_token, strava_token_expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (strava_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url,
        strava_access_token = EXCLUDED.strava_access_token,
        strava_refresh_token = EXCLUDED.strava_refresh_token,
        strava_token_expires_at = EXCLUDED.strava_token_expires_at,
        updated_at = NOW()
      RETURNING *
    `, [
      athlete.id.toString(),
      athlete.id.toString(),
      `${athlete.firstname} ${athlete.lastname}`,
      athlete.profile,
      athlete.city,
      athlete.country,
      access_token,
      refresh_token,
      new Date(expires_at * 1000).toISOString(),
    ]);
    
    const profile = result.rows[0];
    
    // Generate JWT session token
    const sessionToken = jwt.sign(
      { userId: profile.user_id, stravaId: profile.strava_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      session: { access_token: sessionToken },
      profile,
    });
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Refresh Strava token
stravaAuthRouter.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});
```

### 5.7 Sync Strava Route

Create `server/src/routes/sync-strava.ts`:
```typescript
import { Router } from 'express';
import { query } from '../lib/db.js';

export const syncStravaRouter = Router();

// Sync activities from Strava
syncStravaRouter.post('/', async (req, res) => {
  try {
    const { user_id, access_token, full_sync } = req.body;
    
    // Get user's last sync time
    const profileResult = await query(
      'SELECT last_synced_at FROM profiles WHERE user_id = $1',
      [user_id]
    );
    
    const lastSyncedAt = profileResult.rows[0]?.last_synced_at;
    const after = full_sync ? 0 : (lastSyncedAt ? Math.floor(new Date(lastSyncedAt).getTime() / 1000) : 0);
    
    // Fetch activities from Strava
    let page = 1;
    let allActivities: any[] = [];
    const perPage = 100;
    
    while (true) {
      const url = `https://www.strava.com/api/v3/athlete/activities?after=${after}&page=${page}&per_page=${perPage}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      
      if (!response.ok) break;
      
      const activities = await response.json();
      if (activities.length === 0) break;
      
      allActivities = allActivities.concat(activities);
      if (activities.length < perPage) break;
      page++;
    }
    
    // Batch upsert activities
    const BATCH_SIZE = 100;
    for (let i = 0; i < allActivities.length; i += BATCH_SIZE) {
      const batch = allActivities.slice(i, i + BATCH_SIZE);
      
      for (const activity of batch) {
        await query(`
          INSERT INTO activities (
            user_id, strava_id, name, activity_type, distance, moving_time,
            elapsed_time, elevation_gain, start_date, average_speed, max_speed,
            average_heartrate, max_heartrate, calories, kudos_count,
            achievement_count, workout_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (strava_id) DO UPDATE SET
            name = EXCLUDED.name,
            distance = EXCLUDED.distance,
            moving_time = EXCLUDED.moving_time,
            kudos_count = EXCLUDED.kudos_count,
            updated_at = NOW()
        `, [
          user_id,
          activity.id,
          activity.name,
          activity.type,
          activity.distance,
          Math.round(activity.moving_time),
          Math.round(activity.elapsed_time),
          activity.total_elevation_gain,
          activity.start_date,
          activity.average_speed,
          activity.max_speed,
          activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
          activity.max_heartrate ? Math.round(activity.max_heartrate) : null,
          activity.calories ? Math.round(activity.calories) : null,
          activity.kudos_count || 0,
          activity.achievement_count || 0,
          activity.workout_type,
        ]);
      }
    }
    
    // Update last synced timestamp
    await query(
      'UPDATE profiles SET last_synced_at = NOW() WHERE user_id = $1',
      [user_id]
    );
    
    res.json({
      success: true,
      synced_count: allActivities.length,
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});
```

### 5.8 Environment Variables

Create `server/.env`:
```env
# Database
DATABASE_URL=postgres://erode_runners:your-password@localhost:5432/erode_runners

# Strava OAuth
STRAVA_CLIENT_ID=168531
STRAVA_CLIENT_SECRET=your-strava-client-secret

# Authentication
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 5.9 Install and Run Server

```bash
cd server
npm install
npm run dev
```

---

## 6. Frontend Configuration

### 6.1 Create Production Environment

Create `.env.production` in project root:
```env
VITE_SUPABASE_URL=https://api.your-domain.com
VITE_SUPABASE_PUBLISHABLE_KEY=not-used-in-self-hosted
VITE_SUPABASE_PROJECT_ID=self-hosted
```

### 6.2 Create Custom Supabase Client

Since you're replacing Supabase with your own API, create a wrapper:

Create `src/lib/api-client.ts`:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async fetch(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.getToken()) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.getToken()}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  // Strava Auth
  async getStravaAuthUrl() {
    return this.fetch('/functions/v1/strava-auth/authorize');
  }

  async exchangeStravaCode(code: string) {
    return this.fetch('/functions/v1/strava-auth/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // Activities
  async syncActivities(userId: string, accessToken: string, fullSync = false) {
    return this.fetch('/functions/v1/sync-strava', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        access_token: accessToken,
        full_sync: fullSync,
      }),
    });
  }
}

export const apiClient = new ApiClient();
```

### 6.3 Update Capacitor Config for Self-Hosted

Edit `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'com.eroderunners.app',
  appName: 'Erode Runners Club',
  webDir: 'dist',
  server: {
    url: 'https://app.your-domain.com', // Your self-hosted frontend
    cleartext: false,
  },
  // ... rest of config
};
```

---

## 7. Strava OAuth Configuration

### 7.1 Update Strava App Settings

1. Go to https://www.strava.com/settings/api
2. Update **Authorization Callback Domain** to: `your-domain.com`
3. Note your **Client ID** and **Client Secret**

### 7.2 Environment Variables

Ensure these are set in your server:
```env
STRAVA_CLIENT_ID=168531
STRAVA_CLIENT_SECRET=your-actual-secret
```

---

## 8. Deployment Options

### Option A: Docker Compose (Recommended)

Create `docker-compose.yml` in project root:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: erode_runners
      POSTGRES_USER: erode_runners
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U erode_runners"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: ./server
    restart: always
    environment:
      DATABASE_URL: postgres://erode_runners:${DB_PASSWORD}@postgres:5432/erode_runners
      STRAVA_CLIENT_ID: ${STRAVA_CLIENT_ID}
      STRAVA_CLIENT_SECRET: ${STRAVA_CLIENT_SECRET}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
      FRONTEND_URL: https://app.${DOMAIN}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy

  web:
    build: .
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - api

volumes:
  postgres_data:
```

Create `.env` for Docker:
```env
DB_PASSWORD=your-secure-database-password
STRAVA_CLIENT_ID=168531
STRAVA_CLIENT_SECRET=your-strava-secret
JWT_SECRET=your-jwt-secret-at-least-32-characters
DOMAIN=your-domain.com
```

### Dockerfile for API

Create `server/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

### Dockerfile for Frontend

Create `Dockerfile` in project root:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

Create `nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        listen [::]:80;
        server_name app.your-domain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name app.your-domain.com;

        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

        # Frontend
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # API Proxy
        location /functions/v1/ {
            proxy_pass http://api:3001/functions/v1/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### Deploy Commands

```bash
# Get SSL certificate
sudo apt install certbot
sudo certbot certonly --standalone -d app.your-domain.com

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Rebuild after changes
docker-compose up -d --build
```

### Option B: Traditional VPS Deployment

1. **Install dependencies on server:**
```bash
sudo apt update
sudo apt install nginx postgresql nodejs npm certbot python3-certbot-nginx
```

2. **Set up database** (see Section 4)

3. **Deploy API:**
```bash
cd /var/www/erode-runners-api
git clone your-repo .
cd server
npm install
npm run build
# Use PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name erode-api
pm2 save
pm2 startup
```

4. **Deploy frontend:**
```bash
cd /var/www/erode-runners-web
git clone your-repo .
npm install
npm run build
# Copy dist to nginx
sudo cp -r dist/* /var/www/html/
```

5. **Configure Nginx** (similar to above)

6. **Get SSL:**
```bash
sudo certbot --nginx -d app.your-domain.com
```

---

## 9. Mobile App Build & Release

### 9.1 Update Capacitor Config

Ensure `capacitor.config.ts` points to your production server:
```typescript
server: {
  url: 'https://app.your-domain.com',
  cleartext: false,
}
```

### 9.2 Generate App Icons & Splash Screens

1. Create assets:
   - `resources/icon.png` - 1024x1024px app icon
   - `resources/splash.png` - 2732x2732px splash screen

2. Generate platform assets:
```bash
npm install -D @capacitor/assets
npx capacitor-assets generate
```

### 9.3 Android Build

```bash
# Build web app
npm run build

# Sync to Android
npx cap sync android

# Generate signed APK
cd android

# Create keystore (first time only)
keytool -genkey -v -keystore erode-runners.keystore \
  -alias erode-runners -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

### 9.4 iOS Build

```bash
# Build web app
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

In Xcode:
1. Set up signing with your Apple Developer account
2. Select **Product > Archive**
3. **Distribute App** > **App Store Connect**
4. Upload to App Store Connect

### 9.5 Play Store Submission

1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app
3. Fill in store listing details
4. Upload APK to **Production** track
5. Submit for review

### 9.6 App Store Submission

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app
3. Fill in app information
4. Select build from uploaded archives
5. Submit for review

---

## 10. Maintenance & Updates

### 10.1 Updating the App

```bash
# Pull latest changes
git pull

# Rebuild
npm run build
npx cap sync

# For Android
cd android && ./gradlew assembleRelease

# For iOS
npx cap open ios
# Archive and upload in Xcode
```

### 10.2 Database Migrations

When schema changes are needed:

```bash
# Create migration file
touch migrations/$(date +%Y%m%d%H%M%S)_description.sql

# Edit migration file with SQL changes

# Apply to production
psql -U erode_runners -d erode_runners -f migrations/new_migration.sql
```

### 10.3 Monitoring

Set up monitoring with:
- **Uptime Robot** - Free uptime monitoring
- **Sentry** - Error tracking
- **Grafana + Prometheus** - Metrics (advanced)

### 10.4 Backups

```bash
# Daily database backup (add to cron)
pg_dump -U erode_runners erode_runners > /backups/db_$(date +%Y%m%d).sql

# Compress old backups
find /backups -name "*.sql" -mtime +7 -exec gzip {} \;

# Delete backups older than 30 days
find /backups -name "*.sql.gz" -mtime +30 -delete
```

---

## Quick Reference

| Component | Lovable Cloud | Self-Hosted |
|-----------|--------------|-------------|
| Database | Supabase | PostgreSQL |
| Auth | Supabase Auth | JWT + bcrypt |
| Edge Functions | Supabase Functions | Express.js API |
| File Storage | Supabase Storage | S3/Cloudflare R2 |
| Hosting | Lovable CDN | Nginx/Docker |
| SSL | Automatic | Let's Encrypt |

---

## Support & Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Express.js Docs**: https://expressjs.com/
- **Docker Docs**: https://docs.docker.com/
- **Strava API Docs**: https://developers.strava.com/docs/

---

*Last updated: January 2026*
