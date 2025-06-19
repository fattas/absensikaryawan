"use client";

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SplashScreen } from "@/components/splash-screen"
import { Toaster } from "@/components/ui/sonner"
import { useState, useEffect } from "react"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [showSplash, setShowSplash] = useState(true);

  // Fungsi untuk menangani ketika splash screen selesai
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Reset splash screen setiap kali halaman dimuat ulang
  useEffect(() => {
    setShowSplash(true);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Employee Attendance System</title>
        <meta name="description" content="Face Recognition and GPS-based Attendance System" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {showSplash ? (
            <SplashScreen onFinish={handleSplashFinish} />
          ) : null}
          <div style={{ display: showSplash ? "none" : "block" }}>
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
