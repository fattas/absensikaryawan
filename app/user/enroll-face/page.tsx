"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import * as faceapi from "face-api.js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { saveFaceEncoding } from "@/lib/face-service"
import { Progress } from "@/components/ui/progress"
import { getUserProfile } from "@/lib/auth-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function EnrollFace() {
  const router = useRouter()
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureProgress, setCaptureProgress] = useState(0)
  const [faceDetected, setFaceDetected] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false)
  const capturedFacesRef = useRef<Float32Array[]>([])

  useEffect(() => {
    const checkFaceEnrollment = async () => {
      try {
        const userData = await getUserProfile()

        // If user already has face enrollment, show message
        if (userData.hasFaceEncoding) {
          setAlreadyEnrolled(true)
          setIsLoading(false)
          return
        }

        // Continue with model loading if not enrolled
        loadModels()
      } catch (error) {
        console.error("Error checking face enrollment:", error)
        router.push("/")
      }
    }

    checkFaceEnrollment()
  }, [router, toast])

  const loadModels = async () => {
    try {
      // Check if we're in a browser environment
      if (typeof window === "undefined") return

      // Create a function to check if a file exists
      const fileExists = async (url: string) => {
        try {
          const response = await fetch(url, { method: "HEAD" })
          return response.ok
        } catch {
          return false
        }
      }

      // Check if model files exist before trying to load them
      const modelsPath = "/models"
      const tinyFaceDetectorPath = `${modelsPath}/tiny_face_detector_model-weights_manifest.json`
      const modelExists = await fileExists(tinyFaceDetectorPath)

      if (!modelExists) {
        setModelError("File model pengenalan wajah tidak ditemukan. Pastikan model berada di direktori public/models.")
        setIsLoading(false)
        return
      }

      // Load models if they exist
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath),
      ])

      setModelsLoaded(true)
      setIsLoading(false)
    } catch (error) {
      console.error("Error loading face-api models:", error)
      setModelError(
        "Error loading face recognition models. You may need to add the binary (.bin) files to your models directory.",
      )
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!modelsLoaded || alreadyEnrolled) return

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error("Error accessing camera:", error)
        toast({
          title: "Akses Kamera Ditolak",
          description: "Mohon izinkan akses kamera untuk mendaftarkan wajah Anda.",
          variant: "destructive",
        })
      }
    }

    startVideo()

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [modelsLoaded, toast, alreadyEnrolled])

  useEffect(() => {
    if (!modelsLoaded || !videoRef.current || !canvasRef.current || alreadyEnrolled) return

    const detectFace = async () => {
      if (!videoRef.current || !canvasRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const displaySize = { width: video.width, height: video.height }
      faceapi.matchDimensions(canvas, displaySize)

      const interval = setInterval(async () => {
        if (isCapturing) {
          try {
            const detections = await faceapi
              .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptor()

            const context = canvas.getContext("2d")
            if (context) context.clearRect(0, 0, canvas.width, canvas.height)

            if (detections) {
              setFaceDetected(true)
              const resizedDetections = faceapi.resizeResults(detections, displaySize)
              faceapi.draw.drawDetections(canvas, resizedDetections)
              faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)

              // Store face descriptor
              if (capturedFacesRef.current.length < 5) {
                capturedFacesRef.current.push(detections.descriptor)
                setCaptureProgress((capturedFacesRef.current.length / 5) * 100)
              }

              if (capturedFacesRef.current.length === 5) {
                clearInterval(interval)
                await finalizeFaceEnrollment()
              }
            } else {
              setFaceDetected(false)
            }
          } catch (error) {
            console.error("Error during face detection:", error)
            clearInterval(interval)
            setIsCapturing(false)
            setModelError("Error during face detection. The model files may be incomplete.")
          }
        }
      }, 500)

      return () => clearInterval(interval)
    }

    if (isCapturing) {
      detectFace()
    }
  }, [isCapturing, modelsLoaded, toast, alreadyEnrolled])

  const startCapture = () => {
    setIsCapturing(true)
    capturedFacesRef.current = []
    setCaptureProgress(0)
  }

  const finalizeFaceEnrollment = async () => {
    try {
      setIsCapturing(false)

      // Calculate average face descriptor
      const descriptorLength = capturedFacesRef.current[0].length
      const averageDescriptor = new Float32Array(descriptorLength)

      for (let i = 0; i < descriptorLength; i++) {
        let sum = 0
        for (const descriptor of capturedFacesRef.current) {
          sum += descriptor[i]
        }
        averageDescriptor[i] = sum / capturedFacesRef.current.length
      }

      // Save face encoding to server
      await saveFaceEncoding(Array.from(averageDescriptor))

      toast({
        title: "Pendaftaran Wajah Berhasil",
        description: "Wajah Anda telah berhasil didaftarkan.",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Error saving face encoding:", error)
      toast({
        title: "Pendaftaran Gagal",
        description: "Gagal menyimpan data wajah. Silakan coba lagi.",
        variant: "destructive",
      })
    }
  }

  if (alreadyEnrolled) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center">
        <div className="w-full max-w-[430px] min-h-screen bg-white shadow-sm flex flex-col">
          {/* App header */}
          <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              ← Kembali
            </Button>
            <h1 className="text-lg font-bold text-center">Pendaftaran Wajah</h1>
            <div className="w-16"></div> {/* Spacer for centering */}
          </header>

          {/* App content */}
          <main className="flex-1 overflow-auto p-4 space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Wajah Sudah Terdaftar</AlertTitle>
              <AlertDescription className="text-green-700">
                Anda sudah mendaftarkan wajah Anda sebelumnya. Jika Anda ingin mengubah data wajah, silakan hubungi
                administrator.
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Pendaftaran Wajah Selesai</h2>
                    <p className="text-gray-600 mt-2">
                      Anda sudah berhasil mendaftarkan wajah Anda. Anda dapat menggunakan fitur absensi dengan
                      verifikasi wajah.
                    </p>
                  </div>
                  <Button className="mt-4" onClick={() => router.push("/dashboard")}>
                    Kembali ke Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-sm flex flex-col">
        {/* App header */}
        <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            ← Kembali
          </Button>
          <h1 className="text-lg font-bold text-center">Pendaftaran Wajah</h1>
          <div className="w-16"></div> {/* Spacer for centering */}
        </header>

        {/* App content */}
        <main className="flex-1 overflow-auto p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Daftarkan Wajah Anda</CardTitle>
              <CardDescription>
                Daftarkan wajah Anda untuk menggunakan fitur absensi dengan verifikasi wajah
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 w-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                  <p className="mt-4 text-gray-600">Memuat model pengenalan wajah...</p>
                </div>
              ) : modelError ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Model</AlertTitle>
                  <AlertDescription>{modelError}</AlertDescription>
                </Alert>
              ) : (
                <div className="relative w-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    width={400}
                    height={300}
                    className="rounded-lg w-full h-auto bg-black"
                    onPlay={() => {
                      if (canvasRef.current) {
                        canvasRef.current.width = videoRef.current?.videoWidth || 400
                        canvasRef.current.height = videoRef.current?.videoHeight || 300
                      }
                    }}
                  />
                  <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

                  {isCapturing && (
                    <div className="absolute bottom-4 left-0 right-0 mx-auto w-4/5">
                      <Progress value={captureProgress} className="h-2" />
                      <p className="text-center text-sm mt-1 text-white drop-shadow-md">
                        {faceDetected ? "Wajah terdeteksi! Tetap diam..." : "Tidak ada wajah terdeteksi"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              {!isCapturing && !modelError ? (
                <Button onClick={startCapture} className="w-full" disabled={isLoading || !modelsLoaded}>
                  Mulai Pendaftaran Wajah
                </Button>
              ) : isCapturing ? (
                <p className="text-sm text-center text-gray-600">
                  Mengambil data wajah ({Math.round(captureProgress)}%)...
                </p>
              ) : null}
              <p className="text-xs text-gray-500 text-center">
                Data wajah Anda akan disimpan dengan aman dan hanya digunakan untuk verifikasi absensi.
              </p>
              <Button variant="outline" className="mt-2" onClick={() => router.push("/dashboard")}>
                Kembali ke Dashboard
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    </div>
  )
}
