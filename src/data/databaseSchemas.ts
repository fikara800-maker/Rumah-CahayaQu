export const MYSQL_SCHEMA_SQL = `-- ==============================================================================
-- DATABASE SCHEMA: BIMBEL RUMAH CAHAYAQU (MYSQL 8.0+)
-- Master Data Lokasi Cabang, Geofencing, & Presensi Guru Real-time
-- ==============================================================================

-- 1. Tabel Master Lokasi Cabang Bimbel (Geofencing & Pusat Belajar)
CREATE TABLE IF NOT EXISTS \`bimbel_locations\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(150) NOT NULL COMMENT 'Nama Cabang Bimbel (cth: Pusat Jagakarsa)',
  \`address\` TEXT NOT NULL COMMENT 'Alamat Lengkap Cabang',
  \`latitude\` DECIMAL(10, 8) NOT NULL COMMENT 'Garis Lintang (-90 s/d +90)',
  \`longitude\` DECIMAL(11, 8) NOT NULL COMMENT 'Garis Bujur (-180 s/d +180)',
  \`radius_meters\` INT UNSIGNED NOT NULL DEFAULT 10 COMMENT 'Radius Toleransi Geofence dalam meter',
  \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Status operasional cabang',
  \`is_default\` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Penanda cabang pusat / default',
  \`notes\` TEXT NULL COMMENT 'Catatan operasional / fasilitas',
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_location_active\` (\`is_active\`),
  INDEX \`idx_location_coords\` (\`latitude\`, \`longitude\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Pengguna (Admin, Guru, Wali Murid)
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(120) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`role\` ENUM('admin', 'teacher', 'parent') NOT NULL,
  \`phone\` VARCHAR(30) NULL,
  \`subject\` VARCHAR(50) NULL,
  \`created_at\` DATE NOT NULL,
  INDEX \`idx_user_role\` (\`role\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Presensi & Absensi Guru (Tersinkronisasi dengan Master Lokasi)
CREATE TABLE IF NOT EXISTS \`teacher_attendances\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`teacher_id\` VARCHAR(50) NOT NULL,
  \`teacher_name\` VARCHAR(100) NOT NULL,
  \`subject\` VARCHAR(50) NULL,
  \`date\` DATE NOT NULL,
  \`status\` ENUM('Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat') NOT NULL DEFAULT 'Hadir',
  \`time_in\` TIME NULL,
  \`time_out\` TIME NULL,
  \`notes\` TEXT NULL,
  
  -- Sinkronisasi Master Lokasi Cabang
  \`location_id\` VARCHAR(50) NULL,
  \`location_name\` VARCHAR(150) NULL,
  
  -- Bukti Check-In (Live Selfie & GPS)
  \`photo_base64\` MEDIUMTEXT NULL COMMENT 'Foto selfie live saat check-in',
  \`latitude\` DECIMAL(10, 8) NULL COMMENT 'Koordinat GPS Check-In',
  \`longitude\` DECIMAL(11, 8) NULL COMMENT 'Koordinat GPS Check-In',
  \`distance_meters\` INT NULL COMMENT 'Jarak aktual dalam meter dari titik bimbel',
  \`location_address\` TEXT NULL COMMENT 'Alamat hasil reverse geocode saat check-in',
  \`is_within_radius\` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'True jika distance <= radius_meters',
  \`check_in_timestamp\` DATETIME NULL,
  
  -- Bukti Check-Out (Live Selfie & GPS)
  \`check_out_photo_base64\` MEDIUMTEXT NULL,
  \`check_out_latitude\` DECIMAL(10, 8) NULL,
  \`check_out_longitude\` DECIMAL(11, 8) NULL,
  \`check_out_address\` TEXT NULL,
  \`check_out_timestamp\` DATETIME NULL,
  
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT \`fk_teacher_att_user\` FOREIGN KEY (\`teacher_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_teacher_att_location\` FOREIGN KEY (\`location_id\`) REFERENCES \`bimbel_locations\` (\`id\`) ON DELETE SET NULL,
  INDEX \`idx_teacher_date\` (\`teacher_id\`, \`date\`),
  INDEX \`idx_teacher_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- QUERY CONTOH: VALIDASI JARAK GPS MENGGUNAKAN ST_Distance_Sphere (MYSQL 8)
-- ==============================================================================
-- Menghitung jarak guru terhadap cabang default (dalam satuan meter)
SELECT 
  loc.id AS location_id,
  loc.name AS branch_name,
  loc.radius_meters,
  ROUND(
    ST_Distance_Sphere(
      POINT(106.828500, -6.345800),             -- Longitude, Latitude Guru
      POINT(loc.longitude, loc.latitude)        -- Longitude, Latitude Cabang
    )
  ) AS distance_in_meters,
  (
    ST_Distance_Sphere(
      POINT(106.828500, -6.345800),
      POINT(loc.longitude, loc.latitude)
    ) <= loc.radius_meters
  ) AS is_valid_geofence
FROM bimbel_locations loc
WHERE loc.is_active = TRUE;
`;

export const POSTGRESQL_SCHEMA_SQL = `-- ==============================================================================
-- DATABASE SCHEMA: BIMBEL RUMAH CAHAYAQU (POSTGRESQL 14+ / POSTGIS)
-- Master Data Lokasi Cabang, Geofencing, & Presensi Guru Real-time
-- ==============================================================================

-- 1. Enable PostGIS Extension (Opsional untuk query spasial presisi tinggi)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tipe Data Enum Status Kehadiran
DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Tabel Master Lokasi Cabang Bimbel
CREATE TABLE IF NOT EXISTS bimbel_locations (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'loc-' || uuid_generate_v4()::text,
  name VARCHAR(150) NOT NULL,
  address TEXT NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude NUMERIC(11, 8) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  radius_meters INT NOT NULL DEFAULT 10 CHECK (radius_meters > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bimbel_loc_active ON bimbel_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_bimbel_loc_coords ON bimbel_locations(latitude, longitude);

-- 4. Tabel Pengguna (Admin, Guru, Wali Murid)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  phone VARCHAR(30),
  subject VARCHAR(50),
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 5. Tabel Presensi & Absensi Guru
CREATE TABLE IF NOT EXISTS teacher_attendances (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'tatt-' || uuid_generate_v4()::text,
  teacher_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_name VARCHAR(100) NOT NULL,
  subject VARCHAR(50),
  date DATE NOT NULL,
  status attendance_status NOT NULL DEFAULT 'Hadir',
  time_in TIME,
  time_out TIME,
  notes TEXT,
  
  -- Foreign Key Master Lokasi
  location_id VARCHAR(50) REFERENCES bimbel_locations(id) ON DELETE SET NULL,
  location_name VARCHAR(150),
  
  -- Check-In Telemetri (Selfie + GPS)
  photo_base64 TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  distance_meters INT,
  location_address TEXT,
  is_within_radius BOOLEAN NOT NULL DEFAULT FALSE,
  check_in_timestamp TIMESTAMPTZ,
  
  -- Check-Out Telemetri
  check_out_photo_base64 TEXT,
  check_out_latitude NUMERIC(10, 8),
  check_out_longitude NUMERIC(11, 8),
  check_out_address TEXT,
  check_out_timestamp TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tatt_teacher_date ON teacher_attendances(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_tatt_status ON teacher_attendances(status);

-- ==============================================================================
-- FUNGSI HAVERSINE DISTANCE DI POSTGRESQL (MENGHITUNG JARAK DALAM METER)
-- ==============================================================================
CREATE OR REPLACE FUNCTION calculate_distance_meters(
  lat1 NUMERIC, lon1 NUMERIC,
  lat2 NUMERIC, lon2 NUMERIC
) RETURNS INT AS $$
DECLARE
  r CONSTANT NUMERIC := 6371000; -- Radius bumi dalam meter
  d_lat NUMERIC := radians(lat2 - lat1);
  d_lon NUMERIC := radians(lon2 - lon1);
  a NUMERIC;
  c NUMERIC;
BEGIN
  a := sin(d_lat / 2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2)^2;
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  RETURN ROUND(r * c);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
`;
