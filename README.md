# LocalShare

A simple and efficient file sharing web application built with Nuxt.js that allows you to:
- Upload and manage files in a hierarchical folder structure
- Create folders and subfolders
- Download files directly from the web interface
- Delete files and folders
- Auto-refresh to see changes in real-time

## Prerequisites

- Node.js 16.x or later
- NPM, Yarn, PNPM or Bun package manager
- A modern web browser

## Setup

1. Install dependencies:
   ```bash
   # Using npm
   npm install

   # Using yarn
   yarn install

   # Using pnpm
   pnpm install

   # Using bun
   bun install
   ```

2. Configure the file storage path:
   - Add storage path to `UPLOAD_DIR` variable in `.env`

3. Start the development server:
   ```bash
   # Using npm
   npm run dev

   # Using yarn
   yarn dev

   # Using pnpm
   pnpm dev

   # Using bun
   bun run dev
   ```

The application will be available at `http://localhost:80`
