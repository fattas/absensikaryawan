"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ModelInstructions() {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Model Pengenalan Wajah Tidak Ditemukan</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>
          Model pengenalan wajah tidak ditemukan di direktori publik. Untuk memperbaiki masalah ini, Anda perlu
          mengunduh model face-api.js dan menempatkannya di direktori <code>public/models</code>.
        </p>
        <div className="text-sm bg-gray-100 p-3 rounded-md">
          <p className="font-medium">Ikuti langkah-langkah berikut:</p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Unduh model dari repositori GitHub face-api.js</li>
            <li>
              Buat folder <code>models</code> di direktori <code>public</code> Anda
            </li>
            <li>
              Ekstrak dan tempatkan semua file model di direktori <code>public/models</code>
            </li>
            <li>Segarkan halaman ini</li>
          </ol>
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              window.open("https://github.com/justadudewhohacks/face-api.js/tree/master/weights", "_blank")
            }
          >
            Dapatkan Model
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
