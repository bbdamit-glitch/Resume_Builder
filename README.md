# ResumeForge MVP3

MVP3 upgrades the frontend demo into a real full-stack foundation.

## Architecture

Web:
- Next.js
- React
- TypeScript

API:
- NestJS
- JWT authentication
- bcrypt password hashing
- DTO validation
- Resume CRUD

Database:
- PostgreSQL
- Prisma ORM

Local infrastructure:
- Docker Compose

## MVP3 features

- Register
- Login
- JWT access token
- Password hashing
- PostgreSQL persistence
- User table
- Resume table
- Create resume
- List resumes
- Get resume
- Update resume API
- Delete resume API
- User isolation: users can access only their own resumes
- Next.js frontend connected to API

## VS Code setup

Open this folder in VS Code.

### 1. Start PostgreSQL

```powershell
docker compose up -d
```

Check:

```powershell
docker ps
```

### 2. API environment

Copy:

```text
apps/api/.env.example
```

to:

```text
apps/api/.env
```

### 3. Install dependencies

From the root:

```powershell
npm install
cd apps/api
npm install
cd ../web
npm install
cd ../..
```

### 4. Generate Prisma client

```powershell
npm run prisma:generate
```

### 5. Create database tables

```powershell
npm run prisma:migrate -- --name init
```

If PowerShell does not pass the argument correctly, run:

```powershell
cd apps/api
npx prisma migrate dev --name init
cd ../..
```

### 6. Run web + API together

```powershell
npm run dev
```

Web:

http://localhost:3000

API:

http://localhost:4000

## API endpoints

### Auth

POST `/auth/register`

```json
{
  "email": "amit@example.com",
  "password": "Password123",
  "fullName": "Amit Sharma"
}
```

POST `/auth/login`

```json
{
  "email": "amit@example.com",
  "password": "Password123"
}
```

### Resumes

All resume endpoints require:

```text
Authorization: Bearer <accessToken>
```

GET `/resumes`

GET `/resumes/:id`

POST `/resumes`

PUT `/resumes/:id`

DELETE `/resumes/:id`

## Security note

This is an MVP development setup. Before production:
- move secrets to Azure Key Vault or another secret manager
- use short-lived access tokens + refresh-token rotation
- add rate limiting
- add email verification
- add password reset
- add secure httpOnly cookies
- add audit logging
- add stronger DTO/schema validation
- add automated tests
- add HTTPS
- add database backups
