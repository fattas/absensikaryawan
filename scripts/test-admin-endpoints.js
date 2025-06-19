const fetch = require('node-fetch')

async function testAdminEndpoints() {
  const baseURL = 'http://localhost:3000'
  
  // Mock admin session cookie
  const adminCookie = JSON.stringify({
    id: "admin-test-123",
    role: "ADMIN", 
    email: "admin@test.com",
    name: "Test Admin"
  })
  
  console.log('=== Testing Admin API Endpoints ===')
  
  const endpoints = [
    { 
      name: 'Point Activities (GET)', 
      url: '/api/admin/points/activities',
      method: 'GET'
    },
    { 
      name: 'Rewards (GET)', 
      url: '/api/admin/rewards',
      method: 'GET'
    },
    { 
      name: 'Analytics (GET)', 
      url: '/api/admin/points/analytics',
      method: 'GET'
    }
  ]
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing ${endpoint.name}...`)
      console.log(`   URL: ${endpoint.url}`)
      
      const response = await fetch(`${baseURL}${endpoint.url}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `admin-session=${adminCookie}`
        }
      })
      
      console.log(`   Status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ Success!`)
        console.log(`   Response format: ${JSON.stringify(Object.keys(data))}`)
        
        if (data.data && Array.isArray(data.data)) {
          console.log(`   📊 Data count: ${data.data.length} items`)
          if (data.data.length > 0) {
            console.log(`   🔹 Sample item keys: ${JSON.stringify(Object.keys(data.data[0]))}`)
          }
        } else if (data.data) {
          console.log(`   📊 Data type: ${typeof data.data}`)
          console.log(`   🔹 Data keys: ${JSON.stringify(Object.keys(data.data))}`)
        }
      } else {
        const errorText = await response.text()
        console.log(`   ❌ Failed!`)
        console.log(`   Error: ${errorText}`)
      }
    } catch (error) {
      console.log(`   💥 Request failed: ${error.message}`)
    }
  }
  
  console.log('\n=== Testing Complete ===')
}

// Wait for server to start
console.log('Waiting for server to start...')
setTimeout(testAdminEndpoints, 5000) 