const mysql = require('mysql2/promise');

async function testLeaveSystem() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'employee_attendance_v2'
    });

    console.log('Connected to database successfully!\n');

    // 1. Check if tables exist
    console.log('1. Checking leave system tables...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'leave_%'"
    );
    
    if (tables.length > 0) {
      console.log('✓ Leave tables found:');
      tables.forEach(table => {
        console.log(`  - ${Object.values(table)[0]}`);
      });
    } else {
      console.log('✗ No leave tables found!');
      return;
    }

    // 2. Check leave_requests structure
    console.log('\n2. Checking leave_requests table structure...');
    const [requestColumns] = await connection.execute(
      "SHOW COLUMNS FROM leave_requests"
    );
    console.log('✓ leave_requests columns:');
    requestColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    // 3. Check leave_balances structure
    console.log('\n3. Checking leave_balances table structure...');
    const [balanceColumns] = await connection.execute(
      "SHOW COLUMNS FROM leave_balances"
    );
    console.log('✓ leave_balances columns:');
    balanceColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    // 4. Check if leave balances were initialized
    console.log('\n4. Checking initialized leave balances...');
    const [balances] = await connection.execute(
      "SELECT COUNT(*) as count FROM leave_balances WHERE year = YEAR(CURDATE())"
    );
    console.log(`✓ Leave balances initialized for ${balances[0].count} users`);

    // 5. Test sample data
    console.log('\n5. Sample leave balance data:');
    const [sampleBalances] = await connection.execute(
      `SELECT lb.*, u.name, u.email 
       FROM leave_balances lb
       JOIN users u ON lb.userId = u.id
       WHERE lb.year = YEAR(CURDATE())
       LIMIT 3`
    );
    
    if (sampleBalances.length > 0) {
      console.log('✓ Sample balances:');
      sampleBalances.forEach(balance => {
        console.log(`  - ${balance.name} (${balance.email}): ${balance.remainingDays}/${balance.totalDays} days remaining`);
      });
    }

    // 6. Check triggers
    console.log('\n6. Checking database triggers...');
    const [triggers] = await connection.execute(
      "SHOW TRIGGERS LIKE 'leave_%'"
    );
    if (triggers.length > 0) {
      console.log('✓ Triggers found:');
      triggers.forEach(trigger => {
        console.log(`  - ${trigger.Trigger} on ${trigger.Table}`);
      });
    }

    console.log('\n✅ Leave system is properly set up and ready to use!');

  } catch (error) {
    console.error('Error testing leave system:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testLeaveSystem(); 