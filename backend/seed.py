import os
from uuid import uuid4
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
    print("Please create backend/.env with your Supabase credentials first.")
    exit(1)

supabase: Client = create_client(url, key)

def seed_data():
    print("Seeding data...")

    # 1. Create a Rider with a fixed UUID for testing
    # Using a fixed UUID so we can hardcode it in the frontend for the demo
    rider_id = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" 
    
    # Check if rider exists
    try:
        existing_rider = supabase.table("riders").select("*").eq("id", rider_id).execute()
        if not existing_rider.data:
            print(f"Creating rider with ID: {rider_id}")
            supabase.table("riders").insert({
                "id": rider_id,
                "name": "Demo Rider",
                "phone": "09123456789"
            }).execute()
        else:
            print(f"Rider {rider_id} already exists.")
    except Exception as e:
        print(f"Error checking/creating rider: {e}")
        return

    # 2. Create Orders
    orders = [
        {
            "id": str(uuid4()),
            "order_no": "ORD-101",
            "rider_id": rider_id,
            "customer_name": "Alice Johnson",
            "address": "Unit 101, Blue Residences, Katipunan Ave",
            "cod_amount": 550.00,
            "status": "PENDING",
            "payment_status": "PENDING",
            "created_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid4()),
            "order_no": "ORD-102",
            "rider_id": rider_id,
            "customer_name": "Bob Smith",
            "address": "123 Mango St, Quezon City",
            "cod_amount": 120.50,
            "status": "PENDING",
            "payment_status": "PENDING",
            "created_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid4()),
            "order_no": "ORD-103",
            "rider_id": rider_id,
            "customer_name": "Charlie Brown",
            "address": "456 Narra St, Marikina",
            "cod_amount": 1500.00,
            "status": "COMPLETED",
            "payment_status": "PAID",
            "created_at": datetime.now().isoformat()
        }
    ]

    for order in orders:
        try:
            print(f"Creating order {order['order_no']}")
            supabase.table("orders").insert(order).execute()
        except Exception as e:
            print(f"Error creating order {order['order_no']}: {e}")

    print("\nSeeding complete!")
    print(f"Rider ID: {rider_id}")

if __name__ == "__main__":
    seed_data()
