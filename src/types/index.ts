export type SubjectCategory = 'Membaca' | 'Berhitung' | 'Mengaji';

export interface Student {
  id: string;
  name: string;
  className: string; // Mata Pelajaran (e.g. 'Membaca' | 'Berhitung' | 'Mengaji')
  subject?: SubjectCategory | string;
  age?: number;
  parentName: string;
  parentPhone: string;
  teacherId?: string;
  teacherName?: string; // Guru Pembimbing yang ditugaskan khusus
  status?: 'active' | 'graduated' | 'inactive';
}

export interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  timeIn: string; // HH:MM
  timeOut: string | null; // HH:MM or null
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat';
  notes?: string;
}

export interface AspectScore {
  name: string;
  score: number; // 1-5
}

export interface Assessment {
  id: string;
  studentId: string;
  studentName: string;
  subject: SubjectCategory | string;
  date: string; // YYYY-MM-DD
  aspects: AspectScore[];
  notes: string;
  teacherName: string;
}

export interface DailyActivity {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  date: string; // YYYY-MM-DD
  targetClass: string; // "Semua Mata Pelajaran" or "Membaca" | "Berhitung" | "Mengaji"
}

export interface ChatMessage {
  id: string;
  sender: 'guru' | 'orangtua';
  senderName: string;
  senderId?: string;
  receiverId?: string;
  receiverName?: string;
  message: string;
  timestamp: string; // ISO string
  studentId?: string;
  studentName?: string;
  teacherName?: string;
  teacherId?: string;
  parentName?: string;
  parentId?: string;
  status?: 'sent' | 'delivered' | 'read';
  isRead?: boolean;
  readAt?: string;
  deliveredAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  studentId: string;
  studentName: string;
  parentName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  status: 'Lunas' | 'Belum Bayar' | 'Terlambat';
  billingMonth: string; // e.g. "Juli 2026"
}

export interface ScheduleItem {
  id: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  timeSlot: string; // e.g. "14:00 - 15:30"
  className: string; // "Membaca" | "Berhitung" | "Mengaji"
  subject: string; // e.g. "Membaca Dasar", "Iqro & Juz Amma", "Berhitung Cepat"
  teacherName: string;
  studentId?: string; // Optional: ID Siswa jika jadwal khusus per anak
  studentName?: string; // Optional: Nama Siswa jika jadwal khusus per anak
}

export interface BroadcastMessage {
  id: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  senderName: string;
  senderRole?: 'admin' | 'teacher';
  expiresAt?: string; // YYYY-MM-DD or empty string for no expiry
}

export interface UserAccount {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: 'admin' | 'teacher' | 'parent';
  createdAt: string;
  phone?: string;
  subject?: string;
  subjects?: string[];
  childName?: string;
}

export interface BankAccountInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  instructions?: string;
}

export interface TeacherAttendance {
  id: string;
  teacherId: string;
  teacherName: string;
  subject?: string;
  date: string; // YYYY-MM-DD
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat';
  timeIn?: string; // HH:MM
  timeOut?: string | null; // HH:MM or null
  notes?: string;
  photoBase64?: string;
  locationId?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  locationAddress?: string;
  isWithinRadius?: boolean;
  checkInTimestamp?: string;
  checkOutPhotoBase64?: string;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  checkOutAddress?: string;
  checkOutTimestamp?: string;
}

export interface BimbelLocation {
  id: string;
  name: string; // Nama Cabang / Lokasi (e.g. "Bimbel Rumah CahayaQu - Pusat Jagakarsa")
  address: string; // Alamat Lengkap
  latitude: number; // e.g. -6.3458
  longitude: number; // e.g. 106.8285
  radiusMeters: number; // Radius toleransi presensi dalam meter (default 10)
  isActive: boolean; // Status aktif operasional
  isDefault?: boolean; // Lokasi utama / default
  notes?: string; // Catatan operasional
  updatedAt?: string;
}

export interface BimbelState {
  users: UserAccount[];
  students: Student[];
  attendance: Attendance[];
  teacherAttendance?: TeacherAttendance[];
  assessments: Assessment[];
  activities: DailyActivity[];
  chats: ChatMessage[];
  invoices: Invoice[];
  schedules: ScheduleItem[];
  broadcasts: BroadcastMessage[];
  bankAccount?: BankAccountInfo;
  locations?: BimbelLocation[];
  activeLocationId?: string;
}
