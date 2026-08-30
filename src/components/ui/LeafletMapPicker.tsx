'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  MapPin, 
  Navigation, 
  Search, 
  RefreshCw, 
  Plus, 
  Minus, 
  Crosshair, 
  Layers,
  Sparkles,
  LocateFixed,
  Eye,
  ExternalLink,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export type MapLayerType = 'osm_standard' | 'carto_voyager' | 'esri_clarity' | 'google_hybrid';

interface LeafletMapPickerProps {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  branchName?: string;
  userLatitude?: number;
  userLongitude?: number;
  userAccuracy?: number;
  onLocationChange?: (coords: { latitude: number; longitude: number; address?: string }) => void;
  onGeocodingStateChange?: (isGeocoding: boolean) => void;
  height?: string;
  isReadOnly?: boolean;
  defaultLayer?: MapLayerType;
  showToolbar?: boolean;
  showUserMarker?: boolean;
  showTargetCircle?: boolean;
}

export function LeafletMapPicker({
  latitude,
  longitude,
  radiusMeters = 10,
  branchName = 'Titik Bimbel',
  userLatitude,
  userLongitude,
  userAccuracy,
  onLocationChange,
  onGeocodingStateChange,
  height = '360px',
  isReadOnly = false,
  defaultLayer = 'osm_standard',
  showToolbar = true,
  showUserMarker = true,
  showTargetCircle = true,
}: LeafletMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const bimbelMarkerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const distanceLineRef = useRef<any>(null);
  const isInternalUpdateRef = useRef<boolean>(false);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>(defaultLayer);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);

  // Reverse Geocoding via OpenStreetMap Nominatim with fast fallback
  const performReverseGeocode = async (lat: number, lng: number): Promise<string | undefined> => {
    setIsGeocoding(true);
    if (onGeocodingStateChange) onGeocodingStateChange(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'id, en',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          setIsGeocoding(false);
          if (onGeocodingStateChange) onGeocodingStateChange(false);
          return data.display_name;
        }
      }
    } catch (err) {
      console.warn('Reverse geocoding warning:', err);
    }
    setIsGeocoding(false);
    if (onGeocodingStateChange) onGeocodingStateChange(false);
    return undefined;
  };

  // Ultra-reliable Tile layer configuration
  const getTileLayerConfig = (type: MapLayerType) => {
    switch (type) {
      case 'osm_standard':
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          options: {
            maxZoom: 19,
            subdomains: ['a', 'b', 'c'],
            attribution: '© OpenStreetMap contributors'
          }
        };
      case 'carto_voyager':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          options: {
            maxZoom: 20,
            subdomains: ['a', 'b', 'c', 'd'],
            attribution: '© CARTO, © OpenStreetMap'
          }
        };
      case 'esri_clarity':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          options: {
            maxZoom: 19,
            maxNativeZoom: 18,
            attribution: '© Esri, Maxar, Earthstar Geographics'
          }
        };
      case 'google_hybrid':
      default:
        return {
          url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          options: {
            maxZoom: 20,
            maxNativeZoom: 19,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          }
        };
    }
  };

  // Helper to calculate distance in meters
  const calcDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;
    let resizeTimer: any = null;

    async function initLeafletMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Safe patch for Leaflet DOM utilities to prevent position errors
      if (L && L.DomUtil && !(L.DomUtil as any)._posPatched) {
        (L.DomUtil as any)._posPatched = true;
        const origGetPosition = L.DomUtil.getPosition;
        L.DomUtil.getPosition = function (el: any) {
          if (!el) return new L.Point(0, 0);
          try {
            return origGetPosition ? origGetPosition.call(L.DomUtil, el) || new L.Point(0, 0) : (el._leaflet_pos || new L.Point(0, 0));
          } catch {
            return new L.Point(0, 0);
          }
        };
        const origSetPosition = L.DomUtil.setPosition;
        L.DomUtil.setPosition = function (el: any, point: any) {
          if (!el) return;
          try {
            if (origSetPosition) origSetPosition.call(L.DomUtil, el, point);
            else el._leaflet_pos = point;
          } catch {
            try {
              if (el && typeof el === 'object') el._leaflet_pos = point;
            } catch {}
          }
        };
      }

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Map cleanup error:', e);
        }
        mapInstanceRef.current = null;
      }

      if (!isMounted || !mapContainerRef.current) return;

      // Reset leaflet container id
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      // 1. Bimbel Center Pin (Purple + Gold Crown)
      const bimbelPinHtml = `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));">
          <div style="position: absolute; bottom: 2px; width: 20px; height: 7px; background: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(2px);"></div>
          <div style="width: 38px; height: 38px; background: #8A4C93; border: 3px solid #FFFFFF; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;">
            <div style="transform: rotate(45deg); width: 14px; height: 14px; background: #FACC15; border: 2px solid #FFFFFF; border-radius: 50%;"></div>
          </div>
        </div>
      `;

      const bimbelIcon = L.divIcon({
        html: bimbelPinHtml,
        className: 'custom-bimbel-pin',
        iconSize: [44, 44],
        iconAnchor: [22, 42],
        popupAnchor: [0, -42],
      });

      // 2. User Live Location Pin (Blue/Emerald Pulse Ring)
      const userPinHtml = `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; background: rgba(16, 185, 129, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 22px; height: 22px; background: #10B981; border: 3px solid #FFFFFF; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
            <div style="width: 8px; height: 8px; background: #FFFFFF; border-radius: 50%;"></div>
          </div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userPinHtml,
        className: 'custom-user-live-pin',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });

      const initialLat = Number(latitude) || -6.4063056;
      const initialLng = Number(longitude) || 108.1679722;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 18,
        maxZoom: 20,
        minZoom: 4,
        zoomControl: false,
        attributionControl: false,
      });

      // Add High-Quality Tile Layer
      const tileConfig = getTileLayerConfig(activeLayer);
      const tileLayer = L.tileLayer(tileConfig.url, tileConfig.options).addTo(map);
      tileLayerRef.current = tileLayer;

      // Add Target Bimbel Marker
      const bimbelMarker = L.marker([initialLat, initialLng], {
        icon: bimbelIcon,
        draggable: !isReadOnly,
        autoPan: true,
      }).addTo(map);

      bimbelMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #8A4C93; font-size: 13px;">${branchName}</strong><br/>
          <span>Radius Toleransi: <b>${radiusMeters} meter</b></span><br/>
          <span style="color: #666; font-size: 11px;">Koordinat: ${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}</span>
        </div>
      `);

      // Add Geofence Circle
      let circle: any = null;
      if (showTargetCircle) {
        circle = L.circle([initialLat, initialLng], {
          radius: Number(radiusMeters) || 10,
          color: '#10B981',
          fillColor: '#10B981',
          fillOpacity: 0.22,
          weight: 2.5,
          dashArray: '6, 6',
        }).addTo(map);
      }

      // Add User Live Marker if coordinates exist
      let userMarker: any = null;
      let distanceLine: any = null;
      if (showUserMarker && userLatitude !== undefined && userLongitude !== undefined) {
        const uLat = Number(userLatitude);
        const uLng = Number(userLongitude);
        if (!isNaN(uLat) && !isNaN(uLng)) {
          userMarker = L.marker([uLat, uLng], {
            icon: userIcon,
            interactive: true,
          }).addTo(map);

          const dist = calcDistanceMeters(initialLat, initialLng, uLat, uLng);
          setCalculatedDistance(dist);

          userMarker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px;">
              <strong style="color: #10B981;">📍 Posisi GPS Anda</strong><br/>
              <span>Jarak ke Bimbel: <b>${dist} meter</b></span><br/>
              <span style="color: #666; font-size: 11px;">${uLat.toFixed(6)}, ${uLng.toFixed(6)}</span>
            </div>
          `);

          // Draw dashed distance line connecting User to Bimbel
          distanceLine = L.polyline([[initialLat, initialLng], [uLat, uLng]], {
            color: dist <= radiusMeters ? '#10B981' : '#F59E0B',
            weight: 3,
            dashArray: '5, 8',
            opacity: 0.85,
          }).addTo(map);
        }
      }

      // Handle Marker Drag for Admins
      if (!isReadOnly && onLocationChange) {
        bimbelMarker.on('dragend', async () => {
          const pos = bimbelMarker.getLatLng();
          if (circle) circle.setLatLng(pos);
          if (distanceLine && userMarker) {
            const uPos = userMarker.getLatLng();
            distanceLine.setLatLngs([pos, uPos]);
            const dist = calcDistanceMeters(pos.lat, pos.lng, uPos.lat, uPos.lng);
            setCalculatedDistance(dist);
          }
          isInternalUpdateRef.current = true;
          const address = await performReverseGeocode(pos.lat, pos.lng);
          onLocationChange({
            latitude: Number(pos.lat.toFixed(6)),
            longitude: Number(pos.lng.toFixed(6)),
            address,
          });
        });

        // Handle Map Click to move pin
        map.on('click', async (e: any) => {
          const { lat, lng } = e.latlng;
          bimbelMarker.setLatLng([lat, lng]);
          if (circle) circle.setLatLng([lat, lng]);
          if (distanceLine && userMarker) {
            const uPos = userMarker.getLatLng();
            distanceLine.setLatLngs([[lat, lng], uPos]);
            const dist = calcDistanceMeters(lat, lng, uPos.lat, uPos.lng);
            setCalculatedDistance(dist);
          }
          isInternalUpdateRef.current = true;
          const address = await performReverseGeocode(lat, lng);
          onLocationChange({
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lng.toFixed(6)),
            address,
          });
        });
      }

      mapInstanceRef.current = map;
      bimbelMarkerRef.current = bimbelMarker;
      userMarkerRef.current = userMarker;
      circleRef.current = circle;
      distanceLineRef.current = distanceLine;
      setIsMapReady(true);

      // Force Leaflet to recalculate container bounds at staggered intervals
      const delays = [50, 200, 500, 1000];
      delays.forEach(d => {
        setTimeout(() => {
          if (map && isMounted) {
            map.invalidateSize();
          }
        }, d);
      });
    }

    initLeafletMap();

    return () => {
      isMounted = false;
      if (resizeTimer) clearTimeout(resizeTimer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (err) {
          console.warn('Map cleanup unmount error:', err);
        }
        mapInstanceRef.current = null;
        bimbelMarkerRef.current = null;
        userMarkerRef.current = null;
        circleRef.current = null;
        distanceLineRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Update tile layer when activeLayer changes
  const switchLayer = async (newLayer: MapLayerType) => {
    setActiveLayer(newLayer);
    if (!mapInstanceRef.current) return;

    const L = (await import('leaflet')).default;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const config = getTileLayerConfig(newLayer);
    const newTileLayer = L.tileLayer(config.url, config.options).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;
    newTileLayer.bringToBack();
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleCenterOnBimbel = () => {
    if (mapInstanceRef.current && bimbelMarkerRef.current) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      mapInstanceRef.current.setView([lat, lng], 18, { animate: true });
    }
  };

  const handleCenterOnUser = () => {
    if (mapInstanceRef.current && userLatitude !== undefined && userLongitude !== undefined) {
      const lat = Number(userLatitude);
      const lng = Number(userLongitude);
      mapInstanceRef.current.setView([lat, lng], 18, { animate: true });
    }
  };

  const handleFitAll = async () => {
    if (!mapInstanceRef.current) return;
    const L = (await import('leaflet')).default;
    const points: [number, number][] = [[Number(latitude), Number(longitude)]];
    if (userLatitude !== undefined && userLongitude !== undefined) {
      points.push([Number(userLatitude), Number(userLongitude)]);
    }
    const bounds = L.latLngBounds(points);
    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 19 });
  };

  // Update markers and circle when latitude / longitude or user location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !bimbelMarkerRef.current) return;

    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const rad = Number(radiusMeters) || 10;

    if (!isNaN(lat) && !isNaN(lng)) {
      bimbelMarkerRef.current.setLatLng([lat, lng]);
      if (circleRef.current) {
        circleRef.current.setLatLng([lat, lng]);
        circleRef.current.setRadius(rad);
      }
    }

    if (userLatitude !== undefined && userLongitude !== undefined) {
      const uLat = Number(userLatitude);
      const uLng = Number(userLongitude);
      if (!isNaN(uLat) && !isNaN(uLng)) {
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([uLat, uLng]);
        }
        if (distanceLineRef.current) {
          distanceLineRef.current.setLatLngs([[lat, lng], [uLat, uLng]]);
          const dist = calcDistanceMeters(lat, lng, uLat, uLng);
          setCalculatedDistance(dist);
          distanceLineRef.current.setStyle({
            color: dist <= rad ? '#10B981' : '#F59E0B'
          });
        }
      }
    }
  }, [latitude, longitude, radiusMeters, userLatitude, userLongitude]);

  // Handle ResizeObserver for dynamic tabs & modals
  useEffect(() => {
    if (!mapContainerRef.current || !mapInstanceRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [isMapReady]);

  // GPS Geolocation trigger
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Perangkat Anda tidak mendukung geolokasi GPS.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));

        if (mapInstanceRef.current && bimbelMarkerRef.current) {
          if (!isReadOnly) {
            bimbelMarkerRef.current.setLatLng([lat, lng]);
            if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
          }
          mapInstanceRef.current.setView([lat, lng], 18, { animate: true });
        }

        if (onLocationChange) {
          const address = await performReverseGeocode(lat, lng);
          onLocationChange({
            latitude: lat,
            longitude: lng,
            address,
          });
        }

        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        alert('Gagal mendeteksi lokasi GPS. Pastikan izin lokasi (Geolocation) telah diaktifkan di browser.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Smart Indonesian Address Search
  const handleSearchPlace = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery || searchQuery).trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    // Check known local presets (like Jangga Indramayu / Losarang)
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('jangga') || (lowerQuery.includes('losarang') && lowerQuery.includes('indramayu'))) {
      const janggaMatch = {
        display_name: 'Blok Ranca Gunda, Desa Jangga, Kec. Losarang, Kab. Indramayu, Jawa Barat 45253 (Pusat Rumah CahayaQu)',
        lat: '-6.406306',
        lon: '108.167972',
      };
      setSearchResults([janggaMatch]);
      setIsSearching(false);
      return;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&countrycodes=id&limit=5`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'id, en' } });
      const data = res.ok ? await res.json() : [];

      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        setSearchError('Lokasi tidak ditemukan. Coba cari nama kecamatan / kabupaten atau geser pin langsung pada peta.');
      }
    } catch (err) {
      setSearchError('Terjadi gangguan koneksi saat mencari lokasi.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = async (item: { display_name: string; lat: string; lon: string }) => {
    const lat = Number(parseFloat(item.lat).toFixed(6));
    const lng = Number(parseFloat(item.lon).toFixed(6));

    if (mapInstanceRef.current && bimbelMarkerRef.current) {
      if (!isReadOnly) {
        bimbelMarkerRef.current.setLatLng([lat, lng]);
        if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
      }
      mapInstanceRef.current.setView([lat, lng], 18, { animate: true });
    }

    setSearchResults([]);
    setSearchQuery('');
    
    if (onLocationChange) {
      onLocationChange({
        latitude: lat,
        longitude: lng,
        address: item.display_name,
      });
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#E4D8E6] bg-white shadow-sm flex flex-col">
      {/* Top Map Control Toolbar */}
      {showToolbar && (
        <div className="p-3 bg-white border-b border-[#EDE6DD] flex flex-col gap-2.5 z-10">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            
            {/* Search Input */}
            {!isReadOnly && (
              <div className="relative flex-1 min-w-[220px] max-w-md flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchPlace();
                    }
                  }}
                  placeholder="Cari desa / jalan / kota di peta..."
                  className="w-full pl-8 pr-16 py-2 text-xs bg-brand-light border border-[#E0D8CC] rounded-xl focus:bg-white focus:outline-hidden focus:border-brand-primary font-medium"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => handleSearchPlace()}
                  disabled={isSearching || !searchQuery.trim()}
                  className="absolute right-1.5 px-2.5 py-1 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1"
                >
                  {isSearching ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Cari'}
                </button>
              </div>
            )}

            {/* Map Layer Switcher */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center bg-brand-light p-0.5 rounded-xl border border-[#E0D8CC]">
                <button
                  type="button"
                  onClick={() => switchLayer('osm_standard')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                    activeLayer === 'osm_standard'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-gray-600 hover:text-brand-dark'
                  }`}
                  title="Peta Jalan Jelas & Terang (OpenStreetMap)"
                >
                  <span>🗺️ Peta Jelas</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchLayer('carto_voyager')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                    activeLayer === 'carto_voyager'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-gray-600 hover:text-brand-dark'
                  }`}
                  title="Peta Halus Modern & Kontras Tinggi (Carto Voyager)"
                >
                  <span>🏙️ Modern</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchLayer('esri_clarity')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                    activeLayer === 'esri_clarity'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-gray-600 hover:text-brand-dark'
                  }`}
                  title="Foto Satelit Nyata HD (Esri World Imagery)"
                >
                  <span>🛰️ Satelit HD</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchLayer('google_hybrid')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                    activeLayer === 'google_hybrid'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-gray-600 hover:text-brand-dark'
                  }`}
                  title="Google Satelit + Nama Jalan (Hybrid)"
                >
                  <span>🚀 Hybrid</span>
                </button>
              </div>

              {/* GPS Live Button */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Deteksi dan gunakan posisi GPS perangkat Anda saat ini"
              >
                {isLocating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : (
                  <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>{isLocating ? 'Mendeteksi GPS...' : 'GPS Saya'}</span>
              </button>
            </div>
          </div>

          {/* Quick Info & Google Maps link */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs pt-1.5 border-t border-[#F0EAE1]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-brand-dark flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8A4C93] inline-block" />
                {branchName}:
              </span>
              <span className="font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md text-[11px]">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </span>
              {calculatedDistance !== null && (
                <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 ${
                  calculatedDistance <= radiusMeters 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {calculatedDistance <= radiusMeters ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-amber-600" />}
                  Jarak Anda: {calculatedDistance} meter (Radius: {radiusMeters}m)
                </span>
              )}
            </div>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:text-brand-primary-hover font-bold text-[11px] flex items-center gap-1 hover:underline"
            >
              <span>Buka Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Search Result Dropdown */}
      {searchResults.length > 0 && (
        <div className="absolute top-16 left-3 right-3 md:left-4 md:right-auto md:w-96 bg-white rounded-xl shadow-xl border border-[#E0D8CC] p-1.5 z-30 max-h-60 overflow-y-auto space-y-1">
          <div className="px-2 py-1 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
            Hasil Pencarian (Pilih untuk Pindah Pin):
          </div>
          {searchResults.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSearchResult(item)}
              className="w-full text-left p-2 rounded-lg text-xs hover:bg-brand-light transition-all flex items-start gap-2 cursor-pointer border border-transparent hover:border-[#E8E1D7]"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
              <span className="line-clamp-2 text-brand-dark font-medium leading-tight">
                {item.display_name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Search Error Alert */}
      {searchError && (
        <div className="absolute top-16 left-3 right-3 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-xl text-xs z-30 flex items-center justify-between">
          <span>{searchError}</span>
          <button onClick={() => setSearchError(null)} className="font-bold text-red-500 hover:text-red-800 ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* Leaflet Map Canvas Container */}
      <div 
        ref={mapContainerRef} 
        style={{ height, minHeight: '260px' }} 
        className="w-full relative z-0 bg-[#E8ECEF]"
      />

      {/* On-Map Floating Floating Quick Controls */}
      <div className="absolute right-3 top-20 flex flex-col gap-1.5 z-20">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-xl bg-white/95 text-brand-dark shadow-md border border-black/10 flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold"
          title="Perbesar Peta (+)"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-xl bg-white/95 text-brand-dark shadow-md border border-black/10 flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold"
          title="Perkecil Peta (-)"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleCenterOnBimbel}
          className="w-8 h-8 rounded-xl bg-white/95 text-brand-primary shadow-md border border-black/10 flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Pusatkan ke Titik Bimbel"
        >
          <MapPin className="w-4 h-4" />
        </button>

        {userLatitude !== undefined && userLongitude !== undefined && (
          <button
            type="button"
            onClick={handleCenterOnUser}
            className="w-8 h-8 rounded-xl bg-white/95 text-emerald-600 shadow-md border border-black/10 flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Pusatkan ke Posisi GPS Saya"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={handleFitAll}
          className="w-8 h-8 rounded-xl bg-white/95 text-gray-700 shadow-md border border-black/10 flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer text-xs font-bold"
          title="Tampilkan Semua Titik (Fit Bounds)"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend Overlay at Bottom-Left */}
      <div className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-black/10 shadow-xs z-10 flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1 text-[#8A4C93] font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8A4C93] inline-block" />
          <span>Titik Bimbel</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-600 font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-ping" />
          <span>Posisi Anda</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500 font-medium">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-500 inline-block" />
          <span>Radius {radiusMeters}m</span>
        </div>
      </div>
    </div>
  );
}
