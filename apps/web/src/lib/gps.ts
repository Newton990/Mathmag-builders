// src/lib/gps.ts
// Browser geolocation wrapper. GPS is a field aid, never the sole proof of
// attendance: the check-in call also records the officer and timestamp.

export interface GpsReading {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: string;
}

export function getCurrentGps(): Promise<GpsReading> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('This device does not provide location services'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date().toISOString(),
        });
      },
      (error) => {
        reject(
          new Error(
            error.code === error.PERMISSION_DENIED
              ? 'Location permission was denied. Enable it to check in at the site.'
              : 'Could not read the current GPS position',
          ),
        );
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    );
  });
}

export function formatGps(reading: { latitude: number; longitude: number }): string {
  return `${reading.latitude.toFixed(5)}, ${reading.longitude.toFixed(5)}`;
}
