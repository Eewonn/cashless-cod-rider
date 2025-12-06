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

def reset_data():
    rider_id = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
    print(f"Resetting orders for rider {rider_id}...")

    try:
        # Update all orders for this rider to PENDING
        response = supabase.table("orders").update({
            "status": "PENDING",
            "payment_status": "PENDING",
            "qr_id": None,
            "pod_url": None
        }).eq("rider_id", rider_id).execute()
        
        print("Orders reset successfully!")
        
    except Exception as e:
        print(f"Error resetting orders: {e}")

if __name__ == "__main__":
    reset_data()
