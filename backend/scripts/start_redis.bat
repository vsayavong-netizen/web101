@echo off
echo Starting Redis server for WebSocket functionality...

REM Check if Redis is already running
redis-cli ping >nul 2>&1
if %errorlevel% == 0 (
    echo Redis is already running on port 6379
    goto :end
)

REM Try to start Redis server
echo Starting Redis server...
redis-server --port 6379 --daemonize yes

REM Wait a moment for Redis to start
timeout /t 2 /nobreak >nul

REM Check if Redis started successfully
redis-cli ping >nul 2>&1
if %errorlevel% == 0 (
    echo Redis server started successfully on port 6379
) else (
    echo Failed to start Redis server. Please install Redis or use Docker.
    echo You can install Redis from: https://redis.io/download
    echo Or use Docker: docker run -d -p 6379:6379 redis:alpine
)

:end
pause
