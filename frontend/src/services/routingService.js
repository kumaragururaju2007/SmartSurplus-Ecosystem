/**
 * SmartSurplus OSRM Road Routing & Navigation Service
 * 
 * Free OpenStreetMap-based shortest practical road route calculation,
 * distance remaining, ETA calculation, turn-by-turn guidance, and route deviation detection.
 * 
 * Complies with 100% free open-source technology requirements (OSRM + OpenStreetMap).
 */

const OSRM_API_BASE = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Haversine formula to compute great-circle distance between two coordinates in meters
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Calculates perpendicular distance from a point to a line segment in meters
 */
export function pointToSegmentDistanceMeters(pLat, pLng, aLat, aLng, bLat, bLng) {
  const dAB = calculateDistanceMeters(aLat, aLng, bLat, bLng);
  if (dAB === 0) return calculateDistanceMeters(pLat, pLng, aLat, aLng);

  // Vector projections in flat approximation for local distances
  const dAP = calculateDistanceMeters(aLat, aLng, pLat, pLng);
  const dBP = calculateDistanceMeters(bLat, bLng, pLat, pLng);

  // Check if projection falls outside segment AB
  if (dAP * dAP > dAB * dAB + dBP * dBP) return dBP;
  if (dBP * dBP > dAB * dAB + dAP * dAP) return dAP;

  // Semi-perimeter Heron's formula for triangle height
  const s = (dAB + dAP + dBP) / 2;
  const area = Math.sqrt(Math.max(0, s * (s - dAB) * (s - dAP) * (s - dBP)));
  return (2 * area) / dAB;
}

/**
 * Checks if current GPS position deviates significantly from the calculated road polyline
 * @param {number} currentLat - Current vehicle latitude
 * @param {number} currentLng - Current vehicle longitude
 * @param {Array<[number, number]>} routeCoordinates - Array of [lat, lng] points
 * @param {number} thresholdMeters - Deviation trigger threshold (default: 65 meters)
 * @returns {{ isDeviated: boolean, minDistanceMeters: number }}
 */
export function checkRouteDeviation(currentLat, currentLng, routeCoordinates, thresholdMeters = 65) {
  if (!routeCoordinates || routeCoordinates.length < 2) {
    return { isDeviated: false, minDistanceMeters: 0 };
  }

  let minDistance = Infinity;

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const [aLat, aLng] = routeCoordinates[i];
    const [bLat, bLng] = routeCoordinates[i + 1];
    const dist = pointToSegmentDistanceMeters(currentLat, currentLng, aLat, aLng, bLat, bLng);
    if (dist < minDistance) {
      minDistance = dist;
    }
    // Early exit if point is sufficiently close to any segment
    if (minDistance < 25) break;
  }

  return {
    isDeviated: minDistance > thresholdMeters,
    minDistanceMeters: Math.round(minDistance)
  };
}

/**
 * Formats distance in meters to user-friendly string (e.g., '4.8 km' or '750 m')
 */
export function formatDistance(meters) {
  if (meters === null || meters === undefined || isNaN(meters)) return '-- km';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Formats duration in seconds to user-friendly string (e.g., '18 min' or '1 hr 12 min')
 */
export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return '-- min';
  const totalMin = Math.round(seconds / 60);
  if (totalMin < 1) return '1 min';
  if (totalMin < 60) return `${totalMin} min`;
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return `${hrs} hr ${mins} min`;
}

/**
 * Formats ETA clock time (e.g., '8:45 PM')
 */
export function formatEta(seconds) {
  if (!seconds || isNaN(seconds)) return '--:--';
  const etaDate = new Date(Date.now() + seconds * 1000);
  return etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Calculate vehicle heading / bearing between two coordinates in degrees (0-360)
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return (θ * 180 / Math.PI + 360) % 360;
}

/**
 * Fetches shortest practical road route from OSRM
 * @param {number} startLat - Driver current latitude
 * @param {number} startLng - Driver current longitude
 * @param {number} endLat - Destination latitude
 * @param {number} endLng - Destination longitude
 * @returns {Promise<{ success: boolean, coordinates: Array<[number, number]>, distanceMeters: number, distanceText: string, durationSeconds: number, durationText: string, etaText: string, steps: Array<object>, message?: string }>}
 */
export async function fetchShortestRoadRoute(startLat, startLng, endLat, endLng) {
  try {
    if (
      startLat === undefined || startLng === undefined ||
      endLat === undefined || endLng === undefined ||
      isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)
    ) {
      return { success: false, message: 'Invalid start or destination GPS coordinates.' };
    }

    // OSRM expects coordinates in "longitude,latitude" order
    const url = `${OSRM_API_BASE}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM routing HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const bestRoute = data.routes[0];
      
      // OSRM GeoJSON geometry gives coordinates as [lng, lat]; Leaflet requires [lat, lng]
      const leafletCoordinates = bestRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

      // Extract step-by-step driving maneuvers
      const steps = [];
      if (bestRoute.legs && bestRoute.legs.length > 0) {
        bestRoute.legs.forEach(leg => {
          (leg.steps || []).forEach(step => {
            steps.push({
              instruction: step.maneuver?.instruction || (step.name ? `Proceed onto ${step.name}` : 'Continue on current road'),
              modifier: step.maneuver?.modifier || 'straight',
              type: step.maneuver?.type || 'turn',
              distanceMeters: step.distance || 0,
              distanceText: formatDistance(step.distance || 0),
              name: step.name || '',
              location: step.maneuver?.location ? [step.maneuver.location[1], step.maneuver.location[0]] : null
            });
          });
        });
      }

      return {
        success: true,
        coordinates: leafletCoordinates,
        distanceMeters: bestRoute.distance,
        distanceText: formatDistance(bestRoute.distance),
        durationSeconds: bestRoute.duration,
        durationText: formatDuration(bestRoute.duration),
        etaText: formatEta(bestRoute.duration),
        steps,
        source: 'OSRM OpenStreetMap Driving Engine'
      };
    } else {
      // Fallback: Direct 2-point road line if route not found
      return {
        success: true,
        coordinates: [[startLat, startLng], [endLat, endLng]],
        distanceMeters: calculateDistanceMeters(startLat, startLng, endLat, endLng),
        distanceText: formatDistance(calculateDistanceMeters(startLat, startLng, endLat, endLng)),
        durationSeconds: Math.round(calculateDistanceMeters(startLat, startLng, endLat, endLng) / 8.5), // ~30 km/h approx
        durationText: formatDuration(calculateDistanceMeters(startLat, startLng, endLat, endLng) / 8.5),
        etaText: formatEta(calculateDistanceMeters(startLat, startLng, endLat, endLng) / 8.5),
        steps: [{ instruction: 'Proceed towards destination', modifier: 'straight', distanceText: formatDistance(calculateDistanceMeters(startLat, startLng, endLat, endLng)) }],
        fallback: true
      };
    }
  } catch (err) {
    console.warn('OSRM routing request notice (using road projection fallback):', err.message);
    const directDist = calculateDistanceMeters(startLat, startLng, endLat, endLng);
    return {
      success: true,
      coordinates: [[startLat, startLng], [endLat, endLng]],
      distanceMeters: directDist,
      distanceText: formatDistance(directDist),
      durationSeconds: Math.round(directDist / 8.5),
      durationText: formatDuration(directDist / 8.5),
      etaText: formatEta(directDist / 8.5),
      steps: [{ instruction: 'Follow road network towards destination', modifier: 'straight', distanceText: formatDistance(directDist) }],
      fallback: true
    };
  }
}
