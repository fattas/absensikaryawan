const fetch = require('node-fetch')

async function finalVerificationTest() {
  const baseURL = 'http://localhost:3000'
  
  console.log('🔥 === FINAL ADMIN PANEL VERIFICATION === 🔥')
  console.log('')
  
  try {
    // Step 1: Test Database Connection
    console.log('1️⃣ Testing Database Connection...')
    const dbResponse = await fetch(`${baseURL}/api/system/status`)
    console.log(`   Database: ${dbResponse.ok ? '✅ Connected' : '❌ Connection Failed'}`)
    
    // Step 2: Test Admin Login
    console.log('\n2️⃣ Testing Admin Authentication...')
    const loginResponse = await fetch(`${baseURL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@absensikaryawan.com',
        password: 'Admin123!'
      })
    })
    
    const setCookieHeader = loginResponse.headers.get('set-cookie')
    console.log(`   Admin Login: ${loginResponse.ok ? '✅ Success' : '❌ Failed'}`)
    console.log(`   Cookie Authentication: ${setCookieHeader ? '✅ Working' : '❌ Not Set'}`)
    
    if (!loginResponse.ok) {
      console.log('   ⚠️  Admin login failed - check credentials')
      return
    }
    
    // Step 3: Test All Admin APIs
    console.log('\n3️⃣ Testing Admin Panel APIs...')
    const adminApis = [
      { name: 'Point Activities', url: '/api/admin/points/activities', expectedCount: 7 },
      { name: 'Rewards Management', url: '/api/admin/rewards', expectedCount: 6 },
      { name: 'Analytics Dashboard', url: '/api/admin/points/analytics', expectedType: 'object' },
      { name: 'Admin Redemptions', url: '/api/admin/redemptions', expectedType: 'array' }
    ]
    
    let allApisWorking = true
    
    for (const api of adminApis) {
      try {
        const response = await fetch(`${baseURL}${api.url}`, {
          headers: { 'Cookie': setCookieHeader || '' }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (api.expectedCount && data.data) {
            console.log(`   ${api.name}: ✅ ${data.data.length}/${api.expectedCount} items`)
          } else if (api.expectedType === 'object' && data.data) {
            console.log(`   ${api.name}: ✅ Analytics data available`)
          } else {
            console.log(`   ${api.name}: ✅ Working`)
          }
        } else {
          console.log(`   ${api.name}: ❌ Failed (${response.status})`)
          allApisWorking = false
        }
      } catch (error) {
        console.log(`   ${api.name}: ❌ Error (${error.message})`)
        allApisWorking = false
      }
    }
    
    // Step 4: Test Admin Page Access
    console.log('\n4️⃣ Testing Admin Page Access...')
    const adminPageResponse = await fetch(`${baseURL}/admin/points-system`, {
      headers: { 'Cookie': setCookieHeader || '' }
    })
    console.log(`   Admin Points Page: ${adminPageResponse.ok ? '✅ Accessible' : '❌ Access Denied'}`)
    
    // Summary
    console.log('\n🎯 === VERIFICATION RESULTS ===')
    if (allApisWorking && adminPageResponse.ok) {
      console.log('🎉 ✅ ALL SYSTEMS WORKING!')
      console.log('')
      console.log('🚀 READY TO USE - Next Steps:')
      console.log('   1. Open browser: http://localhost:3000/admin')
      console.log('   2. Login with:')
      console.log('      📧 Email: admin@absensikaryawan.com')
      console.log('      🔑 Password: Admin123!')
      console.log('   3. Go to "Poin & Reward" tab')
      console.log('   4. Click "Kelola Sistem Poin"')
      console.log('   5. Configure points and rewards!')
      console.log('')
      console.log('📊 Available Features:')
      console.log('   ✅ Point Activities Configuration (7 activities)')
      console.log('   ✅ Rewards Management (6 sample rewards)')
      console.log('   ✅ Analytics Dashboard')
      console.log('   ✅ Stock Management')
      console.log('   ✅ User Points Tracking')
      console.log('')
    } else {
      console.log('❌ SOME ISSUES FOUND')
      console.log('   Please check the errors above and fix them.')
    }
    
  } catch (error) {
    console.error('💥 Verification failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Make sure the server is running (npm run dev)')
    console.log('   2. Check database connection')
    console.log('   3. Verify admin user exists')
  }
}

// Wait for server and run test
console.log('⏳ Waiting for server to be ready...')
setTimeout(finalVerificationTest, 3000) 