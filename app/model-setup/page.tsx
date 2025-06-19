import { ModelSetupGuide } from "@/components/model-setup-guide"

export default function ModelSetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-center mb-8">Face Recognition Model Setup</h1>
      <ModelSetupGuide />
    </div>
  )
}
