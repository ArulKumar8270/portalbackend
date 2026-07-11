function isValidLatLng(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function parseGoogleMapsCoordinates(url) {
  if (!url || typeof url !== "string") return null;
  const decoded = decodeURIComponent(url.trim());

  const atMatch = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = Number(atMatch[1]);
    const lng = Number(atMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  const placeMatch = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (placeMatch) {
    const lat = Number(placeMatch[1]);
    const lng = Number(placeMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  const queryMatch = decoded.match(/[?&](?:q|query)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (queryMatch) {
    const lat = Number(queryMatch[1]);
    const lng = Number(queryMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  const pathMatch = decoded.match(
    /\/(?:dir|place)\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/
  );
  if (pathMatch) {
    const lat = Number(pathMatch[1]);
    const lng = Number(pathMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  return null;
}

function resolveStoreCoordinates(store) {
  if (!store) return null;

  const settingsLat = Number(store.storeLatitude);
  const settingsLng = Number(store.storeLongitude);
  const settingsValid =
    isValidLatLng(settingsLat, settingsLng) &&
    !(settingsLat === 0 && settingsLng === 0);

  const fromUrl = parseGoogleMapsCoordinates(store.location);
  if (fromUrl) {
    return { lat: fromUrl.lat, lng: fromUrl.lng, source: 'location_url' };
  }

  if (settingsValid) {
    return { lat: settingsLat, lng: settingsLng, source: 'settings' };
  }

  return null;
}

module.exports = {
  isValidLatLng,
  parseGoogleMapsCoordinates,
  resolveStoreCoordinates,
};
