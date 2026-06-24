# CMS — Lito Studio

React + Vite admin panel untuk mengelola konten, site, halaman, media, dan token akses.

Berjalan di port **3002** secara default. Semua request `/api/*` di-proxy ke backend (port 3001).

---

## Prasyarat

| Tool | Versi minimum |
|---|---|
| Node.js | 20+ |
| pnpm | 9+ |
| Backend berjalan | `http://localhost:3001` |
| Supabase project | sama dengan yang dipakai backend |

---

## Setup pertama kali

```bash
# 1. Install dependensi dari root monorepo
pnpm install

# 2. Masuk ke direktori CMS
cd apps/cms

# 3. Salin file env
cp .env.example .env
```

Isi `.env`:

```env
# URL backend — kosongkan di dev (proxy Vite otomatis forward ke localhost:3001)
VITE_API_URL=

# Google OAuth Client ID
# Dari: https://console.cloud.google.com → Credentials → OAuth 2.0 Client IDs
REACT_OAUTH_CLIENT_ID=<your-google-oauth-client-id>
```

> **Dev mode:** Jika `VITE_API_URL` dikosongkan, Vite proxy semua `/api/*` ke `http://localhost:3001` secara otomatis — tidak ada CORS issue.

---

## Konfigurasi Google OAuth (opsional tapi direkomendasikan)

1. Buka [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Buat OAuth 2.0 Client ID (type: Web application)
3. Tambahkan Authorized redirect URIs:
   - `http://localhost:3001/api/v1/auth/callback` (dev)
   - `https://api.litostudio.id/api/v1/auth/callback` (production)
4. Copy Client ID ke `REACT_OAUTH_CLIENT_ID`
5. Pastikan `REACT_OAUTH_CLIENT_ID` di backend `.env` juga diisi nilai yang sama

---

## Menjalankan CMS

```bash
# Pastikan backend sudah berjalan dulu di port 3001
# lalu:
pnpm dev
```

CMS: `http://localhost:3002`

```bash
# Build production
pnpm build

# Preview build
pnpm preview

# Type check
pnpm typecheck

# Test
pnpm test
```

---

## Login pertama kali

### Via email + password

1. Buka `http://localhost:3002`
2. Klik "Sign up" dan buat akun baru
3. Atau jalankan seed script untuk membuat akun dev:
   ```bash
   cd apps/backend
   npx tsx scripts/seed-dev-user.ts
   # Default: admin@litostudio.id / password123
   ```

### Via Google OAuth

1. Pastikan `REACT_OAUTH_CLIENT_ID` diisi di `.env` CMS
2. Pastikan backend sudah dikonfigurasi dengan `CORS_ORIGIN` yang mencakup `http://localhost:3002`
3. Klik "Continue with Google" di halaman login

---

## Membuat organisasi dan site

Setelah login pertama kali:

1. **Buat organisasi** → klik "Create Organization"
2. **Site otomatis dibuat** bersamaan dengan organisasi
3. **Site token otomatis digenerate** dan tercatat di log backend:
   ```
   ✅ Site token auto-generated. Copy it from CMS → Sites → Tokens
   ```
4. Buka **Sites → [nama site] → Tokens** untuk melihat dan menyalin token

---

## Mengelola Site Token

Site token dipakai oleh website (Nuxt) untuk mengakses public API.

**Lokasi di CMS:** Sites → [pilih site] → Tokens

| Aksi | Keterangan |
|---|---|
| Lihat token | Tampil prefix saja (raw token hanya muncul sekali saat dibuat) |
| Buat token baru | Klik "New Token" — raw token muncul sekali, copy segera |
| Revoke token | Klik ikon revoke — token langsung tidak valid |

Setelah membuat token, salin nilai raw token ke `.env` website:

```env
# apps/website/.env
NUXT_PUBLIC_ACCESS_TOKEN=<raw-token-dari-cms>
```

---

## Proxy Vite (dev mode)

File `vite.config.ts` sudah mengkonfigurasi proxy:

```ts
proxy: {
  '/api': {
    target: process.env.VITE_API_URL ?? 'http://localhost:3001',
    changeOrigin: true,
  },
}
```

Artinya semua request dari CMS ke `/api/*` diteruskan ke backend secara otomatis. Tidak perlu konfigurasi tambahan saat development.

---

## Environment variables

| Variable | Wajib | Default | Keterangan |
|---|---|---|---|
| `VITE_API_URL` | tidak | `http://localhost:3001` | URL backend — kosongkan di dev (pakai Vite proxy) |
| `REACT_OAUTH_CLIENT_ID` | tidak | — | Google OAuth Client ID |

---

## Troubleshooting

**Halaman kosong / tidak bisa login**
Pastikan backend berjalan di port 3001 sebelum membuka CMS.

**`Network Error` saat login**
Cek apakah `VITE_API_URL` sudah benar. Di dev, kosongkan saja agar pakai Vite proxy.

**Google OAuth redirect error**
Pastikan `CMS_ORIGIN=http://localhost:3002` di `.env` backend dan redirect URI sudah terdaftar di Google Cloud Console.

**Tidak bisa upload media**
Cek `MEDIA_PROVIDER` dan konfigurasi storage di `.env` backend. Untuk Supabase Storage, buat bucket `media` di Supabase Dashboard → Storage.

**Token tidak muncul**
Raw token hanya ditampilkan sekali saat dibuat. Jika terlewat, buat token baru dan revoke yang lama.
