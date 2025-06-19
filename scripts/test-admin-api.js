const fetch = require('node-fetch')

async function testAdminAPI() {
  const baseURL = 'http://localhost:3000'
  
  console.log('=== Testing Admin API Endpoints ===')
  
  // Test endpoints
  const endpoints = [
    { name: 'Point Activities', url: '/api/admin/points/activities' },
    { name: 'Rewards', url: '/api/admin/rewards' },
    { name: 'Analytics', url: '/api/admin/points/analytics' }
  ]
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting ${endpoint.name}...`)
      
      const response = await fetch(`${baseURL}${endpoint.url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'admin-session={"id":"test","role":"ADMIN","email":"admin@test.com"}'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✓ ${endpoint.name}: Success`)
        console.log(`  Data count: ${data.data ? data.data.length : 'N/A'}`)
      } else {
        const error = await response.text()
        console.log(`❌ ${endpoint.name}: Failed (${response.status})`)
        console.log(`  Error: ${error}`)
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Request failed`)
      console.log(`  Error: ${error.message}`)
    }
  }
  
  console.log('\n=== API Test Complete ===')
}

// Wait a bit for server to start
setTimeout(testAdminAPI, 3000) 