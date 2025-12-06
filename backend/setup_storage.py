import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
    exit(1)

supabase: Client = create_client(url, key)

def setup_storage():
    bucket_name = "pod"
    print(f"Checking storage bucket '{bucket_name}'...")

    try:
        buckets = supabase.storage.list_buckets()
        existing = next((b for b in buckets if b.name == bucket_name), None)

        if not existing:
            print(f"Creating bucket '{bucket_name}'...")
            supabase.storage.create_bucket(bucket_name, options={"public": True})
            print("Bucket created successfully!")
        else:
            print(f"Bucket '{bucket_name}' already exists.")
            
            # Check if public
            if not existing.public:
                print(f"Warning: Bucket '{bucket_name}' is NOT public. You may need to update it in the Supabase dashboard.")
            else:
                print(f"Bucket '{bucket_name}' is public.")

    except Exception as e:
        print(f"Error setting up storage: {e}")

if __name__ == "__main__":
    setup_storage()
