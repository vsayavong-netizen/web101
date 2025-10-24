print("Testing basic Python execution...")
print("Current directory:", os.getcwd() if 'os' in globals() else "os not imported")

import os
print("Current directory:", os.getcwd())

# ทดสอบการอ่านไฟล์ .env
try:
    with open('.env', 'r') as f:
        lines = f.readlines()
        print(f"Found {len(lines)} lines in .env file")
        
        # หา superuser settings
        superuser_lines = [line for line in lines if 'SUPERUSER' in line]
        print(f"Found {len(superuser_lines)} superuser lines:")
        for line in superuser_lines:
            print(f"  {line.strip()}")
            
except Exception as e:
    print(f"Error reading .env: {e}")

print("Test completed!")
