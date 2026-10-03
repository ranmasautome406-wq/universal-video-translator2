# 🌐 Universal Video Translator

*Watch any video. Understand any language.*

Upload a video, detect its spoken language, translate the speech, generate subtitles, and optionally create a dubbed voice track. Works fully **without paid AI APIs** in Demo Mode, and is structured so Whisper, DeepL/LLM translation and ElevenLabs can be connected later.

## Features

- Upload (drag & drop) with thumbnail, size, duration, replace/remove, and server-side validation
- Source language (Auto Detect) and one or **many** target languages (22 languages, popular first)
- Modes: Subtitles Only, Voice Translation, Subtitles + Voice; 4 voice styles
- Live processing screen (8 steps, progress bar, time remaining, one card per language)
- Result page: custom player (play/pause/seek/volume/fullscreen/subtitle toggle), downloads for video, SRT, VTT, audio
- Subtitle editor (edit text and timing, add/delete, save)
- Before/after comparison slider
- Dashboard (stats, project cards, delete) and Admin panel (users, jobs, logs, limits, system status)
- JWT auth, bcrypt, rate limiting, helmet, CORS allow-list, safe random upload filenames
- Demo Mode with clear "Demo data" labels

## Tech stack

React + Vite, Tailwind CSS, Lucide icons · Node.js + Express · SQLite (better-sqlite3) · JWT · Multer · FFmpeg

## Folder structure

```
universal-video-translator/
├── package.json              # convenience scripts
├── README.md
├── backend/
│   ├── server.js
│   ├── .env.example
│   ├── routes/               # auth, videos, translate, subtitles, download, admin
│   ├── middleware/           # auth (JWT), upload (Multer)
│   ├── services/
│   │   ├── speechToText.js   # provider: openai (Whisper)
│   │   ├── translation.js    # providers: openai, deepl
│   │   ├── textToSpeech.js   # provider: elevenlabs
│   │   ├── videoProcessor.js # FFmpeg utilities
│   │   ├── jobRunner.js      # pipeline + demo simulation
│   │   └── demoData.js
│   ├── utils/                # config, db, languages, subtitles (SRT/VTT)
│   ├── scripts/make-admin.js
│   ├── uploads/  outputs/  data/   # created at runtime
└── frontend/
    ├── index.html, vite.config.js, tailwind.config.js
    └── src/  App.jsx, main.jsx, components/, pages/, layouts/, services/, hooks/, utils/, config/
```

## Requirements

- Node.js **18 or newer** (`node -v`)
- FFmpeg + FFprobe (only needed for real mode; Demo Mode runs without it)

## Quick start (Demo Mode)

```bash
cd universal-video-translator
npm run install:all

cd backend
cp .env.example .env
# open .env and set JWT_SECRET to a long random string, e.g. output of:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run in **two terminals**:

```bash
# Terminal 1 - backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 - frontend (http://localhost:5173)
cd frontend && npm run dev
```

Open http://localhost:5173, register, then go to **Translate**. Windows PowerShell: use `copy .env.example .env` instead of `cp`.

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev        # auto-restarts on change
npm start          # plain start
```

Check it: http://localhost:5000/api/health should return `{"status":"ok", ...}`.

### Make yourself an admin

Either set `ADMIN_EMAIL=you@example.com` in `.env` *before* registering with that email, or promote an existing account:

```bash
cd backend && npm run make-admin -- you@example.com
```

## Frontend setup

```bash
cd frontend
npm install
npm run dev        # dev server with /api proxied to localhost:5000
npm run build      # production build into frontend/dist
```

`frontend/.env.example` has `VITE_API_URL`. Leave it empty in development.

## Environment variables (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | 5000 | API port |
| `CLIENT_ORIGIN` | http://localhost:5173 | Allowed CORS origin(s), comma-separated |
| `JWT_SECRET` | *(required)* | Min 16 chars; server refuses to start without it |
| `JWT_EXPIRES_IN` | 7d | Token lifetime |
| `ADMIN_EMAIL` | – | Account registered with this email becomes admin |
| `DEMO_MODE` | true | `true` = simulated pipeline, no keys needed |
| `DEMO_STEP_MS` | 1500 | Duration of each simulated step |
| `MAX_FILE_MB` | 500 | Upload limit |
| `RETENTION_DAYS` | 30 | Files older than this are deleted hourly |
| `FFMPEG_PATH` / `FFPROBE_PATH` | ffmpeg / ffprobe | Set full paths if not on PATH |
| `DB_PATH` | ./data/app.db | SQLite file |
| `STT_PROVIDER` | openai | Speech-to-text provider |
| `TRANSLATION_PROVIDER` | openai | `openai` or `deepl` |
| `TTS_PROVIDER` | elevenlabs | Text-to-speech provider |
| `OPENAI_API_KEY`, `OPENAI_TRANSLATION_MODEL` | – / gpt-4o-mini | Whisper + LLM translation |
| `DEEPL_API_KEY` | – | DeepL (keys ending `:fx` use the free endpoint) |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | – | Voice dubbing |

Never commit `.env`. Keys are read only on the server.

## FFmpeg installation

Check with `ffmpeg -version` and `ffprobe -version` (FFmpeg 4.4+ recommended). The admin panel shows whether the server found it.

**Windows**
```powershell
winget install Gyan.FFmpeg
# or: choco install ffmpeg
```
Open a new terminal afterwards. If it is still not found, set `FFMPEG_PATH` and `FFPROBE_PATH` in `.env` to the full `.exe` paths.

**Ubuntu / Debian**
```bash
sudo apt update && sudo apt install -y ffmpeg
```

**macOS**
```bash
brew install ffmpeg
```

**Android (Termux)**
```bash
pkg update && pkg upgrade
pkg install nodejs-lts ffmpeg git python make clang
```
`better-sqlite3` compiles a native module. If `npm install` fails on Termux, try:
```bash
mkdir -p ~/.gyp && echo "{'variables':{'android_ndk_path':''}}" > ~/.gyp/include.gypi
cd backend && npm install
```
Demo Mode is the practical choice on a phone; real processing is slow and memory-hungry there.

## Database setup

Nothing to do. SQLite creates `backend/data/app.db` and all tables (users, videos, jobs, subtitles, usage, settings, logs) on first start. Back it up by copying that file. Passwords are stored as bcrypt hashes.

## Demo Mode

`DEMO_MODE=true` (the default) simulates the 8 processing steps with live progress, creates sample subtitles (full sample text for Hindi, Marathi, Spanish, French, Japanese; other languages show labelled placeholder text), and lets you use the whole workflow. Everything is labelled **Demo data**. The "translated video" is your original file; audio download is disabled because no TTS runs.

Voice modes need a **Pro** plan (or admin). Change a user's plan in **Admin → Users**.

## Connecting real AI APIs

1. Install FFmpeg (above).
2. In `backend/.env` set `DEMO_MODE=false` and add keys:
   ```
   OPENAI_API_KEY=sk-...          # Whisper speech-to-text + LLM translation
   # optional: TRANSLATION_PROVIDER=deepl and DEEPL_API_KEY=...
   # voice dubbing:
   ELEVENLABS_API_KEY=...
   ELEVENLABS_VOICE_ID=...
   ```
3. Restart the backend. If a key is missing, the API answers with a clear "requires API configuration" message instead of failing midway.

Pipeline: `FFmpeg extract audio → speechToText() → translation() → textToSpeech() → buildDubTrack() → exportVideo()`.

**Add another provider:** each service file has a `providers` object. Add a function with the same signature (see the comments at the top of each file), then select it with the matching `*_PROVIDER` variable. Nothing else changes.

Known limits of the real pipeline:
- Audio is sent to Whisper as 48 kbps mono MP3 (~0.36 MB/min), so the 25 MB API cap allows roughly 65 minutes. Longer videos need chunking.
- Dubbing places each clip at its subtitle start time; it does not time-stretch speech, so long translations can overlap the next line.
- The dubbed track uses a single voice (`ELEVENLABS_VOICE_ID`); voice style adjusts delivery settings only.
- Jobs run inside the API process. Use a real queue (e.g. BullMQ) before scaling beyond one server.

## API overview

All routes except auth, `languages` and `health` need `Authorization: Bearer <token>` (downloads also accept `?token=`).

```
POST /api/auth/register | /login | /forgot-password      GET /api/auth/me
POST /api/videos/upload   GET /api/videos   GET|DELETE /api/videos/:id
POST /api/translate       GET /api/translate/:jobId/status   GET /api/translate/video/:videoId
GET|PUT /api/subtitles/:jobId
GET /api/download/:jobId?type=video|srt|vtt|audio
GET /api/health   GET /api/languages
/api/admin/{stats,users,jobs,logs,settings}               (admin only)
```

`forgot-password` answers the same way for any email and does not send mail until you add an email provider.

## Production deployment

**Single server (simplest)**
```bash
npm run install:all
npm run build                 # builds frontend/dist
cd backend
cp .env.example .env          # NODE_ENV=production, DEMO_MODE as needed,
                              # CLIENT_ORIGIN=https://yourdomain.com, strong JWT_SECRET
npm start
```
When `frontend/dist` exists, the backend serves it (with SPA routing) on the same port, so no CORS setup is needed. Keep it running with `pm2 start server.js --name uvt` (run inside `backend/`).

**Behind nginx + HTTPS** (recommended): proxy everything to `localhost:5000`, and allow big uploads:
```nginx
server {
  server_name yourdomain.com;
  client_max_body_size 600m;
  location / { proxy_pass http://127.0.0.1:5000; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $remote_addr; proxy_read_timeout 300s; }
}
```
Then add HTTPS with `sudo certbot --nginx -d yourdomain.com`.

**Split hosting:** build the frontend with `VITE_API_URL=https://api.yourdomain.com npm run build`, host `dist/` on any static host with a "redirect all to index.html" rule, and set `CLIENT_ORIGIN` on the backend to the frontend origin.

Production checklist: strong `JWT_SECRET`, HTTPS, persistent disk for `backend/data`, `uploads` and `outputs`, `MAX_FILE_MB` matched to your proxy limit, regular backups of `app.db`.

## Troubleshooting

- **"The backend is not reachable" banner:** start the backend; check `http://localhost:5000/api/health`.
- **Server exits with JWT_SECRET error:** create `backend/.env` from `.env.example` and set the secret.
- **`better-sqlite3` install fails:** use Node 18/20 LTS; on Linux install `build-essential python3`; on Termux see above.
- **Video won't play in the browser:** AVI/MKV may not be playable in some browsers even though processing works; download the output instead.
- **"This feature requires API configuration":** you turned Demo Mode off without keys.

## Not included

Real payments, real Google OAuth, and password-reset emails are intentionally left as clearly labelled placeholders.
