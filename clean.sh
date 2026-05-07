#!/bin/bash

echo "🔥 Starting complete clean rebuild of HackLog..."


# Remove backend database
echo "🗑️ Removing backend database..."
rm -rf backend/database.sqlite
rm -rf backend/*.sqlite
rm -rf ~/.config/hacklog/database.sqlite  

# Remove release builds
echo "🗑️ Removing release builds..."
rm -rf release
rm -rf dist
rm -rf frontend/dist


# Remove all node_modules
echo "🗑️ Removing all node_modules..."
rm -rf node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules

# Remove package-lock.json files (optional - to get fresh dependencies)
echo "🗑️ Removing lock files (optional)..."
rm -f package-lock.json
rm -f backend/package-lock.json
rm -f frontend/package-lock.json


# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force || true


# Remove any .env cache files
echo "🗑️ Removing any .env cache..."
rm -f backend/.env.cache



# Reinstall root dependencies
echo "📦 Installing root dependencies..."
npm install


# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..


# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..


# Build frontend
echo "🏗️ Building frontend..."
cd frontend
npm run build
cd ..


# Stop any running processes
echo "🛑 Stopping any running processes..."
pkill -f "node" || true
pkill -f "electron" || true
