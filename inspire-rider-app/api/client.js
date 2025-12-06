import axios from 'axios';

// Replace with your machine's IP address or ngrok URL
// For Android Emulator, use 'http://10.0.2.2:8000'
// For iOS Simulator, use 'http://localhost:8000'
// For physical device, use your LAN IP e.g., 'http://192.168.1.x:8000'
const BASE_URL = 'https://a7a9e2fb8cc56a.lhr.life'; 

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds timeout for slow uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;
