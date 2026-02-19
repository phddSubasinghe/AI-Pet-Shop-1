# PawPop API (MongoDB Atlas)

Backend that connects to MongoDB Atlas. Credentials are read from the project root `.env` file.

## Setup

From the **project root** (`pawpop`):

```bash
npm run server:install
```

## Run

From the **project root**:

```bash
npm run server
```

API runs at **http://localhost:3001**.

- **GET /api/health** — Returns `{ ok: true, mongodb: "connected" }` when MongoDB is connected.

## Adding collections

1. Add a model in `server/models/` using Mongoose.
2. Add routes in `server/index.js` (or in separate route files) that use that model.
3. Call the API from the React app using `fetch(import.meta.env.VITE_API_URL + '/api/...')`.
