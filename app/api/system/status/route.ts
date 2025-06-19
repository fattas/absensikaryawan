import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Set a timeout for the database query
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 5000)
    )
    
    // Test database connection with a simple query
    const queryPromise = prisma.$queryRaw`SELECT 1 as alive`
    
    // Race between query and timeout
    await Promise.race([queryPromise, timeoutPromise])
    
    // Additional check: Try to count users to ensure tables exist
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      userCount,
      timestamp: new Date().toISOString(),
      message: 'Database is operational'
    })
  } catch (error) {
    console.error('Database connection check failed:', error)
    
    let errorMessage = 'Database connection failed'
    let errorDetails = ''
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Database connection timeout'
        errorDetails = 'The database is taking too long to respond'
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Database server not running'
        errorDetails = 'Please ensure MySQL/MariaDB service is running in XAMPP'
      } else if (error.message.includes('Unknown database')) {
        errorMessage = 'Database not found'
        errorDetails = 'The employee_attendance_v2 database does not exist'
      } else {
        errorDetails = error.message
      }
    }
    
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        message: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 503 } // Service Unavailable
    )
  }
} 