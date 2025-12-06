const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();
const port = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const payrexSecretKey = process.env.PAYREX_SECRET_KEY;

if (!supabaseUrl || !supabaseKey || !payrexSecretKey) {
  console.error("Missing environment variables. Check .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const payrex = require('payrex-node')(payrexSecretKey);

// Multer for file uploads (memory storage for simple upload to Supabase)
const upload = multer({ storage: multer.memoryStorage() });

// --- Endpoints ---

app.get('/', (req, res) => {
  res.json({ message: "Inspire Rider API is running (Node.js)" });
});

app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

app.get('/orders', async (req, res) => {
  const { rider_id } = req.query;
  if (!rider_id) return res.status(400).json({ detail: "Missing rider_id" });

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('rider_id', rider_id);

  if (error) return res.status(500).json({ detail: error.message });

  // Temporary: Inject coordinates if missing so they show up on the map
  // In production, these should come from the database (latitude/longitude or gps_point)
  const enrichedData = data.map((order, index) => {
    if (!order.latitude || !order.longitude) {
       const mocks = [
         { latitude: 14.5995, longitude: 120.9842 }, // Manila
         { latitude: 14.5547, longitude: 121.0244 }, // Makati
         { latitude: 14.6091, longitude: 121.0223 }, // Cubao
         { latitude: 14.6333, longitude: 121.0439 }, // Quezon City
         { latitude: 14.5378, longitude: 121.0014 }  // Pasay
       ];
       const mock = mocks[index % mocks.length];
       return { ...order, ...mock };
    }
    return order;
  });

  res.json(enrichedData);
});

app.get('/orders/:order_id', async (req, res) => {
  const { order_id } = req.params;
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (error || !data) return res.status(404).json({ detail: "Order not found" });
  res.json(data);
});

app.patch('/orders/:order_id/status', async (req, res) => {
  const { order_id } = req.params;
  const { status, pod_url, latitude, longitude } = req.body;

  const updateData = { status };
  if (pod_url) updateData.pod_url = pod_url;
  
  if (status === 'COMPLETED') {
    updateData.completed_at = new Date().toISOString();
    if (latitude && longitude) {
      updateData.completed_latitude = latitude;
      updateData.completed_longitude = longitude;
    }
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', order_id)
    .select();

  if (error || !data || data.length === 0) {
    return res.status(404).json({ detail: "Order not found or update failed" });
  }

  // Log event
  await supabase.from('events').insert({
    id: uuidv4(),
    order_id: order_id,
    type: "status_change",
    metadata: { 
      new_status: status,
      location: (latitude && longitude) ? { lat: latitude, lng: longitude } : null
    }
  });

  res.json({ status: "success", order: data[0] });
});

app.post('/payment/qr', async (req, res) => {
  const { order_id, amount } = req.body;

  try {
    // Switch back to Checkout Sessions to get a hosted URL for the QR code
    // We include 'currency' and 'amount' at the top level if line_items fails, 
    // or ensure line_items is structured correctly.
    // Based on the error "currency is required", we'll try providing it explicitly.
    
    const sessionPayload = {
      payment_methods: ["qrph"],
      success_url: "https://google.com", // Replace with your app's deep link or success page
      cancel_url: "https://google.com",
      description: `Payment for Order ${order_id}`,
      currency: "PHP", // Added top-level currency as requested by the error
      line_items: [
        {
          name: `Order #${order_id}`,
          quantity: 1,
          amount: Math.round(amount * 100), // Centavos
          currency: "PHP",
          description: `Payment for Order ${order_id}`
        }
      ]
    };

    console.log("Creating Checkout Session with payload:", JSON.stringify(sessionPayload, null, 2));

    const session = await payrex.checkoutSessions.create(sessionPayload);

    console.log("Checkout Session created:", session.id);
    console.log("Checkout URL:", session.url);

    const checkoutUrl = session.url;
    const sessionId = session.id;
    
    // Generate QR for the Checkout URL
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkoutUrl)}`;

    await supabase.from('orders').update({ qr_id: sessionId }).eq('id', order_id);

    res.json({
      qr: qrImage,
      qr_id: sessionId,
      checkout_url: checkoutUrl,
      expires_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("PayRex Error:", error);
    // Fallback: If Checkout Session fails, try to return a helpful error
    res.status(500).json({ detail: "PayRex Error: " + (error.message || JSON.stringify(error)) });
  }
});

app.get('/orders/:order_id/payment-status', async (req, res) => {
  const { order_id } = req.params;

  // 1. Get Session ID
  const { data: order, error } = await supabase
    .from('orders')
    .select('qr_id')
    .eq('id', order_id)
    .single();

  if (error || !order || !order.qr_id) {
    return res.status(404).json({ detail: "Order or Payment Session not found" });
  }

  const sessionId = order.qr_id;

  // 2. Check PayRex Status using SDK
  try {
    // Use checkoutSessions.retrieve
    const session = await payrex.checkoutSessions.retrieve(sessionId);
    
    // Self-healing: If PayRex says paid but we haven't processed it (or just to be sure), update DB
    if (session.payment_status === 'paid') {
       await supabase.from('orders').update({
          payment_status: 'PAID',
          payment_method: 'QRPH'
       }).eq('id', order_id);
    }

    res.json({
      status: session.payment_status, // 'paid', 'unpaid'
      url: session.url
    });
  } catch (error) {
    console.error("PayRex Status Error:", error);
    res.status(500).json({ detail: error.message || "Failed to retrieve status" });
  }
});


app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ detail: "No file uploaded" });

  const fileContent = req.file.buffer;
  const filePath = `pod/${uuidv4()}_${req.file.originalname}`;

  const { data, error } = await supabase.storage
    .from('pod')
    .upload(filePath, fileContent, {
      contentType: req.file.mimetype
    });

  if (error) {
    console.error("Supabase Upload Error:", error);
    return res.status(500).json({ detail: error.message });
  }

  const { data: publicUrlData } = supabase.storage
    .from('pod')
    .getPublicUrl(filePath);

  res.json({ url: publicUrlData.publicUrl });
});

app.post('/payment/webhook', async (req, res) => {
  const payload = req.body;

  try {
    await supabase.from('webhook_logs').insert({ source: 'payrex', payload });
  } catch (e) {
    // ignore log error
  }

  const eventType = payload.type;
  const data = payload.data?.object || {};

  if (eventType === 'checkout.session.completed') {
    const sessionId = data.id;
    await supabase.from('orders').update({
      payment_status: 'PAID',
      payment_method: 'QRPH'
    }).eq('qr_id', sessionId);
    
    console.log(`Payment confirmed for Session ${sessionId}`);
  }

  res.json({ status: "received" });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
