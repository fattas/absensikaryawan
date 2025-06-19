const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Data admin yang akan dibuat
const adminEmail = "admin@absensikaryawan.com";
const adminPassword = "Admin123!"; // Ganti dengan password yang lebih aman pada penggunaan di production
const adminName = "Administrator Sistem";

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: {
        email: adminEmail
      }
    });

    if (existingAdmin) {
      console.log(`Admin dengan email ${adminEmail} sudah ada`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: "ADMIN"
      }
    });

    console.log('Admin berhasil dibuat:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('ID:', admin.id);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 