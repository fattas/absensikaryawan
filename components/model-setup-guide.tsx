"use client"

import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Download, FileJson } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ModelSetupGuide() {
  const [activeTab, setActiveTab] = useState("instructions")

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Face Recognition Model Setup</CardTitle>
        <CardDescription>Follow these steps to set up the face recognition models for your application</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="manual">Manual Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="instructions" className="space-y-4 mt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Model files are required</AlertTitle>
              <AlertDescription>
                The face recognition feature requires model files to be placed in your project's public directory.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="font-medium text-lg">Option 1: Automatic Setup (Recommended)</h3>
              <p className="text-sm text-gray-600">
                The easiest way to set up the models is to download and extract them directly to your project.
              </p>

              <div className="flex flex-col gap-2">
                <Button className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Download Complete Model Package
                </Button>
                <p className="text-xs text-gray-500">
                  After downloading, extract the ZIP file to your project's <code>public</code> directory.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-medium text-lg">Option 2: Manual Setup</h3>
              <p className="text-sm text-gray-600">
                If you prefer to set up the models manually, switch to the "Manual Setup" tab for detailed instructions.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <h3 className="font-medium text-lg">Manual Setup Steps</h3>
            <ol className="list-decimal list-inside space-y-6">
              <li className="space-y-2">
                <p className="font-medium">Create the models directory structure</p>
                <div className="bg-gray-100 p-3 rounded-md text-sm">
                  <p>Create the following directory in your project:</p>
                  <code className="block mt-2 text-blue-600">public/models/</code>
                </div>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Download the model files</p>
                <div className="space-y-3">
                  <p className="text-sm">
                    You need to download the following files from the face-api.js GitHub repository:
                  </p>

                  <div className="bg-gray-100 p-3 rounded-md space-y-2">
                    <div className="flex items-center">
                      <FileJson className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm font-medium">Manifest Files (you already have these):</span>
                    </div>
                    <ul className="list-disc list-inside text-sm pl-4 text-gray-700">
                      <li>face_recognition_model-weights_manifest.json</li>
                      <li>tiny_face_detector_model-weights_manifest.json</li>
                      <li>face_landmark_68_model-weights_manifest.json</li>
                    </ul>
                  </div>

                  <div className="bg-gray-100 p-3 rounded-md space-y-2">
                    <div className="flex items-center">
                      <Download className="h-4 w-4 mr-2 text-green-600" />
                      <span className="text-sm font-medium">Weight Files (you still need these):</span>
                    </div>
                    <ul className="list-disc list-inside text-sm pl-4 text-gray-700">
                      <li>face_recognition_model-shard1.bin</li>
                      <li>face_recognition_model-shard2.bin</li>
                      <li>tiny_face_detector_model-shard1.bin</li>
                      <li>face_landmark_68_model-shard1.bin</li>
                    </ul>
                    <Button size="sm" className="mt-2" variant="outline">
                      <Download className="mr-2 h-3 w-3" />
                      Download Weight Files
                    </Button>
                  </div>
                </div>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Place all files in the models directory</p>
                <div className="bg-gray-100 p-3 rounded-md text-sm">
                  <p>Place all the manifest files (.json) and weight files (.bin) in:</p>
                  <code className="block mt-2 text-blue-600">public/models/</code>
                </div>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Verify your directory structure</p>
                <div className="bg-gray-100 p-3 rounded-md text-sm">
                  <p>Your final directory structure should look like this:</p>
                  <pre className="mt-2 text-xs">
                    public/ ├── models/ │ ├── face_recognition_model-weights_manifest.json │ ├──
                    face_recognition_model-shard1.bin │ ├── face_recognition_model-shard2.bin │ ├──
                    tiny_face_detector_model-weights_manifest.json │ ├── tiny_face_detector_model-shard1.bin │ ├──
                    face_landmark_68_model-weights_manifest.json │ └── face_landmark_68_model-shard1.bin
                  </pre>
                </div>
              </li>

              <li>
                <p className="font-medium">Restart your application</p>
                <p className="text-sm text-gray-600 mt-1">
                  After placing all the files, restart your application and the face recognition features should work
                  properly.
                </p>
              </li>
            </ol>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-sm text-gray-600">
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          <span>You've already downloaded the manifest files</span>
        </div>
        <Button
          variant="outline"
          onClick={() => window.open("https://github.com/justadudewhohacks/face-api.js/tree/master/weights", "_blank")}
        >
          Visit GitHub Repository
        </Button>
      </CardFooter>
    </Card>
  )
}
