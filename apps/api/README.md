# Rhema Care Flow Lite API

MVP Replit API for issue #89.

## Run locally/Replit

```bash
cd apps/api
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Smoke tests

Health:

```bash
curl http://localhost:8000/api/health
```

Login with the seeded admin user:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rhema.local","password":"admin123456"}'
```

## Default seeded user

- Email: `admin@rhema.local`
- Password: `admin123456`

Change this through Replit Secrets before any public deployment.
