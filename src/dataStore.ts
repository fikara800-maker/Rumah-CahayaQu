import { BimbelState, UserAccount, BankAccountInfo, BimbelLocation, Student, BimbelBrandingSettings } from './types';
import { deduplicateChats } from './utils/chatUtils';

export const SUPER_ADMIN_ACCOUNT: UserAccount = {
  id: 'usr-super-admin',
  email: 'depi@gmail.com',
  password: 'defika800',
  name: 'Pemilik (Admin)',
  role: 'admin',
  createdAt: '2026-07-01',
};

export const DEFAULT_BRANDING_SETTINGS: BimbelBrandingSettings = {
  customLogoUrl: null,
  institutionName: 'Bimbel Rumah CahayaQu',
  institutionAddress: 'Jangga, Kec. Losarang, Kabupaten Indramayu, Jawa Barat 45253',
  institutionPhone: '0812-3456-7890',
  institutionEmail: 'cahayaqu.bimbel@gmail.com',
  institutionTagline: 'Membimbing dengan Hati, Menuntun Menuju Prestasi Qurani & Akademik',
  headmasterName: 'Defika, S.Pd.',
  headmasterSignatureUrl: null,
  teacherSignatureUrl: null,
  updatedAt: '2026-08-27',
};

export const DEFAULT_BANK_ACCOUNT: BankAccountInfo = {
  bankName: 'Bank Syariah Indonesia (BSI)',
  accountNumber: '7182938491',
  accountHolder: 'Rumah CahayaQu (Defika)',
  instructions: 'Mohon cantumkan No. Invoice atau Nama Ananda pada berita transfer. Setelah transfer, kirimkan bukti transfer melalui tombol Konfirmasi Pembayaran (WA).',
};

export const DEFAULT_BIMBEL_LOCATIONS: BimbelLocation[] = [
  {
    id: 'loc-pusat-jangga',
    name: 'Bimbel Rumah CahayaQu (Pusat)',
    address: 'Titik Lokasi Utama Bimbel (6°24\'22.7"S 108°10\'04.7"E)',
    latitude: -6.4063056,
    longitude: 108.1679722,
    radiusMeters: 5,
    isActive: true,
    isDefault: true,
    notes: 'Titik pusat absensi guru & kelas belajar.',
    updatedAt: '2026-08-27',
  },
];

export const INITIAL_EMPTY_STATE: BimbelState = {
  users: [SUPER_ADMIN_ACCOUNT],
  students: [],
  attendance: [],
  teacherAttendance: [],
  assessments: [],
  activities: [],
  chats: [],
  invoices: [],
  schedules: [],
  broadcasts: [],
  bankAccount: DEFAULT_BANK_ACCOUNT,
  locations: DEFAULT_BIMBEL_LOCATIONS,
  activeLocationId: 'loc-pusat',
  branding: DEFAULT_BRANDING_SETTINGS,
};

export const DEMO_TEACHERS: UserAccount[] = [
  {
    id: 'usr-guru-siti',
    email: 'siti@bimbel.id',
    password: 'guru123',
    name: 'Guru Siti, S.Pd.',
    role: 'teacher',
    subject: 'Membaca',
    phone: '081234567811',
    createdAt: '2026-07-01',
  },
  {
    id: 'usr-guru-budi',
    email: 'budi@bimbel.id',
    password: 'guru123',
    name: 'Pak Budi, S.Pd.',
    role: 'teacher',
    subject: 'Berhitung',
    phone: '081234567812',
    createdAt: '2026-07-01',
  },
  {
    id: 'usr-guru-fatimah',
    email: 'fatimah@bimbel.id',
    password: 'guru123',
    name: 'Ustadzah Fatimah, S.Pd.I.',
    role: 'teacher',
    subject: 'Mengaji',
    phone: '081234567813',
    createdAt: '2026-07-01',
  },
];

export const DEMO_PARENTS: UserAccount[] = [
  {
    id: 'usr-parent-rina',
    email: 'rina@gmail.com',
    password: 'ortu123',
    name: 'Bunda Rina',
    role: 'parent',
    childName: 'Aisyah Azzahra',
    subject: 'Membaca',
    phone: '081234567801',
    createdAt: '2026-07-01',
  },
  {
    id: 'usr-parent-hendra',
    email: 'hendra@gmail.com',
    password: 'ortu123',
    name: 'Ayah Hendra',
    role: 'parent',
    childName: 'Kenzo Al-Ghifari',
    subject: 'Berhitung',
    phone: '081234567802',
    createdAt: '2026-07-01',
  },
  {
    id: 'usr-parent-nisa',
    email: 'nisa@gmail.com',
    password: 'ortu123',
    name: 'Bunda Nisa',
    role: 'parent',
    childName: 'Bilal Ramadhan',
    subject: 'Mengaji',
    phone: '081234567803',
    createdAt: '2026-07-01',
  },
];

export const DEMO_STUDENTS: Student[] = [
  {
    id: 'stud-aisyah',
    name: 'Aisyah Azzahra',
    className: 'Membaca',
    subject: 'Membaca',
    age: 6,
    parentName: 'Bunda Rina',
    parentPhone: '081234567801',
    teacherId: 'usr-guru-siti',
    teacherName: 'Guru Siti, S.Pd.',
    status: 'active',
  },
  {
    id: 'stud-kenzo',
    name: 'Kenzo Al-Ghifari',
    className: 'Berhitung',
    subject: 'Berhitung',
    age: 7,
    parentName: 'Ayah Hendra',
    parentPhone: '081234567802',
    teacherId: 'usr-guru-budi',
    teacherName: 'Pak Budi, S.Pd.',
    status: 'active',
  },
  {
    id: 'stud-bilal',
    name: 'Bilal Ramadhan',
    className: 'Mengaji',
    subject: 'Mengaji',
    age: 6,
    parentName: 'Bunda Nisa',
    parentPhone: '081234567803',
    teacherId: 'usr-guru-fatimah',
    teacherName: 'Ustadzah Fatimah, S.Pd.I.',
    status: 'active',
  },
  {
    id: 'stud-naura',
    name: 'Naura Salsabila',
    className: 'Membaca',
    subject: 'Membaca',
    age: 5,
    parentName: 'Bunda Dewi',
    parentPhone: '081234567804',
    teacherId: 'usr-guru-siti',
    teacherName: 'Guru Siti, S.Pd.',
    status: 'active',
  },
];

export const DEMO_STATE: BimbelState = {
  users: [SUPER_ADMIN_ACCOUNT, ...DEMO_TEACHERS, ...DEMO_PARENTS],
  students: DEMO_STUDENTS,
  attendance: [
    {
      id: 'att-1',
      studentId: 'stud-aisyah',
      studentName: 'Aisyah Azzahra',
      date: '2026-08-26',
      timeIn: '14:00',
      timeOut: '15:30',
      status: 'Hadir',
    },
    {
      id: 'att-2',
      studentId: 'stud-kenzo',
      studentName: 'Kenzo Al-Ghifari',
      date: '2026-08-26',
      timeIn: '14:00',
      timeOut: '15:30',
      status: 'Hadir',
    },
    {
      id: 'att-3',
      studentId: 'stud-bilal',
      studentName: 'Bilal Ramadhan',
      date: '2026-08-26',
      timeIn: '16:00',
      timeOut: '17:30',
      status: 'Hadir',
    },
    {
      id: 'att-4',
      studentId: 'stud-naura',
      studentName: 'Naura Salsabila',
      date: '2026-08-26',
      timeIn: '14:00',
      timeOut: '15:30',
      status: 'Hadir',
    },
  ],
  teacherAttendance: [
    {
      id: 'tatt-1',
      teacherId: 'usr-guru-siti',
      teacherName: 'Guru Siti, S.Pd.',
      subject: 'Membaca',
      date: '2026-08-26',
      status: 'Hadir',
      timeIn: '08:00',
      timeOut: '16:00',
      notes: 'Mendampingi kelas membaca dasar dan fonik Aisyah & Naura.',
      isWithinRadius: true,
      distanceMeters: 5,
    },
    {
      id: 'tatt-2',
      teacherId: 'usr-guru-budi',
      teacherName: 'Pak Budi, S.Pd.',
      subject: 'Berhitung',
      date: '2026-08-26',
      status: 'Hadir',
      timeIn: '08:15',
      timeOut: '16:00',
      notes: 'Sesi berhitung logika penjumlahan & perkalian dasar Kenzo.',
      isWithinRadius: true,
      distanceMeters: 7,
    },
    {
      id: 'tatt-3',
      teacherId: 'usr-guru-fatimah',
      teacherName: 'Ustadzah Fatimah, S.Pd.I.',
      subject: 'Mengaji',
      date: '2026-08-26',
      status: 'Hadir',
      timeIn: '08:00',
      timeOut: '16:30',
      notes: 'Bimbingan tajwid Iqro 4 dan hafalan surat pendek Bilal.',
      isWithinRadius: true,
      distanceMeters: 4,
    },
  ],
  assessments: [
    {
      id: 'as-1',
      studentId: 'stud-aisyah',
      studentName: 'Aisyah Azzahra',
      subject: 'Membaca',
      date: '2026-08-25',
      aspects: [
        { name: 'Pengenalan Huruf & Vokal', score: 5 },
        { name: 'Kelancaran Merangkai Kata', score: 4 },
        { name: 'Fokus & Ketertiban', score: 5 },
        { name: 'Keberanian Membaca Nyaring', score: 5 },
      ],
      notes: 'Aisyah menunjukkan peningkatan pesat dalam membedakan bunyi konsonan rangkap.',
      teacherName: 'Guru Siti, S.Pd.',
    },
    {
      id: 'as-2',
      studentId: 'stud-kenzo',
      studentName: 'Kenzo Al-Ghifari',
      subject: 'Berhitung',
      date: '2026-08-25',
      aspects: [
        { name: 'Pemahaman Konsep Angka', score: 5 },
        { name: 'Penjumlahan Cepat', score: 5 },
        { name: 'Pengurangan Logis', score: 4 },
        { name: 'Ketelitian & Kecepatan', score: 4 },
      ],
      notes: 'Kenzo sangat antusias dalam games tebak angka dan penjumlahan cepat!',
      teacherName: 'Pak Budi, S.Pd.',
    },
    {
      id: 'as-3',
      studentId: 'stud-bilal',
      studentName: 'Bilal Ramadhan',
      subject: 'Mengaji',
      date: '2026-08-25',
      aspects: [
        { name: 'Makharijul Huruf', score: 5 },
        { name: 'Panjang Pendek (Mad)', score: 4 },
        { name: 'Adab Membaca Al-Quran', score: 5 },
        { name: 'Hafalan Doa Harian', score: 5 },
      ],
      notes: 'Pelafalan huruf hijaiyah Bilal semakin bersih dan tartil.',
      teacherName: 'Ustadzah Fatimah, S.Pd.I.',
    },
  ],
  activities: [
    {
      id: 'act-1',
      title: 'Aktivitas Membaca Fonik Ceria',
      description: 'Anak-anak kelas membaca antusias menyusun kartu kata bergambar dengan ceria.',
      mediaUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image',
      date: '2026-08-26',
      targetClass: 'Membaca',
    },
    {
      id: 'act-2',
      title: 'Eksplorasi Berhitung dengan Sempoa & Balok',
      description: 'Latihan motorik dan logika matematika bersama Pak Budi.',
      mediaUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image',
      date: '2026-08-26',
      targetClass: 'Berhitung',
    },
    {
      id: 'act-3',
      title: 'Kajian Tajwid Cilik & Doa Bersama',
      description: 'Hafalan doa kedua orang tua dan surat-surat pendek Juz 30.',
      mediaUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image',
      date: '2026-08-26',
      targetClass: 'Mengaji',
    },
  ],
  chats: [
    {
      id: 'chat-1',
      sender: 'guru',
      senderName: 'Guru Siti, S.Pd.',
      message: 'Assalamu’alaikum Bunda Rina, hari ini Aisyah menyelesaikan modul membaca halaman 12 dengan sangat lancar ya Bunda! 🌟',
      timestamp: '2026-08-26T15:35:00.000Z',
      studentId: 'stud-aisyah',
      studentName: 'Aisyah Azzahra',
      teacherName: 'Guru Siti, S.Pd.',
      parentName: 'Bunda Rina',
      status: 'read',
      isRead: true,
    },
    {
      id: 'chat-2',
      sender: 'orangtua',
      senderName: 'Bunda Rina',
      message: 'Wa’alaikumsalam Bu Siti, alhamdulillah terima kasih banyak atas bimbingannya bu! Di rumah Aisyah juga rajin membaca buku cerita.',
      timestamp: '2026-08-26T15:40:00.000Z',
      studentId: 'stud-aisyah',
      studentName: 'Aisyah Azzahra',
      teacherName: 'Guru Siti, S.Pd.',
      parentName: 'Bunda Rina',
      status: 'read',
      isRead: true,
    },
    {
      id: 'chat-3',
      sender: 'guru',
      senderName: 'Pak Budi, S.Pd.',
      message: 'Halo Ayah Hendra, ananda Kenzo hari ini meraih nilai sempurna pada kuis hitung cepat penjumlahan 1-50! Hebat sekali. 🏆',
      timestamp: '2026-08-26T15:36:00.000Z',
      studentId: 'stud-kenzo',
      studentName: 'Kenzo Al-Ghifari',
      teacherName: 'Pak Budi, S.Pd.',
      parentName: 'Ayah Hendra',
      status: 'read',
      isRead: true,
    },
    {
      id: 'chat-4',
      sender: 'guru',
      senderName: 'Ustadzah Fatimah, S.Pd.I.',
      message: 'Assalamu’alaikum Bunda Nisa, alhamdulillah Bilal hari ini sudah naik ke Iqro 4 halaman 3 ya Bunda. Hafalan An-Naas nya juga sudah lancar. 📖',
      timestamp: '2026-08-26T17:35:00.000Z',
      studentId: 'stud-bilal',
      studentName: 'Bilal Ramadhan',
      teacherName: 'Ustadzah Fatimah, S.Pd.I.',
      parentName: 'Bunda Nisa',
      status: 'read',
      isRead: true,
    },
  ],
  invoices: [
    {
      id: 'inv-1',
      invoiceNo: 'INV/2026/08/001',
      studentId: 'stud-aisyah',
      studentName: 'Aisyah Azzahra',
      parentName: 'Bunda Rina',
      amount: 250000,
      dueDate: '2026-08-10',
      status: 'Lunas',
      billingMonth: 'Agustus 2026',
    },
    {
      id: 'inv-2',
      invoiceNo: 'INV/2026/08/002',
      studentId: 'stud-kenzo',
      studentName: 'Kenzo Al-Ghifari',
      parentName: 'Ayah Hendra',
      amount: 275000,
      dueDate: '2026-08-10',
      status: 'Lunas',
      billingMonth: 'Agustus 2026',
    },
    {
      id: 'inv-3',
      invoiceNo: 'INV/2026/08/003',
      studentId: 'stud-bilal',
      studentName: 'Bilal Ramadhan',
      parentName: 'Bunda Nisa',
      amount: 250000,
      dueDate: '2026-08-10',
      status: 'Lunas',
      billingMonth: 'Agustus 2026',
    },
    {
      id: 'inv-4',
      invoiceNo: 'INV/2026/08/004',
      studentId: 'stud-naura',
      studentName: 'Naura Salsabila',
      parentName: 'Bunda Dewi',
      amount: 250000,
      dueDate: '2026-08-10',
      status: 'Belum Bayar',
      billingMonth: 'Agustus 2026',
    },
  ],
  schedules: [
    {
      id: 'sch-1',
      day: 'Senin',
      timeSlot: '14:00 - 15:30',
      className: 'Membaca',
      subject: 'Membaca Dasar & Fonik',
      teacherName: 'Guru Siti, S.Pd.',
      studentId: 'stud-aisyah',
      studentName: 'Aisyah Azzahra',
    },
    {
      id: 'sch-2',
      day: 'Selasa',
      timeSlot: '14:00 - 15:30',
      className: 'Berhitung',
      subject: 'Berhitung Cepat & Logika',
      teacherName: 'Pak Budi, S.Pd.',
      studentId: 'stud-kenzo',
      studentName: 'Kenzo Al-Ghifari',
    },
    {
      id: 'sch-3',
      day: 'Rabu',
      timeSlot: '16:00 - 17:30',
      className: 'Mengaji',
      subject: 'Iqro & Tajwid Cilik',
      teacherName: 'Ustadzah Fatimah, S.Pd.I.',
      studentId: 'stud-bilal',
      studentName: 'Bilal Ramadhan',
    },
    {
      id: 'sch-4',
      day: 'Kamis',
      timeSlot: '14:00 - 15:30',
      className: 'Membaca',
      subject: 'Membaca Cerita & Menulis',
      teacherName: 'Guru Siti, S.Pd.',
      studentId: 'stud-naura',
      studentName: 'Naura Salsabila',
    },
  ],
  broadcasts: [
    {
      id: 'bc-1',
      title: 'Pelaksanaan Ujian Tumbuh Kembang & Bagi Rapor Tengah Semester',
      content: 'Diberitahukan kepada seluruh Ayah/Bunda wali murid, evaluasi rapor perkembangan ananda akan dilaksanakan pekan depan. Rapor resmi dapat diunduh dalam format PDF atau dicetak langsung.',
      date: '2026-08-25',
      senderName: 'Defika (Kepala Bimbel)',
      senderRole: 'admin',
    },
  ],
  bankAccount: DEFAULT_BANK_ACCOUNT,
  locations: DEFAULT_BIMBEL_LOCATIONS,
  activeLocationId: 'loc-pusat-jangga',
};

const LOCAL_STORAGE_KEY = 'bimbel_hub_state_clean_v8';

export function normalizeIndonesianPhone(phone?: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export function sanitizeBimbelState(rawState: BimbelState): { state: BimbelState; hasChanges: boolean } {
  let hasChanges = false;
  if (!rawState) return { state: { ...INITIAL_EMPTY_STATE }, hasChanges: false };

  // 1. Sanitize schedules: Fix student Alika with Teacher Tami or any mismatched subject
  const updatedSchedules = (rawState.schedules || []).map(sch => {
    const isAlika = sch.studentName?.toLowerCase().includes('alika') || sch.studentId?.toLowerCase().includes('alika');
    const isTeacherTami = sch.teacherName?.toLowerCase().includes('tami');

    // Find if the teacher has a registered subject
    const matchedTeacher = (rawState.users || []).find(
      u => u.role === 'teacher' && (u.name.toLowerCase() === sch.teacherName?.toLowerCase() || sch.teacherName?.toLowerCase().includes(u.name.toLowerCase()))
    );

    // If teacher Tami (Mengaji) or Alika with Tami
    if (isTeacherTami || (isAlika && isTeacherTami)) {
      if (sch.className !== 'Mengaji' || sch.subject?.toLowerCase().includes('membaca')) {
        hasChanges = true;
        return {
          ...sch,
          className: 'Mengaji',
          subject: sch.subject?.toLowerCase().includes('membaca') ? 'Mengaji & Iqro' : (sch.subject || 'Mengaji & Iqro'),
        };
      }
    }

    // Replace any legacy Sarah with real teacher for subject
    if (sch.teacherName?.toLowerCase().includes('sarah')) {
      hasChanges = true;
      const t = (rawState.users || []).find(u => u.role === 'teacher' && u.subject?.toLowerCase() === sch.className?.toLowerCase()) ||
                (rawState.users || []).find(u => u.role === 'teacher');
      return {
        ...sch,
        teacherName: t?.name || 'Guru Pembimbing',
      };
    }

    // If teacher has a dedicated subject other than "Semua Mata Pelajaran"
    if (matchedTeacher && matchedTeacher.subject && matchedTeacher.subject !== 'Semua Mata Pelajaran' && sch.className !== matchedTeacher.subject) {
      if (isAlika || isTeacherTami) {
        hasChanges = true;
        return {
          ...sch,
          className: matchedTeacher.subject,
          subject: sch.subject?.toLowerCase().includes('membaca') && matchedTeacher.subject === 'Mengaji' ? 'Mengaji & Iqro' : sch.subject,
        };
      }
    }

    return sch;
  });

  // 2. Sanitize students: If student Alika is mentored by Teacher Tami, ensure her className is Mengaji
  const updatedStudents = (rawState.students || []).map(stud => {
    const isAlika = stud.name.toLowerCase().includes('alika');
    const isTeacherTami = stud.teacherName?.toLowerCase().includes('tami');
    if (isAlika && isTeacherTami && stud.className !== 'Mengaji') {
      hasChanges = true;
      return {
        ...stud,
        className: 'Mengaji',
        subject: 'Mengaji',
      };
    }
    if (stud.teacherName?.toLowerCase().includes('sarah')) {
      hasChanges = true;
      const matchedT = (rawState.users || []).find(u => u.role === 'teacher' && (u.subject?.toLowerCase() === stud.className?.toLowerCase() || u.subject?.toLowerCase() === stud.subject?.toLowerCase())) ||
                       (rawState.users || []).find(u => u.role === 'teacher');
      return {
        ...stud,
        teacherName: matchedT?.name || 'Guru Pembimbing',
        teacherId: matchedT?.id,
      };
    }
    return stud;
  });

  // 3. Sanitize chats: Ensure status and isRead exist, deduplicate by message id, and clean any legacy Sarah
  const deduplicated = deduplicateChats(rawState.chats || []);
  if (deduplicated.length !== (rawState.chats || []).length) {
    hasChanges = true;
  }
  const updatedChats = deduplicated.map(chat => {
    let modified = false;
    let senderName = chat.senderName;
    let teacherName = chat.teacherName;

    if (senderName?.toLowerCase().includes('sarah') && chat.sender === 'guru') {
      const t = (rawState.users || []).find(u => u.role === 'teacher');
      senderName = t?.name || 'Guru Pembimbing';
      modified = true;
    }
    if (teacherName?.toLowerCase().includes('sarah')) {
      const t = (rawState.users || []).find(u => u.role === 'teacher');
      teacherName = t?.name || 'Guru Pembimbing';
      modified = true;
    }

    if (!chat.status || chat.isRead === undefined || modified) {
      hasChanges = true;
      return {
        ...chat,
        senderName,
        teacherName,
        status: chat.status || 'read',
        isRead: chat.isRead !== undefined ? chat.isRead : true,
      };
    }
    return chat;
  });

  // 4. Ensure all students have a corresponding Parent UserAccount in users
  const currentUsers = rawState.users || [];
  const nextUsers = [...currentUsers];

  (updatedStudents || []).forEach(stud => {
    const parentNorm = normalizeIndonesianPhone(stud.parentPhone);
    const parentNameLower = (stud.parentName || '').trim().toLowerCase();

    const existing = nextUsers.find(u => {
      const uNorm = normalizeIndonesianPhone(u.phone);
      const uNameLower = (u.name || '').trim().toLowerCase();
      const uChildLower = (u.childName || '').trim().toLowerCase();

      const phoneMatch = Boolean(parentNorm.length >= 6 && uNorm.length >= 6 && (parentNorm === uNorm || uNorm.includes(parentNorm) || parentNorm.includes(uNorm)));
      const nameMatch = parentNameLower.length >= 3 && uNameLower.length >= 3 && (parentNameLower === uNameLower || uNameLower.includes(parentNameLower) || parentNameLower.includes(uNameLower));
      const childMatch = Boolean(stud.name && uChildLower && stud.name.trim().toLowerCase() === uChildLower);

      return phoneMatch || nameMatch || childMatch;
    });

    if (!existing && stud.parentName && stud.parentName.trim() !== '') {
      hasChanges = true;
      const digits = (stud.parentPhone || '').replace(/\D/g, '');
      const cleanEmail = digits.length >= 6
        ? `wali_${digits}@cahayaqu.id`
        : `${stud.parentName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'wali'}@gmail.com`;

      const newParentUser: UserAccount = {
        id: `usr-parent-${stud.id || Date.now()}`,
        name: stud.parentName,
        email: cleanEmail,
        phone: stud.parentPhone || '081234567890',
        childName: stud.name,
        subject: typeof stud.className === 'string' ? stud.className : 'Membaca',
        role: 'parent',
        password: 'ortu123',
        createdAt: new Date().toISOString().split('T')[0],
      };
      nextUsers.push(newParentUser);
    }
  });

  const nextState: BimbelState = {
    ...rawState,
    users: nextUsers,
    schedules: updatedSchedules,
    students: updatedStudents,
    chats: updatedChats,
  };

  return { state: nextState, hasChanges };
}

export function loadBimbelState(): BimbelState {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem('bimbel_hub_state_clean_v7');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.bankAccount) {
          parsed.bankAccount = DEFAULT_BANK_ACCOUNT;
        }
        if (!parsed.locations || parsed.locations.length === 0 || parsed.locations[0]?.address?.includes('Jagakarsa')) {
          parsed.locations = DEFAULT_BIMBEL_LOCATIONS;
        }
        if (!parsed.activeLocationId || parsed.activeLocationId === 'loc-pusat') {
          parsed.activeLocationId = 'loc-pusat-jangga';
        }
        if (!parsed.branding) {
          parsed.branding = DEFAULT_BRANDING_SETTINGS;
        }
        const { state: sanitized } = sanitizeBimbelState(parsed);
        return sanitized || { ...INITIAL_EMPTY_STATE };
      }
    }
  } catch (e) {
    console.error('Failed to parse local storage state', e);
  }
  return { ...INITIAL_EMPTY_STATE };
}

export function saveBimbelState(state: BimbelState): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    console.error('Failed to save state to local storage', e);
  }
}


