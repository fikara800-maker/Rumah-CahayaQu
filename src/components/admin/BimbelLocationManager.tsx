'use client';

import React, { useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Radio, 
  ShieldCheck, 
  Database, 
  Navigation, 
  Compass, 
  Layers, 
  Info,
  Check,
  AlertTriangle,
  Building,
  RotateCcw,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { BimbelLocation } from '../../types';
import { LeafletMapPicker } from '../ui/LeafletMapPicker';
import { DatabaseSchemaModal } from './DatabaseSchemaModal';

interface BimbelLocationManagerProps {
  locations: BimbelLocation[];
  onAddLocation: (newLocation: Omit<BimbelLocation, 'id'>) => void;
  onUpdateLocation: (updatedLocation: BimbelLocation) => void;
  onDeleteLocation: (id: string) => void;
  onSetDefaultLocation: (id: string) => void;
}

export function BimbelLocationManager({
  locations,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  onSetDefaultLocation,
}: BimbelLocationManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(-6.401183);
  const [longitude, setLongitude] = useState<number>(108.168759);
  const [radiusMeters, setRadiusMeters] = useState<number>(25);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [notes, setNotes] = useState('');
  const [isSyncingAddress, setIsSyncingAddress] = useState<boolean>(false);

  // Geofence Test Simulator State
  const [testLat, setTestLat] = useState<string>('');
  const [testLng, setTestLng] = useState<string>('');
  const [testResult, setTestResult] = useState<{
    distance: number;
    isValid: boolean;
    branchName: string;
  } | null>(null);

  const startAddNew = () => {
    setIsEditing(true);
    setEditingId(null);
    setName('');
    setAddress('RT 05 RW 02 Blok Ranca Gunda, Desa Jangga, Kec. Losarang, Kab. Indramayu, Jawa Barat 45253');
    setLatitude(-6.401183);
    setLongitude(108.168759);
    setRadiusMeters(25);
    setIsActive(true);
    setIsDefault(locations.length === 0);
    setNotes('');
  };

  const startEdit = (loc: BimbelLocation) => {
    setIsEditing(true);
    setEditingId(loc.id);
    setName(loc.name);
    setAddress(loc.address);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setRadiusMeters(loc.radiusMeters || 10);
    setIsActive(loc.isActive);
    setIsDefault(!!loc.isDefault);
    setNotes(loc.notes || '');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
  };

  // Synchronize Location and Address directly from Pin Drag / Click
  const handleMapLocationChange = (coords: { latitude: number; longitude: number; address?: string }) => {
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
    if (coords.address) {
      setAddress(coords.address);
    }
  };

  // Manual Trigger to re-fetch address from current coordinates
  const handleManualSyncAddress = async () => {
    setIsSyncingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'id, en',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
        }
      }
    } catch (err) {
      console.warn('Sync address error:', err);
    } finally {
      setIsSyncingAddress(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama cabang bimbel wajib diisi.');
      return;
    }
    if (!address.trim()) {
      alert('Alamat lengkap cabang wajib diisi.');
      return;
    }

    if (editingId) {
      onUpdateLocation({
        id: editingId,
        name: name.trim(),
        address: address.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters) || 10,
        isActive,
        isDefault,
        notes: notes.trim(),
        updatedAt: new Date().toISOString().split('T')[0],
      });
    } else {
      onAddLocation({
        name: name.trim(),
        address: address.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters) || 10,
        isActive,
        isDefault,
        notes: notes.trim(),
        updatedAt: new Date().toISOString().split('T')[0],
      });
    }

    setIsEditing(false);
    setEditingId(null);
  };

  // Helper Haversine Distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  const handleRunSimulator = (e: React.FormEvent) => {
    e.preventDefault();
    const tLat = parseFloat(testLat);
    const tLng = parseFloat(testLng);

    if (isNaN(tLat) || isNaN(tLng)) {
      alert('Koordinat pengujian tidak valid.');
      return;
    }

    // Check against default or active location
    const targetBranch = locations.find(l => l.isDefault) || locations[0];
    if (!targetBranch) return;

    const dist = calculateDistance(tLat, tLng, targetBranch.latitude, targetBranch.longitude);
    const isValid = dist <= (targetBranch.radiusMeters || 10);

    setTestResult({
      distance: dist,
      isValid,
      branchName: targetBranch.name,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EDE6DD] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-brand-dark font-display">
              Master Data Lokasi Bimbel & Geofencing
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-extrabold text-[11px]">
              {locations.length} Cabang
            </span>
          </div>
          <p className="text-xs text-brand-muted mt-0.5">
            Konfigurasi koordinat GPS cabang & batas radius presensi kehadiran guru (Maks. 10m).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSqlModal(true)}
            className="px-3.5 py-2 bg-brand-light hover:bg-brand-light/80 text-brand-dark border border-[#E0D8CC] font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Database className="w-4 h-4 text-brand-primary" />
            <span>Skema Database SQL</span>
          </button>

          {!isEditing && (
            <button
              onClick={startAddNew}
              className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Cabang Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Simplified Add / Edit Form */}
      {isEditing && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-brand-primary/30 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#EDE6DD]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-brand-dark font-display">
                  {editingId ? 'Edit Lokasi Cabang' : 'Tambah Lokasi Cabang Baru'}
                </h3>
                <p className="text-xs text-brand-muted">
                  Klik atau geser pin di peta untuk menyelaraskan koordinat & alamat secara otomatis.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="text-xs font-bold text-gray-500 hover:text-brand-dark px-3 py-1.5 rounded-xl border border-[#E0D8CC] hover:bg-gray-50 cursor-pointer"
            >
              Batal
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* LEFT COLUMN: Clean Form Fields (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* 1. Nama Cabang */}
                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-1">
                    Nama Cabang Bimbel <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="cth: Bimbel Rumah CahayaQu (Pusat Jagakarsa)"
                    className="w-full px-3.5 py-2.5 bg-brand-light border border-[#E0D8CC] rounded-xl text-xs font-semibold text-brand-dark focus:bg-white focus:outline-hidden focus:border-brand-primary transition-all"
                  />
                </div>

                {/* 2. Alamat Lengkap with Auto-Sync Indicator */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-brand-dark flex items-center gap-1">
                      Alamat Lengkap <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleManualSyncAddress}
                      disabled={isSyncingAddress}
                      className="text-[11px] font-bold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 cursor-pointer bg-brand-light px-2 py-0.5 rounded-md border border-[#E0D8CC]"
                      title="Ambil nama alamat dari posisi pin saat ini"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncingAddress ? 'animate-spin' : ''}`} />
                      <span>{isSyncingAddress ? 'Menyelaraskan...' : 'Ambil dari Pin'}</span>
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Alamat akan otomatis terisi saat pin di peta digeser atau klik tombol GPS..."
                    className="w-full px-3.5 py-2.5 bg-brand-light border border-[#E0D8CC] rounded-xl text-xs font-medium text-brand-dark focus:bg-white focus:outline-hidden focus:border-brand-primary transition-all resize-none leading-relaxed"
                  />

                  <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                    {isSyncingAddress ? (
                      <span className="text-brand-primary font-semibold flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Menyelaraskan alamat dari pin peta...
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Alamat tersinkronisasi otomatis dengan pin peta
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Koordinat GPS (Latitude & Longitude) */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-brand-light/70 rounded-2xl border border-[#E8E1D7]">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white font-mono border border-[#E0D8CC] rounded-xl text-xs font-bold text-brand-dark focus:outline-hidden focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white font-mono border border-[#E0D8CC] rounded-xl text-xs font-bold text-brand-dark focus:outline-hidden focus:border-brand-primary"
                    />
                  </div>
                </div>

                {/* 4. Radius Toleransi (Meter) - Clean & Simplified */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-brand-dark">
                      Radius Presensi (Meter):
                    </label>
                    <span className="text-xs font-extrabold text-brand-primary font-mono">
                      {radiusMeters} Meter
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      max={200}
                      required
                      value={radiusMeters}
                      onChange={(e) => setRadiusMeters(parseInt(e.target.value) || 10)}
                      className="w-24 px-3 py-2 bg-brand-light font-mono border border-[#E0D8CC] rounded-xl text-xs font-bold text-brand-dark focus:bg-white focus:outline-hidden focus:border-brand-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setRadiusMeters(10)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        radiusMeters === 10
                          ? 'bg-brand-primary text-white shadow-xs'
                          : 'bg-brand-light text-gray-700 hover:bg-gray-200 border border-[#E0D8CC]'
                      }`}
                    >
                      10 Meter (Standar)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRadiusMeters(20)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        radiusMeters === 20
                          ? 'bg-brand-primary text-white shadow-xs'
                          : 'bg-brand-light text-gray-700 hover:bg-gray-200 border border-[#E0D8CC]'
                      }`}
                    >
                      20 Meter
                    </button>
                  </div>
                </div>

                {/* 5. Cabang Default & Status Aktif */}
                <div className="p-3 bg-brand-light rounded-2xl border border-[#E8E1D7] flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="w-4 h-4 text-brand-primary rounded-md focus:ring-brand-primary cursor-pointer accent-brand-primary"
                    />
                    <span className="text-xs font-bold text-brand-dark">Jadikan Cabang Utama</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-brand-primary rounded-md focus:ring-brand-primary cursor-pointer accent-brand-primary"
                    />
                    <span className="text-xs font-bold text-brand-dark">Status Aktif</span>
                  </label>
                </div>

              </div>

              {/* RIGHT COLUMN: Interactive Leaflet Map (7 cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-brand-dark">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-brand-primary" />
                    <span>Peta Interaktif (Geser Pin untuk Menentukan Titik)</span>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    Live Geofencing Radius: <strong>{radiusMeters}m</strong>
                  </span>
                </div>

                {/* Leaflet Map Component */}
                <LeafletMapPicker
                  latitude={latitude}
                  longitude={longitude}
                  radiusMeters={radiusMeters}
                  branchName={name || 'Titik Cabang Bimbel'}
                  onLocationChange={handleMapLocationChange}
                  onGeocodingStateChange={setIsSyncingAddress}
                  height="360px"
                />
              </div>

            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EDE6DD]">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{editingId ? 'Simpan Perubahan Lokasi' : 'Simpan Lokasi Cabang'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Locations List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className={`bg-white rounded-2xl p-5 border transition-all relative flex flex-col justify-between shadow-xs hover:shadow-md ${
              loc.isDefault
                ? 'border-brand-primary ring-2 ring-brand-primary/15'
                : 'border-[#EDE6DD]'
            }`}
          >
            {/* Top Card Badges */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    loc.isDefault ? 'bg-brand-primary text-white' : 'bg-brand-light text-brand-primary'
                  }`}>
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-brand-dark leading-tight line-clamp-1">
                      {loc.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {loc.isDefault && (
                        <span className="px-2 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary font-bold text-[10px]">
                          ⭐ Utama (Default)
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        loc.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {loc.isActive ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed">
                {loc.address}
              </p>

              {/* Map Coordinates & Radius Specs */}
              <div className="p-3 bg-brand-light rounded-xl border border-[#E8E1D7] space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Batas Radius:</span>
                  <span className="font-extrabold text-brand-dark bg-white px-2 py-0.5 rounded-md border border-[#E0D8CC]">
                    {loc.radiusMeters || 10} Meter
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-gray-500">Koordinat GPS:</span>
                  <span className="text-brand-dark font-semibold">
                    {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                  </span>
                </div>
                {loc.notes && (
                  <p className="text-[11px] text-gray-500 italic pt-1 border-t border-[#E8E1D7]">
                    "{loc.notes}"
                  </p>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 mt-4 border-t border-[#F0EBE3] flex items-center justify-between gap-2">
              <div>
                {!loc.isDefault && (
                  <button
                    onClick={() => onSetDefaultLocation(loc.id)}
                    className="text-[11px] font-bold text-brand-primary hover:text-brand-primary-hover hover:underline cursor-pointer"
                  >
                    Jadikan Default
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => startEdit(loc)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-brand-primary hover:bg-brand-light transition-all cursor-pointer"
                  title="Edit Cabang"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {locations.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(`Hapus lokasi cabang "${loc.name}"?`)) {
                        onDeleteLocation(loc.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                    title="Hapus Cabang"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Geofence Distance Simulator Card for Testing */}
      <div className="bg-gradient-to-br from-brand-light to-white p-5 rounded-3xl border border-[#E0D8CC] shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-brand-dark">
              Uji Coba Validasi Geofencing Presensi Guru
            </h4>
            <p className="text-xs text-brand-muted">
              Masukkan koordinat guru untuk menguji apakah status presensi berstatus "VALID (Dalam Radius Bimbel)".
            </p>
          </div>
        </div>

        <form onSubmit={handleRunSimulator} className="flex flex-wrap items-center gap-3">
          <input
            type="number"
            step="any"
            required
            value={testLat}
            onChange={(e) => setTestLat(e.target.value)}
            placeholder="Latitude Guru (cth: -6.34582)"
            className="px-3.5 py-2 bg-white border border-[#E0D8CC] rounded-xl text-xs font-mono text-brand-dark focus:outline-hidden focus:border-brand-primary flex-1 min-w-[160px]"
          />
          <input
            type="number"
            step="any"
            required
            value={testLng}
            onChange={(e) => setTestLng(e.target.value)}
            placeholder="Longitude Guru (cth: 106.82853)"
            className="px-3.5 py-2 bg-white border border-[#E0D8CC] rounded-xl text-xs font-mono text-brand-dark focus:outline-hidden focus:border-brand-primary flex-1 min-w-[160px]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-brand-dark hover:bg-brand-dark/90 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <span>Hitung Jarak & Validasi</span>
          </button>
        </form>

        {testResult && (
          <div className={`mt-3 p-3 rounded-xl border flex items-center justify-between text-xs font-bold animate-in fade-in duration-150 ${
            testResult.isValid
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-red-50 text-red-900 border-red-300'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.isValid ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>
                Jarak terdeteksi: <strong>{testResult.distance} meter</strong> dari {testResult.branchName}.
              </span>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase ${
              testResult.isValid ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {testResult.isValid ? '✓ VALID DALAM RADIUS' : '✗ DILUAR RADIUS'}
            </span>
          </div>
        )}
      </div>

      {/* SQL Schema Modal */}
      <DatabaseSchemaModal
        isOpen={showSqlModal}
        onClose={() => setShowSqlModal(false)}
      />
    </div>
  );
}
