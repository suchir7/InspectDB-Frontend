# InspectDB Frontend

React 19 + TypeScript + Vite frontend for **InspectDB**, an inspection report management system built on Amazon DocumentDB. The API, infrastructure, and full project documentation live in [suchir7/InspectDB-Backend](https://github.com/suchir7/InspectDB-Backend).


## Local development

```bash
npm install
cp .env.example .env     # VITE_API_BASE_URL=http://localhost:8000/api
npm run dev              # http://localhost:5173
```

Run the backend locally on port 8000 (see the [backend README](https://github.com/suchir7/InspectDB-Backend#readme)).

## Deployment (Vercel, free Hobby plan)

The app deploys automatically from this repository on every push to `main`. No environment variables are required:

- Production builds call the API on the same origin (`/api`).
- [`vercel.json`](vercel.json) proxies `/api/*` to the API server on AWS EC2, so there is no CORS setup.
- It also serves `index.html` for all other routes, so deep links like `/dashboard` work.

If the API server's address changes, update the `/api` rewrite destination in `vercel.json` and push .
