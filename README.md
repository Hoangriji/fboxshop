# 🛍️ Uside Shop - E-commerce Platform

Modern React e-commerce website for gaming gear and digital products with Firebase backend.

## Features
- Product catalog with filtering and sorting
- Wishlist management (localStorage persistence)
- Product detail pages
- Zalo payment integration
- Responsive design with 6 color themes
- Firebase backend with Cloudinary image optimization

## Tech Stack
- **Frontend**: React 19.1.1, TypeScript, Vite
- **State Management**: Zustand
- **UI**: Swiper (carousels), Framer Motion (animations)
- **Backend**: Firebase (Firestore, Storage)
- **Image Optimization**: Cloudinary

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Add your Firebase configuration to .env.local
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

> **Note**: Get Firebase credentials from [Firebase Console](https://console.firebase.google.com/) and add them to `.env.local`. Never commit this file to Git.