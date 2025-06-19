import { NextRequest, NextResponse } from 'next/server';

// Cache for geocoding results (in-memory for now)
const geocodeCache = new Map<string, { locationName: string; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { success: false, error: 'Invalid latitude or longitude' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    const cached = geocodeCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        locationName: cached.locationName,
        cached: true
      });
    }

    // Rate limiting
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    lastRequestTime = now;

    // Make request to OpenStreetMap Nominatim
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'id',
          'User-Agent': 'EmployeeAttendanceApp/1.0'
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch location data' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const address = data.address || {};
    
    // Format location name
    let locationName = '';
    
    if (address.city || address.town || address.village) {
      locationName += address.city || address.town || address.village;
    }
    
    if (address.state || address.province) {
      if (locationName) locationName += ', ';
      locationName += address.state || address.province;
    }
    
    if (address.country) {
      if (locationName) locationName += ', ';
      locationName += address.country;
    }
    
    if (!locationName) {
      locationName = 'Lokasi tidak diketahui';
    }

    // Cache the result
    geocodeCache.set(cacheKey, {
      locationName,
      timestamp: Date.now()
    });

    return NextResponse.json({
      success: true,
      locationName,
      cached: false
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 