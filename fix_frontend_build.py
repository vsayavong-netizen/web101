#!/usr/bin/env python
"""
Fix frontend build issues and rebuild with correct API configuration
"""

import os
import sys
import subprocess
import json

def fix_frontend_build():
    """Fix frontend build and API configuration"""
    
    print("🔧 Fixing Frontend Build Issues")
    print("=" * 50)
    
    # Navigate to frontend directory
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    if not os.path.exists(frontend_dir):
        print("❌ Frontend directory not found")
        return False
    
    os.chdir(frontend_dir)
    print(f"📁 Working in: {os.getcwd()}")
    
    # Check if node_modules exists
    if not os.path.exists('node_modules'):
        print("📦 Installing dependencies...")
        try:
            subprocess.run(['npm', 'install'], check=True)
            print("✅ Dependencies installed")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            return False
    
    # Create .env file for production
    env_content = """# Production Environment Variables
VITE_API_BASE_URL=https://eduinfo.online
VITE_WS_URL=wss://eduinfo.online/ws/
VITE_DEBUG=false
"""
    
    with open('.env.production', 'w') as f:
        f.write(env_content)
    print("✅ Created .env.production file")
    
    # Update vite.config.ts to handle API base URL correctly
    vite_config = """import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: env.VITE_API_BASE_URL || 'https://eduinfo.online',
            changeOrigin: true,
            secure: true,
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.log('proxy error', err);
              });
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log('Sending Request to the Target:', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req, _res) => {
                console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
              });
            },
          },
          '/ws': {
            target: env.VITE_WS_URL || 'wss://eduinfo.online',
            ws: true,
            changeOrigin: true,
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
        'process.env.VITE_DEBUG': JSON.stringify(env.VITE_DEBUG),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@components': path.resolve(__dirname, './components'),
          '@utils': path.resolve(__dirname, './utils'),
          '@hooks': path.resolve(__dirname, './hooks'),
          '@context': path.resolve(__dirname, './context'),
          '@config': path.resolve(__dirname, './config'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: mode === 'development',
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              ui: ['@mui/material', '@mui/icons-material'],
            }
          }
        }
      },
      base: '/',
    };
});
"""
    
    with open('vite.config.ts', 'w') as f:
        f.write(vite_config)
    print("✅ Updated vite.config.ts")
    
    # Build frontend for production
    print("🏗️ Building frontend for production...")
    try:
        # Set environment variables for build
        env = os.environ.copy()
        env['VITE_API_BASE_URL'] = 'https://eduinfo.online'
        env['VITE_WS_URL'] = 'wss://eduinfo.online/ws/'
        env['VITE_DEBUG'] = 'false'
        
        subprocess.run(['npm', 'run', 'build'], check=True, env=env)
        print("✅ Frontend built successfully")
        
        # Check if dist directory exists and has files
        if os.path.exists('dist'):
            files = os.listdir('dist')
            print(f"📁 Built files: {len(files)} files")
            for file in files[:5]:  # Show first 5 files
                print(f"   - {file}")
        else:
            print("❌ Dist directory not found")
            return False
            
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Build failed: {e}")
        return False

def create_build_script():
    """Create build script for Render"""
    
    build_script = """#!/bin/bash
# Frontend Build Script for Render

echo "🚀 Building Frontend for Production..."

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set production environment variables
export VITE_API_BASE_URL=https://eduinfo.online
export VITE_WS_URL=wss://eduinfo.online/ws/
export VITE_DEBUG=false

# Build for production
echo "🏗️ Building frontend..."
npm run build

# Check build output
if [ -d "dist" ]; then
    echo "✅ Frontend built successfully"
    ls -la dist/
else
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "🎉 Frontend build completed!"
"""
    
    with open('build_frontend.sh', 'w') as f:
        f.write(build_script)
    
    print("✅ Created build_frontend.sh script")

if __name__ == '__main__':
    print("🔧 Frontend Build Fix Tool")
    print("=" * 50)
    
    # Fix frontend build
    success = fix_frontend_build()
    
    if success:
        # Create build script
        create_build_script()
        
        print("\n📋 Next steps:")
        print("1. Commit and push changes")
        print("2. Redeploy on Render")
        print("3. Check browser console for errors")
        print("4. Test API endpoints")
        print("\n🎉 Frontend build fix completed!")
    else:
        print("\n💥 Fix failed! Check the errors above.")
        sys.exit(1)
