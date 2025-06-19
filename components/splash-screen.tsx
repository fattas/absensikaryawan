"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const { theme, systemTheme } = useTheme();
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(0.95);

  // Tentukan apakah tema gelap atau terang
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDarkTheme = currentTheme === "dark";

  useEffect(() => {
    // Animasi awal
    setTimeout(() => {
      setScale(1);
    }, 100);

    // Durasi statis 2 detik
    const splashDuration = 2000; // 2 detik
    
    // Mulai fade out setelah durasi 2 detik
    setTimeout(() => {
      setOpacity(0);
      setScale(0.98);
    }, splashDuration);
    
    // Selesai setelah fade out (tambahkan 800ms untuk animasi)
    setTimeout(() => {
      onFinish();
    }, splashDuration + 800);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center z-50 transition-all duration-800 ${
        isDarkTheme ? "bg-gray-900" : "bg-white"
      }`}
      style={{ opacity, transform: `scale(${scale})` }}
    >
      <div className="w-32 h-32 mb-6 relative">
        <Image
          src="/placeholder-logo.svg"
          alt="Employee Attendance System"
          fill
          priority
          className="object-contain"
        />
      </div>
      <h1 className={`text-xl font-bold mb-2 ${isDarkTheme ? "text-blue-400" : "text-blue-600"}`}>
        Employee Attendance System
      </h1>
      <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
        Face Recognition and GPS-based Attendance
      </p>
    </div>
  );
} 