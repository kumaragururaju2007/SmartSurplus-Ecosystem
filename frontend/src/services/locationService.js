/**
 * SmartSurplus Unified High-Reliability Geolocation & Address Service
 * Supports:
 * 1. High-accuracy Browser GPS with automatic Wi-Fi / OS positioning & Network IP Geolocation Fallback
 * 2. Robust Reverse Geocoding (Coordinates -> Address, City, State, PIN code)
 * 3. Forward Geocoding (Address / PIN code -> Coordinates + Map centering)
 * 4. Concurrent in-flight request deduplication & memory caching
 */

// Module-level in-flight promise to prevent concurrent duplicate calls and race conditions
let activeLocationPromise = null;

// Module-level reverse-geocode cache (Key: lat,lng -> Value: address object)
const reverseGeocodeCache = new Map();

/**
 * Detect current location using Browser GPS, falling back to OS Wi-Fi positioning, then IP Geolocation.
 * Completely eliminates 1st-click cold-start / permission timeout failures.
 * @returns {Promise<{ lat: number, lng: number, source: 'GPS' | 'NETWORK' | 'IP', message: string, accuracy?: number, city?: string, state?: string, pincode?: string }>}
 */
export async function detectCurrentLocation() {
  if (activeLocationPromise) {
    return activeLocationPromise;
  }

  activeLocationPromise = (async () => {
    // 1. Check if running in a browser environment
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return await fallbackNetworkLocation('Geolocation is not supported by your browser.');
    }

    // 2. Check permission status if Permissions API is available
    let permissionDenied = false;
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        if (status.state === 'denied') {
          permissionDenied = true;
        }
      } catch (e) {}
    }

    if (permissionDenied) {
      throw new Error('Location access is blocked in your browser settings. Please enable location permissions in your browser or click directly on the map.');
    }

    // Helper: Promise wrapper for getCurrentPosition
    const getBrowserPosition = (options) => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    // ATTEMPT 1: High Accuracy GPS (15s timeout to allow user to accept permission prompt + satellite fix)
    try {
      const position = await getBrowserPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // Always fetch fresh, non-stale coordinates
      });

      if (position && position.coords) {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        const acc = Math.round(position.coords.accuracy || 10);
        return {
          lat,
          lng,
          source: 'GPS',
          accuracy: position.coords.accuracy,
          message: `🎯 Exact GPS coordinates detected (±${acc}m accuracy)`
        };
      }
    } catch (highAccError) {
      console.warn('High-accuracy GPS notice:', highAccError.message || highAccError.code);
      
      // If user explicitly clicked "Block" / Denied permission, immediately inform user
      if (highAccError.code === 1 /* PERMISSION_DENIED */) {
        throw new Error('Location access was denied. Please allow location permissions in your browser or click on the map to set coordinates.');
      }
    }

    // ATTEMPT 2: Standard Accuracy (OS Wi-Fi / Cell tower positioning) (8s timeout)
    // Fast & highly reliable on laptops, desktops, and indoor locations where satellite GPS is unavailable
    try {
      const position = await getBrowserPosition({
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 0
      });

      if (position && position.coords) {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        const acc = Math.round(position.coords.accuracy || 30);
        return {
          lat,
          lng,
          source: 'NETWORK',
          accuracy: position.coords.accuracy,
          message: `📍 Device location detected via Network/Wi-Fi (±${acc}m accuracy)`
        };
      }
    } catch (stdAccError) {
      console.warn('Standard accuracy location notice:', stdAccError.message || stdAccError.code);
      if (stdAccError.code === 1 /* PERMISSION_DENIED */) {
        throw new Error('Location access was denied. Please allow location permissions in your browser or click on the map to set coordinates.');
      }
    }

    // ATTEMPT 3: Fallback to Network IP Geolocation
    return await fallbackNetworkLocation('Device GPS and Wi-Fi positioning unavailable.');
  })();

  try {
    return await activeLocationPromise;
  } finally {
    activeLocationPromise = null;
  }
}

/**
 * Fallback to IP-based Geolocation Services
 */
async function fallbackNetworkLocation(reason) {
  // Primary IP Provider: ipapi.co
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const ipRes = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (ipRes.ok) {
      const data = await ipRes.json();
      if (data && data.latitude && data.longitude) {
        const lat = parseFloat(Number(data.latitude).toFixed(6));
        const lng = parseFloat(Number(data.longitude).toFixed(6));
        return {
          lat,
          lng,
          source: 'IP',
          city: data.city || '',
          state: data.region || '',
          pincode: data.postal || '',
          message: `🌐 Estimated location via Network IP (${data.city || 'Local area'}, ${data.region || 'Region'}). Click anywhere on the map to pinpoint exact premises.`
        };
      }
    }
  } catch (ipErr) {
    console.warn('Primary IP geolocation notice:', ipErr.message);
  }

  // Secondary IP Provider: ipwho.is
  try {
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
    const ipRes2 = await fetch('https://ipwho.is/', { signal: controller2.signal });
    clearTimeout(timeoutId2);

    if (ipRes2.ok) {
      const data2 = await ipRes2.json();
      if (data2 && data2.success && data2.latitude && data2.longitude) {
        const lat = parseFloat(Number(data2.latitude).toFixed(6));
        const lng = parseFloat(Number(data2.longitude).toFixed(6));
        return {
          lat,
          lng,
          source: 'IP',
          city: data2.city || '',
          state: data2.region || '',
          pincode: data2.postal || '',
          message: `🌐 Estimated location via Network (${data2.city || 'Local Area'}). You can click on the map to fine-tune.`
        };
      }
    }
  } catch (ipErr2) {
    console.warn('Secondary IP geolocation notice:', ipErr2.message);
  }

  throw new Error(`Location detection unavailable (${reason}). Please type your PIN code / Address or click directly on the interactive map.`);
}

/**
 * Reverse Geocode: Coordinates -> Full Address + City + State + PIN code
 * @param {number} lat 
 * @param {number} lng 
 * @returns {Promise<{ fullAddress: string, city: string, state: string, pincode: string, road: string, displayName?: string }>}
 */
export async function reverseGeocode(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return { fullAddress: '', city: '', state: '', pincode: '', road: '' };
  }

  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  if (isNaN(numLat) || isNaN(numLng)) {
    return { fullAddress: '', city: '', state: '', pincode: '', road: '' };
  }

  // Check in-memory cache (~1.1 meter resolution)
  const cacheKey = `${numLat.toFixed(5)},${numLng.toFixed(5)}`;
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey);
  }

  // Primary: OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${numLat}&lon=${numLng}&addressdetails=1&zoom=18`,
      { 
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal 
      }
    );
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      if (data && data.address) {
        const addr = data.address;
        const road = addr.road || addr.street || addr.neighbourhood || addr.suburb || addr.commercial || addr.amenity || '';
        const cityVal = addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.district || '';
        const stateVal = addr.state || addr.region || '';
        const postCodeVal = (addr.postcode || '').replace(/[^0-9]/g, '').slice(0, 6) || addr.postcode || '';
        
        const fullAddress = [road, cityVal, stateVal, postCodeVal].filter(Boolean).join(', ') || data.display_name || '';

        const result = {
          fullAddress,
          road,
          city: cityVal,
          state: stateVal,
          pincode: postCodeVal,
          displayName: data.display_name
        };
        reverseGeocodeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (e) {
    console.warn('Nominatim reverse geocode notice:', e.message);
  }

  // Fallback: BigDataCloud Client Reverse Geocode
  try {
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
    const resp2 = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${numLat}&longitude=${numLng}&localityLanguage=en`,
      { signal: controller2.signal }
    );
    clearTimeout(timeoutId2);

    if (resp2.ok) {
      const data2 = await resp2.json();
      if (data2) {
        const road = data2.locality || data2.principalSubdivision || '';
        const cityVal = data2.city || data2.locality || '';
        const stateVal = data2.principalSubdivision || '';
        const postCodeVal = data2.postcode || '';
        const fullAddress = [road, cityVal, stateVal, postCodeVal].filter(Boolean).join(', ');

        const result = {
          fullAddress,
          road,
          city: cityVal,
          state: stateVal,
          pincode: postCodeVal,
          displayName: fullAddress
        };
        reverseGeocodeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (e2) {
    console.warn('BigDataCloud reverse geocode fallback notice:', e2.message);
  }

  const fallbackResult = {
    fullAddress: `Lat: ${numLat.toFixed(4)}, Lng: ${numLng.toFixed(4)}`,
    city: '',
    state: '',
    pincode: '',
    road: ''
  };
  return fallbackResult;
}

/**
 * Forward Geocode: Address / PIN code / City -> Coordinates
 * @param {string} query Search text (e.g. "641001", "Gandhipuram, Coimbatore", "T. Nagar Chennai")
 * @returns {Promise<{ lat: number, lng: number, fullAddress: string, city: string, state: string, pincode: string, displayName?: string }>}
 */
export async function forwardGeocode(query) {
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    throw new Error('Please enter a valid address, area, or PIN code to search.');
  }

  const cleanQuery = query.trim();
  const isPincodeOnly = /^[1-9][0-9]{5}$/.test(cleanQuery.replace(/\s+/g, ''));
  const searchQuery = isPincodeOnly ? `${cleanQuery}, India` : (cleanQuery.toLowerCase().includes('india') ? cleanQuery : `${cleanQuery}, India`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=1&addressdetails=1`,
      { 
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal 
      }
    );
    clearTimeout(timeoutId);

    if (resp.ok) {
      const results = await resp.json();
      if (results && results.length > 0) {
        const item = results[0];
        const lat = parseFloat(parseFloat(item.lat).toFixed(6));
        const lng = parseFloat(parseFloat(item.lon).toFixed(6));
        const addr = item.address || {};
        
        const road = addr.road || addr.street || addr.neighbourhood || addr.suburb || '';
        const cityVal = addr.city || addr.town || addr.village || addr.district || addr.county || '';
        const stateVal = addr.state || '';
        const postCodeVal = addr.postcode || (isPincodeOnly ? cleanQuery : '');
        const fullAddress = [road, cityVal, stateVal, postCodeVal].filter(Boolean).join(', ') || item.display_name;

        return {
          lat,
          lng,
          fullAddress,
          city: cityVal,
          state: stateVal,
          pincode: postCodeVal,
          displayName: item.display_name
        };
      }
    }
  } catch (e) {
    console.warn('Forward geocode notice:', e.message);
  }

  throw new Error(`Location not found for "${cleanQuery}". Please check the spelling, enter your 6-digit PIN code, or click directly on the map.`);
}
