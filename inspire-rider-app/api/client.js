import axios from 'axios';

// Replace with your machine's IP address or ngrok URL
// For Android Emulator, use 'http://10.0.2.2:8000'
// For iOS Simulator, use 'http://localhost:8000'
// For physical device, use your LAN IP e.g., 'http://192.168.1.x:8000'
const BASE_URL = 'https://824390216a02d2.lhr.life'; 

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;
