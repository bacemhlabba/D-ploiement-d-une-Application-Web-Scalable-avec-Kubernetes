# Leave Management System

A comprehensive leave management solution for organizations to efficiently handle employee leave requests, approvals, and tracking.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or later)
- npm (v7 or later) or pnpm
- MySQL (v8 or later)

## Installation

1. Install dependencies:
   ```bash
   npm install
   # or if using pnpm
   pnpm install
   ```

## Database Setup

1. Create a MySQL database for the application:
   ```bash
   mysql -u root -p
   ```

2. In the MySQL prompt, run:
   ```sql
   CREATE DATABASE leave_management;
   CREATE USER 'leave_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON leave_management.* TO 'leave_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. Initialize the database schema:
   ```bash
   node scripts/init-mysql.js
   ```

## Configuration

1. Create a `.env` file in the project root directory:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and update the database connection details and other configuration settings:
   ```
   # Database Configuration
   DB_HOST=localhost
   DB_USER=leave_user
   DB_PASSWORD=your_password
   DB_DATABASE=leave_management
   
   # JWT Secret for authentication
   JWT_SECRET=your_jwt_secret_key
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   # or if using pnpm
   pnpm dev
   ```

2. Access the application at [http://localhost:3000](http://localhost:3000)

3. For production deployment:
   ```bash
   npm run build
   npm start
   # or if using pnpm
   pnpm build
   pnpm start
   ```

## Project Structure

```
leave-management/
├── app/                  # Next.js App Router components
├── backend/              # Backend API and database logic
│   ├── lib/              # Database connection utilities
│   ├── middleware/       # API middlewares
│   ├── models/           # Data models and SQL schema
│   └── utils/            # Backend utilities
├── components/           # Reusable UI components
│   └── ui/               # UI component library
├── frontend/             # Frontend-specific components
│   ├── components/       # Frontend-specific UI components
│   ├── contexts/         # React context providers
│   ├── lib/              # Frontend utilities
│   └── services/         # API service functions
├── hooks/                # Custom React hooks
├── lib/                  # Shared utilities
├── pages/                # Next.js Pages Router components
│   └── api/              # API routes
├── public/               # Static assets
├── scripts/              # Utility scripts
└── styles/               # Global styles
```

## Scripts

The project includes several utility scripts in the `scripts` directory:

- **Reset Next.js cache and dependencies**:
  ```bash
  node scripts/reset-next.cjs
  ```

- **Fix React version issues**:
  ```bash
  node scripts/fix-react-versions.cjs
  ```

- **Update database schema**:
  ```bash
  node scripts/update-role-enum.js
  ```

- **Add avatar column to users table**:
  ```bash
  node scripts/add-avatar-column.cjs
  ```

## Troubleshooting

### Module Not Found Issues

If you encounter "Module not found" errors, particularly with React components:

```bash
node scripts/fix-react-versions.cjs
node scripts/reset-next.cjs
```

### Database Connection Issues

Ensure your MySQL server is running and that the credentials in your `.env` file are correct.

### ES Module vs CommonJS Issues

Some scripts use CommonJS (`require`) syntax. If you encounter errors like `require is not defined in ES module scope`, make sure to use the `.cjs` extension for CommonJS scripts.

### Next.js Build Issues

If you encounter issues with Next.js builds, try cleaning the cache:

```bash
rm -rf .next
# then rebuild
npm run build
# or
pnpm build
```


## Author

Bacem HLABBA & Amal Ben abedelghaffar