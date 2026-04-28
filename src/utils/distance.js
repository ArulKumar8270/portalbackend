function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // In kilometers
  return distance;
}

// Helper function to extract lat/lon from Google Maps URL
function extractLatLngFromGoogleMapsUrl(url) {
    if (!url || typeof url !== 'string') {
      return null;
    }
    // Regex to find coordinates in the format /@lat,lon,zoom[m|z]?/
    const match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+\.?\d*)(?:m|z)?/);
    if (match && match.length >= 3) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { lat, lon };
      }
    }
    return null;
  }
  
module.exports = {
  haversineDistance,
  extractLatLngFromGoogleMapsUrl
};