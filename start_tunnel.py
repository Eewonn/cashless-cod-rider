import subprocess
import re
import os
import sys

# Configuration
CLIENT_JS_PATH = "inspire-rider-app/api/client.js"
SSH_COMMAND = ["ssh", "-o", "StrictHostKeyChecking=no", "-R", "80:localhost:8000", "localhost.run"]

def update_client_js(new_url):
    try:
        if not os.path.exists(CLIENT_JS_PATH):
             print(f"❌ Error: Could not find {CLIENT_JS_PATH}")
             return

        with open(CLIENT_JS_PATH, 'r') as f:
            content = f.read()
        
        # Regex to find the BASE_URL line
        # Matches: const BASE_URL = '...';
        pattern = r"const BASE_URL = '[^']+';"
        replacement = f"const BASE_URL = '{new_url}';"
        
        new_content = re.sub(pattern, replacement, content)
        
        if new_content != content:
            with open(CLIENT_JS_PATH, 'w') as f:
                f.write(new_content)
            print(f"✅ Updated {CLIENT_JS_PATH} with new URL: {new_url}")
        else:
            print(f"⚠️ Could not find BASE_URL pattern in {CLIENT_JS_PATH}")
            
    except Exception as e:
        print(f"❌ Error updating client.js: {e}")

def main():
    print("🚀 Starting SSH Tunnel to localhost.run...")
    print("   (Press Ctrl+C to stop)")
    
    # Start the SSH process
    process = subprocess.Popen(
        SSH_COMMAND, 
        stdout=subprocess.PIPE, 
        stderr=subprocess.STDOUT, 
        text=True, 
        bufsize=1, 
        universal_newlines=True
    )

    url_found = False
    
    try:
        # Read output line by line
        for line in iter(process.stdout.readline, ''):
            print(line, end='') # Mirror output to console
            
            if not url_found:
                # Look for the URL in the output
                # Example output: "xxxx.lhr.life tunneled with tls termination, https://xxxx.lhr.life"
                match = re.search(r"(https://[a-z0-9]+\.lhr\.life)", line)
                if match:
                    new_url = match.group(1)
                    print(f"\n🔍 Tunnel URL found: {new_url}")
                    update_client_js(new_url)
                    url_found = True
                    print("⚡ You can now reload your Expo app.\n")

    except KeyboardInterrupt:
        print("\n🛑 Stopping tunnel...")
        process.terminate()
        sys.exit(0)

if __name__ == "__main__":
    main()
