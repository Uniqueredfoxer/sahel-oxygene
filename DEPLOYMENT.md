# Deployment guide

This project has two runtime parts:

- Frontend: React + Vite app
- Backend: Node.js + Express + PostgreSQL + Socket.IO

## 1) Deploy the backend

### Recommended: Render

1. Create a new Web Service on Render.
2. Connect the GitHub repository: `Uniqueredfoxer/sahel-oxygene`.
3. Set the root directory to `backend`.
4. Use the following build command:

```bash
npm install
```

5. Use the following start command:

```bash
npm start
```

6. Add environment variables:

```bash
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=sahel_oxygene
DB_USER=postgres
DB_PASSWORD=your-strong-password
JWT_SECRET=replace-with-a-long-random-string-at-least-32-chars
JWT_EXPIRES_IN=7d
PORT=10000
NODE_ENV=production
PUBLIC_APP_URL=https://your-frontend-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com
SUPER_ADMIN_EMAILS=admin@example.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
```

7. Create a PostgreSQL database and link it to the backend service.
8. After deployment, test the health endpoint:

```bash
https://your-backend-domain.com/api/health
```

## 2) Deploy the frontend

### Recommended: Vercel

1. Create a new project on Vercel.
2. Import the GitHub repository: `Uniqueredfoxer/sahel-oxygene`.
3. Set the root directory to `frontend`.
4. Add the following environment variables:

```bash
VITE_API_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
```

5. Build command:

```bash
npm install && npm run build
```

6. Output directory:

```bash
dist
```

7. Deploy.

## 3) Post-deployment

- Update the admin platform name in the first login screen or admin settings.
- Create the first admin user via registration or seed flow.
- Change the default seed password immediately.
- Add HTTPS domain and set the correct CORS values.

## 4) Notes

- The backend expects PostgreSQL and exposes API routes under `/api`.
- The frontend uses VITE_API_URL and VITE_SOCKET_URL for production communication.
- If you use a custom domain, also update `PUBLIC_APP_URL` and `ALLOWED_ORIGINS` to match it.
