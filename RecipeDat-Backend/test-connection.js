import fetch from 'node-fetch';

async function testConnection() {
  try {
    console.log('🧪 Testing backend connection...');
    
    const response = await fetch('http://localhost:3001/api/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is responding!');
      console.log('Response:', data);
    } else {
      console.log('❌ Backend responded with error:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Failed to connect to backend:', error.message);
    console.log('Make sure your backend server is running on port 3001');
  }
}

testConnection();

