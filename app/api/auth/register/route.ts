import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  console.log("API register endpoint called");
  
  try {
    const body = await req.json();
    console.log("Request body received:", {
      name: body.name,
      email: body.email,
      // password omitted for security
    });
    
    const { name, email, password } = body;

    // Validasi input
    if (!name || !email || !password) {
      console.log("Validation failed: Missing required fields");
      return NextResponse.json(
        { success: false, error: "Nama, email, dan password harus diisi" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      console.log("Validation failed: Password too short");
      return NextResponse.json(
        { success: false, error: "Password harus minimal 6 karakter" },
        { status: 400 }
      )
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("Validation failed: Invalid email format");
      return NextResponse.json(
        { success: false, error: "Format email tidak valid" },
        { status: 400 }
      )
    }

    try {
      // Validate if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      })

      if (existingUser) {
        console.log("Validation failed: Email already registered");
        return NextResponse.json(
          { success: false, error: "Email sudah terdaftar. Silakan gunakan email lain." },
          { status: 400 }
        )
      }
    } catch (dbError) {
      console.error("Database error during user check:", dbError);
      return NextResponse.json(
        { success: false, error: "Terjadi kesalahan saat memeriksa user. Silakan coba lagi." },
        { status: 500 }
      )
    }

    // Hash password
    console.log("Hashing password...");
    let hashedPassword;
    try {
      hashedPassword = await hash(password, 12);
    } catch (hashError) {
      console.error("Error hashing password:", hashError);
      return NextResponse.json(
        { success: false, error: "Terjadi kesalahan saat memproses password. Silakan coba lagi." },
        { status: 500 }
      )
    }

    // Create new user
    console.log("Creating user in database...");
    let user;
    try {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'USER',
        },
      });
      console.log("User created successfully with ID:", user.id);
    } catch (createError: any) {
      console.error("Error creating user:", createError);
      
      if (createError.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: "Email sudah terdaftar. Silakan gunakan email lain." },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: "Terjadi kesalahan saat membuat user. Silakan coba lagi." },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: "Registrasi berhasil. Silakan login."
    })
  } catch (error: any) {
    console.error("Error during registration:", error);
    
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat mendaftar. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
