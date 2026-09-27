# SkillTracker Backend API

Production Express.js backend for SkillTracker: Student Skill Management, Academic Management, and Productivity Suite.

## Features
- **MongoDB Atlas Integration**: Cloud persistence across all models (`users`, `skills`, `practicesessions`, `plannertasks`, `timetables`, `internalexams`, `externalexams`, `expenses`, `achievements`).
- **Strict Multi-Tenant Isolation**: Secure JWT authentication ensuring strict data boundary per user.
- **Offline Sync Replay**: Full support for replaying offline queued actions and reconciling MongoDB IDs.
- **Startup Module Purged**: Fully streamlined student academic suite.

## Environment Variables
Create a `.env` file based on `.env.example`:
```env
MONGO_URI=mongodb+srv://<USERNAME>:<PASSWORD>@cluster0.vh6wg0r.mongodb.net/skilltracker?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=production
```

## Running Locally
```bash
npm install
npm run dev
# or
node server.js
```

## Running Master Verification Suite
```bash
node audit-master-suite.js
```

## Deploying to Render
1. Create a **Web Service** on [Render](https://render.com).
2. Connect this repository: `https://github.com/Thamizhselvans-tech/skilltracker`.
3. Set **Branch** to `backend`.
4. Build Command: `npm install`.
5. Start Command: `node server.js`.
6. Add Environment Variables:
   - `MONGO_URI`: Your MongoDB Atlas connection URI
   - `JWT_SECRET`: A secure JWT random string
   - `PORT`: 5000 (or Render default)
   - `NODE_ENV`: production
