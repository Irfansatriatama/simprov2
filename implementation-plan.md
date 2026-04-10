# SIMPRO — Implementation Plan

> **Source Reference:** `_reference/` — TRACKLY (Vanilla HTML/CSS/JS + Firebase Firestore SPA)  
> **Target:** SIMPRO — Next.js (FE) + NestJS (BE) + Aiven PostgreSQL + Prisma + Tailwind + Shadcn UI  
> **Goal:** 1:1 feature parity with the reference project, production-ready, optimized for performance

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack Decision](#2-tech-stack-decision)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Prisma Schema (Full)](#4-prisma-schema-full)
5. [Backend — NestJS Modules](#5-backend--nestjs-modules)
6. [Frontend — Next.js Pages & Components](#6-frontend--nextjs-pages--components)
7. [Feature-by-Feature Implementation](#7-feature-by-feature-implementation)
8. [Performance Optimization — Prisma](#8-performance-optimization--prisma)
9. [Performance Optimization — Next.js](#9-performance-optimization--nextjs)
10. [MCP & Best Practices](#10-mcp--best-practices)
11. [Implementation Phases & Task Checklist](#11-implementation-phases--task-checklist)

---

## 1. Project Overview

**SIMPRO** is a Project Management Information System for IT consultant firms converted from the reference project TRACKLY. It manages:

- Projects (hierarchical, phases, budgets, team)
- Tasks (backlog, kanban board, sprints, gantt, dependencies, checklists, time logging, comments)
- Maintenance tickets (post-go-live, board/list, severity, PICs)
- Meetings (calendar, agenda, notulensi, action items)
- Reports (progress, workload, burndown, maintenance, assets)
- Clients, Members, Assets
- Discussions (per project, markdown, replies, pins)
- Notifications & Activity Log (audit trail)
- Personal Notes (markdown, folders, sharing, audit)
- Settings (admin + PM only)
- User Guide & Project Feature Guide

**Roles:** `admin` | `pm` | `developer` | `viewer` | `client`  
**Auth:** Better Auth (replacing localStorage session + SHA-256); username-based login via Better Auth username plugin; session di httpOnly cookie

---

## 2. Tech Stack Decision

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | **Next.js 14+ (App Router)** | RSC for performance, SSR/SSG, route-based code splitting |
| Backend | **NestJS** | Modular, decorator-based, TypeScript-native |
| Database | **Aiven PostgreSQL** | Managed PostgreSQL with SSL, connection pooling via PgBouncer |
| ORM | **Prisma 5+** | Type-safe, optimized queries, migrations, relation handling |
| Styling | **Tailwind CSS v3** | Utility-first, purge-enabled for minimal CSS bundle |
| UI Components | **Shadcn UI** | Accessible, composable, headless components on Radix UI |
| Auth | **Better Auth** (`better-auth` + `@thallesp/nestjs-better-auth`) | Session-based; username plugin untuk login pakai username; httpOnly cookie session |
| File Upload | **Multer** (NestJS built-in via `@nestjs/platform-express`) | Disk storage lokal di `backend/uploads/`; serve via `@nestjs/serve-static` |
| Charts | **Recharts** | React-native, tree-shakable Chart.js replacement |
| Drag & Drop | **@dnd-kit/core** | Modern, accessible, performant |
| Gantt | **react-gantt-task** | Drag/resize tasks on timeline; lazy loaded via `next/dynamic` |
| State (client) | **Zustand** | Lightweight, minimal boilerplate |
| Data Fetching (client) | **TanStack Query (React Query)** | Caching, invalidation, optimistic updates |
| Forms | **React Hook Form + Zod** | Type-safe validation end-to-end |
| Markdown | **react-markdown + remark-gfm** | For notes and discussion content |
| Date | **date-fns** | Lightweight, tree-shakable |
| Icons | **lucide-react** | Matches reference project icon set |

---

## 3. Monorepo Structure

```
simprov2/
├── _reference/                   # Source reference (read-only)
├── frontend/                     # Next.js application
│   ├── src/
│   │   ├── app/                  # App Router
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   │       ├── page.tsx
│   │   │   │       └── loading.tsx
│   │   │   ├── (main)/           # Protected layout
│   │   │   │   ├── layout.tsx    # Sidebar + Topbar shell
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── loading.tsx
│   │   │   │   ├── projects/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── loading.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx              # Overview
│   │   │   │   │       ├── backlog/page.tsx
│   │   │   │   │       ├── board/page.tsx
│   │   │   │   │       ├── sprint/page.tsx
│   │   │   │   │       ├── gantt/page.tsx
│   │   │   │   │       ├── maintenance/
│   │   │   │   │       │   ├── page.tsx
│   │   │   │   │       │   └── report/page.tsx
│   │   │   │   │       ├── reports/page.tsx
│   │   │   │   │       ├── discussion/page.tsx
│   │   │   │   │       └── log/page.tsx
│   │   │   │   ├── meetings/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── clients/page.tsx
│   │   │   │   ├── assets/page.tsx
│   │   │   │   ├── members/page.tsx      # admin only
│   │   │   │   ├── settings/page.tsx     # admin + pm only
│   │   │   │   ├── notifications/page.tsx
│   │   │   │   ├── notes/page.tsx
│   │   │   │   ├── guide/page.tsx
│   │   │   │   └── project-guide/page.tsx # admin + pm only
│   │   ├── components/
│   │   │   ├── ui/               # Shadcn generated components
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Topbar.tsx
│   │   │   │   ├── MobileNav.tsx
│   │   │   │   └── NotificationBell.tsx
│   │   │   ├── common/
│   │   │   │   ├── Avatar.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── ConfirmDialog.tsx
│   │   │   │   ├── DataTable.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   └── LoadingSkeleton.tsx
│   │   │   └── features/
│   │   │       ├── projects/
│   │   │       ├── tasks/
│   │   │       ├── board/
│   │   │       ├── sprint/
│   │   │       ├── gantt/
│   │   │       ├── maintenance/
│   │   │       ├── meetings/
│   │   │       ├── reports/
│   │   │       ├── notes/
│   │   │       └── dashboard/
│   │   ├── lib/
│   │   │   ├── api/              # API client functions (per module)
│   │   │   │   ├── client.ts     # axios instance with interceptors
│   │   │   │   ├── projects.ts
│   │   │   │   ├── tasks.ts
│   │   │   │   └── ...
│   │   │   ├── auth-client.ts    # Better Auth client (createAuthClient)
│   │   │   ├── utils.ts
│   │   │   └── constants.ts
│   │   ├── hooks/
│   │   │   ├── useProjects.ts
│   │   │   └── ...              # React Query hooks per module
│   │   ├── store/
│   │   │   └── uiStore.ts        # Zustand: sidebar, modals
│   │   └── types/
│   │       ├── index.ts          # Shared TS interfaces (mirrors Prisma models)
│   │       └── api.ts
│   ├── public/
│   │   ├── logo.svg
│   │   └── icons/
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   └── package.json
│
├── backend/                      # NestJS application
│   ├── src/
│   │   ├── main.ts               # bodyParser: false (wajib untuk Better Auth)
│   │   ├── app.module.ts         # AuthModule.forRoot({ auth }) + ServeStaticModule
│   │   ├── auth/
│   │   │   └── auth.ts           # Better Auth instance (prismaAdapter + username plugin)
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── users/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── sprints/
│   │   ├── maintenance/
│   │   ├── meetings/
│   │   ├── discussions/
│   │   ├── clients/
│   │   ├── assets/
│   │   ├── notifications/
│   │   ├── activity-log/
│   │   ├── notes/
│   │   ├── settings/
│   │   ├── reports/
│   │   └── upload/
│   ├── uploads/                  # File storage lokal (gitignored)
│   │   ├── avatars/
│   │   ├── attachments/          # Task & Discussion attachments
│   │   ├── maintenance/          # Maintenance ticket attachments
│   │   ├── clients/              # Client logos
│   │   └── .gitkeep
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── package.json
│
├── implementation-plan.md
└── package.json                  # Workspace root (npm workspaces or turbo)
```

---

## 4. Prisma Schema (Full)

> **File:** `backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ───────────────────────────────────────────────────────────────────
// GlobalRole & UserStatus dihapus — digantikan String fields di Better Auth User

enum ProjectRole {
  PM
  DEVELOPER
  VIEWER
  CLIENT
}

enum SprintStatus {
  PLANNING
  ACTIVE
  COMPLETED
}

enum NotePermission {
  VIEW
  EDIT
}

// ─── BETTER AUTH CORE TABLES ─────────────────────────────────────────────────
// Di-generate via `npx auth@latest generate` lalu diintegrasikan ke schema ini.
// JANGAN edit section ini secara manual — gunakan Better Auth CLI.

model User {
  id              String    @id
  name            String                        // fullName user
  email           String    @unique
  emailVerified   Boolean   @default(false)
  image           String?                       // avatar URL (local: /uploads/avatars/...)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // username plugin fields (auto-added by `npx auth generate`)
  username        String?   @unique
  displayUsername String?

  // SIMPRO custom fields — dideklarasikan sebagai additionalFields di auth.ts
  role            String    @default("developer") // admin|pm|developer|viewer|client
  status          String    @default("active")    // active|inactive|invited
  phoneNumber     String?
  company         String?
  department      String?
  position        String?
  bio             String?
  linkedin        String?
  github          String?
  timezone        String?   @default("Asia/Jakarta")
  lastLogin       DateTime?

  // Better Auth relations
  sessions        Session[]
  accounts        Account[]

  // SIMPRO business relations
  projectMemberships    ProjectMember[]
  createdProjects       Project[]          @relation("ProjectCreator")
  taskAssignments       TaskAssignee[]
  reportedTasks         Task[]             @relation("TaskReporter")
  maintenancePics       MaintenancePicDev[]
  maintenanceAssigned   Maintenance[]      @relation("MaintenanceAssignee")
  meetingAttendances    MeetingAttendee[]
  createdMeetings       Meeting[]          @relation("MeetingCreator")
  discussions           Discussion[]
  discussionReplies     DiscussionReply[]
  activityLogs          ActivityLog[]
  notifications         Notification[]     @relation("NotificationRecipient")
  actorNotifications    Notification[]     @relation("NotificationActor")
  notes                 Note[]             @relation("NoteOwner")
  noteShares            NoteShare[]
  noteAudits            NoteAudit[]
  assignedAssets        Asset[]

  @@map("user")
  @@index([username])
  @@index([email])
  @@index([role])
  @@index([status])
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("session")
  @@index([userId])
  @@index([token])
}

model Account {
  id          String   @id
  accountId   String
  providerId  String
  userId      String
  password    String?  // bcrypt hash — dikelola Better Auth
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("account")
  @@index([userId])
}

model Verification {
  id         String    @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime? @default(now())
  updatedAt  DateTime? @updatedAt

  @@map("verification")
}

// ─── CLIENTS ─────────────────────────────────────────────────────────────────

model Client {
  id            String    @id @default(cuid())
  companyName   String
  industry      String?
  contactPerson String?
  contactEmail  String?
  contactPhone  String?
  address       String?
  website       String?
  logo          String?
  notes         String?
  status        String    @default("active")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  projects      Project[]

  @@index([status])
  @@index([companyName])
}

// ─── PROJECTS ────────────────────────────────────────────────────────────────

model Project {
  id            String    @id @default(cuid())
  name          String
  code          String    @unique
  description   String?
  status        String    @default("active")
  phase         String?
  priority      String    @default("medium")
  clientId      String?
  parentId      String?
  startDate     DateTime?
  endDate       DateTime?
  actualEndDate DateTime?
  budget        Decimal?  @db.Decimal(15, 2)
  actualCost    Decimal?  @db.Decimal(15, 2)
  tags          String[]
  coverColor    String?
  progress      Float?    @default(0)
  createdById   String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  client        Client?         @relation(fields: [clientId], references: [id])
  parent        Project?        @relation("ProjectHierarchy", fields: [parentId], references: [id])
  children      Project[]       @relation("ProjectHierarchy")
  createdBy     User            @relation("ProjectCreator", fields: [createdById], references: [id])
  members       ProjectMember[]
  tasks         Task[]
  sprints       Sprint[]
  maintenance   Maintenance[]
  discussions   Discussion[]
  activityLogs  ActivityLog[]
  notifications Notification[]
  meetingLinks  MeetingProject[]

  @@index([status])
  @@index([phase])
  @@index([clientId])
  @@index([parentId])
  @@index([createdById])
  @@index([code])
}

model ProjectMember {
  projectId   String
  userId      String
  projectRole ProjectRole @default(DEVELOPER)
  createdAt   DateTime    @default(now())

  project     Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([projectId, userId])
  @@index([userId])
  @@index([projectId])
}

// ─── SPRINTS ─────────────────────────────────────────────────────────────────

model Sprint {
  id          String       @id @default(cuid())
  projectId   String
  name        String
  goal        String?
  startDate   DateTime?
  endDate     DateTime?
  status      SprintStatus @default(PLANNING)
  retroNotes  String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks       Task[]

  @@index([projectId])
  @@index([status])
}

// ─── TASKS ───────────────────────────────────────────────────────────────────

model Task {
  id            String    @id @default(cuid())
  projectId     String
  title         String
  description   String?
  type          String    @default("task")
  status        String    @default("todo")
  priority      String    @default("medium")
  reporterId    String
  sprintId      String?
  epicId        String?
  parentTaskId  String?
  storyPoints   Int?
  startDate     DateTime?
  dueDate       DateTime?
  completedAt   DateTime?
  tags          String[]
  timeLogged    Float?    @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  project       Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  reporter      User             @relation("TaskReporter", fields: [reporterId], references: [id])
  sprint        Sprint?          @relation(fields: [sprintId], references: [id])
  parentTask    Task?            @relation("TaskHierarchy", fields: [parentTaskId], references: [id])
  subTasks      Task[]           @relation("TaskHierarchy")
  assignees     TaskAssignee[]
  attachments   TaskAttachment[]
  comments      TaskComment[]
  checklists    TaskChecklist[]
  dependsOn     TaskDependency[] @relation("TaskDependant")
  dependedOnBy  TaskDependency[] @relation("TaskDependency")

  @@index([projectId])
  @@index([sprintId])
  @@index([status])
  @@index([priority])
  @@index([reporterId])
  @@index([parentTaskId])
  @@index([epicId])
  @@index([dueDate])
  @@index([projectId, status])       // Composite: board/backlog queries
  @@index([projectId, sprintId])     // Composite: sprint queries
}

model TaskAssignee {
  taskId  String
  userId  String
  task    Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([taskId, userId])
  @@index([userId])
}

model TaskAttachment {
  id        String   @id @default(cuid())
  taskId    String
  url       String   // e.g. /uploads/attachments/uuid.pdf
  name      String   // original filename
  mimeType  String?  // image/png, application/pdf, dll
  size      Int?     // bytes
  createdAt DateTime @default(now())

  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
}

model TaskComment {
  id        String   @id @default(cuid())
  taskId    String
  authorId  String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
}

model TaskChecklist {
  id        String   @id @default(cuid())
  taskId    String
  text      String
  done      Boolean  @default(false)
  order     Int      @default(0)

  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
}

model TaskDependency {
  id            String @id @default(cuid())
  taskId        String
  dependsOnId   String
  type          String @default("blocks")

  task          Task   @relation("TaskDependant", fields: [taskId], references: [id], onDelete: Cascade)
  dependsOn     Task   @relation("TaskDependency", fields: [dependsOnId], references: [id], onDelete: Cascade)

  @@unique([taskId, dependsOnId])
  @@index([taskId])
  @@index([dependsOnId])
}

// ─── MAINTENANCE ─────────────────────────────────────────────────────────────

model Maintenance {
  id              String    @id @default(cuid())
  projectId       String
  ticketNumber    String    @unique
  title           String
  description     String?
  type            String
  severity        String    @default("medium")
  priority        String    @default("medium")
  status          String    @default("reported")
  reportedBy      String?
  reportedDate    DateTime?
  assignedDate    DateTime?
  dueDate         DateTime?
  orderedBy       String?
  picClient       String?
  resolvedDate    DateTime?
  assignedTo      String?
  estimatedHours  Float?
  actualHours     Float?
  costEstimate    Decimal?  @db.Decimal(15, 2)
  notes           String?
  resolutionNotes String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  project         Project               @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee        User?                 @relation("MaintenanceAssignee", fields: [assignedTo], references: [id])
  picDevs         MaintenancePicDev[]
  attachments     MaintenanceAttachment[]
  activityLogs    MaintenanceActivityLog[]

  @@index([projectId])
  @@index([status])
  @@index([severity])
  @@index([priority])
  @@index([assignedTo])
  @@index([projectId, status])   // Composite: board/list queries
  @@index([ticketNumber])
}

model MaintenancePicDev {
  maintenanceId String
  userId        String

  maintenance   Maintenance @relation(fields: [maintenanceId], references: [id], onDelete: Cascade)
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([maintenanceId, userId])
  @@index([userId])
}

model MaintenanceAttachment {
  id            String      @id @default(cuid())
  maintenanceId String
  url           String      // e.g. /uploads/maintenance/uuid.jpg
  name          String      // original filename
  mimeType      String?     // image/jpeg, application/pdf, dll
  size          Int?        // bytes
  uploadedBy    String?     // userId uploader
  createdAt     DateTime    @default(now())

  maintenance   Maintenance @relation(fields: [maintenanceId], references: [id], onDelete: Cascade)

  @@index([maintenanceId])
}

model MaintenanceActivityLog {
  id            String      @id @default(cuid())
  maintenanceId String
  text          String
  at            DateTime    @default(now())

  maintenance   Maintenance @relation(fields: [maintenanceId], references: [id], onDelete: Cascade)

  @@index([maintenanceId])
}

// ─── MEETINGS ────────────────────────────────────────────────────────────────

model Meeting {
  id                  String    @id @default(cuid())
  title               String
  description         String?
  type                String
  date                DateTime
  startTime           String
  endTime             String
  location            String?
  status              String    @default("scheduled")
  notulensiContent    String?
  notulensiCreatedBy  String?
  notulensiUpdatedAt  DateTime?
  createdById         String
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  createdBy           User              @relation("MeetingCreator", fields: [createdById], references: [id])
  projects            MeetingProject[]
  attendees           MeetingAttendee[]
  agendaItems         MeetingAgendaItem[]
  actionItems         MeetingActionItem[]

  @@index([date])
  @@index([createdById])
  @@index([status])
}

model MeetingProject {
  meetingId String
  projectId String

  meeting   Meeting @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@id([meetingId, projectId])
}

model MeetingAttendee {
  meetingId String
  userId    String

  meeting   Meeting @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([meetingId, userId])
  @@index([userId])
}

model MeetingAgendaItem {
  id        String  @id @default(cuid())
  meetingId String
  text      String
  order     Int     @default(0)
  done      Boolean @default(false)

  meeting   Meeting @relation(fields: [meetingId], references: [id], onDelete: Cascade)

  @@index([meetingId])
}

model MeetingActionItem {
  id          String    @id @default(cuid())
  meetingId   String
  title       String
  assigneeId  String?
  dueDate     DateTime?
  done        Boolean   @default(false)
  taskId      String?   // FK to Task if converted to task

  meeting     Meeting   @relation(fields: [meetingId], references: [id], onDelete: Cascade)

  @@index([meetingId])
  @@index([assigneeId])
}

// ─── DISCUSSIONS ─────────────────────────────────────────────────────────────

model Discussion {
  id          String   @id @default(cuid())
  projectId   String
  title       String
  content     String
  type        String   @default("general")
  authorId    String
  pinned      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project     Project             @relation(fields: [projectId], references: [id], onDelete: Cascade)
  author      User                @relation(fields: [authorId], references: [id])
  replies     DiscussionReply[]
  attachments DiscussionAttachment[]

  @@index([projectId])
  @@index([authorId])
  @@index([pinned])
  @@index([projectId, pinned])   // Composite: pinned-first display
}

model DiscussionReply {
  id           String   @id @default(cuid())
  discussionId String
  authorId     String
  content      String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  discussion   Discussion @relation(fields: [discussionId], references: [id], onDelete: Cascade)
  author       User       @relation(fields: [authorId], references: [id])

  @@index([discussionId])
}

model DiscussionAttachment {
  id           String   @id @default(cuid())
  discussionId String
  url          String   // e.g. /uploads/attachments/uuid.png
  name         String   // original filename
  mimeType     String?  // image/png, application/pdf, dll
  size         Int?     // bytes
  createdAt    DateTime @default(now())

  discussion   Discussion @relation(fields: [discussionId], references: [id], onDelete: Cascade)

  @@index([discussionId])
}

// ─── ASSETS ──────────────────────────────────────────────────────────────────

model Asset {
  id              String    @id @default(cuid())
  name            String
  category        String?
  description     String?
  serialNumber    String?
  purchaseDate    DateTime?
  purchasePrice   Decimal?  @db.Decimal(15, 2)
  vendor          String?
  assignedTo      String?
  projectId       String?
  status          String    @default("available")
  warrantyExpiry  DateTime?
  notes           String?
  image           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  assignedUser    User?     @relation(fields: [assignedTo], references: [id])

  @@index([status])
  @@index([assignedTo])
  @@index([projectId])
  @@index([category])
}

// ─── ACTIVITY LOG ────────────────────────────────────────────────────────────

model ActivityLog {
  id          String   @id @default(cuid())
  projectId   String?
  entityType  String
  entityId    String
  entityName  String?
  action      String
  actorId     String
  actorName   String
  changes     Json?
  metadata    Json?
  createdAt   DateTime @default(now())

  project     Project? @relation(fields: [projectId], references: [id])
  actor       User     @relation(fields: [actorId], references: [id])

  @@index([projectId])
  @@index([actorId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@index([projectId, createdAt])   // Composite: project activity feed
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

model Notification {
  id          String   @id @default(cuid())
  userId      String
  actorId     String?
  actorName   String?
  actorAvatar String?
  entityType  String
  entityId    String
  entityName  String?
  action      String
  message     String
  projectId   String?
  projectName String?
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())

  user        User     @relation("NotificationRecipient", fields: [userId], references: [id], onDelete: Cascade)
  actor       User?    @relation("NotificationActor", fields: [actorId], references: [id])
  project     Project? @relation(fields: [projectId], references: [id])

  @@index([userId])
  @@index([userId, read])           // Composite: unread count + list
  @@index([createdAt])
  @@index([projectId])
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

model Setting {
  key       String @id
  value     String

  @@index([key])
}

// ─── NOTES ───────────────────────────────────────────────────────────────────

model Note {
  id          String    @id @default(cuid())
  ownerId     String
  title       String
  content     String    @default("")
  folderId    String?
  pinned      Boolean   @default(false)
  color       String?
  tags        String[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  owner       User        @relation("NoteOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  shares      NoteShare[]
  audits      NoteAudit[]

  @@index([ownerId])
  @@index([folderId])
  @@index([pinned])
  @@index([ownerId, folderId])   // Composite: notes by folder
}

model NoteShare {
  noteId      String
  userId      String
  permission  NotePermission @default(VIEW)

  note        Note @relation(fields: [noteId], references: [id], onDelete: Cascade)
  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([noteId, userId])
  @@index([userId])
}

model NoteAudit {
  id        String   @id @default(cuid())
  noteId    String
  userId    String
  userName  String
  action    String
  detail    String?
  diff      Json?
  createdAt DateTime @default(now())

  note      Note @relation(fields: [noteId], references: [id], onDelete: Cascade)
  user      User @relation(fields: [userId], references: [id])

  @@index([noteId])
  @@index([userId])
  @@index([createdAt])
}

// ─── NOTE FOLDERS ────────────────────────────────────────────────────────────
// Folders were in localStorage in reference; now persisted to DB per user

model NoteFolder {
  id        String   @id @default(cuid())
  userId    String
  name      String
  color     String?
  createdAt DateTime @default(now())

  @@index([userId])
}
```

---

## 5. Backend — NestJS Modules

### 5.1 Module List

| Module | Path | Responsibility |
|--------|------|---------------|
| `PrismaModule` | `src/prisma/` | Global Prisma service |
| Better Auth | `src/auth/auth.ts` | Better Auth instance; di-mount via `AuthModule.forRoot({ auth })` di `app.module.ts`; menangani semua `/api/auth/*` routes |
| `UsersModule` | `src/users/` | CRUD users (admin), update profile, avatar URL save |
| `ProjectsModule` | `src/projects/` | CRUD projects, members, hierarchy |
| `TasksModule` | `src/tasks/` | CRUD tasks, assignees, bulk ops, CSV export |
| `SprintsModule` | `src/sprints/` | CRUD sprints, activate/complete, velocity |
| `MaintenanceModule` | `src/maintenance/` | Tickets CRUD, board, activity log, attachments |
| `MeetingsModule` | `src/meetings/` | CRUD meetings, agenda, notulensi, action items |
| `DiscussionsModule` | `src/discussions/` | Posts, replies, pins, attachments |
| `ClientsModule` | `src/clients/` | CRUD clients |
| `AssetsModule` | `src/assets/` | CRUD assets |
| `NotificationsModule` | `src/notifications/` | List, mark-read, pagination |
| `ActivityLogModule` | `src/activity-log/` | Log reads, project-scoped |
| `NotesModule` | `src/notes/` | CRUD notes, folders, shares, audit |
| `SettingsModule` | `src/settings/` | Get/update system settings |
| `ReportsModule` | `src/reports/` | Aggregated data for charts |
| `UploadModule` | `src/upload/` | Multer disk storage; `POST /upload`, `DELETE /upload`; category routing; 10MB limit |

### 5.2 Auth Module (Better Auth)

**Library:** `better-auth` + `@thallesp/nestjs-better-auth`

**`backend/src/auth/auth.ts`** — Better Auth instance:

```typescript
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { username } from "better-auth/plugins"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,    // http://localhost:3001
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  plugins: [
    username({ minUsernameLength: 3, maxUsernameLength: 50 }),
  ],
  user: {
    additionalFields: {
      role:        { type: "string", defaultValue: "developer" },
      status:      { type: "string", defaultValue: "active" },
      phoneNumber: { type: "string", required: false },
      company:     { type: "string", required: false },
      department:  { type: "string", required: false },
      position:    { type: "string", required: false },
      bio:         { type: "string", required: false },
      linkedin:    { type: "string", required: false },
      github:      { type: "string", required: false },
      timezone:    { type: "string", defaultValue: "Asia/Jakarta" },
      lastLogin:   { type: "date",   required: false },
    }
  },
  session: {
    expiresIn:   60 * 60 * 24 * 7,   // 7 hari
    updateAge:   60 * 60 * 24,        // perpanjang tiap 24 jam
    cookieCache: { enabled: true, maxAge: 5 * 60 }
  }
})

export type Auth = typeof auth
```

**`backend/src/main.ts`** — wajib disable body parser:

```typescript
const app = await NestFactory.create(AppModule, { bodyParser: false })
```

**`backend/src/app.module.ts`**:

```typescript
import { AuthModule } from '@thallesp/nestjs-better-auth'
import { ServeStaticModule } from '@nestjs/serve-static'
import { auth } from './auth/auth'
import { join } from 'path'

@Module({
  imports: [
    AuthModule.forRoot({ auth }),       // mounts /api/auth/* + global AuthGuard
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),
    // ... other modules
  ]
})
export class AppModule {}
```

**Routes yang di-handle Better Auth** (`/api/auth/*` — otomatis di-mount):

```
POST   /api/auth/sign-in/username    → login username + password; set session cookie
POST   /api/auth/sign-out            → logout; hapus session cookie
POST   /api/auth/change-password     → ganti password (built-in; butuh session)
GET    /api/auth/get-session         → return session saat ini
POST   /api/auth/sign-up/email       → buat user baru (dipakai admin via NestJS service)
```

**Controller pattern** — gantikan `@UseGuards(JwtAuthGuard)`:

```typescript
import { Session, UserSession, AllowAnonymous } from '@thallesp/nestjs-better-auth'

@Controller('projects')
export class ProjectsController {
  @Get()
  async list(@Session() session: UserSession) {
    // session.user.id, session.user.role, session.user.name tersedia
    return this.projectsService.findAll(session.user.id, session.user.role)
  }

  @Get('health')
  @AllowAnonymous()
  health() { return { ok: true } }
}
```

**Role guard** — tidak pakai `@Roles()` decorator; cek `session.user.role` langsung di service:

```typescript
if (session.user.role !== 'admin' && session.user.role !== 'pm') {
  throw new ForbiddenException('Insufficient permissions')
}
```

**Admin create user** via Better Auth API (bukan Prisma langsung):

```typescript
// UsersService — admin create user
await auth.api.signUpEmail({
  body: {
    email: dto.email,
    name: dto.fullName,
    password: dto.password,       // admin sets initial password
    username: dto.username,
    role: dto.role,
    status: 'active',
  }
})
```

### 5.3 Shared Notification Service

A `NotificationService` is imported by other modules (tasks, maintenance, meetings, etc.) to create notifications inside the same transaction as the mutation.

```typescript
// Used inside task update transaction:
await tx.notification.createMany({
  data: recipientIds.map(userId => ({
    userId,
    actorId: currentUser.id,
    entityType: 'task',
    entityId: task.id,
    action: 'updated',
    message: `...,`
  }))
})
```

### 5.4 Activity Log Service

`ActivityLogService.log()` is called from every mutating service. Accepts a Prisma transaction client to batch with the mutation.

```typescript
await this.activityLogService.log(tx, {
  projectId,
  entityType: 'task',
  entityId: task.id,
  entityName: task.title,
  action: 'updated',
  actor: currentUser,
  changes: diff,
})
```

### 5.5 API Endpoint Map (Full)

#### Auth
```
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/change-password
GET    /auth/me
```

#### Users
```
GET    /users                        # admin only
POST   /users                        # admin only
GET    /users/:id
PATCH  /users/:id                    # admin or self
DELETE /users/:id                    # admin only
PATCH  /users/:id/status             # admin only
```

#### Projects
```
GET    /projects                     # filtered by membership
POST   /projects
GET    /projects/:id
PATCH  /projects/:id
DELETE /projects/:id
GET    /projects/:id/members
POST   /projects/:id/members
PATCH  /projects/:id/members/:userId
DELETE /projects/:id/members/:userId
```

#### Tasks
```
GET    /tasks?projectId=&sprintId=&status=&priority=&assigneeId=&search=&page=&take=
POST   /tasks
GET    /tasks/:id
PATCH  /tasks/:id
DELETE /tasks/:id
POST   /tasks/bulk-update            # bulk status/priority/sprint/delete
GET    /tasks/export/csv?projectId=  # CSV download
POST   /tasks/:id/comments
GET    /tasks/:id/comments
PATCH  /tasks/:id/comments/:commentId
DELETE /tasks/:id/comments/:commentId
POST   /tasks/:id/checklists
PATCH  /tasks/:id/checklists/:checklistId
DELETE /tasks/:id/checklists/:checklistId
POST   /tasks/:id/log-time
POST   /tasks/:id/attachments
DELETE /tasks/:id/attachments/:attachmentId
POST   /tasks/:id/dependencies
DELETE /tasks/:id/dependencies/:dependencyId
```

#### Sprints
```
GET    /sprints?projectId=
POST   /sprints
GET    /sprints/:id
PATCH  /sprints/:id
DELETE /sprints/:id
POST   /sprints/:id/activate
POST   /sprints/:id/complete         # body: { unfinishedTaskAction: 'backlog'|'carry' }
```

#### Maintenance
```
GET    /maintenance?projectId=&status=&severity=&assignedTo=&page=&take=
POST   /maintenance
GET    /maintenance/:id
PATCH  /maintenance/:id
DELETE /maintenance/:id
POST   /maintenance/:id/attachments
DELETE /maintenance/:id/attachments/:attachmentId
GET    /maintenance/report?projectId=&from=&to=&status=&type=  # PM/admin only
```

#### Meetings
```
GET    /meetings?from=&to=            # filtered by role
POST   /meetings
GET    /meetings/:id
PATCH  /meetings/:id
DELETE /meetings/:id
PATCH  /meetings/:id/notulensi
POST   /meetings/:id/agenda
PATCH  /meetings/:id/agenda/:itemId
POST   /meetings/:id/action-items
PATCH  /meetings/:id/action-items/:itemId
POST   /meetings/:id/action-items/:itemId/convert-to-task
```

#### Discussions
```
GET    /discussions?projectId=
POST   /discussions
GET    /discussions/:id
PATCH  /discussions/:id
DELETE /discussions/:id
POST   /discussions/:id/replies
PATCH  /discussions/:id/replies/:replyId
DELETE /discussions/:id/replies/:replyId
PATCH  /discussions/:id/pin          # admin/pm only
```

#### Clients
```
GET    /clients
POST   /clients
GET    /clients/:id
PATCH  /clients/:id
DELETE /clients/:id
```

#### Assets
```
GET    /assets
POST   /assets
GET    /assets/:id
PATCH  /assets/:id
DELETE /assets/:id
```

#### Notifications
```
GET    /notifications?page=&take=
PATCH  /notifications/read-all
PATCH  /notifications/:id/read
GET    /notifications/unread-count
```

#### Activity Log
```
GET    /activity-log?projectId=&entityType=&page=&take=
```

#### Notes
```
GET    /notes                         # own + shared
POST   /notes
GET    /notes/:id
PATCH  /notes/:id
DELETE /notes/:id
POST   /notes/:id/share
DELETE /notes/:id/share/:userId
GET    /notes/:id/audit
GET    /note-folders
POST   /note-folders
PATCH  /note-folders/:id
DELETE /note-folders/:id
```

#### Settings
```
GET    /settings                      # admin + pm
PATCH  /settings                      # admin only; body: { key, value }[]
```

#### Reports
```
GET    /reports/progress?projectId=
GET    /reports/workload?projectId=
GET    /reports/burndown?projectId=&sprintId=
GET    /reports/maintenance-summary?projectId=&from=&to=
GET    /reports/assets?projectId=
GET    /reports/dashboard             # aggregate for dashboard page
```

#### Upload
```
POST   /upload                        # multipart/form-data; fields: file + category (avatar|attachment|maintenance|client)
                                      # response: { url, name, size, mimeType }
DELETE /upload                        # body: { url } — hapus file dari disk
```

**Implementasi UploadModule:**

```typescript
// upload.module.ts
import { MulterModule } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { v4 as uuidv4 } from 'uuid'

MulterModule.register({
  storage: diskStorage({
    destination: (req, file, cb) => {
      const category = req.body.category ?? 'attachments'
      cb(null, `./uploads/${category}`)
    },
    filename: (req, file, cb) => {
      cb(null, `${uuidv4()}${extname(file.originalname)}`)
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },  // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|zip/
    const valid = allowed.test(extname(file.originalname).toLowerCase())
    cb(valid ? null : new Error('File type not allowed'), valid)
  },
})

// upload.controller.ts
@Post()
@UseInterceptors(FileInterceptor('file'))
upload(@UploadedFile() file: Express.Multer.File, @Body('category') category: string) {
  return {
    url: `/uploads/${category ?? 'attachments'}/${file.filename}`,
    name: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
  }
}
```

---

## 6. Frontend — Next.js Pages & Components

### 6.1 App Router Pages

| Route | RSC / Client | Auth Guard | Role Guard |
|-------|-------------|-----------|-----------|
| `/login` | RSC shell + Client form | Redirect if authed | — |
| `/dashboard` | RSC fetch + Client charts | ✓ | — |
| `/projects` | RSC list + Client filters | ✓ | — |
| `/projects/[id]` | RSC | ✓ | member |
| `/projects/[id]/backlog` | Client (60s auto-refresh) | ✓ | member |
| `/projects/[id]/board` | Client (DnD) | ✓ | member |
| `/projects/[id]/sprint` | Client | ✓ | member |
| `/projects/[id]/gantt` | Client (canvas) | ✓ | member |
| `/projects/[id]/maintenance` | Client | ✓ | member |
| `/projects/[id]/maintenance/report` | RSC | ✓ | pm/admin |
| `/projects/[id]/reports` | Client (charts) | ✓ | pm/admin |
| `/projects/[id]/discussion` | Client | ✓ | member |
| `/projects/[id]/log` | RSC + pagination | ✓ | pm/admin |
| `/meetings` | Client (calendar) | ✓ | — |
| `/meetings/[id]` | RSC + Client | ✓ | — |
| `/clients` | RSC | ✓ | — |
| `/assets` | RSC | ✓ | — |
| `/members` | RSC + Client | ✓ | admin |
| `/settings` | Client | ✓ | admin/pm |
| `/notifications` | Client + infinite scroll | ✓ | — |
| `/notes` | Client | ✓ | — |
| `/guide` | RSC (static) | ✓ | — |
| `/project-guide` | RSC (static) | ✓ | admin/pm |

### 6.2 Key Client Components

#### Layout
- `Sidebar` — collapsible nav with role-gated items; active route highlight
- `Topbar` — page title, `NotificationBell` (polling `/notifications/unread-count` every 30s), user menu
- `MobileNav` — bottom tab bar (matches reference)

#### Common
- `Avatar` — image with fallback initials + color hash (matches `avatar.js`)
- `StatusBadge` — colored pill (matches `badge.js`)
- `ConfirmDialog` — wraps Shadcn `AlertDialog`
- `DataTable` — Shadcn `Table` + pagination + sorting
- `SlideOver` — right-side sheet (task detail panel)
- `EmptyState`
- `Skeleton` variants per feature

#### Feature Components

**Tasks / Backlog:**
- `TaskTable` — filterable, sortable, with checkbox bulk selection
- `TaskDetail` (slide-over) — all task fields, comments, checklists, attachments, time log, dependencies
- `TaskForm` — create/edit modal
- `BulkActionBar` — sticky bottom bar when items selected

**Board:**
- `KanbanBoard` — `@dnd-kit` draggable columns
- `KanbanColumn` — droppable, shows task cards
- `KanbanCard` — compact task with avatar, priority badge

**Sprint:**
- `SprintPanel` — planning board; activate/complete actions
- `SprintStats` — velocity, points

**Gantt:**
- `GanttChart` — timeline; tasks as bars, drag to reschedule, resize to extend

**Maintenance:**
- `MaintenanceBoard` — DnD columns by status
- `MaintenanceList` — filterable table
- `TicketForm` — create/edit modal with multi-PIC selection

**Reports:**
- `ProgressChart` — Recharts `AreaChart`
- `WorkloadChart` — Recharts `BarChart`
- `BurndownChart` — Recharts `LineChart`
- `MaintenanceSummaryChart`
- `AssetsReport`

**Meetings:**
- `MeetingCalendar` — month/week view
- `MeetingCard`
- `AgendaList` — draggable order, done toggle
- `NotulensiEditor` — markdown textarea with preview
- `ActionItemList` — with "Convert to Task" button

**Notes:**
- `NoteEditor` — markdown editor + preview
- `NoteList` — with folder filter, pin, color
- `NoteShareModal`

**Notifications:**
- `NotificationBell` — dropdown with top 5 + link to full page
- `NotificationList` — infinite scroll, mark-read, deep links

---

## 7. Feature-by-Feature Implementation

### 7.1 Authentication

**Reference behavior:**  
- SHA-256 username/password → `localStorage` session (8h/30d)
- Redirects: `viewer`/`client` → `/projects`; others → `/dashboard`

**SIMPRO implementation:**

**Frontend auth client** (`frontend/src/lib/auth-client.ts`):
```typescript
import { createAuthClient } from "better-auth/react"
import { usernameClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,  // http://localhost:3001
  plugins: [usernameClient()],
})

export const { signIn, signOut, useSession } = authClient
```

**Login flow:**
- Form submit: `authClient.signIn.username({ username, password })`
- Better Auth validates username + password (bcrypt internally), set httpOnly session cookie
- On sukses: baca `session.user.role`, redirect by role — `viewer`/`client` → `/projects`; others → `/dashboard`

**Session di Client Components:**
```typescript
const { data: session, isPending } = useSession()
// session.user.id, session.user.role, session.user.name, session.user.image
```

**Session di RSC:**
```typescript
import { headers } from "next/headers"
const { data: session } = await authClient.getSession({
  fetchOptions: { headers: Object.fromEntries(await headers()) }
})
if (!session) redirect('/login')
```

**Logout:** `authClient.signOut()` — Better Auth hapus session cookie

**Change password:** `authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true })`

### 7.2 Dashboard

**Reference behavior:**  
- Stats cards: total projects, active tasks, total clients, total users
- Bar chart: tasks by priority
- Donut chart: project status distribution
- Workload table: tasks per developer
- Recent activity feed

**SIMPRO implementation:**
- `GET /reports/dashboard` returns all aggregated data in **one request**
- Backend uses Prisma `groupBy` for charts, `findMany` with `take: 10` for activity
- Frontend: RSC fetches data server-side; charts are Client components wrapped in `Suspense`
- Charts use Recharts `ResponsiveContainer`

### 7.3 Projects

**Reference behavior:**
- Cards with progress, phase badge, client, dates, member avatars
- Hierarchical display (parent/child)
- Filters: status, phase, client
- Edit from project banner via custom event

**SIMPRO implementation:**
- `GET /projects` returns projects with `select` for cards (no heavy relations)
- Hierarchical display: recursive React component from flat list (group by `parentId`)
- Filters as URL search params (Next.js `useSearchParams`)
- Edit via Shadcn `Sheet` triggered from project banner

### 7.4 Backlog

**Reference behavior:**
- Filterable/sortable task list; group by epic
- Slide-over task detail
- Bulk: status, priority, sprint, delete
- CSV export
- 60s auto-refresh

**SIMPRO implementation:**
- `GET /tasks?projectId=&...` with server-side pagination (`take=50` default, cursor-based)
- React Query `useQuery` with `refetchInterval: 60000` for auto-refresh
- Bulk: `POST /tasks/bulk-update` → single transaction with `updateMany`
- CSV: `GET /tasks/export/csv` → NestJS streams CSV with BOM header
- Slide-over is a `Sheet` component from Shadcn

### 7.5 Kanban Board

**Reference behavior:**
- Columns per task status; DnD between columns
- Read-only for viewer/client

**SIMPRO implementation:**
- `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop
- On drop: optimistic update via React Query + `PATCH /tasks/:id`
- Role check on frontend (disable drag) + backend `@Roles` guard

### 7.6 Sprints

**Reference behavior:**
- One active sprint at a time
- Complete sprint: unfinished tasks moved to backlog or next sprint

**SIMPRO implementation:**
- `POST /sprints/:id/activate` — validates no other active sprint exists
- `POST /sprints/:id/complete` — transaction: update sprint status + update tasks per choice
- Velocity chart from completed sprint `storyPoints`

### 7.7 Gantt

**Reference behavior:**
- Timeline with drag/resize tasks

**SIMPRO implementation:**
- Use `react-gantt-task` library (dipilih: lebih cepat implementasi, siap pakai)
- Task updates on drag/resize end: `PATCH /tasks/:id` dengan `startDate` / `dueDate` baru
- Lazy load dengan `next/dynamic` agar tidak membebani initial bundle

### 7.8 Maintenance

**Reference behavior:**
- Board and list views; DnD status columns
- Role-gated visibility for severity/cost (developer sees limited fields)
- Ticket number auto-generated (`MNT-YYYYMM-XXXX`)

**SIMPRO implementation:**
- Ticket number: generated in NestJS service on create using `SELECT MAX(ticketNumber)` within transaction
- Board: `@dnd-kit` same as kanban
- Role gate: backend returns different `select` projections based on role

### 7.9 Meetings

**Reference behavior:**
- Calendar view (month/week)
- Non-managers see only meetings they created or attend
- Notulensi: markdown content + attachments
- Action items with "convert to task"

**SIMPRO implementation:**
- Calendar: custom grid or `react-big-calendar` (dynamically loaded)
- Filter: backend `WHERE` clause based on role — `pm`/`admin` see all; others see `attendeeId = userId OR createdById = userId`
- Notulensi: `PATCH /meetings/:id/notulensi` with markdown string
- Convert to task: creates `Task` record + links back via `actionItem.taskId`

### 7.10 Reports

**Reference behavior:**
- 5 report types (progress, workload, burndown, maintenance summary, assets)
- Chart.js charts; print (PDF); CSV helpers

**SIMPRO implementation:**
- Each report: dedicated `GET /reports/<type>` endpoint with optimized aggregation query
- Frontend: Recharts components, loaded with `next/dynamic`
- Print: `window.print()` with `@media print` CSS via Tailwind `print:` prefix
- CSV: same streaming approach as tasks export

### 7.11 Discussion

**Reference behavior:**
- Posts + replies; markdown; attachments; pin for admin/PM

**SIMPRO implementation:**
- `react-markdown` + `remark-gfm` for rendering
- Optimistic reply insertion via React Query `useMutation`
- Pin: `PATCH /discussions/:id/pin` with `@Roles('ADMIN', 'PM')` guard

### 7.12 Notifications

**Reference behavior:**
- Bell in topbar; dropdown shows recent; full page with pagination; mark read

**SIMPRO implementation:**
- Unread count: `GET /notifications/unread-count` polled every 30s (`refetchInterval`)
- Bell dropdown: `GET /notifications?take=5`
- Full page: cursor-based infinite scroll with `useInfiniteQuery`
- SSE (optional enhancement) for real-time delivery via `GET /notifications/stream`

### 7.13 Notes

**Reference behavior:**
- Own + shared notes; folders (localStorage → now DB); markdown; audit trail; sharing with view/edit

**SIMPRO implementation:**
- Folders now in `NoteFolder` table (replaces localStorage)
- `GET /notes` returns own notes + notes shared with user (Prisma `OR` query on `NoteShare`)
- Audit: automatically created on save inside transaction
- Markdown editor: `react-markdown` with textarea edit / preview toggle

### 7.14 Members (Admin)

**Reference behavior:**
- Full CRUD users; avatar; role; status; project roles

**SIMPRO implementation:**
- `GET /users` — admin only
- Avatar: upload ke NestJS via `POST /upload` (category: `avatar`), URL disimpan di field `image` user, diakses via `http://localhost:3001/uploads/avatars/<uuid>.ext`
- Create user: admin panggil `auth.api.signUpEmail()` di NestJS service — password diset admin, dikomunikasikan manual ke user
- Password reset: admin panggil `auth.api.setPassword()` di backend

### 7.15 Settings

**Reference behavior:**
- system_name, timezone, date_format, currency, currency_symbol, hourly_rate, tax_rate

**SIMPRO implementation:**
- `GET /settings` → `Setting[]` as `{ key, value }[]`
- Frontend transforms to object; form submits `PATCH /settings` with changed pairs
- Cached on frontend with `staleTime: Infinity`; invalidated on save

---

## 8. Performance Optimization — Prisma

### 8.1 Select Only What You Need

**Never** use bare `findMany` on tables with many columns. Always specify `select` or `include` with nested `select`.

```typescript
// BAD: fetches all columns including large JSON fields
const tasks = await prisma.task.findMany({ where: { projectId } })

// GOOD: select for list view
const tasks = await prisma.task.findMany({
  where: { projectId },
  select: {
    id: true,
    title: true,
    status: true,
    priority: true,
    dueDate: true,
    storyPoints: true,
    assignees: {
      select: { user: { select: { id: true, name: true, image: true } } }
    }
  }
})
```

### 8.2 Cursor-Based Pagination (Not Offset)

Use cursor pagination for large datasets (backlog, activity log, notifications):

```typescript
// First page
const tasks = await prisma.task.findMany({
  where: { projectId },
  take: 50,
  orderBy: { createdAt: 'desc' }
})

// Next page (pass last item's id as cursor)
const tasks = await prisma.task.findMany({
  where: { projectId },
  take: 50,
  skip: 1,
  cursor: { id: lastTaskId },
  orderBy: { createdAt: 'desc' }
})
```

### 8.3 Avoid N+1 with Strategic Include

```typescript
// BAD: N+1 — loop fetches user per task
for (const task of tasks) {
  const user = await prisma.user.findUnique({ where: { id: task.reporterId } })
}

// GOOD: single query with include + nested select
const tasks = await prisma.task.findMany({
  where: { projectId },
  include: {
    reporter: { select: { id: true, name: true, image: true } },
    assignees: { include: { user: { select: { id: true, name: true, image: true } } } }
  }
})
```

### 8.4 Use `groupBy` for Aggregation (Reports/Dashboard)

```typescript
// Task count by status (for board stats)
const tasksByStatus = await prisma.task.groupBy({
  by: ['status'],
  where: { projectId },
  _count: { id: true }
})

// Dashboard: projects by phase
const projectsByPhase = await prisma.project.groupBy({
  by: ['phase'],
  _count: { id: true }
})
```

### 8.5 `Promise.all` for Independent Queries

Dashboard or report pages that need multiple independent data sets:

```typescript
const [projects, tasks, clients, users, maintenance] = await Promise.all([
  prisma.project.count({ where: { status: 'active' } }),
  prisma.task.count({ where: { status: { not: 'done' } } }),
  prisma.client.count(),
  prisma.user.count({ where: { status: 'active' } }),   // lowercase string, bukan enum
  prisma.maintenance.count({ where: { status: { not: 'closed' } } })
])
```

### 8.6 Transactions for Multi-table Mutations

```typescript
// Complete sprint: atomic update
await prisma.$transaction(async (tx) => {
  await tx.sprint.update({ where: { id: sprintId }, data: { status: 'COMPLETED' } })
  await tx.task.updateMany({
    where: { sprintId, status: { not: 'done' } },
    data: { sprintId: targetSprintId ?? null }
  })
  await this.activityLogService.log(tx, { ... })
  await tx.notification.createMany({ data: notifications })
})
```

### 8.7 Database Indexes Strategy

Every `@@index` in the schema above is intentional:

- **Single column indexes**: on all FK columns + frequently filtered columns (`status`, `priority`, `role`)
- **Composite indexes**: on the most common multi-column WHERE patterns
  - `(projectId, status)` — kanban board, backlog filter
  - `(projectId, sprintId)` — sprint backlog
  - `(userId, read)` — unread notification count
  - `(projectId, createdAt)` — activity feed
  - `(projectId, pinned)` — pinned discussions first
  - `(ownerId, folderId)` — notes by folder

### 8.8 Connection Pooling

Aiven PostgreSQL provides PgBouncer. Configure pool size in `DATABASE_URL`:

```
DATABASE_URL="postgres://avnadmin:...@simpro-pg-simpro-v2.d.aivencloud.com:25463/defaultdb?sslmode=require&connection_limit=10&pool_timeout=10"
```

In Prisma datasource, add:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")  // For migrations (bypass pooler)
}
```

### 8.9 Raw SQL for Complex Aggregations

When Prisma's query builder is insufficient, use `$queryRaw`:

```typescript
// Workload report: tasks per developer with story points
const workload = await prisma.$queryRaw<WorkloadRow[]>`
  SELECT
    u.id,
    u.name,
    u.image,
    COUNT(ta.task_id) AS task_count,
    SUM(t.story_points) AS total_points
  FROM "user" u
  JOIN "TaskAssignee" ta ON ta.user_id = u.id
  JOIN "Task" t ON t.id = ta.task_id
  WHERE t.project_id = ${projectId}
    AND t.status != 'done'
  GROUP BY u.id, u.name, u.image
  ORDER BY task_count DESC
`
```

### 8.10 Use `findFirst` instead of `findMany` when expecting one result

```typescript
// BAD
const [sprint] = await prisma.sprint.findMany({
  where: { projectId, status: 'ACTIVE' }
})

// GOOD
const sprint = await prisma.sprint.findFirst({
  where: { projectId, status: 'ACTIVE' }
})
```

---

## 9. Performance Optimization — Next.js

### 9.1 React Server Components by Default

All data-fetching pages should be RSC unless they need interactivity (DnD, forms, real-time):

| Page | Strategy |
|------|---------|
| `/dashboard` | RSC shell + `Suspense` boundaries for charts (Client) |
| `/projects` | RSC (initial list) + Client for filters/search |
| `/projects/[id]/backlog` | Client (auto-refresh, bulk actions, slide-over) |
| `/projects/[id]/board` | Client (DnD) |
| `/projects/[id]/gantt` | Client (canvas) |
| `/meetings` | Client (calendar interactivity) |
| `/notifications` | Client (infinite scroll) |

### 9.2 Streaming with Suspense

Wrap slow-loading sections in `Suspense`:

```tsx
// dashboard/page.tsx (RSC)
export default async function DashboardPage() {
  return (
    <div>
      <StatsCards /> {/* fast RSC fetch */}
      <Suspense fallback={<ChartSkeleton />}>
        <DashboardCharts /> {/* slower RSC fetch */}
      </Suspense>
      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  )
}
```

### 9.3 Dynamic Imports for Heavy Components

```typescript
// Heavy chart/gantt/calendar components → dynamic import
const GanttChart = dynamic(() => import('@/components/features/gantt/GanttChart'), {
  ssr: false,
  loading: () => <GanttSkeleton />
})

const ReportsCharts = dynamic(() => import('@/components/features/reports/ReportsCharts'), {
  ssr: false
})
```

### 9.4 React Query for Client-Side Caching

Configure global defaults to avoid redundant network calls:

```typescript
// lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,     // 2 min before refetch
      gcTime: 1000 * 60 * 10,       // 10 min cache lifetime
      refetchOnWindowFocus: false,   // prevents surprise refetches
      retry: 1
    }
  }
})
```

### 9.5 Optimistic Updates

For status changes (board drag, checklist toggle, notification read):

```typescript
useMutation({
  mutationFn: (id: string) => api.tasks.updateStatus(id, newStatus),
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ['tasks', projectId] })
    const previous = queryClient.getQueryData(['tasks', projectId])
    queryClient.setQueryData(['tasks', projectId], (old) =>
      old.map(t => t.id === id ? { ...t, status: newStatus } : t)
    )
    return { previous }
  },
  onError: (_, __, ctx) => {
    queryClient.setQueryData(['tasks', projectId], ctx.previous)
  }
})
```

### 9.6 Image Optimization

All user avatars and client logos via `next/image`:

```tsx
<Image
  src={user.image
    ? `${process.env.NEXT_PUBLIC_API_URL}${user.image}`
    : '/default-avatar.png'}
  alt={user.name}
  width={32}
  height={32}
  className="rounded-full"
/>
```

Configure `next.config.ts` untuk mengizinkan domain NestJS backend:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '3001',
      pathname: '/uploads/**',
    },
    // tambahkan hostname production saat deploy
  ]
}
```

### 9.7 Font Optimization

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], display: 'swap' })
```

### 9.8 Route-Level Code Splitting

Each App Router page/layout is automatically code-split. Avoid importing large libs at the module level in RSCs.

### 9.9 Caching API Calls in RSC

For rarely-changing data (settings, guide content):

```typescript
// RSC fetch with Next.js cache
const settings = await fetch(`${API_URL}/settings`, {
  next: { revalidate: 300 }  // revalidate every 5 min
}).then(r => r.json())
```

### 9.10 Middleware for Auth Guard

`middleware.ts` menggunakan `getSessionCookie` dari Better Auth — fast cookie-only check, berjalan di edge tanpa database call:

```typescript
// frontend/middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)
  if (!sessionCookie && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon).*)', '/']
}
```

> **PENTING:** `getSessionCookie` hanya cek **keberadaan** cookie, bukan validitasnya. Validasi session penuh **wajib** dilakukan di setiap RSC page yang butuh auth:
>
> ```typescript
> // Di setiap protected RSC page
> const { data: session } = await authClient.getSession({
>   fetchOptions: { headers: Object.fromEntries(await headers()) }
> })
> if (!session) redirect('/login')
> // role check
> if (session.user.role !== 'admin') redirect('/dashboard')
> ```

---

## 10. MCP & Best Practices

### 10.1 Always Use MCP Tools for Best Practices

When implementing, use the MCP tools in this priority order:

1. **Prisma MCP** (`@prisma/mcp-server`) — for schema validation, query optimization hints, migration generation
2. **Next.js docs** — via Cursor Composer's web search for App Router patterns
3. **NestJS docs** — for module, guard, pipe patterns

### 10.2 Code Style Standards

- **DTOs**: All request bodies validated with `class-validator` + `class-transformer` in NestJS
- **Response shape**: Consistent `{ data, meta }` envelope for paginated responses
- **Error handling**: Global `HttpExceptionFilter` in NestJS; axios interceptor on frontend
- **Environment vars**: `.env` for backend (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `UPLOAD_BASE_URL`); `NEXT_PUBLIC_API_URL` for frontend
- **TypeScript strict mode**: Both frontend and backend use `"strict": true`

### 10.3 Database Migration Workflow

```bash
# Generate migration after schema change
npx prisma migrate dev --name <descriptive-name>

# For production (via Aiven direct URL)
npx prisma migrate deploy
```

### 10.4 Seeding

`backend/prisma/seed.ts` harus membuat:
1. Default admin user via Better Auth API:

```typescript
import { auth } from '../src/auth/auth'

await auth.api.signUpEmail({
  body: {
    email: 'admin@simpro.id',
    name: 'Administrator',
    password: 'Admin@123',
    username: 'admin',
    role: 'admin',
    status: 'active',
  }
})
```

2. Default settings (system_name: "SIMPRO", currency: "IDR", currency_symbol: "Rp", timezone: "Asia/Jakarta", date_format: "DD/MM/YYYY", hourly_rate: "0", tax_rate: "11")

---

## 11. Implementation Phases & Task Checklist

### Phase 0: Project Setup

- [ ] Initialize workspace root `package.json` with npm workspaces
- [ ] Initialize NestJS app in `backend/` (`nest new backend`)
- [ ] Initialize Next.js app in `frontend/` (`npx create-next-app@latest frontend --typescript --tailwind --app`)
- [ ] Install and configure Shadcn UI in `frontend/` (`npx shadcn-ui@latest init`)
- [ ] Add Shadcn components: `button`, `input`, `card`, `sheet`, `dialog`, `alert-dialog`, `table`, `badge`, `avatar`, `dropdown-menu`, `toast`, `skeleton`, `form`, `select`, `checkbox`, `tabs`, `separator`, `popover`, `calendar`, `scroll-area`, `textarea`, `switch`, `label`
- [ ] Install Prisma in `backend/` (`npm install prisma @prisma/client`)
- [ ] Configure `DATABASE_URL` dan `DIRECT_DATABASE_URL` in `backend/.env`
- [ ] Install Better Auth: `npm install better-auth @thallesp/nestjs-better-auth` di `backend/`
- [ ] Buat `backend/src/auth/auth.ts` — Better Auth instance (prismaAdapter + username plugin + additionalFields)
- [ ] Jalankan `npx auth@latest generate` untuk generate schema Better Auth (user, session, account, verification tables)
- [ ] Integrasikan output generate ke `backend/prisma/schema.prisma` (tambahkan model lain dari Section 4)
- [ ] Run `prisma migrate dev --name init`
- [ ] Buat folder `backend/uploads/{avatars,attachments,maintenance,clients}/`
- [ ] Tambah `uploads/*` ke `backend/.gitignore`; buat `uploads/.gitkeep`
- [ ] Install backend deps: `@nestjs/serve-static`, `uuid`, `class-validator`, `class-transformer`
- [ ] Write and run seed (`backend/prisma/seed.ts`) — buat admin user via `auth.api.signUpEmail()`
- [ ] Install frontend deps: `better-auth`, `axios`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `@hookform/resolvers`, `lucide-react`, `recharts`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `react-gantt-task`, `date-fns`, `react-markdown`, `remark-gfm`
- [ ] Buat `frontend/src/lib/auth-client.ts` — `createAuthClient` dengan `usernameClient` plugin

---

### Phase 1: Core Infrastructure

- [ ] **Backend:** `PrismaModule` (global, singleton `PrismaService`)
- [ ] **Backend:** `app.module.ts` — `AuthModule.forRoot({ auth })` + `ServeStaticModule` (mount `/uploads`)
- [ ] **Backend:** `main.ts` — set `bodyParser: false` (wajib untuk Better Auth)
- [ ] **Backend:** `UsersModule` — CRUD users (admin), update profile, avatar URL save
- [ ] **Backend:** `ActivityLogService` — shared injectable, accepts Prisma tx client
- [ ] **Backend:** `NotificationService` — shared injectable, bulk `createMany`
- [ ] **Backend:** Global `HttpExceptionFilter` + `ValidationPipe`
- [ ] **Backend:** CORS configured untuk frontend URL (`http://localhost:3000`) dengan `credentials: true`
- [ ] **Frontend:** axios client dengan base URL + `withCredentials: true` (session via cookie)
- [ ] **Frontend:** Zustand `uiStore` (sidebar open/close, modals)
- [ ] **Frontend:** `QueryClientProvider` wrap in root layout
- [ ] **Frontend:** `middleware.ts` — `getSessionCookie()` dari `better-auth/cookies` untuk optimistic redirect
- [ ] **Frontend:** `(main)/layout.tsx` — `Sidebar` + `Topbar` + mobile nav; session check via `authClient.getSession()`
- [ ] **Frontend:** `Sidebar` component dengan role-gated nav items (baca `session.user.role`)
- [ ] **Frontend:** `Topbar` component dengan `NotificationBell` + user menu (signOut)
- [ ] **Frontend:** Login page — form, submit via `authClient.signIn.username()`, redirect by role

---

### Phase 2: Projects & Tasks (Core Workflow)

- [ ] **Backend:** `ProjectsModule` — CRUD, members management, hierarchy
- [ ] **Backend:** `TasksModule` — full CRUD, assignees, bulk update, CSV export
- [ ] **Backend:** `SprintsModule` — CRUD, activate, complete (with transaction)
- [ ] **Frontend:** `/projects` — card list, filters, hierarchy tree
- [ ] **Frontend:** `ProjectForm` — create/edit modal
- [ ] **Frontend:** `/projects/[id]` — overview page with edit banner
- [ ] **Frontend:** `/projects/[id]/backlog` — `TaskTable`, bulk bar, `TaskDetail` slide-over, 60s auto-refresh
- [ ] **Frontend:** `TaskForm` — create/edit modal
- [ ] **Frontend:** `TaskDetail` — comments, checklists, attachments, time log, dependencies
- [ ] **Frontend:** `/projects/[id]/board` — `KanbanBoard` with `@dnd-kit`, drag updates status
- [ ] **Frontend:** `/projects/[id]/sprint` — `SprintPanel`, activate/complete flow
- [ ] **Frontend:** Task CSV export button → blob download

---

### Phase 3: Maintenance & Meetings

- [ ] **Backend:** `MaintenanceModule` — CRUD, ticket number generation, role-scoped select, attachments
- [ ] **Backend:** `MeetingsModule` — CRUD, agenda, notulensi, action items, convert-to-task
- [ ] **Frontend:** `/projects/[id]/maintenance` — board (DnD) + list toggle
- [ ] **Frontend:** `TicketForm` — create/edit with multi-PIC, severity, all fields
- [ ] **Frontend:** `/projects/[id]/maintenance/report` — filtered table + charts + print
- [ ] **Frontend:** `/meetings` — calendar view + list fallback
- [ ] **Frontend:** `/meetings/[id]` — agenda list, notulensi editor, action items, attendees

---

### Phase 4: Reports & Dashboard

- [ ] **Backend:** `ReportsModule` — 5 report types + dashboard aggregate
- [ ] **Frontend:** `/dashboard` — stats cards, charts (`Suspense`), activity feed, my tasks
- [ ] **Frontend:** `/projects/[id]/reports` — 5 report tabs with Recharts

---

### Phase 5: Supporting Features

- [ ] **Backend:** `DiscussionsModule` — CRUD, replies, pin, attachments
- [ ] **Backend:** `ClientsModule` — CRUD
- [ ] **Backend:** `AssetsModule` — CRUD
- [ ] **Backend:** `NotificationsModule` — list, mark-read, unread count
- [ ] **Backend:** `ActivityLogModule` — read endpoints
- [ ] **Backend:** `NotesModule` — CRUD, folders, shares, audit
- [ ] **Backend:** `SettingsModule` — get/update
- [ ] **Backend:** `UploadModule` — Multer disk storage (`POST /upload`, `DELETE /upload`); category routing; 10MB limit; file type filter (jpg/png/gif/webp/pdf/doc/docx/xls/xlsx/zip)
- [ ] **Frontend:** `/projects/[id]/discussion` — posts, replies, markdown, pin
- [ ] **Frontend:** `/clients` — CRUD table
- [ ] **Frontend:** `/assets` — CRUD table
- [ ] **Frontend:** `/members` — CRUD table, role/status management
- [ ] **Frontend:** `/notifications` — infinite scroll list, mark all read
- [ ] **Frontend:** `/notes` — markdown editor, folder sidebar, sharing modal, audit trail
- [ ] **Frontend:** `/settings` — settings form with all system preferences
- [ ] **Frontend:** `/guide` — static user guide content
- [ ] **Frontend:** `/project-guide` — PM methodology guide (admin/pm only)

---

### Phase 6: Gantt

- [ ] **Frontend:** `/projects/[id]/gantt` — timeline component (react-gantt-task or custom), task drag/resize updates `startDate`/`dueDate`

---

### Phase 7: Polish & QA

- [ ] Verify 1:1 feature parity with `_reference/` for every route
- [ ] Verify all role-gated features match reference behavior
- [ ] Test all Prisma indexes under query load
- [ ] Lighthouse audit for Next.js performance
- [ ] Ensure all CSV exports work with UTF-8 BOM
- [ ] Ensure print/PDF flow works for reports and maintenance-report
- [ ] Mobile responsiveness (reference had mobile nav)
- [ ] Error boundaries on Client components
- [ ] Loading skeletons on all pages
- [ ] Toast notifications for all mutations (success + error)
- [ ] Confirm dialog on all destructive actions

---

## Environment Variables Reference

### Backend (`backend/.env`)

```env
# Database (Aiven PostgreSQL)
DATABASE_URL="postgres://avnadmin:<password>@simpro-pg-simpro-v2.d.aivencloud.com:25463/defaultdb?sslmode=require"
DIRECT_DATABASE_URL="postgres://avnadmin:<password>@simpro-pg-simpro-v2.d.aivencloud.com:25463/defaultdb?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="<min 32 chars — generate: openssl rand -base64 32>"
BETTER_AUTH_URL="http://localhost:3001"

# File Upload (local disk)
UPLOAD_BASE_URL="http://localhost:3001"
UPLOAD_DIR="./uploads"

# Server
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

## Notes for Cursor Composer 2

1. **Implement modules one at a time** — start with Phase 0 → Phase 1 fully before Phase 2.
2. **Schema first** — jalankan `npx auth@latest generate` untuk mendapatkan schema Better Auth, lalu tambahkan model lain dari Section 4, baru `prisma migrate dev`.
3. **Use `select` in every Prisma query** — never use bare `findMany` without explicit field selection.
4. **All mutations** (create/update/delete) must call `ActivityLogService.log()` dan optionally `NotificationService.createMany()` inside the same Prisma transaction.
5. **Feature completeness target:** every route, every action, every role-gate in the reference must exist in SIMPRO. Use the route table in Section 7 as a checklist.
6. **Shadcn components** should be added via `npx shadcn-ui@latest add <component>` — do not copy-paste raw component code.
7. **API error responses** from NestJS should always use `HttpException` (or built-in exceptions like `NotFoundException`) — the global filter will format them consistently.
8. **Better Auth session** disimpan di httpOnly cookie yang di-set oleh NestJS. Frontend axios harus menggunakan `withCredentials: true`. Gunakan `authClient.signIn.username()` untuk login, `useSession()` untuk client components, `authClient.getSession()` untuk RSC.
9. **File uploads**: frontend call `POST /upload` (multipart/form-data, field `file` + `category`). NestJS simpan ke `backend/uploads/<category>/<uuid>.ext`. File diakses via `http://localhost:3001/uploads/<category>/<uuid>.ext`. Field `url` di database menyimpan path relatif (`/uploads/...`).
10. **Better Auth user fields**: field `name` (bukan `fullName`) dan `image` (bukan `avatar`) — sesuaikan semua select query dan UI component.
11. **Role check di NestJS**: tidak pakai `@Roles()` decorator; cek `session.user.role` langsung di dalam service atau controller menggunakan `if/throw ForbiddenException`.
12. **Progress field on Project** is a derived value — compute dari tasks done/total dan update di setiap task status change (inside transaction).
