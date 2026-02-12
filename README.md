# On The Records - Backend API

NestJS backend API for the On The Records music platform.

## Security Features

- **Helmet** - Sets various HTTP headers for security (XSS protection, content policy, etc.)
- **Rate Limiting** - Protection against DDoS and brute force attacks
  - Short: 3 requests per second
  - Medium: 20 requests per 10 seconds
  - Long: 100 requests per minute
  - Auth: 5 login attempts per minute, 3 registrations per 5 minutes
- **CORS** - Configured for frontend origin only
- **Compression** - Gzip compression for responses
- **Validation** - Input validation and sanitization
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Error Handling** - Secure error responses (no sensitive data in production)
- **Request Logging** - All requests logged with sanitized body

## Listening History Feature

The backend supports tracking user listening history:

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/history/update` | Update listening history for a song |
| POST | `/api/history/sync` | Bulk sync history (on tab close) |
| GET | `/api/history` | Get user's listening history |
| GET | `/api/history/stats` | Get user's listening statistics |
| GET | `/api/history/song/:songId` | Get history for specific song |
| POST | `/api/history/songs` | Get history for multiple songs |
| DELETE | `/api/history` | Clear all history |
| DELETE | `/api/history/song/:songId` | Remove specific song from history |

### Data Tracked

- **Play Count** - Number of times user played the song
- **Total Duration** - Total time listened in seconds
- **Last Position** - Playback position for resume
- **Completed** - Whether user listened to >90% of song

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=otr_db

# JWT Configuration
JWT_SECRET=otr-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# App Configuration
PORT=3005
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Cloudflare R2 (untuk upload file - wajib)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=otr-uploads
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### 3. Create database

```bash
createdb otr_db
```

Or using psql:
```sql
CREATE DATABASE otr_db;
```

### 4. Run database migrations

```bash
# Generate migration from entities (first time or after entity changes)
npm run migration:generate -- src/database/migrations/InitialSchema

# Run migrations to create tables
npm run migration:run
```

**Migration Commands:**
- `npm run migration:generate -- src/database/migrations/<MigrationName>` - Generate migration from entity changes
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration

### 5. Seed the database

```bash
npm run seed
```

This will create:
- Admin user: `admin@otr.com` / `admin123`
- Creator user: `creator@otr.com` / `creator123`
- Demo user: `demo@otr.com` / `demo123`
- All genres and moods

## Running the app

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at: `http://localhost:3005`

## Deploy ke Vercel

### Persiapan

1. **Install Vercel CLI** (jika belum):
   ```bash
   npm i -g vercel
   ```

2. **Set Environment Variables** di [Vercel Dashboard](https://vercel.com/dashboard) → Project → Settings → Environment Variables. Tambahkan:
   - `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` (gunakan database eksternal, misal Neon/Supabase)
   - `JWT_SECRET`, `JWT_EXPIRES_IN`
   - `FRONTEND_URL` (URL frontend untuk CORS)
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` (Cloudflare R2 untuk upload)
   - `NODE_ENV=production`

3. **Database**: Jalankan migration di database production (sekali) via CLI atau layanan yang dipakai.

### Deploy

```bash
# Preview deployment
npm run deploy

# Production deployment
npm run deploy:prod
```

Atau dengan Vercel CLI langsung:
```bash
vercel          # preview
vercel --prod   # production
```

### Upload file (Cloudflare R2)

Semua upload file (gambar dan audio) disimpan di **Cloudflare R2**. API mengembalikan URL publik dari R2, sehingga:

- Berfungsi di **Vercel** (serverless) dan di server biasa.
- File persisten dan bisa diakses via URL (r2.dev atau custom domain).

**Setup R2:**

1. Buat bucket di [Cloudflare Dashboard](https://dash.cloudflare.com) → R2 → Create bucket.
2. Buat API token: R2 → Manage R2 API Tokens → Create API token (Object Read & Write).
3. Aktifkan public access di bucket: Settings → Public access → Allow Access (akan dapat URL seperti `https://pub-xxxxx.r2.dev`).
4. Isi variabel di `.env`: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.

## API Documentation

Swagger documentation is available at: `http://localhost:3005/api/docs`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/profile` - Get current user profile
- `GET /api/auth/check` - Check if token is valid

### Songs
- `GET /api/songs` - Get published songs
- `GET /api/songs/admin` - Get all songs (admin)
- `GET /api/songs/pending` - Get pending songs (admin)
- `GET /api/songs/my-songs` - Get current user's songs
- `POST /api/songs` - Upload a new song
- `PATCH /api/songs/:id/approve` - Approve a song (admin)
- `PATCH /api/songs/:id/reject` - Reject a song (admin)

### Albums
- `GET /api/albums` - Get all albums
- `POST /api/albums` - Create an album
- `GET /api/albums/:id` - Get album by ID

### Playlists
- `GET /api/playlists` - Get all playlists
- `POST /api/playlists` - Create a playlist

### Events
- `GET /api/events` - Get all events
- `GET /api/events/upcoming` - Get upcoming events
- `GET /api/events/past` - Get past events

### Genres & Moods
- `GET /api/genres` - Get all genres
- `GET /api/moods` - Get all moods

### Users & Creators
- `GET /api/users` - Get all users (admin)
- `GET /api/creators` - Get all creators
- `GET /api/residents` - Get all residents

### Subscribers
- `POST /api/subscribers/subscribe` - Subscribe to newsletter
- `POST /api/subscribers/unsubscribe` - Unsubscribe

### Products
- `GET /api/products` - Get all products

### Program Schedule
- `GET /api/program` - Get all shows
- `GET /api/program/schedule` - Get weekly schedule

### OTR Picks
- `GET /api/picks` - Get all OTR picks
- `POST /api/picks` - Add content as OTR pick (admin)

### Settings
- `GET /api/settings` - Get all settings (admin)
- `POST /api/settings` - Update settings (admin)

### File Upload
- `POST /api/upload/image` - Upload an image
- `POST /api/upload/audio` - Upload an audio file

## Project Structure

```
src/
├── database/
│   ├── data-source.ts      # TypeORM data source config
│   ├── migrations/         # Database migrations
│   └── seeds/
│       └── seed.ts         # Database seeder
├── entities/               # Database entities
│   ├── user.entity.ts
│   ├── song.entity.ts
│   ├── album.entity.ts
│   ├── playlist.entity.ts
│   ├── genre.entity.ts
│   ├── mood.entity.ts
│   ├── event.entity.ts
│   └── ...
├── modules/                # Feature modules
│   ├── auth/
│   ├── users/
│   ├── songs/
│   ├── albums/
│   ├── playlists/
│   ├── events/
│   ├── genres/
│   ├── moods/
│   ├── creators/
│   ├── residents/
│   ├── subscribers/
│   ├── products/
│   ├── program/
│   ├── picks/
│   ├── settings/
│   └── upload/
├── app.module.ts
└── main.ts
```

## License

UNLICENSED
