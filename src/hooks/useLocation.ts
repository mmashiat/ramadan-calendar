import { useState, useCallback } from 'react';
import { getCachedLocation, cacheLocation } from '../lib/storage';

interface LocationState {
  lat: number;
  lng: number;
  loading: boolean;
  error: string | null;
  needsPermission: boolean;
}

export function useLocation(): LocationState & { requestLocation: () => void } {
  const [state, setState] = useState<LocationState>(() => {
    const cached = getCachedLocation();
    if (cached) {
      return { lat: cached.lat, lng: cached.lng, loading: false, error: null, needsPermission: false };
    }
    return { lat: 0, lng: 0, loading: false, error: null, needsPermission: true };
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        needsPermission: false,
        error: 'Geolocation not supported by this browser',
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, needsPermission: false }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        cacheLocation(latitude, longitude);
        setState({
          lat: latitude,
          lng: longitude,
          loading: false,
          error: null,
          needsPermission: false,
        });
      },
      (err) => {
        // Fallback to a reasonable default
        const fallback = { lat: 40.7128, lng: -74.006 };
        cacheLocation(fallback.lat, fallback.lng);
        setState({
          ...fallback,
          loading: false,
          error: `Using default location (NYC). ${err.message}`,
          needsPermission: false,
        });
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  return { ...state, requestLocation };
}
