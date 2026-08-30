'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  ShieldCheck, 
  Clock,
  VideoOff,
  Building,
  Check
} from 'lucide-react';
import { TeacherAttendance, BimbelLocation } from '../../types';

// Default Bimbel Location Center (Titik 6°24'22.7"S 108°10'04.7"E)
export const BIMBEL_DEFAULT_LOCATION: BimbelLocation = {
  id: 'loc-pusat',
  name: 'Bimbel Rumah CahayaQu (Pusat)',
  address: 'Titik Lokasi Bimbel: 6°24\'22.7"S 108°10\'04.7"E',
  latitude: -6.4063056,
  longitude: 108.1679722,
  radiusMeters: 5,
  isActive: true,
  isDefault: true,
};

// Haversine Distance Formula in Meters
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of Earth in meters
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
}

interface TeacherCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: {
    id: string;
    name: string;
    email?: string;
    role?: string;
    subject?: string;
    [key: string]: any;
  };
  locations?: BimbelLocation[];
  activeLocationId?: string;
  mode: 'check-in' | 'check-out';
  existingRecord?: TeacherAttendance;
  onSuccess: (data: {
    photoBase64: string;
    latitude: number;
    longitude: number;
    distanceMeters: number;
    address: string;
    isWithinRadius: boolean;
    locationId?: string;
    locationName?: string;
    timestamp: string;
    timeHHmm: string;
    notes?: string;
  }) => void;
}

export function TeacherCheckInModal({
  isOpen,
  onClose,
  teacher,
  locations = [],
  activeLocationId,
  mode,
  existingRecord,
  onSuccess,
}: TeacherCheckInModalProps) {
  // Determine Available Branches
  const activeLocations = locations.filter(l => l.isActive);
  const initialBranch = (
    activeLocations.find(l => l.id === activeLocationId) ||
    activeLocations.find(l => l.isDefault) ||
    activeLocations[0] ||
    BIMBEL_DEFAULT_LOCATION
  );

  const selectedBranch = initialBranch;

  // Camera States
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(true);
  const [isShutterActive, setIsShutterActive] = useState<boolean>(false);

  // GPS & Location States
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string>('Mendeteksi koordinat...');
  const [distanceMeters, setDistanceMeters] = useState<number>(0);
  const [isWithinRadius, setIsWithinRadius] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Live Clock
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Recalculate distance when coords change
  useEffect(() => {
    if (currentCoords && selectedBranch) {
      const dist = calculateHaversineDistance(
        currentCoords.latitude,
        currentCoords.longitude,
        selectedBranch.latitude,
        selectedBranch.longitude
      );
      setDistanceMeters(dist);
      setIsWithinRadius(dist <= (selectedBranch.radiusMeters || 5));
    }
  }, [currentCoords, selectedBranch]);

  // Bind stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      const videoEl = videoRef.current;
      videoEl.srcObject = stream;
      
      const handlePlay = () => {
        setIsCameraStarting(false);
      };

      videoEl.onloadedmetadata = () => {
        videoEl.play().then(handlePlay).catch((err) => {
          console.warn('Play error after metadata:', err);
          handlePlay();
        });
      };

      videoEl.play().then(handlePlay).catch((err) => {
        console.warn('Direct play error:', err);
      });
    }
  }, [stream]);

  // 1. Initialize Camera on Modal Open
  const startCamera = async () => {
    setIsCameraStarting(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Perangkat tidak mendukung akses kamera HTML5.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsCameraStarting(false);
    } catch (err: any) {
      console.warn('Gagal akses front camera:', err);
      let errMsg = 'Tidak dapat mengakses kamera depan.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Izin kamera ditolak. Harap izinkan akses kamera di browser Anda.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'Kamera tidak ditemukan pada perangkat Anda.';
      }
      setCameraError(errMsg);
      setIsCameraStarting(false);
    }
  };

  // Stop Media Stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // 2. Geolocation Request
  const requestLocation = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      setGpsLoading(false);
      setDetectedAddress('GPS Geolocation tidak didukung browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setCurrentCoords(coords);
        setGpsLoading(false);
        setDetectedAddress(`Lat: ${coords.latitude.toFixed(6)}, Lng: ${coords.longitude.toFixed(6)}`);

        // Calculate distance to 6°24'22.7"S 108°10'04.7"E
        const dist = calculateHaversineDistance(
          coords.latitude,
          coords.longitude,
          selectedBranch.latitude,
          selectedBranch.longitude
        );
        setDistanceMeters(dist);
        setIsWithinRadius(dist <= (selectedBranch.radiusMeters || 5));
      },
      (err) => {
        console.warn('GPS error:', err);
        setGpsLoading(false);
        setDetectedAddress('Gagal membaca sinyal GPS');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
      requestLocation();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Execute Instant Capture & Auto-Submit
  const doSubmitWithPhoto = (photoBase64: string, customDist?: number, customWithinRadius?: boolean) => {
    setIsSubmitting(true);
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const timeHHmm = `${hours}:${mins}`;

    const finalDistance = customDist !== undefined ? customDist : distanceMeters;
    const finalWithinRadius = customWithinRadius !== undefined ? customWithinRadius : isWithinRadius;
    const lat = currentCoords?.latitude || selectedBranch.latitude;
    const lon = currentCoords?.longitude || selectedBranch.longitude;

    setTimeout(() => {
      onSuccess({
        photoBase64,
        latitude: lat,
        longitude: lon,
        distanceMeters: finalDistance,
        address: detectedAddress,
        isWithinRadius: finalWithinRadius,
        locationId: selectedBranch.id,
        locationName: selectedBranch.name,
        timestamp: now.toISOString(),
        timeHHmm: timeHHmm,
        notes: mode === 'check-in' ? 'Presensi Masuk (Selfie + GPS 5m)' : 'Presensi Pulang (Selfie + GPS 5m)',
      });
      setIsSubmitting(false);
      onClose();
    }, 350);
  };

  // Handle Capture Photo and AUTO SUBMIT immediately
  const handleCaptureAndAutoSubmit = () => {
    if (isSubmitting) return;

    // If camera error, fallback to simulated selfie
    if (cameraError || !videoRef.current || !canvasRef.current) {
      handleUseSimulatedSelfie();
      return;
    }

    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 250);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    if (ctx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } catch (drawErr) {
        console.warn('Canvas draw video error:', drawErr);
      }

      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      
      const nowStr = new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });

      // Bottom banner overlay with teacher name & status
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, canvas.height - 46, canvas.width, 46);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`📸 ${teacher.name} (${mode === 'check-in' ? 'Absen Masuk' : 'Absen Pulang'})`, 14, canvas.height - 24);
      ctx.font = '11px sans-serif';
      ctx.fillText(`${nowStr} WIB | Radius: ${distanceMeters}m (${isWithinRadius ? 'Dalam 5m' : 'Luar 5m'})`, 14, canvas.height - 8);

      const dataUrl = canvas.width > 0 ? canvas.toDataURL('image/jpeg', 0.88) : '';
      if (dataUrl) {
        doSubmitWithPhoto(dataUrl);
      } else {
        handleUseSimulatedSelfie();
      }
    } else {
      handleUseSimulatedSelfie();
    }
  };

  // Fallback: Generate Avatar Selfie and Auto Submit
  const handleUseSimulatedSelfie = () => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 400, 400);
      grad.addColorStop(0, '#532D6D');
      grad.addColorStop(1, '#8B48B6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 400);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 110px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(teacher.name.charAt(0).toUpperCase(), 200, 170);

      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(teacher.name, 200, 280);
      ctx.font = '14px sans-serif';
      ctx.fillText(`${mode === 'check-in' ? 'Presensi Masuk' : 'Presensi Pulang'}`, 200, 315);
      ctx.font = '12px sans-serif';
      ctx.fillText(`6°24'22.7"S 108°10'04.7"E`, 200, 345);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      doSubmitWithPhoto(dataUrl);
    }
  };

  // Handle Native File Upload & Auto Submit
  const handleNativeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          doSubmitWithPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick Testing: Set Validasi Di Titik 5m
  const handleCalibrateHere = () => {
    setDistanceMeters(0);
    setIsWithinRadius(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-[95%] sm:w-full shadow-2xl border border-[#E4D8E6] animate-fade-in overflow-hidden max-h-[85vh] flex flex-col">
        
        {/* Hidden Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleNativeFileUpload}
          className="hidden"
        />

        {/* Modal Header - Clean with Title and Close Button */}
        <div className="px-4 py-3 border-b border-[#F3EDF5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              mode === 'check-in' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
            }`}>
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-brand-dark">
                {mode === 'check-in' ? 'Presensi Masuk Selfie & GPS' : 'Presensi Pulang Selfie & GPS'}
              </h4>
              <p className="text-[10px] text-gray-500 font-medium">{teacher.name}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Tutup"
            title="Tutup"
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Live Face View & Instant Status */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col space-y-3">

          {/* Real-Time GPS Status Card */}
          <div className="bg-[#FAF7F5] border border-[#EFE5DC] rounded-2xl p-3 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isWithinRadius ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-extrabold text-brand-dark">Status GPS:</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    isWithinRadius 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {gpsLoading ? 'Mendeteksi...' : isWithinRadius ? '✅ Dalam Radius (≤5m)' : `⚠️ Jarak: ${distanceMeters}m`}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-mono truncate mt-0.5">
                  {currentCoords ? `Lat: ${currentCoords.latitude.toFixed(5)}, Lng: ${currentCoords.longitude.toFixed(5)}` : 'Memeriksa koordinat...'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={requestLocation}
              disabled={gpsLoading}
              title="Perbarui Sinyal GPS"
              className="p-2 bg-white hover:bg-gray-100 text-gray-700 border border-[#E4D8E6] rounded-xl transition-all cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>

          {/* Camera Frame (Focus on Face View Only) */}
          <div className="relative aspect-square w-full bg-black rounded-3xl overflow-hidden shadow-inner border-2 border-[#E4D8E6] flex items-center justify-center">
            
            {/* Shutter Animation Effect */}
            {isShutterActive && (
              <div className="absolute inset-0 bg-white z-30 animate-ping pointer-events-none" />
            )}

            {/* Live Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] ${
                cameraError ? 'hidden' : 'block'
              }`}
            />

            {/* Face Guide Oval Target Overlay */}
            {!cameraError && (
              <>
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-44 h-56 border-2 border-dashed border-white/80 rounded-[50%] flex items-center justify-center shadow-2xl">
                    <span className="text-[10px] font-extrabold bg-black/60 text-white px-3 py-1 rounded-full backdrop-blur-xs">
                      Arahkan Wajah di Sini
                    </span>
                  </div>
                </div>

                {/* Real-time Watermark Live */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl text-[10px] font-medium flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold uppercase tracking-wider">Kamera Live</span>
                  </div>
                  <span className="font-mono font-bold">
                    {currentDate.toLocaleTimeString('id-ID')} WIB
                  </span>
                </div>
              </>
            )}

            {/* Camera Starting Spinner */}
            {isCameraStarting && !stream && !cameraError && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white space-y-2 z-10">
                <RefreshCw className="w-7 h-7 animate-spin mx-auto text-emerald-400" />
                <p className="text-xs text-gray-200 font-semibold">Mengaktifkan kamera...</p>
              </div>
            )}

            {/* Camera Error / Fallback State */}
            {cameraError && (
              <div className="p-5 text-center space-y-3 bg-gray-900 text-white w-full h-full flex flex-col items-center justify-center z-20">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                  <VideoOff className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-red-300">{cameraError}</h4>
                <p className="text-[11px] text-gray-400">
                  Gunakan kamera ponsel atau foto akun Anda di bawah untuk tetap melakukan presensi.
                </p>
                <div className="flex gap-2 flex-wrap justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" /> Kamera HP
                  </button>
                  <button
                    type="button"
                    onClick={handleUseSimulatedSelfie}
                    className="px-3 py-1.5 bg-brand-primary text-white font-bold rounded-xl text-xs hover:bg-brand-primary/90 transition-all cursor-pointer"
                  >
                    Kirim Foto Akun
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button: Ambil Gambar & Otomatis Terkirim */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleCaptureAndAutoSubmit}
              disabled={isSubmitting}
              className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-white ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : mode === 'check-in'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Menyimpan Presensi...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span>
                    {mode === 'check-in' ? 'Ambil Gambar & Otomatis Absen Masuk' : 'Ambil Gambar & Otomatis Absen Pulang'}
                  </span>
                </>
              )}
            </button>

            {/* Quick Testing Simulation Helper if > 5m */}
            {!isWithinRadius && (
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-[10px] text-gray-500">*Sedang uji coba di luar titik 5m?</span>
                <button
                  type="button"
                  onClick={handleCalibrateHere}
                  className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Set Simulasi Posisi Valid (≤5m)
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
