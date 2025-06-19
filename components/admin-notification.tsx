"use client";

import { toast } from "sonner";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

interface NotificationOptions {
  /**
   * Durasi notifikasi dalam milidetik
   * @default 3000
   */
  duration?: number;
}

/**
 * Komponen untuk menampilkan notifikasi sukses admin
 */
export const AdminNotification = {
  /**
   * Menampilkan notifikasi sukses
   * @param message Pesan yang akan ditampilkan
   * @param options Opsi notifikasi
   */
  success: (message: string, options?: NotificationOptions) => {
    toast.success(message, {
      duration: options?.duration || 3000,
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    });
  },

  /**
   * Menampilkan notifikasi error
   * @param message Pesan yang akan ditampilkan
   * @param options Opsi notifikasi
   */
  error: (message: string, options?: NotificationOptions) => {
    toast.error(message, {
      duration: options?.duration || 4000,
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
    });
  },

  /**
   * Menampilkan notifikasi info
   * @param message Pesan yang akan ditampilkan
   * @param options Opsi notifikasi
   */
  info: (message: string, options?: NotificationOptions) => {
    toast.info(message, {
      duration: options?.duration || 3000,
      icon: <Info className="h-5 w-5 text-blue-500" />,
    });
  },
}; 