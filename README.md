# Pyasa

Pyasa is a React Native + NestJS social platform for car enthusiasts. The mobile app is built with Expo, and the backend provides authentication, profiles, posts, events, messages, PostgreSQL persistence, and Huawei OBS media uploads.

## Tech Stack

- Expo / React Native
- Zustand
- React Navigation
- NestJS
- PostgreSQL
- TypeORM
- Huawei OBS

## Project Structure

```text
.
|-- assets/              # App logo, icon, splash assets
|-- src/                 # Expo mobile app
|   |-- api/
|   |-- components/
|   |-- navigation/
|   |-- screens/
|   |-- store/
|   `-- theme/
`-- backend/             # NestJS API
    `-- src/
```

## Environment

Real environment files are intentionally ignored by Git.

Create the backend env file from the example:

```bash
cp backend/.env.example backend/.env
```

Then fill in:

```text
DB_HOST=
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASS=

JWT_SECRET=
JWT_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development

OBS_ACCESS_KEY=
OBS_SECRET_KEY=
OBS_ENDPOINT=https://obs.tr-west-1.myhuaweicloud.com
OBS_BUCKET=
OBS_REGION=
```

Do not commit `backend/.env`.

## Install

Install mobile dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
```

## Run The Backend

```bash
cd backend
npm run start:dev
```

The API runs at:

```text
http://localhost:3000/api/v1
```

Swagger docs:

```text
http://localhost:3000/api/docs
```

## Run The Mobile App

Update the API base URL in `src/api/client.ts` if your local network IP changes:

```ts
export const BASE_URL = 'http://YOUR_LAN_IP:3000/api/v1';
```

Then start Expo:

```bash
npm start
```

Clear Metro cache if assets or icons do not refresh:

```bash
npx expo start -c
```

## Type Checks

Mobile:

```bash
npx tsc --noEmit
```

Backend:

```bash
cd backend
npx tsc --noEmit
```

## Git Hygiene

Ignored files include:

- `.env` and `.env.*`
- `node_modules/`
- `.expo/`
- `dist/`
- `*.tsbuildinfo`

Only `backend/.env.example` is committed as a safe template.
