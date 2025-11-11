#!/usr/bin/env python3
"""
Simple WebSocket test script to verify connections work
"""
import asyncio
import websockets
import json
import sys

async def test_websocket():
    """Test WebSocket connection to notifications endpoint"""
    uri = "ws://localhost:8000/ws/notifications/?token=test_token"

    try:
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connection established successfully!")

            # Send a test message
            test_message = {
                "action": "get_notifications"
            }
            await websocket.send(json.dumps(test_message))
            print("📤 Sent test message:", test_message)

            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print("📥 Received response:", response)
            except asyncio.TimeoutError:
                print("⚠️ No response received within 5 seconds")

            # Close connection
            await websocket.close()
            print("🔚 WebSocket connection closed")

    except Exception as e:
        print(f"❌ WebSocket connection failed: {e}")
        return False

    return True

if __name__ == "__main__":
    print("🧪 Testing WebSocket connection...")
    success = asyncio.run(test_websocket())
    if success:
        print("✅ WebSocket test passed!")
        sys.exit(0)
    else:
        print("❌ WebSocket test failed!")
        sys.exit(1)