const { URLSearchParams } = require('url');

async function geocodeAddress(address) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Geocoding skipped: GOOGLE_API_KEY is not set');
      return null;
    }
    if (!address || !address.trim()) return null;

    const qs = new URLSearchParams({ address: address.trim(), key: apiKey });
    const url = `https://maps.googleapis.com/maps/api/geocode/json?${qs.toString()}`;

    const resp = await fetch(url);
    if (!resp.ok) {
      console.error('Geocoding HTTP error:', resp.status, resp.statusText);
      return null;
    }
    const data = await resp.json();
    if (!data || data.status !== 'OK' || !data.results || !data.results.length) {
      console.warn('Geocoding failed:', data && data.status, data && data.error_message);
      return null;
    }
    const loc = data.results[0].geometry && data.results[0].geometry.location;
    if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return null;
    return { lat: loc.lat, lng: loc.lng };
  } catch (e) {
    console.error('Geocoding exception:', e && e.message);
    return null;
  }
}

module.exports = { geocodeAddress };

