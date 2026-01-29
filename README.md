# Cycling App - Monorepo

A full-stack cycling social platform built with a monorepo architecture using **Turborepo**, **Next.js**, **Express**, and **Prisma**.

---

## 🏗 High-Level Architecture

This project is organized as a monorepo:
- **`apps/web`**: Frontend application built with Next.js 16, Tailwind CSS, and Lucide icons.
- **`apps/api`**: Backend REST API built with Express, Socket.io for real-time notifications, and Prisma ORM.
- **`apps/mobile`**: Mobile application built with Expo and React Native.
- **`packages/`**: Shared configurations and utilities.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed:
- **Node.js**: v18.0.0 or higher.
- **npm**: v10.0.0 or higher.
- **SQLite**: (Optional) The project uses SQLite for local development by default, which is self-contained.

---

## 🚀 Step-by-Step Installation

### 1. Clone & Install Dependencies
First, clone the repository and install all dependencies from the root directory. This will install packages for both the `web` and `api` applications.
```bash
npm install
```

### 2. Configure Environment Variables

#### Backend (API)
Navigate to `apps/api/` and create a `.env` file.
```env
# Database connection (SQLite)
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="your-secure-random-string"

# Server Port
PORT=4000
```

#### Frontend (Web)
Navigate to `apps/web/` and create a `.env.local` file.
```env
# API URL (Where your backend is running)
NEXT_PUBLIC_API_URL=https://cycling-app-nj8k.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://cycling-app-nj8k.onrender.com

# Site Metadata
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=CyclingApp
```

### 3. Database Initialization
This project uses **Prisma** as an ORM. You need to push the schema to your local SQLite database and generate the Prisma client.
```bash
# Inside apps/api or from root
npx prisma db push
npx prisma generate
```

---

## 🏃 Running the Application

### Development Mode
To start both the API and Web applications concurrently with hot-reloading:
```bash
# From the root directory
npm run dev
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000](http://localhost:4000)

### Mobile Application
To start the mobile app in development mode:
```bash
# From the root directory or inside apps/mobile
npm run start --filter=mobile
```
This will open the Expo Dev Tools/CLI, where you can choose to run on iOS, Android, or Web.

### Prisma Studio (GUI)
To view and edit your database data through a web interface:
```bash
# Inside apps/api
npx prisma studio
```
Accessible at: [http://localhost:5555](http://localhost:5555)

---

## 📦 Deployment (Render.com)

The easiest way to deploy this monorepo is using **Render Blueprints**.

### Option 1: Using Render Blueprint (Recommended)
1. Connect your GitHub repository to [Render](https://dashboard.render.com).
2. Render will automatically detect the `render.yaml` file.
3. Follow the prompts to create the blueprint.
4. Render will set up both the **API** and **Web** services, including a persistent disk for the SQLite database.

### Option 2: Manual Deployment

#### 1. Backend API (Web Service)
- **Runtime**: `Node`
- **Build Command**: `npm install && npx turbo run build --filter=api`
- **Start Command**: `node apps/api/dist/index.js`
- **Environment Variables**: 
  - `DATABASE_URL`: `file:/opt/render/project/src/apps/api/prisma/dev.db`
  - `JWT_SECRET`: (Your secret)
  - `PORT`: `4000`
- **Disk**: 
  - **Mount Path**: `/opt/render/project/src/apps/api/prisma`
  - **Size**: 1GB (minimum)

#### 2. Frontend Web (Web Service)
- **Runtime**: `Node`
- **Build Command**: `npm install && npx turbo run build --filter=web`
- **Start Command**: `npx turbo run start --filter=web`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: `https://cycling-app-nj8k.onrender.com`
  - `NEXT_PUBLIC_SOCKET_URL`: `https://cycling-app-nj8k.onrender.com`
  - `NEXT_PUBLIC_SITE_URL`: (The URL of your deployed web app)

---

## 🛠 Troubleshooting

- **Socket Connection Errors**: Ensure the `NEXT_PUBLIC_SOCKET_URL` in the frontend matches the absolute URL where the backend is hosted.
- **Prisma Client Issues**: If you see missing type errors, run `npx prisma generate` inside `apps/api`.
- **Node Version**: If you encounter installation errors, ensure you are using a consistent Node.js version (LTS recommended).
- **Environment Variables**: Next.js requires `NEXT_PUBLIC_` prefix for variables accessed on the client-side.
