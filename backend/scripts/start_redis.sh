#!/bin/bash

echo "Starting Redis server for WebSocket functionality..."

# Check if Redis is already running
if redis-cli ping > /dev/null 2>&1; then
    echo "Redis is already running on port 6379"
    exit 0
fi

# Try to start Redis server
echo "Starting Redis server..."
redis-server --port 6379 --daemonize yes

# Wait a moment for Redis to start
sleep 2

# Check if Redis started successfully
if redis-cli ping > /dev/null 2>&1; then
    echo "Redis server started successfully on port 6379"
else
    echo "Failed to start Redis server. Please install Redis or use Docker."
    echo "You can install Redis from: https://redis.io/download"
    echo "Or use Docker: docker run -d -p 6379:6379 redis:alpine"
    exit 1
fi
