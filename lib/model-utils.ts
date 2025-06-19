// Utility functions for handling face-api.js models

/**
 * Creates a mock face descriptor for testing purposes
 * @returns A Float32Array with 128 random values
 */
export function createMockFaceDescriptor(): Float32Array {
  // Create a random face descriptor (128-dimensional vector)
  return new Float32Array(Array.from({ length: 128 }, () => Math.random() * 2 - 1))
}

/**
 * Checks if the face-api.js models are available in the public directory
 * @param modelsPath The path to the models directory
 * @returns A promise that resolves to true if the models are available, false otherwise
 */
export async function checkModelsAvailability(modelsPath = "/models"): Promise<boolean> {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return false

    // List of model files to check
    const modelFiles = [
      "tiny_face_detector_model-weights_manifest.json",
      "face_landmark_68_model-weights_manifest.json",
      "face_recognition_model-weights_manifest.json",
    ]

    // Check if at least one model file exists
    for (const file of modelFiles) {
      const response = await fetch(`${modelsPath}/${file}`, { method: "HEAD" })
      if (response.ok) {
        return true
      }
    }

    return false
  } catch {
    return false
  }
}
