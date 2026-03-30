# MultiTask - Multi-Tenant Task Management SaaS

A production-ready multi-tenant task management platform built with React, Node.js, Prisma, and MySQL.

## Tech Stack

- **Frontend**: React 18 + JavaScript + Tailwind CSS + React Router + Zustand + Axios
- **Backend**: Node.js + Express + JavaScript
- **Database**: MySQL 8.0
- **ORM**: Prisma 5
- **Auth**: JWT (access + refresh tokens) + bcryptjs
- **Containerization**: Docker + Docker Compose

## Features

- **Multi-Tenancy**: Complete tenant isolation — each workspace sees only its own data
- **Authentication**: Register, login, logout, JWT refresh, forgot/reset password, profile management
- **Role-Based Access**: Owner, Admin, Member roles with enforced permissions
- **Projects**: CRUD, archive, status management, project members
- **Tasks**: CRUD, Kanban board with drag-and-drop, list view with filters, status workflow (Todo/In Progress/Review/Done), priorities, due dates, tags
- **Comments**: Task comments with activity notifications
- **Invitations**: Invite users by email, accept invitation flow, resend/cancel
- **Members**: Manage workspace members, change roles, remove/reactivate
- **Dashboard**: Metrics cards, tasks by status/priority, recent activity
- **Notifications**: In-app notifications for task assignments, comments, due date changes
- **Workspace Settings**: Branding (name, logo URL, theme color), plan placeholder

## Project Structure

```
multitask/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── seed.js                # Demo data seeder
│   ├── src/
│   │   ├── controllers/           # Route handlers
│   │   ├── middlewares/            # Auth, roles, validation, error handler
│   │   ├── prisma/                # Prisma client
│   │   ├── routes/                # Express routes
│   │   ├── services/              # Business logic
│   │   ├── utils/                 # JWT, email, logger, errors
│   │   ├── validators/            # Express-validator rules
│   │   ├── app.js                 # Express app setup
│   │   └── server.js              # Entry point
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/            # Sidebar, DashboardLayout
│   │   │   └── shared/            # Modal, EmptyState, LoadingSpinner, ProtectedRoute
│   │   ├── pages/                 # All page components
│   │   ├── services/              # API service modules
│   │   ├── store/                 # Zustand auth store
│   │   ├── App.js                 # Router
│   │   ├── index.js               # Entry point
│   │   └── index.css              # Tailwind + custom styles
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MySQL 8.0 (or use Docker)
- npm

### 1. Start MySQL

**Option A: Docker (recommended)**
```bash
docker run -d --name multitask-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=multitask_db -p 3306:3306 mysql:8.0
```

**Option B: Local MySQL**
Create a database named `multitask_db`.

### 2. Setup Backend

```bash
cd backend

# Copy env file and edit if needed
cp .env.example .env

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed demo data
node prisma/seed.js

# Start dev server
npm run dev
```

Backend runs at `http://localhost:5000`

### 3. Setup Frontend

```bash
cd frontend

# Copy env file
cp .env.example .env

# Install dependencies
npm install

# Start dev server
npm start
```

Frontend runs at `http://localhost:3000`

### 4. Demo Accounts

After seeding, use these accounts:

| Tenant | Email | Password | Role |
|---|---|---|---|
| Acme Corp | alice@acme.com | Password123! | Owner |
| Acme Corp | bob@acme.com | Password123! | Admin |
| Acme Corp | carol@acme.com | Password123! | Member |
| Startup Inc | eve@startup.io | Password123! | Owner |
| Startup Inc | frank@startup.io | Password123! | Member |

## Docker Compose (Full Stack)

```bash
# From project root
docker-compose up --build -d

# Run migrations inside backend container
docker exec multitask-backend npx prisma migrate deploy

# Seed data
docker exec multitask-backend node prisma/seed.js
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MySQL: localhost:3306

## API Routes

| Group | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| Auth | POST | /api/auth/register | No | Register workspace + owner |
| Auth | POST | /api/auth/login | No | Login |
| Auth | POST | /api/auth/refresh-token | No | Refresh JWT |
| Auth | POST | /api/auth/forgot-password | No | Request password reset |
| Auth | POST | /api/auth/reset-password | No | Reset password with token |
| Auth | GET | /api/auth/profile | Yes | Get current user profile |
| Auth | PUT | /api/auth/profile | Yes | Update profile |
| Auth | POST | /api/auth/change-password | Yes | Change password |
| Auth | POST | /api/auth/switch-workspace | Yes | Switch active workspace |
| Workspace | GET | /api/workspace | Yes | Get workspace details |
| Workspace | PUT | /api/workspace | Admin+ | Update workspace settings |
| Members | GET | /api/members | Yes | List workspace members |
| Members | PUT | /api/members/:id/role | Admin+ | Change member role |
| Members | DELETE | /api/members/:id | Admin+ | Remove member |
| Members | POST | /api/members/:id/reactivate | Admin+ | Reactivate member |
| Invitations | POST | /api/invitations | Admin+ | Send invitation |
| Invitations | GET | /api/invitations | Yes | List invitations |
| Invitations | POST | /api/invitations/accept | No | Accept invitation |
| Invitations | DELETE | /api/invitations/:id | Admin+ | Cancel invitation |
| Invitations | POST | /api/invitations/:id/resend | Admin+ | Resend invitation |
| Projects | POST | /api/projects | Yes | Create project |
| Projects | GET | /api/projects | Yes | List projects |
| Projects | GET | /api/projects/:id | Yes | Get project detail |
| Projects | PUT | /api/projects/:id | Yes | Update project |
| Projects | POST | /api/projects/:id/archive | Yes | Archive project |
| Projects | DELETE | /api/projects/:id | Yes | Delete project |
| Projects | POST | /api/projects/:id/members | Yes | Add project member |
| Projects | DELETE | /api/projects/:id/members/:userId | Yes | Remove project member |
| Tasks | POST | /api/tasks | Yes | Create task |
| Tasks | GET | /api/tasks | Yes | List/filter tasks |
| Tasks | GET | /api/tasks/:id | Yes | Get task detail |
| Tasks | PUT | /api/tasks/:id | Yes | Update task |
| Tasks | POST | /api/tasks/reorder | Yes | Reorder tasks (Kanban) |
| Tasks | POST | /api/tasks/:id/archive | Yes | Archive task |
| Tasks | DELETE | /api/tasks/:id | Yes | Delete task |
| Comments | POST | /api/comments | Yes | Add comment |
| Comments | GET | /api/comments/task/:taskId | Yes | Get task comments |
| Comments | PUT | /api/comments/:id | Yes | Edit comment |
| Comments | DELETE | /api/comments/:id | Yes | Delete comment |
| Notifications | GET | /api/notifications | Yes | List notifications |
| Notifications | PUT | /api/notifications/:id/read | Yes | Mark as read |
| Notifications | PUT | /api/notifications/read-all | Yes | Mark all as read |
| Notifications | DELETE | /api/notifications/:id | Yes | Delete notification |
| Dashboard | GET | /api/dashboard | Yes | Get dashboard metrics |

## Security

- JWT access + refresh token flow
- Password hashing with bcryptjs (12 rounds)
- Helmet HTTP headers
- CORS configuration
- Rate limiting (200 req/15min general, 30 req/15min auth)
- Input validation with express-validator
- Tenant isolation enforced via middleware (workspaceId from JWT)
- Role-based permission checks

## Production Deployment

1. Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET` values
2. Configure proper `DATABASE_URL` for production MySQL
3. Set `FRONTEND_URL` to your production frontend domain
4. Configure SMTP for real email delivery
5. Use `docker-compose up --build -d` or deploy services individually
6. Run `npx prisma migrate deploy` for production migrations

## Testing Checklist

- [ ] Register new workspace
- [ ] Login with demo accounts
- [ ] Verify tenant isolation (Acme Corp users can't see Startup Inc data)
- [ ] Create/edit/delete projects
- [ ] Create/edit/delete tasks
- [ ] Drag-and-drop on Kanban board
- [ ] Task filters (status, priority, assignee, project, search)
- [ ] Add comments to tasks
- [ ] Invite a new member
- [ ] Change member roles
- [ ] Remove/reactivate members
- [ ] Check notifications
- [ ] Update workspace settings
- [ ] Update profile
- [ ] Change password
- [ ] Forgot/reset password flow
- [ ] Dashboard metrics accuracy
- [ ] Responsive layout on mobile

## License

MIT
