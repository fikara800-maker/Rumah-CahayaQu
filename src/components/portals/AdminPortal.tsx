import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, 
  Users, 
  Calendar, 
  Plus, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Send, 
  UserPlus, 
  BookOpen, 
  TrendingUp, 
  MapPin, 
  Sparkles, 
  RefreshCw, 
  PhoneCall, 
  Trash2, 
  Megaphone, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  ChevronRight, 
  SlidersHorizontal, 
  X, 
  Edit3, 
  CreditCard, 
  Building2, 
  Copy, 
  Check, 
  Wallet, 
  Save, 
  Info, 
  UserCheck, 
  ClipboardCheck, 
  CheckSquare, 
  History, 
  Printer, 
  ChevronLeft,
  Camera,
  Eye,
  Navigation,
  Award,
  Download,
  Mail,
  Settings,
  Upload,
  RotateCcw,
  PenTool,
  FileSignature,
  Square,
  GraduationCap
} from 'lucide-react';
import { Student, Invoice, ScheduleItem, BimbelState, UserAccount, BroadcastMessage, BankAccountInfo, TeacherAttendance, BimbelLocation, Assessment, Attendance, BimbelBrandingSettings } from '../../types';
import { BimbelLocationManager } from '../admin/BimbelLocationManager';
import { ReportExportModal } from '../modals/ReportExportModal';
import Logo from '../common/Logo';
import LogoCustomizerModal from '../modals/LogoCustomizerModal';
import { DEFAULT_SCHOOL_INFO } from '../../lib/exportUtils';
import { ReceiptModal } from '../modals/ReceiptModal';

export const ALL_BIMBEL_SUBJECTS: readonly string[] = ['Membaca', 'Berhitung', 'Mengaji'] as const;

export function getTeacherSubjectsList(teacher?: UserAccount | null): string[] {
  if (!teacher) return [];
  if (Array.isArray(teacher.subjects) && teacher.subjects.length > 0) {
    return teacher.subjects;
  }
  if (teacher.subject) {
    if (teacher.subject === 'Semua Mata Pelajaran') {
      return ['Membaca', 'Berhitung', 'Mengaji'];
    }
    const split = teacher.subject
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    if (split.length > 0) return split;
  }
  return ['Membaca'];
}

export function teacherCanTeachSubject(teacher?: UserAccount | null, subject?: string): boolean {
  if (!teacher || !subject) return false;
  if (teacher.subject === 'Semua Mata Pelajaran') return true;
  const list = getTeacherSubjectsList(teacher);
  return list.includes(subject) || list.some(s => s.toLowerCase() === subject.toLowerCase());
}

interface AdminPortalProps {
  users?: UserAccount[];
  students: Student[];
  invoices: Invoice[];
  schedules: ScheduleItem[];
  broadcasts?: BroadcastMessage[];
  bankAccount?: BankAccountInfo;
  branding?: BimbelBrandingSettings;
  teacherAttendance?: TeacherAttendance[];
  locations?: BimbelLocation[];
  assessments?: Assessment[];
  attendance?: Attendance[];
  activeSubTab?: 'kesehatan' | 'tagihan' | 'jadwal' | 'siswa' | 'guru' | 'absensi-guru' | 'laporan' | 'lokasi' | 'pengaturan' | 'pengumuman';
  onSubTabChange?: (tab: 'kesehatan' | 'tagihan' | 'jadwal' | 'siswa' | 'guru' | 'absensi-guru' | 'laporan' | 'lokasi' | 'pengaturan' | 'pengumuman') => void;
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onUpdateStudent?: (student: Student, syncSchedules?: boolean) => void;
  onDeleteStudent?: (id: string) => void;
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNo'>) => void;
  onAddSchedule: (schedule: Omit<ScheduleItem, 'id'>) => void;
  onDeleteSchedule?: (id: string) => void;
  onMarkInvoicePaid: (id: string) => void;
  onDeleteInvoice?: (id: string) => void;
  onAddUser?: (user: Omit<UserAccount, 'id' | 'createdAt'>) => void;
  onUpdateUser?: (user: UserAccount) => void;
  onDeleteUser?: (id: string) => void;
  onAddBroadcast?: (broadcast: Omit<BroadcastMessage, 'id'>) => void;
  onUpdateBroadcast?: (broadcast: BroadcastMessage) => void;
  onDeleteBroadcast?: (id: string) => void;
  onUpdateBankAccount?: (bankAccount: BankAccountInfo) => void;
  onUpdateBranding?: (branding: Partial<BimbelBrandingSettings>) => void;
  onUpdateTeacherAttendanceBulk?: (records: TeacherAttendance[]) => void;
  onDeleteTeacherAttendance?: (id: string) => void;
  onUpdateAttendanceBulk?: (records: Attendance[]) => void;
  onDeleteAttendance?: (id: string) => void;
  onAddLocation?: (location: Omit<BimbelLocation, 'id'>) => void;
  onUpdateLocation?: (location: BimbelLocation) => void;
  onDeleteLocation?: (id: string) => void;
  onSetDefaultLocation?: (id: string) => void;
  onResetDatabase?: () => void;
  onUpdateAssessment?: (assessment: Assessment) => void;
  onDeleteAssessment?: (id: string) => void;
  onAddAssessment?: (assessment: Omit<Assessment, 'id'>) => void;
}

export default function AdminPortal({
  users = [],
  students,
  invoices,
  schedules,
  broadcasts = [],
  bankAccount,
  branding,
  teacherAttendance = [],
  locations = [],
  assessments = [],
  attendance = [],
  activeSubTab: controlledActiveSubTab,
  onSubTabChange,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onAddInvoice,
  onAddSchedule,
  onDeleteSchedule,
  onMarkInvoicePaid,
  onDeleteInvoice,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddBroadcast,
  onUpdateBroadcast,
  onDeleteBroadcast,
  onUpdateBankAccount,
  onUpdateBranding,
  onUpdateTeacherAttendanceBulk,
  onDeleteTeacherAttendance,
  onUpdateAttendanceBulk,
  onDeleteAttendance,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  onSetDefaultLocation,
  onResetDatabase,
  onUpdateAssessment,
  onDeleteAssessment,
  onAddAssessment,
}: AdminPortalProps) {
  // Tabs within Admin (Controlled or Uncontrolled fallback)
  const [internalActiveSubTab, setInternalActiveSubTab] = useState<'kesehatan' | 'tagihan' | 'jadwal' | 'siswa' | 'guru' | 'absensi-guru' | 'laporan' | 'lokasi' | 'pengaturan' | 'pengumuman'>('kesehatan');
  const activeSubTab = controlledActiveSubTab !== undefined ? controlledActiveSubTab : internalActiveSubTab;
  const setActiveSubTab = (tab: 'kesehatan' | 'tagihan' | 'jadwal' | 'siswa' | 'guru' | 'absensi-guru' | 'laporan' | 'lokasi' | 'pengaturan' | 'pengumuman') => {
    if (onSubTabChange) onSubTabChange(tab);
    setInternalActiveSubTab(tab);
  };

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportSelectedStudentId, setReportSelectedStudentId] = useState<string>('');

  // Receipt Modal State
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = useState<Invoice | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Logo Customizer State
  const [isLogoModalOpen, setIsLogoModalOpen] = useState<boolean>(false);

  // Sub-tabs in "Pengaturan & Informasi": 'identitas' | 'pengumuman'
  const [pengaturanTab, setPengaturanTab] = useState<'identitas' | 'pengumuman'>('identitas');

  // School Identity & Official Contact State
  const [schoolName, setSchoolName] = useState<string>(() => {
    if (branding?.institutionName) return branding.institutionName;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('bimbel_school_info');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.name) return parsed.name;
        }
      } catch {}
    }
    return DEFAULT_SCHOOL_INFO.name;
  });

  const [schoolTagline, setSchoolTagline] = useState<string>(() => {
    if (branding?.institutionTagline) return branding.institutionTagline;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('bimbel_school_info');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.tagline) return parsed.tagline;
        }
      } catch {}
    }
    return DEFAULT_SCHOOL_INFO.tagline;
  });

  const [schoolAddress, setSchoolAddress] = useState<string>(() => {
    if (branding?.institutionAddress) return branding.institutionAddress;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('bimbel_school_info');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.address) return parsed.address;
        }
      } catch {}
    }
    return DEFAULT_SCHOOL_INFO.address;
  });

  const [schoolPhone, setSchoolPhone] = useState<string>(() => {
    if (branding?.institutionPhone) return branding.institutionPhone;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('bimbel_school_info');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.phone) return parsed.phone;
        }
      } catch {}
    }
    return DEFAULT_SCHOOL_INFO.phone;
  });

  const [schoolEmail, setSchoolEmail] = useState<string>(() => {
    if (branding?.institutionEmail) return branding.institutionEmail;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('bimbel_school_info');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.email) return parsed.email;
        }
      } catch {}
    }
    return DEFAULT_SCHOOL_INFO.email;
  });

  const [schoolHeadmaster, setSchoolHeadmaster] = useState<string>(() => {
    if (branding?.headmasterName) return branding.headmasterName;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('bimbel_school_info');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.headmaster) return parsed.headmaster;
        }
      } catch {}
    }
    return DEFAULT_SCHOOL_INFO.headmaster;
  });

  const [currentCustomLogo, setCurrentCustomLogo] = useState<string | null>(() => {
    if (branding?.customLogoUrl !== undefined) return branding.customLogoUrl;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bimbel_custom_logo');
    }
    return null;
  });
  const [isSavingSchoolInfo, setIsSavingSchoolInfo] = useState<boolean>(false);
  const quickLogoFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync Logo and School Info from props, localStorage, and event listeners
  React.useEffect(() => {
    if (branding) {
      if (branding.institutionName) setSchoolName(branding.institutionName);
      if (branding.institutionTagline) setSchoolTagline(branding.institutionTagline);
      if (branding.institutionAddress) setSchoolAddress(branding.institutionAddress);
      if (branding.institutionPhone) setSchoolPhone(branding.institutionPhone);
      if (branding.institutionEmail) setSchoolEmail(branding.institutionEmail);
      if (branding.headmasterName) setSchoolHeadmaster(branding.headmasterName);
      if (branding.customLogoUrl !== undefined) setCurrentCustomLogo(branding.customLogoUrl);
    }
  }, [branding]);

  React.useEffect(() => {
    const checkLogoAndInfo = () => {
      if (typeof window !== 'undefined') {
        const savedLogo = localStorage.getItem('bimbel_custom_logo');
        if (branding?.customLogoUrl === undefined) {
          setCurrentCustomLogo(savedLogo || null);
        }

        try {
          const savedInfo = localStorage.getItem('bimbel_school_info');
          if (savedInfo && !branding) {
            const parsed = JSON.parse(savedInfo);
            if (parsed.name) setSchoolName(parsed.name);
            if (parsed.tagline) setSchoolTagline(parsed.tagline);
            if (parsed.address) setSchoolAddress(parsed.address);
            if (parsed.phone) setSchoolPhone(parsed.phone);
            if (parsed.email) setSchoolEmail(parsed.email);
            if (parsed.headmaster) setSchoolHeadmaster(parsed.headmaster);
          }
        } catch {}
      }
    };

    checkLogoAndInfo();

    const handleUpdates = () => checkLogoAndInfo();
    window.addEventListener('bimbel_logo_updated', handleUpdates);
    window.addEventListener('bimbel_school_info_updated', handleUpdates);
    window.addEventListener('storage', handleUpdates);

    return () => {
      window.removeEventListener('bimbel_logo_updated', handleUpdates);
      window.removeEventListener('bimbel_school_info_updated', handleUpdates);
      window.removeEventListener('storage', handleUpdates);
    };
  }, [branding]);

  const handleSaveSchoolInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim() || !schoolAddress.trim() || !schoolPhone.trim()) {
      triggerToast('Gagal: Nama Bimbel, Alamat, dan No. Telepon resmi wajib diisi.');
      return;
    }
    setIsSavingSchoolInfo(true);
    const infoObj = {
      name: schoolName.trim(),
      tagline: schoolTagline.trim(),
      address: schoolAddress.trim(),
      phone: schoolPhone.trim(),
      email: schoolEmail.trim(),
      headmaster: schoolHeadmaster.trim(),
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('bimbel_school_info', JSON.stringify(infoObj));
      window.dispatchEvent(new Event('bimbel_school_info_updated'));
    }
    if (onUpdateBranding) {
      onUpdateBranding({
        institutionName: schoolName.trim(),
        institutionTagline: schoolTagline.trim(),
        institutionAddress: schoolAddress.trim(),
        institutionPhone: schoolPhone.trim(),
        institutionEmail: schoolEmail.trim(),
        headmasterName: schoolHeadmaster.trim(),
      });
    }
    setTimeout(() => {
      setIsSavingSchoolInfo(false);
      triggerToast('Identitas & Kontak Resmi Bimbel berhasil disimpan dan disinkronkan ke seluruh sistem!');
    }, 250);
  };

  const handleResetSchoolInfoToDefault = () => {
    setSchoolName(DEFAULT_SCHOOL_INFO.name);
    setSchoolTagline(DEFAULT_SCHOOL_INFO.tagline);
    setSchoolAddress(DEFAULT_SCHOOL_INFO.address);
    setSchoolPhone(DEFAULT_SCHOOL_INFO.phone);
    setSchoolEmail(DEFAULT_SCHOOL_INFO.email);
    setSchoolHeadmaster(DEFAULT_SCHOOL_INFO.headmaster);

    if (typeof window !== 'undefined') {
      localStorage.setItem('bimbel_school_info', JSON.stringify(DEFAULT_SCHOOL_INFO));
      window.dispatchEvent(new Event('bimbel_school_info_updated'));
    }
    if (onUpdateBranding) {
      onUpdateBranding({
        institutionName: DEFAULT_SCHOOL_INFO.name,
        institutionTagline: DEFAULT_SCHOOL_INFO.tagline,
        institutionAddress: DEFAULT_SCHOOL_INFO.address,
        institutionPhone: DEFAULT_SCHOOL_INFO.phone,
        institutionEmail: DEFAULT_SCHOOL_INFO.email,
        headmasterName: DEFAULT_SCHOOL_INFO.headmaster,
      });
    }
    triggerToast('Identitas bimbel telah dikembalikan ke standar bawaan.');
  };

  const handleQuickLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerToast('Gagal: Harap unggah file gambar (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCurrentCustomLogo(dataUrl);
      if (typeof window !== 'undefined') {
        localStorage.setItem('bimbel_custom_logo', dataUrl);
        window.dispatchEvent(new Event('bimbel_logo_updated'));
      }
      if (onUpdateBranding) {
        onUpdateBranding({ customLogoUrl: dataUrl });
      }
      triggerToast('Logo resmi bimbel berhasil diperbarui di semua halaman & cetak dokumen!');
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogoToDefault = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bimbel_custom_logo');
      window.dispatchEvent(new Event('bimbel_logo_updated'));
    }
    setCurrentCustomLogo(null);
    if (onUpdateBranding) {
      onUpdateBranding({ customLogoUrl: null });
    }
    triggerToast('Logo dikembalikan ke lambang resmi default Rumah CahayaQu.');
  };

  // Bank Account Settings State
  const [bankName, setBankName] = useState<string>(bankAccount?.bankName || 'Bank Syariah Indonesia (BSI)');
  const [accountNumber, setAccountNumber] = useState<string>(bankAccount?.accountNumber || '7182938491');
  const [accountHolder, setAccountHolder] = useState<string>(bankAccount?.accountHolder || 'Rumah CahayaQu (Defika)');
  const [bankInstructions, setBankInstructions] = useState<string>(
    bankAccount?.instructions || 'Mohon cantumkan No. Invoice atau Nama Ananda pada berita transfer. Setelah transfer, kirimkan bukti transfer melalui tombol Konfirmasi Pembayaran (WA).'
  );
  const [isCopiedAdminAcc, setIsCopiedAdminAcc] = useState<boolean>(false);
  const [isSavingBank, setIsSavingBank] = useState<boolean>(false);

  // Sync bank account when external prop updates
  React.useEffect(() => {
    if (bankAccount) {
      setBankName(bankAccount.bankName || 'Bank Syariah Indonesia (BSI)');
      setAccountNumber(bankAccount.accountNumber || '7182938491');
      setAccountHolder(bankAccount.accountHolder || 'Rumah CahayaQu (Defika)');
      setBankInstructions(bankAccount.instructions || '');
    }
  }, [bankAccount]);

  const handleSaveBankDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      triggerToast('Gagal: Nama Bank, No. Rekening, dan Nama Pemilik Rekening wajib diisi.');
      return;
    }
    setIsSavingBank(true);
    const updated: BankAccountInfo = {
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim(),
      instructions: bankInstructions.trim(),
    };
    if (onUpdateBankAccount) {
      onUpdateBankAccount(updated);
    }
    setTimeout(() => {
      setIsSavingBank(false);
      triggerToast('Rekening Pembayaran SPP Berhasil Diperbarui & Diselaraskan ke Portal Ortu!');
    }, 200);
  };

  const handleCopyAdminAccountNumber = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(accountNumber);
      setIsCopiedAdminAcc(true);
      setTimeout(() => setIsCopiedAdminAcc(false), 2000);
    }
  };

  // Teacher Creation Form State
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPassword, setTPassword] = useState('guru123');
  const [tPhone, setTPhone] = useState('');
  const [tSubjects, setTSubjects] = useState<string[]>(['Membaca']);

  // Edit Teacher Modal State
  const [editingTeacher, setEditingTeacher] = useState<UserAccount | null>(null);
  const [editTName, setEditTName] = useState('');
  const [editTEmail, setEditTEmail] = useState('');
  const [editTPassword, setEditTPassword] = useState('');
  const [editTPhone, setEditTPhone] = useState('');
  const [editTSubjects, setEditTSubjects] = useState<string[]>(['Membaca']);

  const handleOpenEditTeacher = (teacher: UserAccount) => {
    setEditingTeacher(teacher);
    setEditTName(teacher.name);
    setEditTEmail(teacher.email);
    setEditTPassword(teacher.password || 'guru123');
    setEditTPhone(teacher.phone || '');
    setEditTSubjects(getTeacherSubjectsList(teacher));
  };

  const handleSaveEditTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    if (!editTName.trim() || !editTEmail.trim() || !editTPassword.trim()) {
      triggerToast('Gagal: Nama, Email, dan Password login guru wajib diisi.');
      return;
    }
    if (editTSubjects.length === 0) {
      triggerToast('Gagal: Pilih minimal 1 mata pelajaran yang diampu oleh guru.');
      return;
    }
    const updatedUser: UserAccount = {
      ...editingTeacher,
      name: editTName.trim(),
      email: editTEmail.trim().toLowerCase(),
      password: editTPassword.trim(),
      phone: editTPhone.trim(),
      subjects: editTSubjects,
      subject: editTSubjects.join(', '),
    };
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    setEditingTeacher(null);
    triggerToast(`Sukses: Data akun & mata pelajaran Guru ${updatedUser.name} berhasil diperbarui.`);
  };

  // Broadcast Form State for Admin
  const todayStr = new Date().toISOString().split('T')[0];
  const [bcTitle, setBcTitle] = useState('');
  const [bcContent, setBcContent] = useState('');
  const [bcSender, setBcSender] = useState('Admin Bimbel');
  const [bcToDelete, setBcToDelete] = useState<BroadcastMessage | null>(null);

  // Edit Broadcast State & Modal
  const [editingBroadcast, setEditingBroadcast] = useState<BroadcastMessage | null>(null);
  const [editBcTitle, setEditBcTitle] = useState<string>('');
  const [editBcContent, setEditBcContent] = useState<string>('');
  const [editBcSender, setEditBcSender] = useState<string>('Admin Bimbel');
  const [editBcDate, setEditBcDate] = useState<string>('');

  const handleOpenEditBroadcast = (bc: BroadcastMessage) => {
    setEditingBroadcast(bc);
    setEditBcTitle(bc.title);
    setEditBcContent(bc.content);
    setEditBcSender(bc.senderName);
    setEditBcDate(bc.date || todayStr);
  };

  const handleSaveEditBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBroadcast) return;
    if (!editBcTitle.trim() || !editBcContent.trim() || !editBcSender.trim()) {
      triggerToast('Gagal: Judul, Isi, dan Pengirim Pengumuman wajib diisi.');
      return;
    }

    const updated: BroadcastMessage = {
      ...editingBroadcast,
      title: editBcTitle.trim(),
      content: editBcContent.trim(),
      senderName: editBcSender.trim(),
      date: editBcDate || editingBroadcast.date,
    };

    if (onUpdateBroadcast) {
      onUpdateBroadcast(updated);
    }
    setEditingBroadcast(null);
    triggerToast('Pengumuman & Pengirim berhasil diperbarui!');
  };

  // Search/Filters for Billing
  const [billingSearch, setBillingSearch] = useState<string>('');
  const [billingStatusFilter, setBillingStatusFilter] = useState<string>('Semua');

  // Add Student Form State
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentClass, setNewStudentClass] = useState<string>('Membaca');
  const [newStudentParent, setNewStudentParent] = useState<string>('');
  const [newStudentPhone, setNewStudentPhone] = useState<string>('');
  const [newStudentTeacher, setNewStudentTeacher] = useState<string>('');

  // Add Invoice Form State
  const [newInvoiceStudentId, setNewInvoiceStudentId] = useState<string>('');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState<string>('');
  const [newInvoiceDueDate, setNewInvoiceDueDate] = useState<string>('');
  const [newInvoiceMonth, setNewInvoiceMonth] = useState<string>('Agustus 2026');
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);

  // Add Schedule Form State
  const [newSchStudentId, setNewSchStudentId] = useState<string>('all');
  const [newSchDay, setNewSchDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Senin');
  const [newSchTime, setNewSchTime] = useState<string>('14:00 - 15:30');
  const [newSchClass, setNewSchClass] = useState<string>('Membaca');
  const [newSchSubject, setNewSchSubject] = useState<string>('');
  const [newSchTeacher, setNewSchTeacher] = useState<string>('');
  const [schToDelete, setSchToDelete] = useState<ScheduleItem | null>(null);

  // Student-specific Schedule Filter & Modal
  const [scheduleFilterStudent, setScheduleFilterStudent] = useState<string>('all');
  const [scheduleModalStudent, setScheduleModalStudent] = useState<Student | null>(null);
  const [modalSchDay, setModalSchDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Senin');
  const [modalSchTime, setModalSchTime] = useState<string>('14:00 - 15:30');
  const [modalSchSubject, setModalSchSubject] = useState<string>('');
  const [modalSchTeacher, setModalSchTeacher] = useState<string>('');

  // Edit Student / Change Lesson State & Modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [editStudentName, setEditStudentName] = useState<string>('');
  const [editStudentAge, setEditStudentAge] = useState<number>(6);
  const [editStudentClass, setEditStudentClass] = useState<string>('Membaca');
  const [editStudentParentName, setEditStudentParentName] = useState<string>('');
  const [editStudentParentPhone, setEditStudentParentPhone] = useState<string>('');
  const [editStudentTeacherName, setEditStudentTeacherName] = useState<string>('');
  const [editStudentStatus, setEditStudentStatus] = useState<'active' | 'graduated' | 'inactive'>('active');
  const [editStudentSyncSchedules, setEditStudentSyncSchedules] = useState<boolean>(true);

  // Primary Presensi Section Tab: 'guru' (Presensi Guru) | 'murid' (Presensi Murid)
  const [attMainTab, setAttMainTab] = useState<'guru' | 'murid'>('guru');

  // Absensi Guru (Teacher Attendance) State
  const [teacherAttDate, setTeacherAttDate] = useState<string>(todayStr);
  const [teacherAttViewMode, setTeacherAttViewMode] = useState<'input' | 'riwayat'>('input');
  const [teacherAttStatusFilter, setTeacherAttStatusFilter] = useState<string>('Semua');
  const [teacherAttTeacherFilter, setTeacherAttTeacherFilter] = useState<string>('all');
  const [teacherAttSearch, setTeacherAttSearch] = useState<string>('');
  const [teacherAttendanceDraft, setTeacherAttendanceDraft] = useState<
    Record<string, { status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat'; timeIn: string; timeOut: string; notes: string }>
  >({});
  const [isSavingTeacherAtt, setIsSavingTeacherAtt] = useState<boolean>(false);

  // Edit / Delete single teacher attendance record modal state
  const [editingTeacherLog, setEditingTeacherLog] = useState<TeacherAttendance | null>(null);
  const [editLogDate, setEditLogDate] = useState<string>('');
  const [editLogStatus, setEditLogStatus] = useState<'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat'>('Hadir');
  const [editLogTimeIn, setEditLogTimeIn] = useState<string>('08:00');
  const [editLogTimeOut, setEditLogTimeOut] = useState<string>('16:00');
  const [editLogNotes, setEditLogNotes] = useState<string>('');
  const [deletingTeacherLog, setDeletingTeacherLog] = useState<TeacherAttendance | null>(null);
  const [viewingTeacherAttendancePhoto, setViewingTeacherAttendancePhoto] = useState<TeacherAttendance | null>(null);

  // Presensi Murid (Student Attendance) State
  const [studentAttDate, setStudentAttDate] = useState<string>(todayStr);
  const [studentAttViewMode, setStudentAttViewMode] = useState<'input' | 'riwayat'>('input');
  const [studentAttStatusFilter, setStudentAttStatusFilter] = useState<string>('Semua');
  const [studentAttClassFilter, setStudentAttClassFilter] = useState<string>('all');
  const [studentAttMonthFilter, setStudentAttMonthFilter] = useState<string>('all');
  const [studentAttSearch, setStudentAttSearch] = useState<string>('');
  const [studentAttendanceDraft, setStudentAttendanceDraft] = useState<
    Record<string, { status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat'; timeIn: string; timeOut: string; notes: string }>
  >({});
  const [isSavingStudentAtt, setIsSavingStudentAtt] = useState<boolean>(false);

  // Edit / Delete single student attendance record modal state
  const [editingStudentLog, setEditingStudentLog] = useState<Attendance | null>(null);
  const [editStudentLogDate, setEditStudentLogDate] = useState<string>('');
  const [editStudentLogStatus, setEditStudentLogStatus] = useState<'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat'>('Hadir');
  const [editStudentLogTimeIn, setEditStudentLogTimeIn] = useState<string>('14:00');
  const [editStudentLogTimeOut, setEditStudentLogTimeOut] = useState<string>('15:30');
  const [editStudentLogNotes, setEditStudentLogNotes] = useState<string>('');
  const [deletingStudentLog, setDeletingStudentLog] = useState<Attendance | null>(null);

  // Synchronize Daily Draft for Student Attendance when date, students, or records update
  React.useEffect(() => {
    const existingRecordsForDate = attendance.filter(r => r.date === studentAttDate);
    const existingMap = new Map(existingRecordsForDate.map(r => [r.studentId, r]));

    const initialDraft: Record<string, { status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat'; timeIn: string; timeOut: string; notes: string }> = {};
    students.forEach(s => {
      const rec = existingMap.get(s.id);
      if (rec) {
        initialDraft[s.id] = {
          status: rec.status,
          timeIn: rec.timeIn || '14:00',
          timeOut: rec.timeOut || '15:30',
          notes: rec.notes || '',
        };
      } else {
        initialDraft[s.id] = {
          status: 'Hadir',
          timeIn: '14:00',
          timeOut: '15:30',
          notes: '',
        };
      }
    });

    setStudentAttendanceDraft(initialDraft);
  }, [studentAttDate, students, attendance]);

  // Synchronize Daily Draft for Teacher Attendance when date, users, or records update
  React.useEffect(() => {
    const teacherUsers = users.filter(u => u.role === 'teacher');
    const existingRecordsForDate = teacherAttendance.filter(r => r.date === teacherAttDate);
    const existingMap = new Map(existingRecordsForDate.map(r => [r.teacherId, r]));

    const initialDraft: Record<string, { status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat'; timeIn: string; timeOut: string; notes: string }> = {};
    teacherUsers.forEach(t => {
      const rec = existingMap.get(t.id);
      if (rec) {
        initialDraft[t.id] = {
          status: rec.status,
          timeIn: rec.timeIn || '08:00',
          timeOut: rec.timeOut || '16:00',
          notes: rec.notes || '',
        };
      } else {
        initialDraft[t.id] = {
          status: 'Hadir',
          timeIn: '08:00',
          timeOut: '16:00',
          notes: '',
        };
      }
    });

    setTeacherAttendanceDraft(initialDraft);
  }, [teacherAttDate, users, teacherAttendance]);

  // Interactive UI Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAdminBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcTitle.trim() || !bcContent.trim()) {
      triggerToast('Judul dan konten pengumuman wajib diisi.');
      return;
    }

    if (onAddBroadcast) {
      onAddBroadcast({
        title: bcTitle.trim(),
        content: bcContent.trim(),
        date: todayStr,
        senderName: bcSender,
        senderRole: 'admin'
      });
      setBcTitle('');
      setBcContent('');
      triggerToast('Pengumuman massal berhasil disiarkan!');
    }
  };

  // Calculations for Financial Metrics
  const totalBillingAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidBillingAmount = invoices.filter(inv => inv.status === 'Lunas').reduce((sum, inv) => sum + inv.amount, 0);
  const unpaidBillingAmount = invoices.filter(inv => inv.status === 'Belum Bayar').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueBillingAmount = invoices.filter(inv => inv.status === 'Terlambat').reduce((sum, inv) => sum + inv.amount, 0);

  // Form submit handlers
  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim() || !tEmail.trim() || !tPassword.trim()) {
      triggerToast('Gagal: Nama, Email, dan Password guru wajib diisi lengkap!');
      return;
    }
    if (tSubjects.length === 0) {
      triggerToast('Gagal: Pilih minimal 1 mata pelajaran yang diampu oleh guru!');
      return;
    }

    if (onAddUser) {
      onAddUser({
        name: tName.trim(),
        email: tEmail.trim().toLowerCase(),
        password: tPassword.trim(),
        phone: tPhone.trim(),
        role: 'teacher',
        subjects: tSubjects,
        subject: tSubjects.join(', '),
      });
    }

    setTName('');
    setTEmail('');
    setTPassword('guru123');
    setTPhone('');
    setTSubjects(['Membaca']);
    triggerToast(`Sukses: Akun Guru ${tName} berhasil dibuat! Guru dapat login menggunakan email ${tEmail.toLowerCase()}`);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentParent.trim() || !newStudentPhone.trim()) {
      triggerToast('Gagal: Seluruh isian data siswa wajib diisi lengkap!');
      return;
    }
    const teacherUsers = users.filter(u => u.role === 'teacher');
    const teacherToAssign = newStudentTeacher || (teacherUsers.length > 0 ? teacherUsers[0].name : 'Guru Pembimbing');

    const teacherObj = teacherUsers.find(u => u.name === teacherToAssign);
    onAddStudent({
      name: newStudentName,
      className: newStudentClass,
      parentName: newStudentParent,
      parentPhone: newStudentPhone,
      teacherName: teacherToAssign,
      teacherId: teacherObj?.id,
    });

    setNewStudentName('');
    setNewStudentParent('');
    setNewStudentPhone('');
    setNewStudentTeacher('');
    triggerToast(`Sukses: Siswa baru ${newStudentName} berhasil didaftarkan dengan Guru ${teacherToAssign}.`);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newInvoiceAmount);
    if (!newInvoiceStudentId || isNaN(amountVal) || amountVal <= 0 || !newInvoiceDueDate) {
      triggerToast('Gagal: Masukkan data invoice & nominal yang valid!');
      return;
    }

    const targetStudent = students.find(s => s.id === newInvoiceStudentId);
    if (!targetStudent) return;

    onAddInvoice({
      studentId: newInvoiceStudentId,
      studentName: targetStudent.name,
      parentName: targetStudent.parentName,
      amount: amountVal,
      dueDate: newInvoiceDueDate,
      status: 'Belum Bayar',
      billingMonth: newInvoiceMonth
    });

    setNewInvoiceAmount('');
    setNewInvoiceDueDate('');
    triggerToast(`Sukses: Tagihan baru senilai Rp ${amountVal.toLocaleString()} berhasil diterbitkan untuk ${targetStudent.name}.`);
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchSubject.trim()) {
      triggerToast('Gagal: Fokus pembahasan / silabus wajib diisi.');
      return;
    }

    const availableTeachers = users.filter(u => u.role === 'teacher');
    if (availableTeachers.length === 0) {
      triggerToast('Peringatan: Belum ada data guru. Silakan tambahkan akun guru di Tab Kelola Guru terlebih dahulu.');
      return;
    }

    const teacherToAssign = newSchTeacher || (availableTeachers.length > 0 ? availableTeachers[0].name : '');
    if (!teacherToAssign) {
      triggerToast('Peringatan: Silakan pilih guru untuk jadwal ini.');
      return;
    }

    const selectedTargetStudent = newSchStudentId !== 'all' ? students.find(s => s.id === newSchStudentId) : null;

    onAddSchedule({
      day: newSchDay,
      timeSlot: newSchTime,
      className: newSchClass,
      subject: newSchSubject.trim(),
      teacherName: teacherToAssign,
      studentId: selectedTargetStudent ? selectedTargetStudent.id : undefined,
      studentName: selectedTargetStudent ? selectedTargetStudent.name : undefined,
    });

    setNewSchSubject('');
    triggerToast(
      selectedTargetStudent
        ? `Sukses: Jadwal khusus ananda ${selectedTargetStudent.name} - ${newSchClass} (${newSchDay}, ${newSchTime}) dengan Guru ${teacherToAssign} berhasil disimpan.`
        : `Sukses: Jadwal umum ${newSchClass} hari ${newSchDay} berhasil dipasang.`
    );
  };

  const handleCreateStudentSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModalStudent) return;
    if (!modalSchSubject.trim()) {
      triggerToast('Gagal: Fokus pembahasan materi wajib diisi.');
      return;
    }

    const availableTeachers = users.filter(u => u.role === 'teacher');
    const teacherToAssign = modalSchTeacher || (availableTeachers.length > 0 ? availableTeachers[0].name : 'Guru');
    const assignedTeacherObj = users.find(u => u.role === 'teacher' && u.name === teacherToAssign);
    const resolvedClass = (assignedTeacherObj?.subject && assignedTeacherObj.subject !== 'Semua Mata Pelajaran')
      ? assignedTeacherObj.subject
      : (scheduleModalStudent.className || 'Membaca');

    onAddSchedule({
      day: modalSchDay,
      timeSlot: modalSchTime,
      className: resolvedClass,
      subject: modalSchSubject.trim(),
      teacherName: teacherToAssign,
      studentId: scheduleModalStudent.id,
      studentName: scheduleModalStudent.name,
    });

    setModalSchSubject('');
    triggerToast(`Sukses: Jadwal sesi ${modalSchDay} (${resolvedClass}) untuk ${scheduleModalStudent.name} berhasil ditambahkan!`);
  };

  const handleOpenEditStudent = (stud: Student) => {
    setEditingStudent(stud);
    setEditStudentName(stud.name);
    setEditStudentAge(stud.age || 6);
    setEditStudentClass(stud.className || 'Membaca');
    setEditStudentParentName(stud.parentName);
    setEditStudentParentPhone(stud.parentPhone);
    setEditStudentTeacherName(stud.teacherName || '');
    setEditStudentStatus(stud.status || 'active');
    setEditStudentSyncSchedules(true);
  };

  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editStudentName.trim()) {
      triggerToast('Gagal: Nama ananda wajib diisi.');
      return;
    }
    if (!editStudentParentName.trim() || !editStudentParentPhone.trim()) {
      triggerToast('Gagal: Nama dan nomor telepon orang tua wajib diisi.');
      return;
    }

    const prevClass = editingStudent.className;
    const teacherUsers = users.filter(u => u.role === 'teacher');
    const chosenTeacherName = editStudentTeacherName.trim() || editingStudent.teacherName || (teacherUsers.length > 0 ? teacherUsers[0].name : 'Guru Pembimbing');
    const matchedTeacherObj = teacherUsers.find(u => u.name === chosenTeacherName);

    const updatedStudent: Student = {
      ...editingStudent,
      name: editStudentName.trim(),
      age: Number(editStudentAge) || 6,
      className: editStudentClass,
      parentName: editStudentParentName.trim(),
      parentPhone: editStudentParentPhone.trim(),
      teacherName: chosenTeacherName,
      teacherId: matchedTeacherObj?.id || editingStudent.teacherId,
      status: editStudentStatus,
    };

    if (onUpdateStudent) {
      onUpdateStudent(updatedStudent, editStudentSyncSchedules);
    }

    setEditingStudent(null);
    if (prevClass !== editStudentClass) {
      triggerToast(`Sukses: Pelajaran les ananda ${updatedStudent.name} berhasil diubah dari "${prevClass}" menjadi "${editStudentClass}"!`);
    } else {
      triggerToast(`Sukses: Data profil ananda ${updatedStudent.name} berhasil diperbarui.`);
    }
  };

  const handleSimulateReminder = (inv: Invoice) => {
    triggerToast(`Simulasi WA Sent: Tagihan berhasil dikirim ke ${inv.parentName} (${students.find(s => s.id === inv.studentId)?.parentPhone || '081xxxx'})!`);
  };

  // Handlers for Teacher Attendance
  const handleDateStep = (days: number) => {
    const current = new Date(teacherAttDate);
    if (!isNaN(current.getTime())) {
      current.setDate(current.getDate() + days);
      setTeacherAttDate(current.toISOString().split('T')[0]);
    }
  };

  const handleMarkAllTeachersPresent = () => {
    const teacherUsers = users.filter(u => u.role === 'teacher');
    const updatedDraft: Record<string, { status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat'; timeIn: string; timeOut: string; notes: string }> = {};
    teacherUsers.forEach(t => {
      updatedDraft[t.id] = {
        status: 'Hadir',
        timeIn: teacherAttendanceDraft[t.id]?.timeIn || '08:00',
        timeOut: teacherAttendanceDraft[t.id]?.timeOut || '16:00',
        notes: teacherAttendanceDraft[t.id]?.notes || '',
      };
    });
    setTeacherAttendanceDraft(updatedDraft);
    triggerToast('Semua guru telah ditandai Hadir!');
  };

  const handleSaveDailyTeacherAttendance = () => {
    const teacherUsers = users.filter(u => u.role === 'teacher');
    if (teacherUsers.length === 0) {
      triggerToast('Gagal: Belum ada akun guru untuk dicatat absensinya.');
      return;
    }

    setIsSavingTeacherAtt(true);
    const recordsToSave: TeacherAttendance[] = teacherUsers.map(t => {
      const draft = teacherAttendanceDraft[t.id] || { status: 'Hadir', timeIn: '08:00', timeOut: '16:00', notes: '' };
      const existing = teacherAttendance.find(r => r.teacherId === t.id && r.date === teacherAttDate);
      return {
        id: existing ? existing.id : `tatt-${t.id}-${teacherAttDate}`,
        teacherId: t.id,
        teacherName: t.name,
        subject: t.subject || 'Pengajar',
        date: teacherAttDate,
        status: draft.status,
        timeIn: draft.timeIn,
        timeOut: draft.timeOut || null,
        notes: draft.notes.trim() || undefined,
      };
    });

    if (onUpdateTeacherAttendanceBulk) {
      onUpdateTeacherAttendanceBulk(recordsToSave);
    }

    setTimeout(() => {
      setIsSavingTeacherAtt(false);
      triggerToast(`Presensi ${recordsToSave.length} Guru untuk tanggal ${teacherAttDate} berhasil disimpan!`);
    }, 200);
  };

  const handleOpenEditTeacherLog = (log: TeacherAttendance) => {
    setEditingTeacherLog(log);
    setEditLogDate(log.date);
    setEditLogStatus(log.status);
    setEditLogTimeIn(log.timeIn || '08:00');
    setEditLogTimeOut(log.timeOut || '16:00');
    setEditLogNotes(log.notes || '');
  };

  const handleSaveEditTeacherLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacherLog) return;

    const updated: TeacherAttendance = {
      ...editingTeacherLog,
      date: editLogDate,
      status: editLogStatus,
      timeIn: editLogTimeIn,
      timeOut: editLogTimeOut || null,
      notes: editLogNotes.trim() || undefined,
    };

    if (onUpdateTeacherAttendanceBulk) {
      onUpdateTeacherAttendanceBulk([updated]);
    }

    setEditingTeacherLog(null);
    triggerToast(`Data presensi ${updated.teacherName} (${updated.date}) berhasil diperbarui!`);
  };

  // Student Attendance Handlers
  const handleStudentDateStep = (deltaDays: number) => {
    const d = new Date(studentAttDate);
    d.setDate(d.getDate() + deltaDays);
    setStudentAttDate(d.toISOString().split('T')[0]);
  };

  const handleMarkAllStudentsPresent = () => {
    const updatedDraft = { ...studentAttendanceDraft };
    students.forEach(s => {
      updatedDraft[s.id] = {
        status: 'Hadir',
        timeIn: studentAttendanceDraft[s.id]?.timeIn || '14:00',
        timeOut: studentAttendanceDraft[s.id]?.timeOut || '15:30',
        notes: studentAttendanceDraft[s.id]?.notes || '',
      };
    });
    setStudentAttendanceDraft(updatedDraft);
    triggerToast('Semua murid telah ditandai Hadir!');
  };

  const handleSaveDailyStudentAttendance = () => {
    if (students.length === 0) {
      triggerToast('Gagal: Belum ada data murid terdaftar.');
      return;
    }

    setIsSavingStudentAtt(true);
    const recordsToSave: Attendance[] = students.map(s => {
      const draft = studentAttendanceDraft[s.id] || { status: 'Hadir', timeIn: '14:00', timeOut: '15:30', notes: '' };
      const existing = attendance.find(r => r.studentId === s.id && r.date === studentAttDate);
      return {
        id: existing ? existing.id : `att-${s.id}-${studentAttDate}`,
        studentId: s.id,
        studentName: s.name,
        date: studentAttDate,
        status: draft.status,
        timeIn: draft.timeIn || '14:00',
        timeOut: draft.timeOut || '15:30',
        notes: draft.notes.trim() || undefined,
      };
    });

    if (onUpdateAttendanceBulk) {
      onUpdateAttendanceBulk(recordsToSave);
    }

    setTimeout(() => {
      setIsSavingStudentAtt(false);
      triggerToast(`Presensi ${recordsToSave.length} Murid untuk tanggal ${studentAttDate} berhasil disimpan!`);
    }, 200);
  };

  const handleOpenEditStudentLog = (log: Attendance) => {
    setEditingStudentLog(log);
    setEditStudentLogDate(log.date);
    setEditStudentLogStatus(log.status);
    setEditStudentLogTimeIn(log.timeIn || '14:00');
    setEditStudentLogTimeOut(log.timeOut || '15:30');
    setEditStudentLogNotes(log.notes || '');
  };

  const handleSaveEditStudentLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentLog) return;

    const updated: Attendance = {
      ...editingStudentLog,
      date: editStudentLogDate,
      status: editStudentLogStatus,
      timeIn: editStudentLogTimeIn,
      timeOut: editStudentLogTimeOut || null,
      notes: editStudentLogNotes.trim() || undefined,
    };

    if (onUpdateAttendanceBulk) {
      onUpdateAttendanceBulk([updated]);
    }

    setEditingStudentLog(null);
    triggerToast(`Data presensi ${updated.studentName} (${updated.date}) berhasil diperbarui!`);
  };

  const handleDeleteStudentLogConfirm = () => {
    if (!deletingStudentLog) return;
    if (onDeleteAttendance) {
      onDeleteAttendance(deletingStudentLog.id);
    }
    triggerToast(`Data presensi ${deletingStudentLog.studentName} berhasil dihapus.`);
    setDeletingStudentLog(null);
  };

  // Filtered Student Attendance Logs for History Tab
  const filteredStudentLogs = attendance.filter(log => {
    const studentObj = students.find(s => s.id === log.studentId);
    const matchesSearch = (log.studentName || '').toLowerCase().includes(studentAttSearch.toLowerCase()) ||
                          (log.notes && log.notes.toLowerCase().includes(studentAttSearch.toLowerCase())) ||
                          (studentObj && studentObj.parentName.toLowerCase().includes(studentAttSearch.toLowerCase())) ||
                          (studentObj && (studentObj.teacherName || '').toLowerCase().includes(studentAttSearch.toLowerCase()));
    const matchesClass = studentAttClassFilter === 'all' || (studentObj && studentObj.className === studentAttClassFilter);
    const matchesStatus = studentAttStatusFilter === 'Semua' || log.status === studentAttStatusFilter;
    const matchesMonth = studentAttMonthFilter === 'all' || log.date.startsWith(studentAttMonthFilter);
    return matchesSearch && matchesClass && matchesStatus && matchesMonth;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filtered Teacher Attendance Logs for History Tab
  const filteredTeacherLogs = teacherAttendance.filter(log => {
    const matchesSearch = log.teacherName.toLowerCase().includes(teacherAttSearch.toLowerCase()) ||
                          (log.notes && log.notes.toLowerCase().includes(teacherAttSearch.toLowerCase())) ||
                          (log.subject && log.subject.toLowerCase().includes(teacherAttSearch.toLowerCase()));
    const matchesTeacher = teacherAttTeacherFilter === 'all' || log.teacherId === teacherAttTeacherFilter;
    const matchesStatus = teacherAttStatusFilter === 'Semua' || log.status === teacherAttStatusFilter;
    return matchesSearch && matchesTeacher && matchesStatus;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filtering invoices based on search & tab selected
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.studentName.toLowerCase().includes(billingSearch.toLowerCase()) || 
                          inv.parentName.toLowerCase().includes(billingSearch.toLowerCase()) || 
                          inv.invoiceNo.toLowerCase().includes(billingSearch.toLowerCase());
    
    if (billingStatusFilter === 'Semua') return matchesSearch;
    return matchesSearch && inv.status === billingStatusFilter;
  });

  const overdueCount = invoices.filter(i => i.status === 'Terlambat').length;
  const teacherCount = users.filter(u => u.role === 'teacher').length;

  const navMenuItems = [
    {
      id: 'kesehatan' as const,
      label: 'Ringkasan Keuangan',
      desc: 'Analitik & metrik kas',
      icon: TrendingUp,
    },
    {
      id: 'tagihan' as const,
      label: 'Tagihan SPP',
      desc: 'Kelola invoice & status bayar',
      icon: FileText,
    },
    {
      id: 'jadwal' as const,
      label: 'Kelola Jadwal',
      desc: 'Sesi bimbel & alokasi guru',
      icon: Calendar,
    },
    {
      id: 'siswa' as const,
      label: 'Kelola Siswa',
      desc: 'Data murid & kontak ortu',
      icon: Users,
    },
    {
      id: 'guru' as const,
      label: 'Kelola Guru',
      desc: 'Data tentor & akun masuk',
      icon: BookOpen,
    },
    {
      id: 'absensi-guru' as const,
      label: 'Presensi & Kehadiran',
      desc: 'Presensi guru & murid bimbel',
      icon: UserCheck,
    },
    {
      id: 'laporan' as const,
      label: 'Laporan & Rapor',
      desc: 'Edit evaluasi, cetak & ekspor',
      icon: Award,
    },
    {
      id: 'pengaturan' as const,
      label: 'Pengaturan & Informasi',
      desc: 'Identitas bimbel & pengumuman',
      icon: SlidersHorizontal,
    },
  ];

  const navScrollRef = React.useRef<HTMLElement>(null);
  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      const scrollAmount = 220;
      navScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div id="admin-portal-root" className="animate-fade-in relative">

      {/* Floating Alert Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-brand-dark text-white text-sm font-bold px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-brand-accent/20 animate-bounce">
          <Sparkles className="w-5 h-5 text-brand-accent" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Content Area with smooth transition between subtabs */}
      <div className="w-full min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >

      {/* RENDER ACTIVE SUBTAB CONTENT */}

      {activeSubTab === 'kesehatan' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Card Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E4D8E6] shadow-premium flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Siswa</span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-brand-primary">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-brand-dark">{students.length} Anak</div>
                <p className="text-xs text-gray-500 mt-1">Siswa Terdaftar Aktif</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E4D8E6] shadow-premium flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dana Masuk</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-emerald-600">Rp {paidBillingAmount.toLocaleString()}</div>
                <p className="text-xs text-emerald-600 font-medium mt-1">Telah Lunas Diverifikasi</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E4D8E6] shadow-premium flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-300 uppercase tracking-wider">Tagihan Pending</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center text-brand-accent">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-[#9A731C] dark:text-amber-300">Rp {unpaidBillingAmount.toLocaleString()}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Menunggu Pembayaran</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E4D8E6] shadow-premium flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tunggakan</span>
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-red-500">Rp {overdueBillingAmount.toLocaleString()}</div>
                <p className="text-xs text-red-500 font-bold mt-1">Lewat Jatuh Tempo</p>
              </div>
            </div>
          </div>

          {/* Visual Business Health Chart & Summary */}
          <div className="bg-white rounded-3xl border border-[#E4D8E6] p-6 shadow-premium">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F3EDF5]">
              <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] flex items-center justify-center text-brand-accent">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-dark">Grafik Realisasi Finansial Bimbel</h3>
                <p className="text-xs text-gray-400">Realisasi perolehan SPP murid aktif dibanding target operasional bulanan</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              
              {/* Responsive SVG Bar Chart */}
              <div className="lg:col-span-3 bg-brand-light rounded-2xl p-4 sm:p-6 border border-[#EFEAE2]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-6 pb-2.5 border-b border-[#EAE3DC]/70 text-xs font-bold">
                  <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">ANALISIS REVENU REKAP BULANAN</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-gray-600 font-semibold text-xs">
                      <span className="w-3 h-3 bg-[#E4D8E6] rounded-xs" /> Target
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-600 font-semibold text-xs">
                      <span className="w-3 h-3 bg-[#8A4C93] rounded-xs" /> Terkumpul
                    </span>
                  </div>
                </div>

                {/* Simulated Chart Bars representing months starting from Agustus with rotated X-Axis on Mobile */}
                <div className="h-72 sm:h-64 flex items-end justify-between sm:justify-around pt-4 pb-2 px-2 sm:px-6 gap-2 sm:gap-4">
                  
                  {/* Agustus (Current Month) */}
                  <div className="flex flex-col items-center gap-2 flex-1 max-w-[72px] sm:max-w-[90px]">
                    <div className="relative w-8 sm:w-12 h-36 sm:h-44 flex items-end justify-center bg-gray-200 rounded-lg overflow-hidden shrink-0">
                      {/* Target bar */}
                      <div className="absolute bottom-0 w-full h-[100%] bg-gray-300 rounded-b-lg" />
                      {/* Realized bar based on paid amount out of total */}
                      <div 
                        className="absolute bottom-0 w-full bg-brand-primary rounded-b-lg transition-all duration-1000"
                        style={{ height: `${totalBillingAmount > 0 ? Math.max(25, (paidBillingAmount / totalBillingAmount) * 100) : 75}%` }}
                      />
                    </div>
                    <div className="h-16 sm:h-8 flex items-start justify-center pt-2 sm:pt-1 w-full overflow-visible">
                      <span className="text-[10px] sm:text-xs font-bold text-brand-dark text-center -rotate-45 sm:rotate-0 whitespace-nowrap transform origin-top-left sm:origin-center translate-x-1 sm:translate-x-0">
                        Agustus (Aktif)
                      </span>
                    </div>
                  </div>

                  {/* September */}
                  <div className="flex flex-col items-center gap-2 flex-1 max-w-[72px] sm:max-w-[90px]">
                    <div className="relative w-8 sm:w-12 h-36 sm:h-44 flex items-end justify-center bg-gray-200 rounded-lg overflow-hidden shrink-0">
                      <div className="absolute bottom-0 w-full h-[95%] bg-gray-300 rounded-b-lg" />
                      <div className="absolute bottom-0 w-full h-[60%] bg-brand-primary/60 rounded-b-lg" />
                    </div>
                    <div className="h-16 sm:h-8 flex items-start justify-center pt-2 sm:pt-1 w-full overflow-visible">
                      <span className="text-[10px] sm:text-xs font-bold text-brand-dark text-center -rotate-45 sm:rotate-0 whitespace-nowrap transform origin-top-left sm:origin-center translate-x-1 sm:translate-x-0">
                        September
                      </span>
                    </div>
                  </div>

                  {/* Oktober */}
                  <div className="flex flex-col items-center gap-2 flex-1 max-w-[72px] sm:max-w-[90px]">
                    <div className="relative w-8 sm:w-12 h-36 sm:h-44 flex items-end justify-center bg-gray-200 rounded-lg overflow-hidden shrink-0">
                      <div className="absolute bottom-0 w-full h-[90%] bg-gray-300 rounded-b-lg" />
                      <div className="absolute bottom-0 w-full h-[40%] bg-brand-primary/40 rounded-b-lg" />
                    </div>
                    <div className="h-16 sm:h-8 flex items-start justify-center pt-2 sm:pt-1 w-full overflow-visible">
                      <span className="text-[10px] sm:text-xs font-bold text-brand-dark text-center -rotate-45 sm:rotate-0 whitespace-nowrap transform origin-top-left sm:origin-center translate-x-1 sm:translate-x-0">
                        Oktober
                      </span>
                    </div>
                  </div>

                  {/* November */}
                  <div className="flex flex-col items-center gap-2 flex-1 max-w-[72px] sm:max-w-[90px]">
                    <div className="relative w-8 sm:w-12 h-36 sm:h-44 flex items-end justify-center bg-gray-200 rounded-lg overflow-hidden shrink-0">
                      <div className="absolute bottom-0 w-full h-[85%] bg-gray-300 rounded-b-lg" />
                      <div className="absolute bottom-0 w-full h-[25%] bg-brand-primary/30 rounded-b-lg" />
                    </div>
                    <div className="h-16 sm:h-8 flex items-start justify-center pt-2 sm:pt-1 w-full overflow-visible">
                      <span className="text-[10px] sm:text-xs font-bold text-brand-dark text-center -rotate-45 sm:rotate-0 whitespace-nowrap transform origin-top-left sm:origin-center translate-x-1 sm:translate-x-0">
                        November
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Operational Insights */}
              <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
                <div className="bg-[#FFFDF9] rounded-2xl p-5 border border-brand-accent/20">
                  <h4 className="text-base font-bold text-brand-dark mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-accent" />
                    Kesehatan Operasional Bimbel
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    Kolektibilitas SPP bulan ini berada di angka <strong className="text-brand-primary">{totalBillingAmount > 0 ? Math.round((paidBillingAmount / totalBillingAmount) * 100) : 0}%</strong>. Diperlukan tindakan pengiriman pengingat berkala untuk tagihan terlambat demi menjaga arus kas operasional tetap sehat.
                  </p>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-2 border-b border-[#FAF6F0]">
                      <span className="text-gray-500">Rasio Kolektibilitas</span>
                      <span className="font-bold text-brand-dark">{totalBillingAmount > 0 ? Math.round((paidBillingAmount / totalBillingAmount) * 100) : 0}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#FAF6F0]">
                      <span className="text-gray-500">Tagihan Terkirim</span>
                      <span className="font-bold text-brand-dark">{invoices.length} Invoice</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-500">Pendapatan Rerata per Siswa</span>
                      <span className="font-bold text-emerald-600">Rp {students.length > 0 ? Math.round(totalBillingAmount / students.length).toLocaleString() : 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-primary/5 rounded-2xl p-4 border border-brand-primary/10 flex items-center gap-3">
                  <AlertTriangle className="text-brand-primary w-5 h-5 shrink-0" />
                  <p className="text-xs text-brand-primary leading-tight">
                    Optimalkan pendapatan dengan menawarkan diskon pelunasan lebih awal (early-bird) untuk SPP bulan berikutnya.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'tagihan' && (
        <div className="space-y-8 animate-fade-in">

          {/* Section: Bank Account & Payment Instructions Management */}
          <div className="bg-white rounded-3xl border border-[#E4D8E6] p-6 sm:p-7 shadow-premium">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F3EDF5]">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold shrink-0 shadow-2xs">
                  <Building2 className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-brand-dark flex items-center gap-2">
                    Pengaturan Rekening Pembayaran SPP
                    <span className="text-[11px] font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                      Tampil di Portal Ortu
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    Atur data bank tujuan transfer dan instruksi pembayaran yang akan dilihat wali murid di Kartu SPP.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 bg-brand-light px-3.5 py-1.5 rounded-xl border border-[#ECE5DB] self-start sm:self-auto">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-extrabold text-brand-dark">{bankName}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
              {/* Form Settings (7 cols) */}
              <form onSubmit={handleSaveBankDetails} className="lg:col-span-7 space-y-4.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="admin-bank-name" className="text-xs font-bold text-gray-500 uppercase">
                      Nama Bank / Saluran Transfer
                    </label>
                    <input
                      id="admin-bank-name"
                      type="text"
                      list="admin-bank-presets"
                      placeholder="Contoh: Bank Syariah Indonesia (BSI)"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      required
                      className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
                    />
                    <datalist id="admin-bank-presets">
                      <option value="Bank Syariah Indonesia (BSI)" />
                      <option value="BCA" />
                      <option value="Bank Mandiri" />
                      <option value="BRI" />
                      <option value="BNI" />
                      <option value="Bank Jago" />
                      <option value="QRIS / Dompet Digital" />
                    </datalist>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="admin-account-number" className="text-xs font-bold text-gray-500 uppercase">
                      Nomor Rekening / No. VA
                    </label>
                    <input
                      id="admin-account-number"
                      type="text"
                      placeholder="Contoh: 7182938491"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      required
                      className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 text-sm font-mono font-extrabold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="admin-account-holder" className="text-xs font-bold text-gray-500 uppercase">
                    Atas Nama (Pemilik Rekening)
                  </label>
                  <input
                    id="admin-account-holder"
                    type="text"
                    placeholder="Contoh: Rumah CahayaQu (Defika)"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    required
                    className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="admin-bank-instructions" className="text-xs font-bold text-gray-500 uppercase">
                    Panduan Singkat / Catatan Transfer untuk Orang Tua
                  </label>
                  <textarea
                    id="admin-bank-instructions"
                    rows={2}
                    placeholder="Contoh: Cantumkan No. Invoice / Nama Ananda pada berita transfer..."
                    value={bankInstructions}
                    onChange={(e) => setBankInstructions(e.target.value)}
                    className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl p-3 text-xs font-medium text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingBank}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-extrabold rounded-xl text-sm transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSavingBank ? 'Menyimpan...' : 'Simpan Perubahan Rekening'}
                  </button>
                </div>
              </form>

              {/* Live Preview for Admin (5 cols) */}
              <div className="lg:col-span-5 bg-gradient-to-br from-brand-light to-[#F7F2EB] rounded-2xl border border-[#E7DECE] p-5 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#E3D8C6]">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-brand-primary" />
                      Pratinjau di Kartu SPP Ortu
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold bg-white px-2 py-0.5 rounded-md border border-[#E2DBD0]">
                      Live Preview
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-[#E6DDCE] shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-500 uppercase">Transfer Bank Resmi</span>
                      <span className="text-xs font-extrabold text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-lg">
                        {bankName || 'Nama Bank'}
                      </span>
                    </div>

                    <div className="bg-brand-light rounded-xl p-3 border border-[#EFE8DF] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">No. Rekening Tujuan</div>
                        <div className="text-base font-mono font-extrabold text-brand-dark tracking-wide">
                          {accountNumber || '0000000000'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyAdminAccountNumber}
                        className="px-2.5 py-1.5 bg-white hover:bg-brand-primary/10 border border-[#E2DBD0] text-brand-primary rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Salin No. Rekening"
                      >
                        {isCopiedAdminAcc ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold text-[10px]">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Salin</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-xs text-gray-600">
                      <span className="text-gray-400 font-semibold">Atas Nama:</span>{' '}
                      <strong className="text-brand-dark font-extrabold">{accountHolder || '-'}</strong>
                    </div>

                    {bankInstructions && (
                      <div className="text-[11px] text-gray-500 bg-[#FAF7F2] p-2.5 rounded-lg border border-[#F0E9DC] leading-relaxed flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
                        <span>{bankInstructions}</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 italic mt-3 text-center">
                  *Perubahan pada form di samping akan langsung otomatis terupdate secara real-time pada kartu SPP wali murid.
                </p>
              </div>
            </div>
          </div>
          
          {/* Quick billing creator & search ribbon */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Create Invoice Form */}
            <div className="bg-white rounded-3xl border border-[#E4D8E6] p-6 shadow-premium">
              <h3 className="text-base font-extrabold text-brand-dark mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-primary" />
                Terbitkan Invoice Baru
              </h3>

              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="invoice-student-select" className="text-xs font-bold text-gray-500 uppercase">Pilih Siswa</label>
                  <select
                    id="invoice-student-select"
                    value={newInvoiceStudentId}
                    onChange={(e) => setNewInvoiceStudentId(e.target.value)}
                    className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2"
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (Ortu: {s.parentName})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="invoice-amount" className="text-xs font-bold text-gray-500 uppercase">Nominal Tagihan (Rp)</label>
                  <input
                    id="invoice-amount"
                    type="number"
                    placeholder="Contoh: 450000"
                    value={newInvoiceAmount}
                    onChange={(e) => setNewInvoiceAmount(e.target.value)}
                    className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 focus:outline-none focus:ring-2"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="invoice-due-date" className="text-xs font-bold text-gray-500 uppercase">Tenggat Pembayaran</label>
                  <input
                    id="invoice-due-date"
                    type="date"
                    value={newInvoiceDueDate}
                    onChange={(e) => setNewInvoiceDueDate(e.target.value)}
                    className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 focus:outline-none focus:ring-2"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="invoice-month-select" className="text-xs font-bold text-gray-500 uppercase">Bulan Tagihan</label>
                  <select
                    id="invoice-month-select"
                    value={newInvoiceMonth}
                    onChange={(e) => setNewInvoiceMonth(e.target.value)}
                    className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2"
                  >
                    <option value="Agustus 2026">Agustus 2026</option>
                    <option value="September 2026">September 2026</option>
                    <option value="Oktober 2026">Oktober 2026</option>
                    <option value="November 2026">November 2026</option>
                    <option value="Desember 2026">Desember 2026</option>
                    <option value="Januari 2027">Januari 2027</option>
                    <option value="Februari 2027">Februari 2027</option>
                    <option value="Maret 2027">Maret 2027</option>
                    <option value="April 2027">April 2027</option>
                    <option value="Mei 2027">Mei 2027</option>
                    <option value="Juni 2027">Juni 2027</option>
                    <option value="Juli 2027">Juli 2027</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl text-sm transition-all shadow cursor-pointer active:scale-95"
                >
                  Terbitkan Invoice SPP
                </button>
              </form>
            </div>

            {/* Invoice Management Table / List */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E4D8E6] p-6 shadow-premium flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h3 className="text-base font-extrabold text-brand-dark">Arsip Tagihan Murid</h3>
                  
                  {/* Status Filters */}
                  <div className="flex flex-wrap gap-1 bg-brand-light p-1 rounded-xl border border-[#ECE5DB] self-start sm:self-center">
                    {[
                      { key: 'Semua', label: 'Semua', count: invoices.length },
                      { key: 'Lunas', label: 'Riwayat Lunas', count: invoices.filter(i => i.status === 'Lunas').length },
                      { key: 'Belum Bayar', label: 'Belum Bayar', count: invoices.filter(i => i.status === 'Belum Bayar').length },
                      { key: 'Terlambat', label: 'Terlambat', count: invoices.filter(i => i.status === 'Terlambat').length },
                    ].map(({ key, label, count }) => (
                      <button
                        key={key}
                        onClick={() => setBillingStatusFilter(key)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          billingStatusFilter === key
                            ? 'bg-brand-primary text-white shadow-xs'
                            : 'text-gray-500 hover:text-brand-primary hover:bg-white/60'
                        }`}
                      >
                        <span>{label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                          billingStatusFilter === key ? 'bg-white/20 text-white' : 'bg-gray-200/70 text-gray-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                  <input
                    id="billing-search-input"
                    type="text"
                    placeholder="Cari berdasarkan nama murid, orang tua, nomor invoice..."
                    value={billingSearch}
                    onChange={(e) => setBillingSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-brand-light border border-[#E4D8E6] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
                  />
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
                </div>

                {/* Billing Table */}
                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#F3EDF5] text-gray-400 font-extrabold uppercase tracking-wide">
                        <th className="py-2">No. Invoice / Murid</th>
                        <th className="py-2">Bulan</th>
                        <th className="py-2">Nominal</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FDFBF7]">
                      {filteredInvoices.length > 0 ? (
                        filteredInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-brand-light/50 transition-colors">
                            <td className="py-3">
                              <div className="font-bold text-brand-dark">{inv.invoiceNo}</div>
                              <div className="text-gray-500 font-medium">{inv.studentName}</div>
                            </td>
                            <td className="py-3 text-gray-500 font-semibold">{inv.billingMonth}</td>
                            <td className="py-3 font-bold text-brand-dark">Rp {inv.amount.toLocaleString()}</td>
                            <td className="py-3">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                inv.status === 'Lunas' ? 'bg-green-100 text-green-700' :
                                inv.status === 'Terlambat' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReceiptInvoice(inv);
                                  setIsReceiptModalOpen(true);
                                }}
                                className="p-1.5 bg-white hover:bg-brand-primary/10 border border-[#E4D8E6] text-brand-primary rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                                title="Unduh / Lihat Bukti Kuitansi"
                              >
                                <Printer className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                              </button>
                              {inv.status !== 'Lunas' && (
                                <button
                                  onClick={() => onMarkInvoicePaid(inv.id)}
                                  className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-[10px] shadow transition-all active:scale-95 cursor-pointer"
                                  title="Tandai Lunas"
                                >
                                  Tandai Lunas
                                </button>
                              )}
                              <button
                                onClick={() => handleSimulateReminder(inv)}
                                className="p-1.5 bg-white hover:bg-brand-accent/10 border border-[#E4D8E6] text-brand-primary rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                                title="Kirim Pengingat WhatsApp"
                              >
                                <PhoneCall className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                              </button>
                              {onDeleteInvoice && (
                                <button
                                  onClick={() => setDeletingInvoice(inv)}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                                  title="Hapus Tagihan"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                            Tidak ada invoice yang memenuhi kriteria pencarian.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-[#FFFDF9] border border-[#F3E9D7] p-3 rounded-xl flex items-start gap-2.5 mt-4">
                <CheckCircle className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Semua transaksi diproses secara aman. Status tagihan otomatis terupdate di **Portal Orang Tua** secara instan setelah Admin menandai lunas atau menyunting data tagihan.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {activeSubTab === 'jadwal' && (
        <div className="space-y-8 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Add Schedule Form */}
            <div className="bg-white rounded-3xl border border-[#E4D8E6] p-6 shadow-premium self-start">
              <h3 className="text-base font-extrabold text-brand-dark mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-primary" />
                Tambah Jadwal Belajar
              </h3>

              <form onSubmit={handleCreateSchedule} className="space-y-4">
                {/* Target Siswa / Jenis Jadwal */}
                <div className="space-y-1.5">
                  <label htmlFor="sch-student-select" className="text-xs font-bold text-gray-500 uppercase">
                    Target Jadwal (Per Anak / Reguler)
                  </label>
                  <select
                    id="sch-student-select"
                    value={newSchStudentId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewSchStudentId(val);
                      if (val !== 'all') {
                        const s = students.find(item => item.id === val);
                        if (s) {
                          if (s.className) {
                            setNewSchClass(s.className);
                          }
                          // Also match teacher if student has assigned teacher
                          if (s.teacherName) {
                            setNewSchTeacher(s.teacherName);
                          } else {
                            const matchedTeacher = users.find(u => u.role === 'teacher' && (u.subject === s.className || u.subject === 'Semua Mata Pelajaran'));
                            if (matchedTeacher) {
                              setNewSchTeacher(matchedTeacher.name);
                            }
                          }
                        }
                      }
                    }}
                    className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="all">👥 Semua Siswa (Jadwal Reguler Kelas)</option>
                    {students.length > 0 && (
                      <optgroup label="Khusus Siswa Tertentu (Per Anak)">
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            👦 {s.name} ({s.className})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {newSchStudentId !== 'all' && (
                    <p className="text-[11px] text-brand-primary font-medium">
                      Jadwal ini akan diprioritaskan khusus di dasbor Ananda {students.find(s => s.id === newSchStudentId)?.name}.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="sch-day-select" className="text-xs font-bold text-gray-500 uppercase">Hari</label>
                    <select
                      id="sch-day-select"
                      value={newSchDay}
                      onChange={(e) => setNewSchDay(e.target.value as any)}
                      className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-sm font-bold text-brand-dark focus:outline-none"
                    >
                      <option value="Senin">Senin</option>
                      <option value="Selasa">Selasa</option>
                      <option value="Rabu">Rabu</option>
                      <option value="Kamis">Kamis</option>
                      <option value="Jumat">Jumat</option>
                      <option value="Sabtu">Sabtu</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="sch-class-select" className="text-xs font-bold text-gray-500 uppercase">Mata Pelajaran</label>
                    <select
                      id="sch-class-select"
                      value={newSchClass}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewSchClass(val);
                        // If current teacher doesn't teach this subject, auto-select teacher who teaches it
                        const currentTeacherObj = users.find(u => u.role === 'teacher' && u.name === newSchTeacher);
                        if (!currentTeacherObj || !teacherCanTeachSubject(currentTeacherObj, val)) {
                          const matchingTeacher = users.find(u => u.role === 'teacher' && teacherCanTeachSubject(u, val));
                          if (matchingTeacher) {
                            setNewSchTeacher(matchingTeacher.name);
                          }
                        }
                      }}
                      className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-sm font-bold text-brand-dark focus:outline-none"
                    >
                      <option value="Membaca">Membaca</option>
                      <option value="Berhitung">Berhitung</option>
                      <option value="Mengaji">Mengaji</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sch-time-slot" className="text-xs font-bold text-gray-500 uppercase">Slot Waktu Belajar</label>
                  <input
                    id="sch-time-slot"
                    type="text"
                    value={newSchTime}
                    onChange={(e) => setNewSchTime(e.target.value)}
                    placeholder="Contoh: 14:00 - 15:30"
                    className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 focus:outline-none"
                  />
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {['14:00 - 15:30', '15:45 - 17:15', '09:00 - 10:30'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNewSchTime(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          newSchTime === preset 
                            ? 'bg-brand-primary text-white border-brand-primary font-bold' 
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sch-teacher-select" className="text-xs font-bold text-gray-500 uppercase">Tentor / Guru Alokasi</label>
                  <select
                    id="sch-teacher-select"
                    value={newSchTeacher}
                    onChange={(e) => {
                      const selectedTeacherName = e.target.value;
                      setNewSchTeacher(selectedTeacherName);
                      if (selectedTeacherName) {
                        const teacherObj = users.find(u => u.role === 'teacher' && u.name === selectedTeacherName);
                        if (teacherObj) {
                          const teacherSubjs = getTeacherSubjectsList(teacherObj);
                          // If current class is not taught by selected teacher, align to teacher's first subject
                          if (!teacherCanTeachSubject(teacherObj, newSchClass) && teacherSubjs.length > 0) {
                            setNewSchClass(teacherSubjs[0]);
                          }
                          // Suggest syllabus
                          const activeClass = teacherCanTeachSubject(teacherObj, newSchClass) ? newSchClass : (teacherSubjs[0] || 'Membaca');
                          if (!newSchSubject || newSchSubject.includes('Fonik') || newSchSubject.includes('Logika') || newSchSubject.includes('Iqro') || newSchSubject.includes('Pengenalan')) {
                            if (activeClass === 'Mengaji') {
                              setNewSchSubject('Iqro & Tajwid Cilik / Praktik Sholat');
                            } else if (activeClass === 'Berhitung') {
                              setNewSchSubject('Berhitung Cepat & Logika Matematika');
                            } else if (activeClass === 'Membaca') {
                              setNewSchSubject('Pengenalan Fonik & Suku Kata');
                            }
                          }
                        }
                      }
                    }}
                    className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 text-sm font-bold text-brand-dark focus:outline-none"
                  >
                    {users.filter(u => u.role === 'teacher').length === 0 ? (
                      <option value="">-- Belum ada data guru (Kosong) --</option>
                    ) : (
                      <>
                        <option value="">-- Pilih Guru / Tentor --</option>
                        {users
                          .filter(u => u.role === 'teacher')
                          .map((teacher) => {
                            const subjsStr = getTeacherSubjectsList(teacher).join(', ');
                            return (
                              <option key={teacher.id} value={teacher.name}>
                                {teacher.name} ({subjsStr || 'Pengajar'})
                              </option>
                            );
                          })}
                      </>
                    )}
                  </select>
                  {newSchTeacher && (() => {
                    const selectedTeacherObj = users.find(u => u.role === 'teacher' && u.name === newSchTeacher);
                    if (selectedTeacherObj) {
                      const subjsStr = getTeacherSubjectsList(selectedTeacherObj).join(', ');
                      return (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          <span>Mengajar: <strong>{subjsStr}</strong> ➜ Mata Pelajaran diselaraskan ({newSchClass})</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sch-subject" className="text-xs font-bold text-gray-500 uppercase">Fokus Pembahasan / Silabus</label>
                  <input
                    id="sch-subject"
                    type="text"
                    placeholder="Contoh: Pengenalan Fonik & Suku Kata"
                    value={newSchSubject}
                    onChange={(e) => setNewSchSubject(e.target.value)}
                    className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl text-sm transition-all shadow cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {newSchStudentId !== 'all' ? 'Simpan Jadwal Anak' : 'Pasang Slot Jadwal'}
                </button>
              </form>
            </div>

            {/* Schedule Display Matrix */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E4D8E6] p-6 shadow-premium flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#F3EDF5]">
                <div>
                  <h3 className="text-base font-extrabold text-brand-dark">Matriks Jadwal Belajar</h3>
                  <p className="text-xs text-gray-400">Total {schedules.length} slot jadwal aktif</p>
                </div>

                {/* Filter Selector */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sch-filter-select" className="text-xs font-bold text-gray-500 whitespace-nowrap">Filter:</label>
                  <select
                    id="sch-filter-select"
                    value={scheduleFilterStudent}
                    onChange={(e) => setScheduleFilterStudent(e.target.value)}
                    className="bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-1.5 text-xs font-bold text-brand-dark focus:outline-none"
                  >
                    <option value="all">Semua Jadwal</option>
                    <option value="general">Hanya Jadwal Reguler (Umum)</option>
                    <optgroup label="Saring Per Anak">
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          👦 {s.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
              
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 flex-1">
                {(() => {
                  const filteredList = schedules.filter((sch) => {
                    if (scheduleFilterStudent === 'all') return true;
                    if (scheduleFilterStudent === 'general') return !sch.studentId || sch.studentId === 'all';
                    // Student specific
                    return sch.studentId === scheduleFilterStudent || 
                           (sch.studentName && students.find(s => s.id === scheduleFilterStudent)?.name.toLowerCase() === sch.studentName.toLowerCase()) ||
                           (!sch.studentId && sch.className === students.find(s => s.id === scheduleFilterStudent)?.className);
                  });

                  if (filteredList.length === 0) {
                    return (
                      <div className="py-12 text-center text-gray-400 italic bg-gray-50 rounded-2xl border border-dashed border-[#E4D8E6]">
                        Tidak ada slot jadwal yang sesuai dengan filter ini.
                      </div>
                    );
                  }

                  return filteredList.map((sch) => {
                    const isPerStudent = !!sch.studentId && sch.studentId !== 'all';
                    return (
                      <div key={sch.id} className="p-4 rounded-2xl bg-brand-light border border-[#EFEAE2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-brand-primary/30 transition-all">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold bg-[#FAF0E6] text-[#A66D2E] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              {sch.day}
                            </span>
                            <span className="text-xs font-bold text-brand-primary">{sch.timeSlot} WIB</span>
                            
                            {isPerStudent ? (
                              <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                                👦 Khusus: {sch.studentName || 'Ananda'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                👥 Reguler ({sch.className})
                              </span>
                            )}
                          </div>

                          <h4 className="font-extrabold text-brand-dark text-sm truncate">
                            {sch.className} • <span className="text-gray-500 font-medium">{sch.subject}</span>
                          </h4>

                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>Guru Pengajar: <strong className="text-brand-dark">{sch.teacherName}</strong></span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {onDeleteSchedule && (
                            <button
                              type="button"
                              onClick={() => setSchToDelete(sch)}
                              className="p-2 rounded-xl bg-white border border-[#F3ECE4] text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer shadow-2xs flex items-center gap-1 text-xs font-semibold"
                              title="Hapus Slot Jadwal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Hapus</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

          </div>

        </div>
      )}

      {activeSubTab === 'siswa' && (
        <div className="space-y-8 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Register New Student Form */}
            <div className="bg-white rounded-3xl border border-[#E4D8E6] p-6 shadow-premium">
              <h3 className="text-base font-extrabold text-brand-dark mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-primary" />
                Registrasi Murid Baru
              </h3>

              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="student-name-input" className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap Anak</label>
                  <input
                    id="student-name-input"
                    type="text"
                    placeholder="Contoh: Alika Naura"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="student-class-select" className="text-xs font-bold text-gray-500 uppercase">Pilihan Mata Pelajaran</label>
                  <select
                    id="student-class-select"
                    value={newStudentClass}
                    onChange={(e) => {
                      const selectedClass = e.target.value;
                      setNewStudentClass(selectedClass);
                      const currentTeacherObj = users.find(u => u.role === 'teacher' && u.name === newStudentTeacher);
                      if (!currentTeacherObj || !teacherCanTeachSubject(currentTeacherObj, selectedClass)) {
                        const matchingTeacher = users.find(u => u.role === 'teacher' && teacherCanTeachSubject(u, selectedClass));
                        if (matchingTeacher) {
                          setNewStudentTeacher(matchingTeacher.name);
                        }
                      }
                    }}
                    className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="Membaca">Membaca</option>
                    <option value="Berhitung">Berhitung</option>
                    <option value="Mengaji">Mengaji</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="student-teacher-select" className="text-xs font-bold text-gray-500 uppercase">Guru Pembimbing Khusus</label>
                  <select
                    id="student-teacher-select"
                    value={newStudentTeacher}
                    onChange={(e) => {
                      const tName = e.target.value;
                      setNewStudentTeacher(tName);
                      if (tName) {
                        const teacherObj = users.find(u => u.role === 'teacher' && u.name === tName);
                        if (teacherObj) {
                          const subjs = getTeacherSubjectsList(teacherObj);
                          if (!teacherCanTeachSubject(teacherObj, newStudentClass) && subjs.length > 0) {
                            setNewStudentClass(subjs[0]);
                          }
                        }
                      }
                    }}
                    className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="">-- Pilih Guru Pembimbing --</option>
                    {users.filter(u => u.role === 'teacher').map(t => (
                      <option key={t.id} value={t.name}>{t.name} ({getTeacherSubjectsList(t).join(', ') || 'Pengajar'})</option>
                    ))}
                    {users.filter(u => u.role === 'teacher').length === 0 && (
                      <option value="Guru Pembimbing">Guru Pembimbing (Default)</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="student-parent-input" className="text-xs font-bold text-gray-500 uppercase">Nama Orang Tua (Wali)</label>
                  <input
                    id="student-parent-input"
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={newStudentParent}
                    onChange={(e) => setNewStudentParent(e.target.value)}
                    className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="student-phone-input" className="text-xs font-bold text-gray-500 uppercase">Nomor HP/WhatsApp Ortu</label>
                  <input
                    id="student-phone-input"
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(e.target.value)}
                    className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl text-sm transition-all shadow cursor-pointer active:scale-95 animate-pulse"
                >
                  Registrasikan Anak
                </button>
              </form>
            </div>

            {/* List Registered Students */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E4D8E6] p-6 shadow-premium">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="text-base font-extrabold text-brand-dark">Daftar Murid Terdaftar ({students.length})</h3>
                <p className="text-xs text-gray-400 font-medium">Klik &ldquo;Atur Jadwal&rdquo; untuk sesuaikan sesi belajar per anak</p>
              </div>
              
              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                {students.length > 0 ? (
                  students.map((stud) => {
                    const studentSchedulesList = schedules.filter(sch => 
                      sch.studentId === stud.id || 
                      (sch.studentName && sch.studentName.toLowerCase().trim() === stud.name.toLowerCase().trim()) ||
                      ((!sch.studentId || sch.studentId === 'all') && sch.className === stud.className)
                    );

                    return (
                      <div key={stud.id} className="p-4 rounded-2xl bg-brand-light border border-[#EFEAE2] flex flex-col gap-3 hover:border-brand-primary/30 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-base shrink-0">
                              {stud.name[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-brand-dark text-sm truncate">{stud.name}</h4>
                                <span className="text-[10px] font-extrabold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full uppercase">
                                  {stud.className}
                                </span>
                                {stud.teacherName && (
                                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-full">
                                    👩‍🏫 {stud.teacherName}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5 truncate">
                                Wali: <strong className="text-brand-dark">{stud.parentName}</strong> ({stud.parentPhone})
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleOpenEditStudent(stud)}
                              className="px-3 py-1.5 rounded-xl bg-white border border-[#E4D8E6] text-brand-dark hover:bg-brand-primary hover:text-white hover:border-brand-primary text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                              title="Ubah Mata Pelajaran Les & Data Murid"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Ubah Les / Profil</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setScheduleModalStudent(stud);
                                setModalSchDay('Senin');
                                setModalSchTime('14:00 - 15:30');
                                setModalSchSubject('');
                                const teachers = users.filter(u => u.role === 'teacher');
                                setModalSchTeacher(teachers.length > 0 ? teachers[0].name : '');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Atur Jadwal Anak</span>
                            </button>

                            {onDeleteStudent && (
                              <button
                                type="button"
                                onClick={() => setDeletingStudent(stud)}
                                className="px-2.5 py-1.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                                title="Hapus Data Siswa"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Schedule Badges Preview */}
                        <div className="pt-2 border-t border-[#F3ECE4] flex items-center gap-2 flex-wrap text-xs">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jadwal Aktif:</span>
                          {studentSchedulesList.length > 0 ? (
                            studentSchedulesList.map((sch) => (
                              <span
                                key={sch.id}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                                  sch.studentId === stud.id
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-white text-gray-600 border-gray-200'
                                }`}
                              >
                                🗓️ {sch.day} {sch.timeSlot} • {sch.teacherName}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">Belum ada jadwal terpasang</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-gray-400 italic bg-gray-50 rounded-2xl border border-dashed border-[#E4D8E6]">
                    Belum ada murid terdaftar. Gunakan form di samping untuk meregistrasikan murid pertama!
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB GURU: KELOLA AKUN GURU */}
      {activeSubTab === 'guru' && (
        <div className="space-y-8 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form Create Teacher */}
            <div className="bg-white rounded-3xl border border-[#E4D8E6] p-6 shadow-premium self-start">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-brand-dark">Buat Akun Guru Baru</h3>
                  <p className="text-xs text-gray-400">Siapkan akses login pengajar</p>
                </div>
              </div>

              <form onSubmit={handleCreateTeacher} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="teacher-name-input" className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap Guru</label>
                  <input
                    id="teacher-name-input"
                    type="text"
                    required
                    placeholder="Contoh: Guru Anisa Rahma"
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="teacher-email-input" className="text-xs font-bold text-gray-500 uppercase">Email Login Guru</label>
                  <input
                    id="teacher-email-input"
                    type="email"
                    required
                    placeholder="anisa.guru@cahayaqu.com"
                    value={tEmail}
                    onChange={(e) => setTEmail(e.target.value)}
                    className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="teacher-pass-input" className="text-xs font-bold text-gray-500 uppercase">Password Login</label>
                  <input
                    id="teacher-pass-input"
                    type="text"
                    required
                    placeholder="guru123"
                    value={tPassword}
                    onChange={(e) => setTPassword(e.target.value)}
                    className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="teacher-phone-input" className="text-xs font-bold text-gray-500 uppercase">No. WhatsApp / HP (Opsional)</label>
                  <input
                    id="teacher-phone-input"
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={tPhone}
                    onChange={(e) => setTPhone(e.target.value)}
                    className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-500 uppercase">Mata Pelajaran Diampu</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (tSubjects.length === ALL_BIMBEL_SUBJECTS.length) {
                          setTSubjects(['Membaca']);
                        } else {
                          setTSubjects([...ALL_BIMBEL_SUBJECTS]);
                        }
                      }}
                      className="text-[11px] text-brand-primary hover:underline font-bold cursor-pointer"
                    >
                      {tSubjects.length === ALL_BIMBEL_SUBJECTS.length ? 'Pilih 1 Saja' : 'Pilih Semua'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {ALL_BIMBEL_SUBJECTS.map((subj) => {
                      const isSelected = tSubjects.includes(subj);
                      return (
                        <button
                          key={subj}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (tSubjects.length > 1) {
                                setTSubjects(tSubjects.filter(s => s !== subj));
                              }
                            } else {
                              setTSubjects([...tSubjects, subj]);
                            }
                          }}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-sm'
                              : 'bg-brand-light border-[#E4D8E6] text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          )}
                          <span>{subj}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Pilih 1 atau lebih mata pelajaran yang dapat diajarkan guru ini.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl text-sm transition-all shadow cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-brand-accent" />
                  Buat & Terbitkan Akun Guru
                </button>
              </form>
            </div>

            {/* List Created Teachers */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E4D8E6] p-6 shadow-premium">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-brand-dark">Daftar Akun Guru Terdaftar</h3>
                  <p className="text-xs text-gray-400">Guru dapat menggunakan email & password di bawah untuk masuk</p>
                </div>
                <span className="text-xs font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                  {users.filter(u => u.role === 'teacher').length} Guru Aktif
                </span>
              </div>

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {users.filter(u => u.role === 'teacher').length > 0 ? (
                  users.filter(u => u.role === 'teacher').map((teacher) => {
                    const teacherSubjs = getTeacherSubjectsList(teacher);
                    return (
                      <div key={teacher.id} className="p-3.5 sm:p-4 rounded-2xl bg-brand-light border border-[#EFEAE2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-brand-primary/30 transition-all">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 font-extrabold text-base shrink-0">
                            {teacher.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <h4 className="font-extrabold text-brand-dark text-sm truncate">{teacher.name}</h4>
                              <div className="flex flex-wrap gap-1">
                                {teacherSubjs.map((subj) => (
                                  <span key={subj} className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200/60">
                                    {subj}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <p className="text-[11px] sm:text-xs text-gray-500 mt-1 font-mono break-all">
                              Email: <strong className="text-brand-dark">{teacher.email}</strong> | Pass: <strong className="text-brand-primary">{teacher.password || '******'}</strong>
                              {teacher.phone && <span className="ml-2 font-sans text-gray-400">| WA: <strong className="text-brand-dark">{teacher.phone}</strong></span>}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#ECE5DB]">
                          <button
                            type="button"
                            onClick={() => handleOpenEditTeacher(teacher)}
                            className="px-3 py-1.5 bg-white hover:bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
                            title="Edit Data & Mata Pelajaran Guru"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            Edit
                          </button>
                          {onDeleteUser && (
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteUser(teacher.id);
                                triggerToast(`Akun Guru ${teacher.name} telah dihapus.`);
                              }}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              title="Hapus Akun Guru"
                            >
                              Hapus Akun
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-gray-400 italic bg-gray-50 rounded-2xl border border-dashed border-[#E4D8E6]">
                    Belum ada akun guru yang dibuat. Gunakan formulir di sebelah kiri untuk membuat akun pengajar pertama!
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUBTAB 6: ABSENSI & PRESENSI (GURU & MURID) */}
      {activeSubTab === 'absensi-guru' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Primary Tab Switcher: Tab 1: Presensi Guru, Tab 2: Presensi Murid */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E4D8E6] shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-100 text-brand-primary">
                  <UserCheck className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-extrabold text-brand-dark">Presensi & Kehadiran Bimbel</h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Pusat monitoring absensi harian dan rekapitulasi kehadiran Guru Pengajar & Murid Bimbel.
              </p>
            </div>

            {/* Main Toggle Tabs: Tab 1: Presensi Guru | Tab 2: Presensi Murid */}
            <div className="flex items-center gap-1.5 bg-brand-light p-1.5 rounded-2xl border border-[#E4D8E6] self-start md:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setAttMainTab('guru')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  attMainTab === 'guru'
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-brand-dark hover:bg-white/60'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Presensi Guru ({users.filter(u => u.role === 'teacher').length})
              </button>

              <button
                type="button"
                onClick={() => setAttMainTab('murid')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  attMainTab === 'murid'
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-brand-dark hover:bg-white/60'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Presensi Murid ({students.length})
              </button>
            </div>
          </div>

          {/* TAB 1: PRESENSI GURU */}
          {attMainTab === 'guru' && (
            <div className="space-y-6 animate-fade-in">
              {/* Teacher View Mode Switcher Header */}
              <div className="bg-white p-5 rounded-3xl border border-[#E4D8E6] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                      <UserCheck className="w-5 h-5" />
                    </span>
                    <h4 className="text-base font-extrabold text-brand-dark">Kelola Presensi Guru</h4>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Catat presensi harian, jam masuk/pulang tentor, dan tinjau rekapitulasi kehadiran.
                  </p>
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-2 self-start md:self-auto bg-brand-light p-1 rounded-2xl border border-[#E4D8E6]">
                  <button
                    type="button"
                    onClick={() => setTeacherAttViewMode('input')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      teacherAttViewMode === 'input'
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'text-gray-600 hover:text-brand-dark'
                    }`}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Presensi Harian
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeacherAttViewMode('riwayat')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      teacherAttViewMode === 'riwayat'
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'text-gray-600 hover:text-brand-dark'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    Riwayat & Rekap ({teacherAttendance.length})
                  </button>
                </div>
              </div>

              {/* Date Selector & Metrics Section (For Presensi Harian) */}
              {teacherAttViewMode === 'input' && (
            <>
              {/* Date Control Toolbar */}
              <div className="bg-gradient-to-r from-[#FFFBF7] to-[#FDF8F3] p-4 sm:p-5 rounded-3xl border border-[#ECE2D8] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Tanggal Presensi:</span>
                  <div className="flex items-center gap-1 bg-white border border-[#E4D8E6] rounded-2xl p-1 shadow-xs">
                    <button
                      type="button"
                      onClick={() => handleDateStep(-1)}
                      className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-all cursor-pointer"
                      title="Hari Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <input
                      type="date"
                      value={teacherAttDate}
                      onChange={(e) => setTeacherAttDate(e.target.value)}
                      className="text-xs font-bold text-brand-dark px-2 py-1 bg-transparent border-none focus:outline-none cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => handleDateStep(1)}
                      className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-all cursor-pointer"
                      title="Hari Berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTeacherAttDate(todayStr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      teacherAttDate === todayStr
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-white text-gray-600 border border-[#E4D8E6] hover:bg-gray-50'
                    }`}
                  >
                    Hari Ini
                  </button>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleMarkAllTeachersPresent}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    Tandai Semua Hadir
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDailyTeacherAttendance}
                    disabled={isSavingTeacherAtt}
                    className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5 text-brand-accent" />
                    {isSavingTeacherAtt ? 'Menyimpan...' : 'Simpan Presensi'}
                  </button>
                </div>
              </div>

              {/* Status Metric Pills */}
              {(() => {
                const teacherUsers = users.filter(u => u.role === 'teacher');
                const total = teacherUsers.length;
                let hadir = 0;
                let izinSakit = 0;
                let terlambatAlpa = 0;

                teacherUsers.forEach(t => {
                  const status = teacherAttendanceDraft[t.id]?.status || 'Hadir';
                  if (status === 'Hadir') hadir++;
                  else if (status === 'Izin' || status === 'Sakit') izinSakit++;
                  else if (status === 'Terlambat' || status === 'Alpa') terlambatAlpa++;
                });

                const rate = total > 0 ? Math.round((hadir / total) * 100) : 0;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-[#E4D8E6] shadow-xs">
                      <p className="text-[11px] font-bold text-gray-400 uppercase">Total Guru</p>
                      <p className="text-xl font-extrabold text-brand-dark mt-1">{total} <span className="text-xs font-normal text-gray-500">Orang</span></p>
                    </div>
                    <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 shadow-xs">
                      <p className="text-[11px] font-bold text-emerald-700 uppercase">Hadir</p>
                      <p className="text-xl font-extrabold text-emerald-800 mt-1">{hadir} <span className="text-xs font-normal text-emerald-600">Guru</span></p>
                    </div>
                    <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200/80 shadow-xs">
                      <p className="text-[11px] font-bold text-blue-700 uppercase">Izin / Sakit</p>
                      <p className="text-xl font-extrabold text-blue-800 mt-1">{izinSakit} <span className="text-xs font-normal text-blue-600">Guru</span></p>
                    </div>
                    <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 shadow-xs">
                      <p className="text-[11px] font-bold text-amber-700 uppercase">Terlambat / Alpa</p>
                      <p className="text-xl font-extrabold text-amber-800 mt-1">{terlambatAlpa} <span className="text-xs font-normal text-amber-600">Guru ({rate}%)</span></p>
                    </div>
                  </div>
                );
              })()}

              {/* Teacher Presensi Cards List */}
              <div className="space-y-4">
                {users.filter(u => u.role === 'teacher').length === 0 ? (
                  <div className="py-14 text-center bg-white rounded-3xl border border-dashed border-[#E4D8E6] p-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto font-extrabold">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <h4 className="font-extrabold text-brand-dark text-base">Belum Ada Data Guru</h4>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      Silakan buat akun guru pengajar terlebih dahulu di tab <strong>Kelola Guru</strong> agar dapat mencatat absensi harian.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('guru')}
                      className="px-4 py-2 bg-brand-primary text-white font-bold rounded-xl text-xs transition-all shadow cursor-pointer"
                    >
                      Buka Kelola Guru
                    </button>
                  </div>
                ) : (
                  users.filter(u => u.role === 'teacher').map(teacher => {
                    const draft = teacherAttendanceDraft[teacher.id] || { status: 'Hadir', timeIn: '08:00', timeOut: '16:00', notes: '' };
                    const isRecorded = teacherAttendance.some(r => r.teacherId === teacher.id && r.date === teacherAttDate);

                    return (
                      <div
                        key={teacher.id}
                        className="bg-white rounded-3xl border border-[#E4D8E6] p-5 shadow-sm hover:border-brand-primary/40 transition-all space-y-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#F5EFF7]">
                          {/* Teacher Identity */}
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900 font-black text-lg flex items-center justify-center shrink-0 shadow-xs border border-amber-300">
                              {teacher.name[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-base font-extrabold text-brand-dark">{teacher.name}</h4>
                                <span className="text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                  {teacher.subject || 'Pengajar'}
                                </span>
                                {isRecorded && (
                                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Tersimpan
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{teacher.email}</p>
                            </div>
                          </div>

                          {/* Quick Status Buttons */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpa'] as const).map(statusOption => {
                              const isSelected = draft.status === statusOption;
                              let activeStyles = 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200';
                              
                              if (isSelected) {
                                if (statusOption === 'Hadir') activeStyles = 'bg-emerald-600 text-white border-emerald-600 shadow-sm';
                                else if (statusOption === 'Terlambat') activeStyles = 'bg-amber-600 text-white border-amber-600 shadow-sm';
                                else if (statusOption === 'Izin') activeStyles = 'bg-blue-600 text-white border-blue-600 shadow-sm';
                                else if (statusOption === 'Sakit') activeStyles = 'bg-purple-600 text-white border-purple-600 shadow-sm';
                                else if (statusOption === 'Alpa') activeStyles = 'bg-rose-600 text-white border-rose-600 shadow-sm';
                              }

                              return (
                                <button
                                  key={statusOption}
                                  type="button"
                                  onClick={() => {
                                    setTeacherAttendanceDraft(prev => ({
                                      ...prev,
                                      [teacher.id]: {
                                        ...draft,
                                        status: statusOption,
                                      }
                                    }));
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${activeStyles}`}
                                >
                                  {statusOption}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Timing & Notes Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                              Jam Masuk (WIB)
                            </label>
                            <input
                              type="time"
                              value={draft.timeIn}
                              disabled={draft.status === 'Alpa' || draft.status === 'Sakit' || draft.status === 'Izin'}
                              onChange={(e) => {
                                setTeacherAttendanceDraft(prev => ({
                                  ...prev,
                                  [teacher.id]: { ...draft, timeIn: e.target.value }
                                }));
                              }}
                              className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-xs font-bold text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50 disabled:bg-gray-100"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                              Jam Pulang (WIB)
                            </label>
                            <input
                              type="time"
                              value={draft.timeOut}
                              disabled={draft.status === 'Alpa' || draft.status === 'Sakit' || draft.status === 'Izin'}
                              onChange={(e) => {
                                setTeacherAttendanceDraft(prev => ({
                                  ...prev,
                                  [teacher.id]: { ...draft, timeOut: e.target.value }
                                }));
                              }}
                              className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-xs font-bold text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50 disabled:bg-gray-100"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                              Keterangan / Aktivitas Mengajar
                            </label>
                            <input
                              type="text"
                              placeholder={
                                draft.status === 'Hadir' ? 'Mengajar modul reguler...' :
                                draft.status === 'Terlambat' ? 'Keterangan terlambat...' :
                                draft.status === 'Sakit' ? 'Keterangan surat dokter / istirahat...' :
                                draft.status === 'Izin' ? 'Alasan keperluan izin...' : 'Tidak hadir tanpa keterangan'
                              }
                              value={draft.notes}
                              onChange={(e) => {
                                setTeacherAttendanceDraft(prev => ({
                                  ...prev,
                                  [teacher.id]: { ...draft, notes: e.target.value }
                                }));
                              }}
                              className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-xs text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Sticky Action Bar */}
              {users.filter(u => u.role === 'teacher').length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-[#E4D8E6] shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Info className="w-4 h-4 text-brand-primary shrink-0" />
                    <span>Pastikan perubahan presensi telah ditinjau sebelum disimpan.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveDailyTeacherAttendance}
                    disabled={isSavingTeacherAtt}
                    className="w-full sm:w-auto px-6 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-extrabold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 text-brand-accent" />
                    {isSavingTeacherAtt ? 'Menyimpan...' : 'Simpan Seluruh Presensi Guru'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* View Mode: Riwayat & Rekap Lengkap */}
          {teacherAttViewMode === 'riwayat' && (
            <div className="space-y-4">
              {/* Search & Filter Toolbar */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E4D8E6] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama guru, catatan, atau mata pelajaran..."
                      value={teacherAttSearch}
                      onChange={(e) => setTeacherAttSearch(e.target.value)}
                      className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl pl-9 pr-4 py-2 text-xs text-brand-dark focus:outline-none"
                    />
                  </div>

                  {/* Teacher Filter */}
                  <select
                    value={teacherAttTeacherFilter}
                    onChange={(e) => setTeacherAttTeacherFilter(e.target.value)}
                    className="bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-xs font-bold text-brand-dark focus:outline-none"
                  >
                    <option value="all">Semua Guru</option>
                    {users.filter(u => u.role === 'teacher').map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={teacherAttStatusFilter}
                    onChange={(e) => setTeacherAttStatusFilter(e.target.value)}
                    className="bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-xs font-bold text-brand-dark focus:outline-none"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Hadir">Hadir</option>
                    <option value="Terlambat">Terlambat</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Alpa">Alpa</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
                    title="Cetak Rekap Presensi"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Cetak Rekap
                  </button>
                </div>
              </div>

              {/* Table of Records */}
              <div className="bg-white rounded-3xl border border-[#E4D8E6] shadow-premium overflow-hidden">
                {filteredTeacherLogs.length === 0 ? (
                  <div className="py-14 text-center text-gray-400 italic bg-brand-light/30">
                    Tidak ditemukan data presensi guru yang sesuai filter pencarian.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF5FC] border-b border-[#E4D8E6] text-gray-500 uppercase font-bold text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Tanggal</th>
                          <th className="py-3 px-4">Nama Guru</th>
                          <th className="py-3 px-4">Mapel</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Jam Kerja</th>
                          <th className="py-3 px-4">Foto & Lokasi GPS</th>
                          <th className="py-3 px-4">Catatan</th>
                          <th className="py-3 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3EDF5]">
                        {filteredTeacherLogs.map(log => {
                          let badgeStyle = 'bg-gray-100 text-gray-700 border-gray-200';
                          if (log.status === 'Hadir') badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                          else if (log.status === 'Terlambat') badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300';
                          else if (log.status === 'Izin') badgeStyle = 'bg-blue-50 text-blue-800 border-blue-300';
                          else if (log.status === 'Sakit') badgeStyle = 'bg-purple-50 text-purple-800 border-purple-300';
                          else if (log.status === 'Alpa') badgeStyle = 'bg-rose-50 text-rose-800 border-rose-300';

                          return (
                            <tr key={log.id} className="hover:bg-brand-light/40 transition-colors">
                              <td className="py-3 px-4 font-bold text-brand-dark whitespace-nowrap">
                                {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="py-3 px-4 font-extrabold text-brand-dark whitespace-nowrap">
                                {log.teacherName}
                              </td>
                              <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                                <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                                  {log.subject || 'Pengajar'}
                                </span>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] border ${badgeStyle}`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap">
                                {log.timeIn ? `${log.timeIn} - ${log.timeOut || '16:00'}` : '-'}
                              </td>
                              
                              {/* Foto & Geofence GPS Column */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                {log.photoBase64 ? (
                                  <div className="flex items-center gap-2">
                                    <div 
                                      onClick={() => setViewingTeacherAttendancePhoto(log)}
                                      className="w-9 h-9 rounded-lg overflow-hidden border border-[#E4D8E6] shrink-0 cursor-pointer relative group hover:ring-2 hover:ring-brand-primary transition-all"
                                      title="Klik untuk periksa foto & koordinat GPS"
                                    >
                                      <img src={log.photoBase64} alt="Selfie" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Eye className="w-3.5 h-3.5" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col">
                                      {log.isWithinRadius !== undefined ? (
                                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                                          log.isWithinRadius ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                        }`}>
                                          {log.isWithinRadius ? '✓ Radius Valid' : `⚠ ${log.distanceMeters || 0}m (Luar)`}
                                        </span>
                                      ) : (
                                        <span className="text-[9px] text-gray-400">Live Foto</span>
                                      )}
                                      {log.locationAddress && (
                                        <span className="text-[9px] text-gray-400 max-w-[120px] truncate" title={log.locationAddress}>
                                          {log.locationAddress}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">Tanpa Foto</span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                                {log.notes || '-'}
                              </td>
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  {log.photoBase64 && (
                                    <button
                                      type="button"
                                      onClick={() => setViewingTeacherAttendancePhoto(log)}
                                      className="p-1.5 hover:bg-brand-light text-brand-primary rounded-lg transition-all cursor-pointer"
                                      title="Lihat Foto & GPS"
                                    >
                                      <Camera className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditTeacherLog(log)}
                                    className="p-1.5 hover:bg-amber-50 text-amber-700 rounded-lg transition-all cursor-pointer"
                                    title="Edit Presensi"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {onDeleteTeacherAttendance && (
                                    <button
                                      type="button"
                                      onClick={() => setDeletingTeacherLog(log)}
                                      className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-all cursor-pointer"
                                      title="Hapus Rekap"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

          {/* TAB 2: PRESENSI MURID */}
          {attMainTab === 'murid' && (
            <div className="space-y-6 animate-fade-in">
              {/* Student View Mode Switcher Header */}
              <div className="bg-white p-5 rounded-3xl border border-[#E4D8E6] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-purple-100 text-brand-primary">
                      <GraduationCap className="w-5 h-5" />
                    </span>
                    <h4 className="text-base font-extrabold text-brand-dark">Kelola Presensi Murid</h4>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Input kehadiran harian siswa, pantau jam belajar, dan periksa rekapitulasi kehadiran per kelas.
                  </p>
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-2 self-start md:self-auto bg-brand-light p-1 rounded-2xl border border-[#E4D8E6]">
                  <button
                    type="button"
                    onClick={() => setStudentAttViewMode('input')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      studentAttViewMode === 'input'
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'text-gray-600 hover:text-brand-dark'
                    }`}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Presensi Harian
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentAttViewMode('riwayat')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      studentAttViewMode === 'riwayat'
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'text-gray-600 hover:text-brand-dark'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    Riwayat & Rekap ({attendance.length})
                  </button>
                </div>
              </div>

              {/* VIEW 1: PRESENSI HARIAN MURID */}
              {studentAttViewMode === 'input' && (
                <>
                  {/* Date Selector, Class Filter & Search Bar */}
                  <div className="bg-gradient-to-r from-[#FAF6FF] to-[#FFF9F2] p-4 sm:p-5 rounded-3xl border border-[#ECE2D8] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Tanggal:</span>
                      <div className="flex items-center gap-1 bg-white border border-[#E4D8E6] rounded-2xl p-1 shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleStudentDateStep(-1)}
                          className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-all cursor-pointer"
                          title="Hari Sebelumnya"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <input
                          type="date"
                          value={studentAttDate}
                          onChange={(e) => setStudentAttDate(e.target.value)}
                          className="text-xs font-bold text-brand-dark px-2 py-1 bg-transparent border-none focus:outline-none cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => handleStudentDateStep(1)}
                          className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-all cursor-pointer"
                          title="Hari Berikutnya"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStudentAttDate(todayStr)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          studentAttDate === todayStr
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-white text-gray-600 border border-[#E4D8E6] hover:bg-gray-50'
                        }`}
                      >
                        Hari Ini
                      </button>

                      {/* Filter Kelas */}
                      <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
                        <span className="text-xs font-bold text-gray-500">Kelas:</span>
                        <select
                          value={studentAttClassFilter}
                          onChange={(e) => setStudentAttClassFilter(e.target.value)}
                          className="bg-white border border-[#E4D8E6] text-brand-dark text-xs font-bold rounded-xl px-3 py-1.5 shadow-xs focus:outline-none cursor-pointer"
                        >
                          <option value="all">Semua Kelas / Mapel</option>
                          <option value="Membaca">Membaca</option>
                          <option value="Berhitung">Berhitung</option>
                          <option value="Mengaji">Mengaji</option>
                          {Array.from(new Set(students.map(s => s.className)))
                            .filter(c => !['Membaca', 'Berhitung', 'Mengaji'].includes(c))
                            .map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Search bar & Bulk Actions */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari nama siswa / ortu..."
                          value={studentAttSearch}
                          onChange={(e) => setStudentAttSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E4D8E6] rounded-xl text-xs font-medium text-brand-dark placeholder-gray-400 focus:outline-none shadow-xs"
                        />
                        {studentAttSearch && (
                          <button
                            type="button"
                            onClick={() => setStudentAttSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleMarkAllStudentsPresent}
                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                        Tandai Semua Hadir
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveDailyStudentAttendance}
                        disabled={isSavingStudentAtt}
                        className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5 text-brand-accent" />
                        {isSavingStudentAtt ? 'Menyimpan...' : 'Simpan Presensi'}
                      </button>
                    </div>
                  </div>

                  {/* Status Metric Cards for Student Attendance */}
                  {(() => {
                    const filteredStudents = students.filter(s => {
                      if (studentAttClassFilter !== 'all' && s.className !== studentAttClassFilter) return false;
                      if (studentAttSearch.trim()) {
                        const q = studentAttSearch.toLowerCase().trim();
                        const matchName = s.name.toLowerCase().includes(q);
                        const matchParent = s.parentName.toLowerCase().includes(q);
                        const matchTeacher = (s.teacherName || '').toLowerCase().includes(q);
                        if (!matchName && !matchParent && !matchTeacher) return false;
                      }
                      return true;
                    });

                    const total = filteredStudents.length;
                    let hadir = 0;
                    let terlambat = 0;
                    let izinSakit = 0;
                    let alpa = 0;

                    filteredStudents.forEach(s => {
                      const st = studentAttendanceDraft[s.id]?.status || 'Hadir';
                      if (st === 'Hadir') hadir++;
                      else if (st === 'Terlambat') terlambat++;
                      else if (st === 'Izin' || st === 'Sakit') izinSakit++;
                      else if (st === 'Alpa') alpa++;
                    });

                    const rate = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 0;

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white p-4 rounded-2xl border border-[#E4D8E6] shadow-xs">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-gray-400 uppercase">Total Siswa</p>
                            <Users className="w-4 h-4 text-purple-600" />
                          </div>
                          <p className="text-2xl font-extrabold text-brand-dark mt-1">
                            {total} <span className="text-xs font-normal text-gray-500">Anak</span>
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Terfilter pada sesi ini</p>
                        </div>

                        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 shadow-xs">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-emerald-700 uppercase">Hadir</p>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <p className="text-2xl font-extrabold text-emerald-800 mt-1">
                            {hadir} <span className="text-xs font-normal text-emerald-600">Siswa ({rate}%)</span>
                          </p>
                          {terlambat > 0 && (
                            <p className="text-[10px] text-amber-700 font-semibold mt-0.5">+{terlambat} Terlambat</p>
                          )}
                        </div>

                        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200/80 shadow-xs">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-blue-700 uppercase">Izin / Sakit</p>
                            <Info className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="text-2xl font-extrabold text-blue-800 mt-1">
                            {izinSakit} <span className="text-xs font-normal text-blue-600">Siswa</span>
                          </p>
                          <p className="text-[10px] text-blue-600 mt-0.5">Dengan keterangan</p>
                        </div>

                        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80 shadow-xs">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-rose-700 uppercase">Tanpa Keterangan (Alpa)</p>
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                          </div>
                          <p className="text-2xl font-extrabold text-rose-800 mt-1">
                            {alpa} <span className="text-xs font-normal text-rose-600">Siswa</span>
                          </p>
                          <p className="text-[10px] text-rose-600 mt-0.5">Belum ada kabar</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Student Attendance List */}
                  <div className="space-y-3">
                    {(() => {
                      const filteredStudents = students.filter(s => {
                        if (studentAttClassFilter !== 'all' && s.className !== studentAttClassFilter) return false;
                        if (studentAttSearch.trim()) {
                          const q = studentAttSearch.toLowerCase().trim();
                          const matchName = s.name.toLowerCase().includes(q);
                          const matchParent = s.parentName.toLowerCase().includes(q);
                          const matchTeacher = (s.teacherName || '').toLowerCase().includes(q);
                          if (!matchName && !matchParent && !matchTeacher) return false;
                        }
                        return true;
                      });

                      if (filteredStudents.length === 0) {
                        return (
                          <div className="bg-white p-12 text-center rounded-3xl border border-[#E4D8E6] text-gray-400 space-y-3">
                            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto" />
                            <p className="text-sm font-bold text-gray-500">Tidak ada data siswa yang cocok dengan filter.</p>
                            <p className="text-xs text-gray-400">Silakan ubah filter kelas atau kata kunci pencarian nama siswa.</p>
                          </div>
                        );
                      }

                      return filteredStudents.map((student) => {
                        const draft = studentAttendanceDraft[student.id] || { status: 'Hadir', timeIn: '14:00', timeOut: '15:30', notes: '' };
                        const isSavedRecord = attendance.some(a => a.studentId === student.id && a.date === studentAttDate);

                        return (
                          <div
                            key={student.id}
                            className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all shadow-xs ${
                              draft.status === 'Hadir'
                                ? 'border-emerald-200/80 hover:border-emerald-300'
                                : draft.status === 'Terlambat'
                                ? 'border-amber-200/80 hover:border-amber-300'
                                : draft.status === 'Izin' || draft.status === 'Sakit'
                                ? 'border-blue-200/80 hover:border-blue-300'
                                : 'border-rose-200/80 hover:border-rose-300'
                            }`}
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              {/* Student Info */}
                              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-base shrink-0 shadow-xs ${
                                  draft.status === 'Hadir'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : draft.status === 'Terlambat'
                                    ? 'bg-amber-100 text-amber-800'
                                    : draft.status === 'Izin' || draft.status === 'Sakit'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {student.name[0]}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-brand-dark text-sm sm:text-base">{student.name}</h4>
                                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                      {student.className}
                                    </span>
                                    {student.teacherName && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-light text-gray-600 border border-[#E4D8E6]">
                                        Tentor: {student.teacherName}
                                      </span>
                                    )}
                                    {isSavedRecord && (
                                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Tersimpan
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                                    <span>Wali: <strong className="text-gray-700">{student.parentName}</strong></span>
                                    <span>•</span>
                                    <span>No. WA: <strong className="text-gray-700 font-mono">{student.parentPhone}</strong></span>
                                    <span>•</span>
                                    <span>Usia: <strong className="text-gray-700">{student.age} Tahun</strong></span>
                                  </p>
                                </div>
                              </div>

                              {/* Status Toggle Buttons */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {(['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpa'] as const).map((statusOption) => {
                                  const isSelected = draft.status === statusOption;
                                  let activeStyles = 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200';
                                  if (isSelected) {
                                    if (statusOption === 'Hadir') activeStyles = 'bg-emerald-600 text-white font-extrabold shadow-sm border-emerald-600';
                                    else if (statusOption === 'Terlambat') activeStyles = 'bg-amber-500 text-white font-extrabold shadow-sm border-amber-500';
                                    else if (statusOption === 'Izin') activeStyles = 'bg-blue-600 text-white font-extrabold shadow-sm border-blue-600';
                                    else if (statusOption === 'Sakit') activeStyles = 'bg-indigo-600 text-white font-extrabold shadow-sm border-indigo-600';
                                    else if (statusOption === 'Alpa') activeStyles = 'bg-rose-600 text-white font-extrabold shadow-sm border-rose-600';
                                  }
                                  return (
                                    <button
                                      key={statusOption}
                                      type="button"
                                      onClick={() => {
                                        setStudentAttendanceDraft(prev => ({
                                          ...prev,
                                          [student.id]: {
                                            ...draft,
                                            status: statusOption,
                                          }
                                        }));
                                      }}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer min-h-[36px] ${activeStyles}`}
                                    >
                                      {statusOption}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Input Time & Learning Notes */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-3.5 pt-3.5 border-t border-[#F3EDF5]">
                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Jam Masuk</label>
                                <input
                                  type="time"
                                  value={draft.timeIn}
                                  disabled={draft.status === 'Alpa' || draft.status === 'Sakit' || draft.status === 'Izin'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setStudentAttendanceDraft(prev => ({
                                      ...prev,
                                      [student.id]: { ...draft, timeIn: val }
                                    }));
                                  }}
                                  className="w-full text-xs bg-brand-light border border-[#E4D8E6] rounded-xl px-2.5 py-1.5 text-brand-dark font-bold focus:outline-none disabled:opacity-40"
                                />
                              </div>

                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Jam Pulang</label>
                                <input
                                  type="time"
                                  value={draft.timeOut}
                                  disabled={draft.status === 'Alpa' || draft.status === 'Sakit' || draft.status === 'Izin'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setStudentAttendanceDraft(prev => ({
                                      ...prev,
                                      [student.id]: { ...draft, timeOut: val }
                                    }));
                                  }}
                                  className="w-full text-xs bg-brand-light border border-[#E4D8E6] rounded-xl px-2.5 py-1.5 text-brand-dark font-bold focus:outline-none disabled:opacity-40"
                                />
                              </div>

                              <div className="sm:col-span-8 space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Keterangan / Materi Belajar Hari Ini</label>
                                <input
                                  type="text"
                                  placeholder="Contoh: Modul Membaca Hal. 12, Hafalan Surat Pendek, atau Alasan Izin..."
                                  value={draft.notes}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setStudentAttendanceDraft(prev => ({
                                      ...prev,
                                      [student.id]: { ...draft, notes: val }
                                    }));
                                  }}
                                  className="w-full text-xs bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-1.5 text-brand-dark placeholder-gray-400 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Sticky Bottom Save Bar */}
                  <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-[#E4D8E6] shadow-xl flex items-center justify-between gap-4">
                    <div className="text-xs text-gray-600 hidden sm:block">
                      <span className="font-bold text-brand-dark">{students.length} Siswa Terdaftar</span> • Pastikan klik simpan untuk memperbarui database riwayat.
                    </div>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={handleMarkAllStudentsPresent}
                        className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                        Tandai Semua Hadir
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveDailyStudentAttendance}
                        disabled={isSavingStudentAtt}
                        className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 text-brand-accent" />
                        {isSavingStudentAtt ? 'Menyimpan Database...' : 'Simpan Presensi Murid'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* VIEW 2: RIWAYAT & REKAP PRESENSI MURID */}
              {studentAttViewMode === 'riwayat' && (
                <div className="space-y-4">
                  {/* Search & Filter Toolbar */}
                  <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E4D8E6] shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex flex-1 items-center gap-2.5 flex-wrap">
                      <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari siswa / catatan..."
                          value={studentAttSearch}
                          onChange={(e) => setStudentAttSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-brand-light border border-[#E4D8E6] rounded-xl text-xs font-medium text-brand-dark placeholder-gray-400 focus:outline-none"
                        />
                      </div>

                      {/* Class Filter */}
                      <select
                        value={studentAttClassFilter}
                        onChange={(e) => setStudentAttClassFilter(e.target.value)}
                        className="bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-xs font-bold text-brand-dark focus:outline-none"
                      >
                        <option value="all">Semua Kelas</option>
                        <option value="Membaca">Membaca</option>
                        <option value="Berhitung">Berhitung</option>
                        <option value="Mengaji">Mengaji</option>
                        {Array.from(new Set(students.map(s => s.className)))
                          .filter(c => !['Membaca', 'Berhitung', 'Mengaji'].includes(c))
                          .map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                      </select>

                      {/* Status Filter */}
                      <select
                        value={studentAttStatusFilter}
                        onChange={(e) => setStudentAttStatusFilter(e.target.value)}
                        className="bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-xs font-bold text-brand-dark focus:outline-none"
                      >
                        <option value="Semua">Semua Status</option>
                        <option value="Hadir">Hadir</option>
                        <option value="Terlambat">Terlambat</option>
                        <option value="Izin">Izin</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Alpa">Alpa</option>
                      </select>

                      {/* Month Filter */}
                      <select
                        value={studentAttMonthFilter}
                        onChange={(e) => setStudentAttMonthFilter(e.target.value)}
                        className="bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-xs font-bold text-brand-dark focus:outline-none"
                      >
                        <option value="all">Semua Periode Bulan</option>
                        {Array.from(new Set(attendance.map(a => a.date.substring(0, 7)))).sort().reverse().map(ym => (
                          <option key={ym} value={ym}>
                            {new Date(ym + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-3.5 py-2 bg-brand-light hover:bg-gray-100 text-brand-dark border border-[#E4D8E6] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-gray-600" />
                        Cetak Rekap
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric for Filtered Records */}
                  {(() => {
                    const total = filteredStudentLogs.length;
                    const hadir = filteredStudentLogs.filter(l => l.status === 'Hadir').length;
                    const terlambat = filteredStudentLogs.filter(l => l.status === 'Terlambat').length;
                    const izinSakit = filteredStudentLogs.filter(l => l.status === 'Izin' || l.status === 'Sakit').length;
                    const alpa = filteredStudentLogs.filter(l => l.status === 'Alpa').length;
                    const rate = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 0;

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white p-3.5 rounded-2xl border border-[#E4D8E6] shadow-2xs">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Total Rekap Sesi</p>
                          <p className="text-lg font-extrabold text-brand-dark mt-0.5">{total} <span className="text-xs font-normal text-gray-500">Catatan</span></p>
                        </div>
                        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80 shadow-2xs">
                          <p className="text-[10px] font-bold text-emerald-700 uppercase">Total Hadir</p>
                          <p className="text-lg font-extrabold text-emerald-800 mt-0.5">{hadir + terlambat} <span className="text-xs font-normal text-emerald-600">({rate}%)</span></p>
                        </div>
                        <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200/80 shadow-2xs">
                          <p className="text-[10px] font-bold text-blue-700 uppercase">Izin / Sakit</p>
                          <p className="text-lg font-extrabold text-blue-800 mt-0.5">{izinSakit} <span className="text-xs font-normal text-blue-600">Sesi</span></p>
                        </div>
                        <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200/80 shadow-2xs">
                          <p className="text-[10px] font-bold text-rose-700 uppercase">Alpa</p>
                          <p className="text-lg font-extrabold text-rose-800 mt-0.5">{alpa} <span className="text-xs font-normal text-rose-600">Sesi</span></p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Attendance Log Table */}
                  <div className="bg-white rounded-3xl border border-[#E4D8E6] shadow-premium overflow-hidden">
                    {filteredStudentLogs.length === 0 ? (
                      <div className="p-12 text-center text-gray-400 space-y-2">
                        <History className="w-10 h-10 mx-auto text-gray-300" />
                        <p className="font-bold text-sm text-gray-600">Tidak ada riwayat presensi murid yang cocok.</p>
                        <p className="text-xs text-gray-400">Gunakan tab Presensi Harian untuk mencatat kehadiran siswa terlebih dahulu.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#FAF6FF] text-gray-600 uppercase text-[10px] tracking-wider border-b border-[#E4D8E6]">
                            <tr>
                              <th className="py-3 px-4 font-bold">Tanggal</th>
                              <th className="py-3 px-4 font-bold">Nama Murid</th>
                              <th className="py-3 px-4 font-bold">Kelas & Tentor</th>
                              <th className="py-3 px-4 font-bold">Status</th>
                              <th className="py-3 px-4 font-bold">Jam Belajar</th>
                              <th className="py-3 px-4 font-bold">Catatan / Materi</th>
                              <th className="py-3 px-4 font-bold text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F3EDF5]">
                            {filteredStudentLogs.map((log) => {
                              const studentObj = students.find(s => s.id === log.studentId);
                              const studentName = log.studentName || (studentObj ? studentObj.name : 'Siswa');
                              const className = studentObj ? studentObj.className : 'Bimbel';
                              const teacherName = studentObj?.teacherName;

                              return (
                                <tr key={log.id} className="hover:bg-brand-light/50 transition-colors">
                                  <td className="py-3 px-4 font-bold text-brand-dark whitespace-nowrap">
                                    {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-extrabold text-brand-dark">{studentName}</div>
                                    {studentObj && (
                                      <div className="text-[10px] text-gray-400">Wali: {studentObj.parentName}</div>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                                      {className}
                                    </span>
                                    {teacherName && (
                                      <div className="text-[10px] text-gray-500 mt-0.5 font-medium">{teacherName}</div>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                                      log.status === 'Hadir'
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                        : log.status === 'Terlambat'
                                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                                        : log.status === 'Izin' || log.status === 'Sakit'
                                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                                        : 'bg-rose-100 text-rose-800 border-rose-200'
                                    }`}>
                                      {log.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-gray-600 font-mono whitespace-nowrap">
                                    {log.timeIn ? `${log.timeIn} - ${log.timeOut || '15:30'}` : '-'}
                                  </td>
                                  <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                                    {log.notes || '-'}
                                  </td>
                                  <td className="py-3 px-4 text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditStudentLog(log)}
                                        className="p-1.5 hover:bg-amber-50 text-amber-700 rounded-lg transition-all cursor-pointer"
                                        title="Edit Presensi Murid"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      {onDeleteAttendance && (
                                        <button
                                          type="button"
                                          onClick={() => setDeletingStudentLog(log)}
                                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-all cursor-pointer"
                                          title="Hapus Rekap Presensi"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 7: PENGATURAN & INFORMASI (IDENTITAS BIMBEL & PENGUMUMAN PORTAL) */}
      {(activeSubTab === 'pengaturan' || activeSubTab === 'pengumuman') && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Top Header & Tab Switcher */}
          <div className="bg-white p-6 rounded-3xl border border-[#E4D8E6] shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-extrabold text-xs">
                  Pusat Pengaturan & Informasi
                </span>
                <span className="text-xs text-gray-500 font-medium">Administrator</span>
              </div>
              <h3 className="text-xl font-extrabold text-brand-dark mt-2">
                Pengaturan & Informasi Bimbel
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                Kelola identitas resmi lembaga, kustomisasi logo, alamat & kontak resmi bimbel, serta siaran pengumuman ke seluruh portal.
              </p>
            </div>

            {/* Sub-tab Pills Switcher */}
            <div className="flex items-center gap-1.5 bg-brand-light p-1.5 rounded-2xl border border-[#E4D8E6] shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setPengaturanTab('identitas')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  pengaturanTab === 'identitas'
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'text-gray-600 hover:text-brand-primary hover:bg-white/60'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Identitas Bimbel</span>
              </button>

              <button
                type="button"
                onClick={() => setPengaturanTab('pengumuman')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  pengaturanTab === 'pengumuman'
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'text-gray-600 hover:text-brand-primary hover:bg-white/60'
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span>Pengumuman Portal</span>
                {broadcasts.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    pengaturanTab === 'pengumuman'
                      ? 'bg-white text-brand-primary'
                      : 'bg-brand-primary/15 text-brand-primary'
                  }`}>
                    {broadcasts.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* TAB 1: IDENTITAS BIMBEL */}
          {pengaturanTab === 'identitas' && (
            <div className="space-y-6 animate-fade-in">
              {/* Card 1: Kustomisasi & Ganti Logo Bimbel */}
              <div className="bg-white rounded-3xl border border-[#E4D8E6] p-6 sm:p-7 shadow-premium space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F3EDF5]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold shrink-0 shadow-2xs">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-brand-dark flex items-center gap-2">
                        Logo Resmi Bimbel
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                          currentCustomLogo ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-brand-primary'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {currentCustomLogo ? 'Logo Kustom Aktif' : 'Logo Bawaan'}
                        </span>
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">
                        Atur logo resmi yang ditampilkan di halaman Login, Header Portal, Kop Dokumen Rapor, dan Kartu SPP.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      ref={quickLogoFileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      onChange={handleQuickLogoUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => setIsLogoModalOpen(true)}
                      className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Camera className="w-4 h-4 text-amber-300" />
                      <span>Buka Studio Ganti Logo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => quickLogoFileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-brand-light hover:bg-brand-primary/10 text-brand-dark hover:text-brand-primary border border-[#E4D8E6] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Unggah Cepat</span>
                    </button>

                    {currentCustomLogo && (
                      <button
                        type="button"
                        onClick={handleResetLogoToDefault}
                        className="px-3.5 py-2.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Kembalikan ke logo default"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Logo</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Logo Live Showcase & Placement Previews */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div className="p-4 rounded-2xl bg-brand-light/70 border border-[#E4D8E6] flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-[#E4D8E6] p-2 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                      <Logo className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-brand-dark block">Logo Aktif</span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {currentCustomLogo ? 'Menggunakan gambar logo kustom unggahan admin.' : 'Menggunakan logo vektor emas & ungu resmi bawaan.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-brand-light/70 border border-[#E4D8E6] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E4D8E6] p-1.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                      <Logo className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-brand-dark block">Header & Navbar</span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Tampil di bilah atas aplikasi untuk wali murid, guru, dan admin.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-brand-light/70 border border-[#E4D8E6] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E4D8E6] p-1.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                      <Logo className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-brand-dark block">Kop Rapor & SPP</span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Tercetak otomatis pada berkas PDF resmi dan kartu pembayaran.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Form Identitas & Kontak Resmi Bimbel */}
              <div className="bg-white rounded-3xl border border-[#E4D8E6] p-6 sm:p-7 shadow-premium space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F3EDF5]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold shrink-0 shadow-2xs">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-brand-dark flex items-center gap-2">
                        Data Identitas & Kontak Resmi Bimbel
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">
                        Perbarui nama bimbel, alamat operasional, telepon, email, serta nama pimpinan.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetSchoolInfoToDefault}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
                    title="Kembalikan nama, alamat, dan kontak ke standar bawaan"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kembalikan Default</span>
                  </button>
                </div>

                <form onSubmit={handleSaveSchoolInfo} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nama Bimbel */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-brand-primary" />
                        <span>Nama Resmi Bimbel / Lembaga</span>
                      </label>
                      <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="Contoh: Bimbel Rumah CahayaQu"
                        required
                        className="w-full text-sm font-bold text-brand-dark bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
                      />
                    </div>

                    {/* Slogan / Tagline */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Slogan / Tagline Bimbel</span>
                      </label>
                      <input
                        type="text"
                        value={schoolTagline}
                        onChange={(e) => setSchoolTagline(e.target.value)}
                        placeholder="Contoh: Pusat Bimbingan Belajar Membaca, Berhitung, dan Mengaji Terpadu"
                        className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
                      />
                    </div>

                    {/* Alamat Lengkap */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                        <span>Alamat Lengkap & Wilayah Operasional</span>
                      </label>
                      <textarea
                        rows={2}
                        value={schoolAddress}
                        onChange={(e) => setSchoolAddress(e.target.value)}
                        placeholder="Contoh: RT 05 RW 02 Blok Ranca Gunda, Desa Jangga, Kec. Losarang, Kab. Indramayu, Jawa Barat 45253"
                        required
                        className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
                      />
                    </div>

                    {/* No. Telepon / WhatsApp */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Nomor Telepon / WhatsApp Resmi</span>
                      </label>
                      <input
                        type="text"
                        value={schoolPhone}
                        onChange={(e) => setSchoolPhone(e.target.value)}
                        placeholder="Contoh: +62 821-2345-6789"
                        required
                        className="w-full text-sm font-bold text-brand-dark bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
                      />
                    </div>

                    {/* Email Resmi */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span>Alamat Email Resmi Bimbel</span>
                      </label>
                      <input
                        type="email"
                        value={schoolEmail}
                        onChange={(e) => setSchoolEmail(e.target.value)}
                        placeholder="Contoh: cahayaqu.bimbel@gmail.com"
                        className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
                      />
                    </div>

                    {/* Kepala / Pimpinan Bimbel */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                        <span>Nama & Gelar Pimpinan / Kepala Bimbel (Tercetak di Dokumen Rapor)</span>
                      </label>
                      <input
                        type="text"
                        value={schoolHeadmaster}
                        onChange={(e) => setSchoolHeadmaster(e.target.value)}
                        placeholder="Contoh: Defika, S.Pd."
                        className="w-full text-sm font-bold text-brand-dark bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingSchoolInfo}
                      className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingSchoolInfo ? 'Menyimpan...' : 'Simpan Perubahan Identitas Bimbel'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Card 3: Pratinjau KOP Dokumen & Surat Resmi */}
              <div className="bg-white rounded-3xl border border-[#E4D8E6] p-6 sm:p-7 shadow-premium space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F3EDF5]">
                  <div>
                    <h4 className="font-extrabold text-sm text-brand-dark flex items-center gap-2">
                      <Eye className="w-4 h-4 text-brand-primary" />
                      Pratinjau KOP Dokumen & Surat Resmi
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Berikut tampilan kop resmi yang tercetak pada dokumen rapor, kwitansi SPP, dan lembar evaluasi.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-brand-primary font-bold text-xs border border-purple-200">
                    Live Preview A4
                  </span>
                </div>

                {/* Styled Document Header Preview Box */}
                <div className="p-6 bg-white rounded-2xl border-2 border-[#E4D8E6] shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-4 pb-3 border-b-2 border-brand-primary/40">
                    <div className="w-16 h-16 p-1 bg-white rounded-xl border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      <Logo className="w-full h-full object-contain" />
                    </div>

                    <div className="flex-1 text-center">
                      <h2 className="text-lg sm:text-xl font-extrabold text-brand-dark font-display uppercase tracking-wide">
                        {schoolName}
                      </h2>
                      <p className="text-xs text-brand-primary font-semibold mt-0.5">
                        {schoolTagline}
                      </p>
                      <p className="text-[11px] text-gray-600 mt-1 leading-snug">
                        {schoolAddress}
                      </p>
                      <p className="text-[11px] text-gray-500 font-medium">
                        Telp/WA: <strong>{schoolPhone}</strong> | Email: <strong>{schoolEmail}</strong>
                      </p>
                    </div>

                    <div className="w-16 hidden sm:block shrink-0" />
                  </div>

                  <div className="text-center py-2">
                    <span className="text-xs font-bold text-gray-400 italic">
                      [ Isi Berkas Rapor / Rekap Tagihan SPP / Laporan Evaluasi ]
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PENGUMUMAN PORTAL */}
          {pengaturanTab === 'pengumuman' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form Siaran Pengumuman Admin */}
                <div className="bg-white p-6 rounded-3xl border border-[#E4D8E6] shadow-premium space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F3EDF5]">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-brand-dark">Buat Pengumuman Baru</h3>
                      <p className="text-xs text-gray-400">Siarkan info resmi ke seluruh akun orang tua</p>
                    </div>
                  </div>

                  <form onSubmit={handleAdminBroadcastSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase">Judul Pengumuman</label>
                      <input
                        type="text"
                        placeholder="Contoh: Pengumuman Pembayaran SPP & Libur Semester"
                        value={bcTitle}
                        onChange={(e) => setBcTitle(e.target.value)}
                        className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase">Isi Pesan Pengumuman</label>
                      <textarea
                        rows={4}
                        placeholder="Tuliskan rincian pengumuman resmi dari Bimbel Rumah CahayaQu secara detail..."
                        value={bcContent}
                        onChange={(e) => setBcContent(e.target.value)}
                        className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="admin-bc-sender" className="text-xs font-bold text-gray-600 uppercase">
                        Pengirim Pengumuman
                      </label>
                      <input
                        id="admin-bc-sender"
                        type="text"
                        list="admin-bc-sender-presets"
                        placeholder="Contoh: Admin Bimbel, Admin Rina, Ustadzah Siti"
                        value={bcSender}
                        onChange={(e) => setBcSender(e.target.value)}
                        required
                        className="w-full text-sm font-bold text-brand-dark bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
                      />
                      <datalist id="admin-bc-sender-presets">
                        <option value="Admin Bimbel" />
                        <option value="Admin Rina" />
                        <option value="Pimpinan Rumah CahayaQu" />
                        <option value="Bagian Keuangan" />
                        <option value="Tata Usaha" />
                        <option value="Koordinator Qur'an" />
                        {users
                          .filter((u) => u.role === 'teacher')
                          .map((t) => (
                            <option key={t.id} value={t.name} />
                          ))}
                      </datalist>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl font-bold text-sm shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                      Siarkan Pengumuman Resmi
                    </button>
                  </form>
                </div>

                {/* Right Column: Daftar Riwayat Pengumuman */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E4D8E6] shadow-premium space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F3EDF5]">
                    <div>
                      <h3 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-primary" />
                        Daftar Riwayat Pengumuman ({broadcasts.length})
                      </h3>
                      <p className="text-xs text-gray-400">Daftar semua siaran aktif. Anda dapat mengubah teks/pengirim atau menghapus kapan saja.</p>
                    </div>
                  </div>

                  {broadcasts.length > 0 ? (
                    <div className="space-y-3.5">
                      {broadcasts.map((bc) => (
                        <div
                          key={bc.id}
                          className="p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-brand-light/50 border-[#E4D8E6] shadow-xs hover:border-brand-primary/40"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-sm text-brand-dark">
                                {bc.title}
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                              {bc.content}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 pt-1 border-t border-gray-100">
                              <span>Pengirim: <strong className="text-brand-dark font-extrabold">{bc.senderName}</strong></span>
                              <span>•</span>
                              <span>Tanggal Dibuat: {bc.date}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditBroadcast(bc)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-brand-primary hover:text-brand-primary hover:bg-brand-primary/10 border border-brand-primary/30 rounded-xl transition-all cursor-pointer shadow-2xs"
                              title="Ubah Pengumuman & Pengirim"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Ubah
                            </button>
                            <button
                              type="button"
                              onClick={() => setBcToDelete(bc)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                              title="Hapus Pengumuman"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center bg-gray-50 rounded-2xl border border-dashed border-[#E4D8E6]">
                      <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-500">Belum ada pengumuman yang disiarkan.</p>
                      <p className="text-[11px] text-gray-400 mt-1">Gunakan formulir di sebelah kiri untuk menyiarkan pengumuman baru.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* SUBTAB LAPORAN: KELOLA, EDIT LAPORAN & CETAK RAPOR */}
      {activeSubTab === 'laporan' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="bg-white p-6 rounded-3xl border border-[#E4D8E6] shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-extrabold text-xs">
                  Modul Laporan & Rapor Terpadu
                </span>
                <span className="text-xs text-gray-500 font-medium">Administrator</span>
              </div>
              <h3 className="text-xl font-extrabold text-brand-dark mt-2">
                Kelola, Edit Evaluasi & Cetak Dokumen Rapor Murid
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                Admin memiliki wewenang penuh untuk mengubah catatan perkembangan murid, menyesuaikan nilai aspek (bintang 1-5), memperbarui catatan kepala bimbel, serta mencetak rapor PDF resmi dan mengekspor data ke Excel / CSV.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setReportSelectedStudentId(students.length > 0 ? students[0].id : '');
                setIsReportModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Buka Pusat Cetak & Ekspor Data</span>
            </button>
          </div>

          {/* Quick List of Students for Direct Report Editing */}
          <div className="bg-white rounded-3xl border border-[#E4D8E6] p-6 shadow-premium space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE6DD]">
              <div>
                <h4 className="font-extrabold text-sm text-brand-dark flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-primary" />
                  Daftar Murid & Data Rapor Evaluasi
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Klik tombol <strong>"Kelola & Edit Laporan"</strong> pada siswa yang diinginkan untuk mengubah nilai/catatan.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-brand-light text-brand-dark font-bold text-xs border border-[#E0D8CC]">
                {students.length} Murid Terdaftar
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((st) => {
                const countEvaluations = assessments.filter(a => a.studentId === st.id || a.studentName.toLowerCase() === st.name.toLowerCase()).length;
                return (
                  <div
                    key={st.id}
                    className="p-4 rounded-2xl bg-brand-light/50 hover:bg-brand-light border border-[#E0D8CC] transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-sm text-brand-dark truncate">{st.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-[#E0D8CC] text-brand-primary text-[10px] font-bold shrink-0">
                          {st.className || 'Program Terpadu'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Wali: <strong>{st.parentName}</strong>
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-600">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          📝 {countEvaluations} Catatan Evaluasi
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#EDE6DD] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReportSelectedStudentId(st.id);
                          setIsReportModalOpen(true);
                        }}
                        className="w-full py-2 bg-white hover:bg-brand-primary hover:text-white text-brand-dark font-bold rounded-xl text-xs border border-[#E0D8CC] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Kelola & Edit Laporan</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 8: MASTER DATA LOKASI BIMBEL & GEOFENCING */}
      {activeSubTab === 'lokasi' && (
        <div className="space-y-6 animate-fade-in">
          <BimbelLocationManager
            locations={locations || []}
            onAddLocation={(newLoc) => {
              if (onAddLocation) {
                onAddLocation(newLoc);
                triggerToast(`Cabang "${newLoc.name}" berhasil ditambahkan & disinkronkan!`);
              }
            }}
            onUpdateLocation={(updatedLoc) => {
              if (onUpdateLocation) {
                onUpdateLocation(updatedLoc);
                triggerToast(`Data lokasi cabang "${updatedLoc.name}" berhasil diperbarui!`);
              }
            }}
            onDeleteLocation={(id) => {
              if (onDeleteLocation) {
                onDeleteLocation(id);
                triggerToast('Lokasi cabang berhasil dihapus.');
              }
            }}
            onSetDefaultLocation={(id) => {
              if (onSetDefaultLocation) {
                onSetDefaultLocation(id);
                triggerToast('Cabang utama (default) berhasil diubah!');
              }
            }}
          />
        </div>
      )}
            </motion.div>
          </AnimatePresence>
        </div>

      {/* Custom Confirmation Modal for Deleting Invoice */}
      {deletingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-[95%] max-h-[85vh] flex flex-col justify-between shadow-2xl border border-[#E4D8E6] animate-fade-in space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-brand-dark">Hapus Tagihan</h3>
                <p className="text-xs text-gray-500">Konfirmasi Penghapusan</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed overflow-y-auto">
              Apakah Anda yakin ingin menghapus tagihan <strong className="text-brand-dark">{deletingInvoice.invoiceNo}</strong> untuk murid <strong className="text-brand-dark">{deletingInvoice.studentName}</strong> ({deletingInvoice.billingMonth}) sejumlah <strong className="text-brand-primary">Rp {deletingInvoice.amount.toLocaleString('id-ID')}</strong>?
            </p>
            <div className="flex gap-2 pt-2 border-t border-[#F3EDF5] sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setDeletingInvoice(null)}
                className="flex-1 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteInvoice) {
                    onDeleteInvoice(deletingInvoice.id);
                    triggerToast(`Tagihan ${deletingInvoice.invoiceNo} telah berhasil dihapus.`);
                  }
                  setDeletingInvoice(null);
                }}
                className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Deleting Broadcast */}
      {bcToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-[95%] max-h-[85vh] flex flex-col justify-between shadow-2xl border border-[#E4D8E6] animate-fade-in space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-brand-dark">Hapus Pengumuman</h3>
                <p className="text-xs text-gray-500">Konfirmasi Penghapusan Siaran</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed overflow-y-auto">
              Apakah Anda yakin ingin menghapus pengumuman <strong className="text-brand-dark">"{bcToDelete.title}"</strong>? Pengumuman ini akan langsung dihapus dari seluruh tampilan aplikasi dan portal orang tua.
            </p>
            <div className="flex gap-2 pt-2 border-t border-[#F3EDF5] sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setBcToDelete(null)}
                className="flex-1 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteBroadcast) {
                    onDeleteBroadcast(bcToDelete.id);
                    triggerToast(`Pengumuman "${bcToDelete.title}" telah dihapus.`);
                  }
                  setBcToDelete(null);
                }}
                className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Pengumuman & Pengirim */}
      {editingBroadcast && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-xl w-[95%] sm:w-[90%] shadow-2xl border border-[#E4D8E6] animate-fade-in max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-[#F3ECE4] shrink-0 bg-[#FAF5FC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-extrabold text-base shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-brand-dark flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-brand-primary" />
                    Edit Pengumuman & Pengirim
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Sesuaikan judul, isi pesan, dan pengirim pengumuman resmi
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingBroadcast(null)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEditBroadcast} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase">Judul Pengumuman</label>
                  <input
                    type="text"
                    value={editBcTitle}
                    onChange={(e) => setEditBcTitle(e.target.value)}
                    placeholder="Contoh: Pengumuman Jadwal Belajar & Libur Semester"
                    required
                    className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white min-h-[44px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase">Isi Pesan Pengumuman</label>
                  <textarea
                    rows={4}
                    value={editBcContent}
                    onChange={(e) => setEditBcContent(e.target.value)}
                    placeholder="Rincian informasi pengumuman..."
                    required
                    className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
                  />
                </div>

                {/* Pengirim Pengumuman & Tanggal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-bc-sender" className="text-xs font-bold text-gray-700 uppercase">
                      Nama / Jabatan Pengirim
                    </label>
                    <input
                      id="edit-bc-sender"
                      type="text"
                      list="edit-bc-sender-presets"
                      value={editBcSender}
                      onChange={(e) => setEditBcSender(e.target.value)}
                      placeholder="Contoh: Admin Bimbel, Ustadzah Siti"
                      required
                      className="w-full text-xs sm:text-sm font-bold text-brand-dark bg-brand-light border border-[#E4D8E6] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white min-h-[44px]"
                    />
                    <datalist id="edit-bc-sender-presets">
                      <option value="Admin Bimbel" />
                      <option value="Admin Rina" />
                      <option value="Pimpinan Rumah CahayaQu" />
                      <option value="Bagian Keuangan" />
                      <option value="Tata Usaha" />
                      <option value="Koordinator Qur'an" />
                      {users
                        .filter((u) => u.role === 'teacher')
                        .map((t) => (
                          <option key={t.id} value={t.name} />
                        ))}
                    </datalist>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase">Tanggal Siaran</label>
                    <input
                      type="text"
                      value={editBcDate}
                      onChange={(e) => setEditBcDate(e.target.value)}
                      placeholder="YYYY-MM-DD"
                      className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="pt-3 border-t border-[#F3EDF5] sticky bottom-0 bg-white flex items-center justify-end gap-2.5 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingBroadcast(null)}
                  className="flex-1 sm:flex-none py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none py-2.5 px-5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Siswa / Ubah Pelajaran Les Anak */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-xl w-[95%] sm:w-[90%] shadow-2xl border border-[#E4D8E6] animate-fade-in max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-[#F3ECE4] shrink-0 bg-[#FAF5FC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-extrabold text-base sm:text-lg shrink-0">
                  {editingStudent.name[0]}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-brand-dark flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-brand-primary" />
                    Ubah Pelajaran Les & Data Anak
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Koreksi profil & program les ananda {editingStudent.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEditStudent} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Program Les Selector (Radio Cards) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Pilih Program Pelajaran Les Anak <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Membaca */}
                    <button
                      type="button"
                      onClick={() => setEditStudentClass('Membaca')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center sm:flex-col justify-between sm:justify-between gap-2 min-h-[44px] ${
                        editStudentClass === 'Membaca'
                          ? 'border-brand-primary bg-brand-light ring-2 ring-brand-primary/20 shadow-sm'
                          : 'border-[#E4D8E6] bg-white hover:border-brand-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:justify-between sm:w-full">
                        <span className="text-xl">📖</span>
                        <div>
                          <p className="font-extrabold text-xs text-brand-dark">Membaca</p>
                          <p className="text-[10px] text-gray-500 leading-tight">Fonik & Menulis</p>
                        </div>
                      </div>
                      {editStudentClass === 'Membaca' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-primary shrink-0" />
                      )}
                    </button>

                    {/* Berhitung */}
                    <button
                      type="button"
                      onClick={() => setEditStudentClass('Berhitung')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center sm:flex-col justify-between sm:justify-between gap-2 min-h-[44px] ${
                        editStudentClass === 'Berhitung'
                          ? 'border-brand-primary bg-brand-light ring-2 ring-brand-primary/20 shadow-sm'
                          : 'border-[#E4D8E6] bg-white hover:border-brand-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:justify-between sm:w-full">
                        <span className="text-xl">🔢</span>
                        <div>
                          <p className="font-extrabold text-xs text-brand-dark">Berhitung</p>
                          <p className="text-[10px] text-gray-500 leading-tight">Matematika Cepat</p>
                        </div>
                      </div>
                      {editStudentClass === 'Berhitung' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-primary shrink-0" />
                      )}
                    </button>

                    {/* Mengaji */}
                    <button
                      type="button"
                      onClick={() => setEditStudentClass('Mengaji')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center sm:flex-col justify-between sm:justify-between gap-2 min-h-[44px] ${
                        editStudentClass === 'Mengaji'
                          ? 'border-brand-primary bg-brand-light ring-2 ring-brand-primary/20 shadow-sm'
                          : 'border-[#E4D8E6] bg-white hover:border-brand-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:justify-between sm:w-full">
                        <span className="text-xl">🕌</span>
                        <div>
                          <p className="font-extrabold text-xs text-brand-dark">Mengaji</p>
                          <p className="text-[10px] text-gray-500 leading-tight">Iqro & Al-Qur'an</p>
                        </div>
                      </div>
                      {editStudentClass === 'Mengaji' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-primary shrink-0" />
                      )}
                    </button>
                  </div>

                  {/* Dropdown fallback / alternate */}
                  <div className="pt-1">
                    <select
                      value={editStudentClass}
                      onChange={(e) => setEditStudentClass(e.target.value)}
                      className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-xs font-bold text-brand-dark focus:outline-none min-h-[44px]"
                    >
                      <option value="Membaca">📖 Program Membaca & Menulis</option>
                      <option value="Berhitung">🔢 Program Berhitung & Matematika Dasar</option>
                      <option value="Mengaji">🕌 Program Mengaji (Iqro & Al-Qur'an)</option>
                    </select>
                  </div>
                </div>

                {/* Data Anak: Nama & Usia */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label htmlFor="edit-stud-name" className="text-xs font-bold text-gray-600 uppercase">
                      Nama Lengkap Anak <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-stud-name"
                      type="text"
                      required
                      value={editStudentName}
                      onChange={(e) => setEditStudentName(e.target.value)}
                      className="w-full text-xs sm:text-sm bg-white border border-[#E4D8E6] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-stud-age" className="text-xs font-bold text-gray-600 uppercase">
                      Usia (Tahun)
                    </label>
                    <input
                      id="edit-stud-age"
                      type="number"
                      min="3"
                      max="16"
                      value={editStudentAge}
                      onChange={(e) => setEditStudentAge(Number(e.target.value))}
                      className="w-full text-xs sm:text-sm bg-white border border-[#E4D8E6] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Data Orang Tua: Nama & Kontak */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-parent-name" className="text-xs font-bold text-gray-600 uppercase">
                      Nama Orang Tua / Wali <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-parent-name"
                      type="text"
                      required
                      value={editStudentParentName}
                      onChange={(e) => setEditStudentParentName(e.target.value)}
                      className="w-full text-xs sm:text-sm bg-white border border-[#E4D8E6] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-parent-phone" className="text-xs font-bold text-gray-600 uppercase">
                      No. WhatsApp / HP <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-parent-phone"
                      type="tel"
                      required
                      value={editStudentParentPhone}
                      onChange={(e) => setEditStudentParentPhone(e.target.value)}
                      className="w-full text-xs sm:text-sm bg-white border border-[#E4D8E6] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Status Keaktifan Siswa & Guru Pembimbing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-stud-status" className="text-xs font-bold text-gray-600 uppercase">
                      Status Keaktifan Belajar
                    </label>
                    <select
                      id="edit-stud-status"
                      value={editStudentStatus}
                      onChange={(e) => setEditStudentStatus(e.target.value as any)}
                      className="w-full bg-white border border-[#E4D8E6] rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-brand-dark focus:outline-none min-h-[44px]"
                    >
                      <option value="active">🟢 Aktif Belajar</option>
                      <option value="inactive">🟡 Cuti / Non-Aktif</option>
                      <option value="graduated">🎓 Sudah Lulus</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-stud-teacher" className="text-xs font-bold text-gray-600 uppercase">
                      Guru Pembimbing Khusus
                    </label>
                    <select
                      id="edit-stud-teacher"
                      value={editStudentTeacherName}
                      onChange={(e) => setEditStudentTeacherName(e.target.value)}
                      className="w-full bg-white border border-[#E4D8E6] rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-brand-dark focus:outline-none min-h-[44px]"
                    >
                      <option value="">-- Pilih Guru Pembimbing --</option>
                      {users.filter(u => u.role === 'teacher').map(t => (
                        <option key={t.id} value={t.name}>{t.name} ({t.subject || 'Pengajar'})</option>
                      ))}
                      {users.filter(u => u.role === 'teacher').length === 0 && (
                        <option value="Guru Pembimbing">Guru Pembimbing (Default)</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Checkbox auto-sync schedules */}
                <div className="bg-[#FAF7F2] rounded-2xl border border-[#EBE4DA] p-3.5 flex items-start gap-2.5">
                  <input
                    id="edit-sync-schedules"
                    type="checkbox"
                    checked={editStudentSyncSchedules}
                    onChange={(e) => setEditStudentSyncSchedules(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-primary focus:ring-brand-primary cursor-pointer"
                  />
                  <label htmlFor="edit-sync-schedules" className="text-xs text-gray-600 cursor-pointer">
                    <span className="font-bold text-brand-dark block">Otomatis sinkronkan jadwal privat anak</span>
                    Jika mata pelajaran diubah, sesuaikan otomatis nama mata pelajaran pada slot jadwal belajar anak ini.
                  </label>
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="pt-3 border-t border-[#F3EDF5] sticky bottom-0 bg-white flex items-center justify-end gap-2.5 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 sm:flex-none py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none py-2.5 px-5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Modal for Managing Schedules Per Student */}
      {scheduleModalStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-[95%] sm:w-[90%] shadow-2xl border border-[#E4D8E6] animate-fade-in max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-[#F3ECE4] shrink-0 bg-[#FAF5FC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-extrabold text-base sm:text-lg shrink-0">
                  {scheduleModalStudent.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-sm sm:text-base text-brand-dark">
                      Atur Jadwal: {scheduleModalStudent.name}
                    </h3>
                    <span className="text-[10px] font-extrabold bg-brand-primary/10 text-brand-primary px-2.5 py-0.5 rounded-full uppercase">
                      {scheduleModalStudent.className}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Wali: <strong className="text-brand-dark">{scheduleModalStudent.parentName}</strong> ({scheduleModalStudent.parentPhone})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setScheduleModalStudent(null)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Current Schedule for This Child */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-brand-primary" />
                  Jadwal Belajar Saat Ini ({scheduleModalStudent.name})
                </h4>

                {(() => {
                  const childSchedules = schedules.filter(sch => 
                    sch.studentId === scheduleModalStudent.id ||
                    (sch.studentName && sch.studentName.toLowerCase().trim() === scheduleModalStudent.name.toLowerCase().trim()) ||
                    ((!sch.studentId || sch.studentId === 'all') && sch.className === scheduleModalStudent.className)
                  );

                  if (childSchedules.length === 0) {
                    return (
                      <div className="py-6 text-center text-gray-400 italic bg-brand-light rounded-2xl border border-dashed border-[#E4D8E6] text-xs">
                        Belum ada sesi jadwal belajar untuk ananda {scheduleModalStudent.name}. Gunakan form di bawah untuk menambahkan sesi.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {childSchedules.map((sch) => {
                        const isDedicated = sch.studentId === scheduleModalStudent.id;
                        return (
                          <div key={sch.id} className="p-3 rounded-2xl bg-brand-light border border-[#EFEAE2] flex items-center justify-between gap-3">
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-extrabold bg-[#FAF0E6] text-[#A66D2E] px-2 py-0.5 rounded-full uppercase">
                                  {sch.day}
                                </span>
                                <span className="text-xs font-bold text-brand-primary">{sch.timeSlot} WIB</span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  isDedicated ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {isDedicated ? 'Khusus Privat Anak' : 'Reguler Kelas'}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-brand-dark truncate">
                                {sch.subject} <span className="text-gray-400 font-normal">• Pengajar: {sch.teacherName}</span>
                              </p>
                            </div>

                            {onDeleteSchedule && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSchToDelete(sch);
                                }}
                                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer shadow-2xs shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="Hapus Sesi Ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Quick Add Sesi Per Anak */}
              <div className="bg-[#FAF7F2] rounded-2xl border border-[#EBE4DA] p-4 space-y-3.5">
                <h4 className="text-xs font-extrabold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-brand-primary" />
                  Tambah Sesi Belajar Baru untuk Ananda
                </h4>

                <form onSubmit={handleCreateStudentSchedule} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="modal-sch-day" className="text-[11px] font-bold text-gray-500 uppercase">Hari</label>
                      <select
                        id="modal-sch-day"
                        value={modalSchDay}
                        onChange={(e) => setModalSchDay(e.target.value as any)}
                        className="w-full bg-white border border-[#E4D8E6] rounded-xl px-3 py-2 text-xs font-bold text-brand-dark focus:outline-none min-h-[44px]"
                      >
                        <option value="Senin">Senin</option>
                        <option value="Selasa">Selasa</option>
                        <option value="Rabu">Rabu</option>
                        <option value="Kamis">Kamis</option>
                        <option value="Jumat">Jumat</option>
                        <option value="Sabtu">Sabtu</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="modal-sch-time" className="text-[11px] font-bold text-gray-500 uppercase">Slot Waktu</label>
                      <input
                        id="modal-sch-time"
                        type="text"
                        value={modalSchTime}
                        onChange={(e) => setModalSchTime(e.target.value)}
                        placeholder="Contoh: 14:00 - 15:30"
                        className="w-full text-xs sm:text-sm bg-white border border-[#E4D8E6] rounded-xl px-3 py-2 focus:outline-none min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="modal-sch-subject" className="text-[11px] font-bold text-gray-500 uppercase">Fokus Materi Pembelajaran</label>
                      <input
                        id="modal-sch-subject"
                        type="text"
                        placeholder={`Materi ${scheduleModalStudent.className}`}
                        value={modalSchSubject}
                        onChange={(e) => setModalSchSubject(e.target.value)}
                        className="w-full text-xs sm:text-sm bg-white border border-[#E4D8E6] rounded-xl px-3 py-2 focus:outline-none min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="modal-sch-teacher" className="text-[11px] font-bold text-gray-500 uppercase">Guru / Tentor Alokasi</label>
                      <select
                        id="modal-sch-teacher"
                        value={modalSchTeacher}
                        onChange={(e) => {
                          const tName = e.target.value;
                          setModalSchTeacher(tName);
                          if (tName) {
                            const teacherObj = users.find(u => u.role === 'teacher' && u.name === tName);
                            if (teacherObj) {
                              const subjs = getTeacherSubjectsList(teacherObj);
                              if (subjs.includes('Mengaji') && (!modalSchSubject || modalSchSubject.includes('Materi'))) {
                                setModalSchSubject('Iqro & Tajwid Cilik / Hafalan');
                              } else if (subjs.includes('Berhitung') && (!modalSchSubject || modalSchSubject.includes('Materi'))) {
                                setModalSchSubject('Berhitung Cepat & Logika');
                              } else if (subjs.includes('Membaca') && (!modalSchSubject || modalSchSubject.includes('Materi'))) {
                                setModalSchSubject('Membaca Dasar & Suku Kata');
                              }
                            }
                          }
                        }}
                        className="w-full bg-white border border-[#E4D8E6] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-brand-dark focus:outline-none min-h-[44px]"
                      >
                        {users.filter(u => u.role === 'teacher').length === 0 ? (
                          <option value="">-- Belum ada data guru --</option>
                        ) : (
                          <>
                            <option value="">-- Pilih Guru Pengajar --</option>
                            {users
                              .filter(u => u.role === 'teacher')
                              .map((t) => (
                                <option key={t.id} value={t.name}>
                                  {t.name} ({getTeacherSubjectsList(t).join(', ') || 'Guru'})
                                </option>
                              ))}
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambahkan Sesi untuk {scheduleModalStudent.name}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-3 sm:p-4 border-t border-[#F3EDF5] sticky bottom-0 bg-white flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setScheduleModalStudent(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Deleting Schedule */}
      {schToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-[95%] sm:w-full shadow-2xl border border-[#E4D8E6] animate-fade-in space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-brand-dark">Hapus Slot Jadwal</h3>
                <p className="text-[11px] text-gray-500">Konfirmasi Penghapusan Jadwal</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus jadwal <strong className="text-brand-dark">{schToDelete.className} ({schToDelete.day}, {schToDelete.timeSlot} WIB)</strong> dengan guru pengajar <strong className="text-brand-dark">{schToDelete.teacherName}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSchToDelete(null)}
                className="flex-1 sm:flex-none py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteSchedule) {
                    onDeleteSchedule(schToDelete.id);
                    triggerToast(`Slot jadwal ${schToDelete.className} (${schToDelete.day}) telah dihapus.`);
                  }
                  setSchToDelete(null);
                }}
                className="flex-1 sm:flex-none py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Presensi Guru */}
      {editingTeacherLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-[95%] sm:w-full shadow-2xl border border-[#E4D8E6] animate-fade-in max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#F3EDF5] flex items-center justify-between shrink-0 bg-amber-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-brand-dark">Edit Presensi Guru</h3>
                  <p className="text-[11px] text-gray-500">{editingTeacherLog.teacherName} ({editingTeacherLog.subject || 'Pengajar'})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeacherLog(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTeacherLog} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Tanggal Presensi</label>
                  <input
                    type="date"
                    required
                    value={editLogDate}
                    onChange={(e) => setEditLogDate(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-brand-dark focus:outline-none min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Status Kehadiran</label>
                  <select
                    value={editLogStatus}
                    onChange={(e) => setEditLogStatus(e.target.value as any)}
                    className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-brand-dark font-bold focus:outline-none min-h-[44px]"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Terlambat">Terlambat</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Alpa">Alpa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Jam Masuk</label>
                  <input
                    type="time"
                    value={editLogTimeIn}
                    disabled={editLogStatus === 'Alpa' || editLogStatus === 'Sakit' || editLogStatus === 'Izin'}
                    onChange={(e) => setEditLogTimeIn(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-brand-dark font-bold focus:outline-none disabled:opacity-50 min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Jam Pulang</label>
                  <input
                    type="time"
                    value={editLogTimeOut}
                    disabled={editLogStatus === 'Alpa' || editLogStatus === 'Sakit' || editLogStatus === 'Izin'}
                    onChange={(e) => setEditLogTimeOut(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-brand-dark font-bold focus:outline-none disabled:opacity-50 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Catatan / Keterangan</label>
                <textarea
                  rows={3}
                  value={editLogNotes}
                  onChange={(e) => setEditLogNotes(e.target.value)}
                  placeholder="Keterangan pengajaran, alasan izin/sakit, dsb..."
                  className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-brand-dark focus:outline-none"
                />
              </div>

              <div className="sticky bottom-0 bg-white pt-3 border-t border-[#F3EDF5] flex items-center justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTeacherLog(null)}
                  className="flex-1 sm:flex-none py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none py-2.5 px-5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px]"
                >
                  <Save className="w-3.5 h-3.5 text-brand-accent" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Siswa */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-[95%] sm:w-full shadow-2xl border border-[#E4D8E6] animate-fade-in space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-brand-dark">Hapus Data Siswa</h3>
                <p className="text-[11px] text-gray-500">Konfirmasi Penghapusan Murid</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus siswa <strong className="text-brand-dark">{deletingStudent.name}</strong> (Mata Pelajaran: <strong className="text-brand-dark">{deletingStudent.className}</strong>, Wali: <strong className="text-brand-dark">{deletingStudent.parentName}</strong>)?
            </p>
            <div className="bg-red-50 border border-red-200/80 rounded-xl p-3 text-[11px] text-red-700 leading-relaxed">
              ⚠️ <strong>Perhatian:</strong> Penghapusan ini juga akan otomatis menghapus seluruh slot jadwal belajar, riwayat kehadiran, dan evaluasi rapor yang terhubung dengan ananda ini.
            </div>
            <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="flex-1 sm:flex-none py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteStudent) {
                    onDeleteStudent(deletingStudent.id);
                    triggerToast(`Data siswa ${deletingStudent.name} berhasil dihapus dari sistem.`);
                  }
                  setDeletingStudent(null);
                }}
                className="flex-1 sm:flex-none py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Siswa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Presensi Guru */}
      {deletingTeacherLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-[95%] sm:w-full shadow-2xl border border-[#E4D8E6] animate-fade-in space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-brand-dark">Hapus Rekap Presensi</h3>
                <p className="text-[11px] text-gray-500">Konfirmasi Penghapusan Log Kehadiran</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan presensi guru <strong className="text-brand-dark">{deletingTeacherLog.teacherName}</strong> pada tanggal <strong className="text-brand-dark">{deletingTeacherLog.date}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTeacherLog(null)}
                className="flex-1 sm:flex-none py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteTeacherAttendance) {
                    onDeleteTeacherAttendance(deletingTeacherLog.id);
                    triggerToast(`Catatan presensi ${deletingTeacherLog.teacherName} tanggal ${deletingTeacherLog.date} berhasil dihapus.`);
                  }
                  setDeletingTeacherLog(null);
                }}
                className="flex-1 sm:flex-none py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Presensi Murid */}
      {editingStudentLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-[95%] sm:w-full shadow-2xl border border-[#E4D8E6] overflow-hidden animate-fade-in max-h-[85vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-[#F3EDF5] flex items-center justify-between bg-purple-50/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-brand-primary flex items-center justify-center font-bold shrink-0">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-brand-dark">Edit Presensi Murid</h3>
                  <p className="text-[11px] text-gray-500">
                    {editingStudentLog.studentName || students.find(s => s.id === editingStudentLog.studentId)?.name || 'Siswa'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudentLog(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStudentLog} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Tanggal Presensi</label>
                  <input
                    type="date"
                    required
                    value={editStudentLogDate}
                    onChange={(e) => setEditStudentLogDate(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-brand-dark focus:outline-none min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Status Kehadiran</label>
                  <select
                    value={editStudentLogStatus}
                    onChange={(e) => setEditStudentLogStatus(e.target.value as any)}
                    className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-brand-dark font-bold focus:outline-none min-h-[44px]"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Terlambat">Terlambat</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Alpa">Alpa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Jam Masuk</label>
                  <input
                    type="time"
                    value={editStudentLogTimeIn}
                    disabled={editStudentLogStatus === 'Alpa' || editStudentLogStatus === 'Sakit' || editStudentLogStatus === 'Izin'}
                    onChange={(e) => setEditStudentLogTimeIn(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-brand-dark font-bold focus:outline-none disabled:opacity-50 min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Jam Pulang</label>
                  <input
                    type="time"
                    value={editStudentLogTimeOut}
                    disabled={editStudentLogStatus === 'Alpa' || editStudentLogStatus === 'Sakit' || editStudentLogStatus === 'Izin'}
                    onChange={(e) => setEditStudentLogTimeOut(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-brand-dark font-bold focus:outline-none disabled:opacity-50 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Keterangan / Materi Belajar</label>
                <textarea
                  rows={3}
                  value={editStudentLogNotes}
                  onChange={(e) => setEditStudentLogNotes(e.target.value)}
                  placeholder="Materi belajar, hafalan surat, alasan izin..."
                  className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-brand-dark focus:outline-none"
                />
              </div>

              <div className="sticky bottom-0 bg-white pt-3 border-t border-[#F3EDF5] flex items-center justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStudentLog(null)}
                  className="flex-1 sm:flex-none py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none py-2.5 px-5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px]"
                >
                  <Save className="w-3.5 h-3.5 text-brand-accent" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Presensi Murid */}
      {deletingStudentLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-[95%] sm:w-full shadow-2xl border border-[#E4D8E6] animate-fade-in space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-brand-dark">Hapus Rekap Presensi Murid</h3>
                <p className="text-[11px] text-gray-500">Konfirmasi Penghapusan Log Kehadiran Murid</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan presensi murid <strong className="text-brand-dark">{deletingStudentLog.studentName || students.find(s => s.id === deletingStudentLog.studentId)?.name || 'Siswa'}</strong> pada tanggal <strong className="text-brand-dark">{deletingStudentLog.date}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudentLog(null)}
                className="flex-1 sm:flex-none py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteStudentLogConfirm}
                className="flex-1 sm:flex-none py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Presensi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Inspector Foto Selfie & Geofence GPS Presensi Guru */}
      {viewingTeacherAttendancePhoto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-[95%] sm:w-full shadow-2xl border border-[#E4D8E6] overflow-hidden animate-fade-in max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-[#F3EDF5] flex items-center justify-between bg-[#FAF5FC] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-brand-dark">
                    Bukti Presensi: {viewingTeacherAttendancePhoto.teacherName}
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    {viewingTeacherAttendancePhoto.date} • Jam Masuk: {viewingTeacherAttendancePhoto.timeIn || '-'} WIB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingTeacherAttendancePhoto(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Photo Display */}
              <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-black border border-[#E4D8E6]">
                <img
                  src={viewingTeacherAttendancePhoto.photoBase64}
                  alt="Selfie Presensi Guru"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs text-white p-2 rounded-xl text-[10px] flex items-center justify-between">
                  <span>📅 {viewingTeacherAttendancePhoto.date} {viewingTeacherAttendancePhoto.timeIn ? `${viewingTeacherAttendancePhoto.timeIn} WIB` : ''}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                    viewingTeacherAttendancePhoto.isWithinRadius ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {viewingTeacherAttendancePhoto.isWithinRadius ? '✓ Sesuai Geofence' : '⚠ Di Luar Radius'}
                  </span>
                </div>
              </div>

              {/* Status & Distance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-brand-light p-3 rounded-2xl border border-[#E4D8E6]">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Status Kehadiran</span>
                  <p className="text-xs sm:text-sm font-extrabold text-brand-dark mt-0.5">{viewingTeacherAttendancePhoto.status}</p>
                </div>
                <div className="bg-brand-light p-3 rounded-2xl border border-[#E4D8E6]">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Jarak dari Bimbel</span>
                  <p className="text-xs sm:text-sm font-extrabold text-brand-dark mt-0.5 font-mono">
                    {viewingTeacherAttendancePhoto.distanceMeters !== undefined ? `${viewingTeacherAttendancePhoto.distanceMeters} Meter` : '-'}
                  </p>
                </div>
              </div>

              {/* Geolocation Details */}
              <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/70 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  Alamat Terdeteksi Real-Time (GPS)
                </div>
                <p className="text-gray-700 leading-relaxed font-medium text-xs">
                  {viewingTeacherAttendancePhoto.locationAddress || 'Alamat tidak terdeteksi via GPS'}
                </p>
                {viewingTeacherAttendancePhoto.latitude && viewingTeacherAttendancePhoto.longitude && (
                  <div className="pt-1 flex items-center justify-between text-[10px] text-emerald-900/70 font-mono border-t border-emerald-200/50 flex-wrap gap-1">
                    <span>Koordinat: {viewingTeacherAttendancePhoto.latitude.toFixed(6)}, {viewingTeacherAttendancePhoto.longitude.toFixed(6)}</span>
                    <a
                      href={`https://www.google.com/maps?q=${viewingTeacherAttendancePhoto.latitude},${viewingTeacherAttendancePhoto.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold text-emerald-800 hover:text-emerald-950"
                    >
                      Buka Google Maps ↗
                    </a>
                  </div>
                )}
              </div>

              {viewingTeacherAttendancePhoto.notes && (
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Catatan Guru:</span>
                  <p className="text-gray-700 italic">"{viewingTeacherAttendancePhoto.notes}"</p>
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 bg-gray-50 border-t border-[#F3EDF5] sticky bottom-0 shrink-0">
              <button
                type="button"
                onClick={() => setViewingTeacherAttendancePhoto(null)}
                className="w-full py-2.5 bg-brand-primary text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-brand-primary/95 transition-all min-h-[44px] flex items-center justify-center"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CETAK, EKSPOR & EDIT LAPORAN RAPOR (ADMIN ACCESS) */}
      {isReportModalOpen && (
        <ReportExportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          state={{
            users,
            students,
            attendance,
            assessments,
            activities: [],
            chats: [],
            schedules,
            invoices,
            broadcasts,
            teacherAttendance,
            bankAccount: bankAccount || { bankName: '', accountNumber: '', accountHolder: '' },
            locations,
            activeLocationId: '',
          }}
          userRole="admin"
          preselectedStudentId={reportSelectedStudentId}
          onUpdateAssessment={onUpdateAssessment}
          onDeleteAssessment={onDeleteAssessment}
          onAddAssessment={onAddAssessment}
        />
      )}

      {/* MODAL: GANTI & KUSTOMISASI LOGO BIMBEL */}
      {isLogoModalOpen && (
        <LogoCustomizerModal
          isOpen={isLogoModalOpen}
          onClose={() => setIsLogoModalOpen(false)}
          onSuccess={(newLogoUrl) => {
            if (onUpdateBranding) {
              onUpdateBranding({ customLogoUrl: newLogoUrl });
            }
          }}
        />
      )}

      {/* MODAL: EDIT AKUN & MATA PELAJARAN GURU */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-[95%] sm:w-full shadow-2xl border border-[#E4D8E6] overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-[#F3EDF5] flex items-center justify-between bg-amber-50/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-brand-dark">
                    Edit Akun & Mata Pelajaran Guru
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Perbarui profil, kata sandi, dan mata pelajaran yang diampu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTeacher} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Nama Lengkap Guru</label>
                <input
                  type="text"
                  required
                  value={editTName}
                  onChange={(e) => setEditTName(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[44px]"
                  placeholder="Contoh: Guru Tami"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Email Login Guru</label>
                <input
                  type="email"
                  required
                  value={editTEmail}
                  onChange={(e) => setEditTEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono min-h-[44px]"
                  placeholder="tami@cahayaqu.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Password Login</label>
                  <input
                    type="text"
                    required
                    value={editTPassword}
                    onChange={(e) => setEditTPassword(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono min-h-[44px]"
                    placeholder="guru123"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">No. WhatsApp / HP</label>
                  <input
                    type="tel"
                    value={editTPhone}
                    onChange={(e) => setEditTPhone(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[44px]"
                    placeholder="081234567890"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">
                    Mata Pelajaran yang Diampu (Multi-Select)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (editTSubjects.length === ALL_BIMBEL_SUBJECTS.length) {
                        setEditTSubjects(['Membaca']);
                      } else {
                        setEditTSubjects([...ALL_BIMBEL_SUBJECTS]);
                      }
                    }}
                    className="text-[11px] text-brand-primary hover:underline font-bold cursor-pointer"
                  >
                    {editTSubjects.length === ALL_BIMBEL_SUBJECTS.length ? 'Pilih 1 Saja' : 'Pilih Semua'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ALL_BIMBEL_SUBJECTS.map((subj) => {
                    const isSelected = editTSubjects.includes(subj);
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (editTSubjects.length > 1) {
                              setEditTSubjects(editTSubjects.filter((s) => s !== subj));
                            }
                          } else {
                            setEditTSubjects([...editTSubjects, subj]);
                          }
                        }}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
                          isSelected
                            ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
                            : 'bg-brand-light border-[#E4D8E6] text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-700 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                        <span>{subj}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Centang semua mata pelajaran yang boleh diajar oleh Guru {editTName || 'ini'} (contoh: Mengaji & Membaca). Pilihan ini akan otomatis tersinkronisasi di menu Kelola Jadwal.
                </p>
              </div>

              <div className="sticky bottom-0 bg-white pt-3 border-t border-[#F3EDF5] flex items-center justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="flex-1 sm:flex-none py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none py-2.5 px-5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <Save className="w-3.5 h-3.5" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt / Invoice Printable Modal */}
      {isReceiptModalOpen && selectedReceiptInvoice && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setSelectedReceiptInvoice(null);
          }}
          invoice={selectedReceiptInvoice}
          bankAccount={bankAccount || { bankName, accountNumber, accountHolder, instructions: bankInstructions }}
          parentName={students.find(s => s.id === selectedReceiptInvoice.studentId)?.parentName}
          studentClass={students.find(s => s.id === selectedReceiptInvoice.studentId)?.className}
        />
      )}

    </div>
  );
}
