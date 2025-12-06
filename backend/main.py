from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from uuid import uuid4
import os
from dotenv import load_dotenv
from datetime import datetime
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---

class Order(BaseModel):
    id: str
    order_no: str
    rider_id: str
    customer_name: str
    address: str
    cod_amount: float
    status: str
    payment_method: Optional[str] = None
    payment_status: str
    qr_id: Optional[str] = None
    pod_url: Optional[str] = None
    created_at: datetime

class OrderStatusUpdate(BaseModel):
    status: str
    pod_url: Optional[str] = None

class PaymentQRRequest(BaseModel):
    order_id: str
    amount: float

class PaymentQRResponse(BaseModel):
    qr: str
    qr_id: str
    expires_at: datetime

class MockConfirmRequest(BaseModel):
    qr_id: str

class WebhookLog(BaseModel):
    source: str
    payload: dict

# --- Mock Data ---
# Removed in favor of Supabase

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Inspire Rider API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/orders")
def list_orders(rider_id: str = Query(..., description="ID of the rider")):
    response = supabase.table('orders').select('*').eq('rider_id', rider_id).execute()
    return response.data

@app.get("/orders/{order_id}")
def get_order(order_id: str):
    try:
        response = supabase.table('orders').select('*').eq('id', order_id).single().execute()
        return response.data
    except Exception:
        raise HTTPException(status_code=404, detail="Order not found")

@app.patch("/orders/{order_id}/status")
def update_order_status(order_id: str, update: OrderStatusUpdate):
    data = {'status': update.status}
    if update.pod_url:
        data['pod_url'] = update.pod_url

    response = supabase.table('orders').update(data).eq('id', order_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Log event
    supabase.table('events').insert({
        "id": str(uuid4()),
        "order_id": order_id,
        "type": "status_change",
        "metadata": {"new_status": update.status}
    }).execute()
    
    return {"status": "success", "order": response.data[0]}

@app.post("/payment/qr", response_model=PaymentQRResponse)
def generate_qr(request: PaymentQRRequest):
    # Call PayRex or similar API here
    qr_id = str(uuid4())
    
    # Save qr_id to the order so we can look it up later
    supabase.table('orders').update({'qr_id': qr_id}).eq('id', request.order_id).execute()

    # Mock response
    return {
        "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", # 1x1 pixel
        "qr_id": qr_id,
        "expires_at": datetime.now()
    }

@app.post("/payment/mock-confirm")
def mock_confirm_payment(request: MockConfirmRequest):
    # Find order with this qr_id and update status
    response = supabase.table('orders').update({
        'payment_status': 'PAID',
        'status': 'COMPLETED'
    }).eq('qr_id', request.qr_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Order not found for this QR")

    return {"status": "paid", "qr_id": request.qr_id}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_content = await file.read()
    file_path = f"pod/{uuid4()}_{file.filename}"
    try:
        # Ensure 'pod' bucket exists in Supabase Storage
        supabase.storage.from_('pod').upload(file_path, file_content)
        public_url = supabase.storage.from_('pod').get_public_url(file_path)
        return {"url": public_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/payment/webhook")
def webhook_receiver(payload: dict):
    supabase.table('webhook_logs').insert({'source': 'payrex', 'payload': payload}).execute()
    return {"status": "received"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
