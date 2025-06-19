// import { prisma } from "./prisma"

interface LocationSettings {
  latitude: number
  longitude: number
  radius: number
}

// Get location settings
export async function getLocationSettings() {
  const response = await fetch('/api/location/settings')
  
  if (!response.ok) {
    if (response.status === 404) {
      // Return default location settings if none exist
      return {
        latitude: -6.2088,
        longitude: 106.8456,
        radius: 100
      }
    }
    const result = await response.json()
    throw new Error(result.error || "Gagal mengambil setting lokasi")
  }

  const result = await response.json()
  return result
}

// Update location settings (admin only)
export async function updateLocationSettings(settings: LocationSettings) {
  // Pastikan semua nilai adalah angka
  const latitude = Number(settings.latitude)
  const longitude = Number(settings.longitude)
  const radius = Number(settings.radius)
  
  // Validasi input
  if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
    throw new Error("Data koordinat dan radius harus berupa angka")
  }
  
  if (radius <= 0) {
    throw new Error("Radius harus lebih besar dari 0")
  }
  
  const response = await fetch('/api/location/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      latitude,
      longitude,
      radius,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Gagal mengupdate setting lokasi")
  }

  return result
}

// Get location settings history
export async function getLocationSettingsHistory(page = 1, limit = 10) {
  const response = await fetch(`/api/location/history?page=${page}&limit=${limit}`)
  
  if (!response.ok) {
    const result = await response.json()
    throw new Error(result.error || "Gagal mengambil history setting lokasi")
  }
  
  return await response.json()
}

// Fungsi untuk memformat koordinat untuk debugging
function formatCoordinate(coord: number): string {
  return coord.toFixed(6);
}

// Calculate distance between two coordinates in meters using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    console.error("Invalid coordinates for distance calculation:", { 
      lat1: formatCoordinate(lat1), 
      lon1: formatCoordinate(lon1), 
      lat2: formatCoordinate(lat2), 
      lon2: formatCoordinate(lon2) 
    });
    return Infinity; // Return a large distance when coordinates are invalid
  }
  
  // Convert to numbers explicitly to ensure correct calculations
  lat1 = Number(lat1);
  lon1 = Number(lon1);
  lat2 = Number(lat2);
  lon2 = Number(lon2);

  // Check if coordinates are identical or extremely close
  if (Math.abs(lat1 - lat2) < 0.0000001 && Math.abs(lon1 - lon2) < 0.0000001) {
    return 0; // Return 0 distance for identical coordinates
  }
  
  // Haversine formula
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance);
}

// Check if user is within allowed radius
export async function isLocationValid(userLat: number, userLng: number): Promise<{ valid: boolean; distance: number }> {
  try {
    // Convert to numbers explicitly
    userLat = Number(userLat);
    userLng = Number(userLng);
    
    if (isNaN(userLat) || isNaN(userLng)) {
      console.error("Invalid user coordinates:", { 
        userLat: formatCoordinate(userLat), 
        userLng: formatCoordinate(userLng) 
      });
      return {
        valid: false,
        distance: Infinity
      };
    }
    
    const settings = await getLocationSettings();
    
    // Ensure settings coordinates are valid numbers
    const targetLat = Number(settings.latitude);
    const targetLng = Number(settings.longitude);
    const radius = Number(settings.radius);
    
    if (isNaN(targetLat) || isNaN(targetLng) || isNaN(radius)) {
      console.error("Invalid location settings:", {
        latitude: formatCoordinate(targetLat),
        longitude: formatCoordinate(targetLng),
        radius
      });
      return {
        valid: false,
        distance: Infinity
      };
    }
    
    const distance = calculateDistance(targetLat, targetLng, userLat, userLng);
    
    // Log detail untuk debugging
    console.log("Distance calculation details:", {
      userCoords: { 
        lat: formatCoordinate(userLat), 
        lng: formatCoordinate(userLng) 
      },
      targetCoords: { 
        lat: formatCoordinate(targetLat), 
        lng: formatCoordinate(targetLng) 
      },
      radius,
      calculatedDistance: distance,
      isValid: distance <= radius
    });
    
    return {
      valid: distance <= radius,
      distance
    };
  } catch (error) {
    console.error("Error checking location validity:", error);
    return {
      valid: false,
      distance: Infinity
    };
  }
}
