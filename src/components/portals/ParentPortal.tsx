import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Heart, 
  Calendar, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  User, 
  Image as ImageIcon, 
  Send, 
  TrendingUp, 
  Award, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  CreditCard, 
  PhoneCall, 
  Megaphone,
  X,
  Smile,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
  BarChart3,
  Layers,
  Activity,
  Zap,
  Target,
  Building2,
  Copy,
  Check,
  CheckCheck,
  Info,
  Printer,
  Lock,
  Download,
  LayoutDashboard
} from 'lucide-react';
import { Student, Attendance, Assessment, DailyActivity, ChatMessage, ScheduleItem, UserAccount, Invoice, BroadcastMessage, BankAccountInfo } from '../../types';
import { ReportExportModal } from '../modals/ReportExportModal';
import { ReceiptModal } from '../modals/ReceiptModal';
import { AnnouncementCard } from '../common/AnnouncementCard';
import { playChatNotificationSound } from '../../utils/audioNotification';
import { deduplicateChats, useDebouncedUnreadCount } from '../../utils/chatUtils';

export type ParentSubTab = 'dashboard' | 'presensi' | 'jadwal' | 'rapor' | 'spp' | 'galeri';

interface ParentPortalProps {
  users?: UserAccount[];
  currentUser?: UserAccount;
  students: Student[];
  attendance: Attendance[];
  assessments: Assessment[];
  activities: DailyActivity[];
  chats: ChatMessage[];
  schedules: ScheduleItem[];
  invoices?: Invoice[];
  broadcasts?: BroadcastMessage[];
  bankAccount?: BankAccountInfo;
  activeSubTab?: ParentSubTab;
  onSubTabChange?: (tab: ParentSubTab) => void;
  onAddChatMessage: (
    sender: 'guru' | 'orangtua', 
    senderName: string, 
    message: string,
    studentId?: string,
    studentName?: string,
    teacherName?: string,
    parentName?: string,
    senderId?: string,
    receiverId?: string,
    teacherId?: string,
    parentId?: string
  ) => void;
  onMarkChatsAsRead?: (chatIds: string[]) => void;
}

export default function ParentPortal({
  users = [],
  currentUser,
  students,
  attendance,
  assessments,
  activities,
  chats,
  schedules,
  invoices = [],
  broadcasts = [],
  bankAccount,
  activeSubTab: controlledActiveSubTab,
  onSubTabChange,
  onAddChatMessage,
  onMarkChatsAsRead,
}: ParentPortalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatToast, setChatToast] = useState<{ id: string; sender: string; text: string; studentName: string } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [activityFilter, setActivityFilter] = useState<string>('Semua');
  const [reportViewMode, setReportViewMode] = useState<'radar' | 'bars'>('radar');
  const [isCopiedAccount, setIsCopiedAccount] = useState<boolean>(false);
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = useState<Invoice | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [presensiFilterMonth, setPresensiFilterMonth] = useState<string>('Semua');
  const [sppTabFilter, setSppTabFilter] = useState<'semua' | 'aktif' | 'riwayat'>('semua');
  const [internalActiveSubTab, setInternalActiveSubTab] = useState<ParentSubTab>('presensi');
  const activeSubTab = controlledActiveSubTab !== undefined ? controlledActiveSubTab : internalActiveSubTab;
  const setActiveSubTab = (tab: ParentSubTab) => {
    if (onSubTabChange) onSubTabChange(tab);
    setInternalActiveSubTab(tab);
  };
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const navScrollRef = useRef<HTMLElement>(null);
  const prevChatIdsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef<boolean>(true);
  const prevStudentChatsCountRef = useRef<number>(0);
  const prevChatOpenRef = useRef<boolean>(false);
  const prevSelectedStudentIdRef = useRef<string>('');
  const prevUnreadKeyRef = useRef<string>('');

  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      navScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const parentNavItems = [
    { id: 'presensi' as const, label: 'Presensi & Kehadiran', icon: ShieldCheck, desc: 'Status kehadiran belajar' },
    { id: 'rapor' as const, label: 'Rapor & Evaluasi', icon: TrendingUp, desc: 'Grafik potensi 4 pilar' },
    { id: 'galeri' as const, label: 'Galeri Aktivitas', icon: ImageIcon, desc: 'Dokumentasi keseruan kelas' },
    { id: 'jadwal' as const, label: 'Jadwal Belajar', icon: Calendar, desc: 'Agenda rutin mingguan' },
    { id: 'spp' as const, label: 'Kartu SPP & Iuran', icon: CreditCard, desc: 'Rekening resmi & tagihan' },
  ];

  const activeBank = bankAccount || {
    bankName: 'Bank Syariah Indonesia (BSI)',
    accountNumber: '7182938491',
    accountHolder: 'Rumah CahayaQu (Defika)',
    instructions: 'Mohon cantumkan No. Invoice atau Nama Ananda pada berita transfer. Setelah transfer, kirimkan bukti transfer melalui tombol Konfirmasi Pembayaran (WA).'
  };

  const handleCopyAccountNumber = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(activeBank.accountNumber);
      setIsCopiedAccount(true);
      setTimeout(() => setIsCopiedAccount(false), 2500);
    }
  };

  // Filter students for the logged in parent if user is parent
  const matchedStudents = currentUser && currentUser.role === 'parent'
    ? students.filter(s => {
        const pNameMatch = Boolean(s.parentName && currentUser.name && s.parentName.toLowerCase().trim() === currentUser.name.toLowerCase().trim());
        const pPhoneMatch = Boolean(s.parentPhone && currentUser.phone && s.parentPhone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, ''));
        const cNameMatch = Boolean(currentUser.childName && s.name.toLowerCase().trim() === currentUser.childName.toLowerCase().trim());
        return pNameMatch || pPhoneMatch || cNameMatch;
      })
    : students;

  // Dynamic fallback student if user is parent but no matching student record in array yet
  const fallbackStudent: Student | null = (currentUser && currentUser.role === 'parent') ? {
    id: `stud-fallback-${currentUser.id}`,
    name: currentUser.childName || `Anak ${currentUser.name}`,
    className: currentUser.subject || 'Membaca',
    subject: currentUser.subject || 'Membaca',
    parentName: currentUser.name,
    parentPhone: currentUser.phone || '-',
  } : null;

  const displayStudents = matchedStudents.length > 0 
    ? matchedStudents 
    : (fallbackStudent ? [fallbackStudent] : (currentUser?.role === 'parent' ? [] : students));

  // Auto-select student for this parent
  useEffect(() => {
    if (displayStudents.length > 0 && (!selectedStudentId || !displayStudents.some(s => s.id === selectedStudentId))) {
      setSelectedStudentId(displayStudents[0].id);
    }
  }, [displayStudents, selectedStudentId]);

  const scrollToBottom = useCallback((smooth = false) => {
    if (chatBodyRef.current) {
      if (smooth) {
        chatBodyRef.current.scrollTo({
          top: chatBodyRef.current.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }
    }
  }, []);

  if (displayStudents.length === 0) {
    return (
      <div id="parent-empty-state" className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-[#E4D8E6] shadow-premium max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 bg-[#FDF0DF] rounded-2xl flex items-center justify-center text-brand-accent mb-6">
          <User className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-brand-dark mb-2">Profil Ananda Belum Terhubung</h3>
        <p className="text-gray-500 max-w-md mb-8 text-sm leading-relaxed">
          Kami belum menemukan data ananda yang terhubung dengan akun Ayah/Bunda. Jangan khawatir, silakan hubungi tim administrasi kami agar profil ananda segera diselaraskan.
        </p>
      </div>
    );
  }

  const currentStudent = displayStudents.find(s => s.id === selectedStudentId) || displayStudents[0];
  if (!currentStudent) return null;

  // Filter today's attendance for current student
  const todayStr = new Date().toISOString().split('T')[0];
  const currentAttendance = attendance.find(
    a => a.studentId === currentStudent.id && a.date === todayStr
  );

  // Get student assessments
  const currentAssessments = assessments.filter(a => a.studentId === currentStudent.id);
  const latestAssessment = currentAssessments.length > 0 ? currentAssessments[currentAssessments.length - 1] : null;

  // Get student invoices for Kartu SPP
  const studentInvoices = invoices.filter(
    inv => inv.studentId === currentStudent.id || inv.studentName?.toLowerCase().trim() === currentStudent.name.toLowerCase().trim()
  );

  const unpaidInvoices = useMemo(() => studentInvoices.filter(i => i.status !== 'Lunas'), [studentInvoices]);
  const paidInvoices = useMemo(() => studentInvoices.filter(i => i.status === 'Lunas'), [studentInvoices]);

  // Attendance history and comprehensive statistics for current student
  const studentAttendanceHistory = useMemo(() => {
    return attendance
      .filter(a => a.studentId === currentStudent.id || a.studentName?.toLowerCase().trim() === currentStudent.name.toLowerCase().trim())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, currentStudent]);

  const attendanceStats = useMemo(() => {
    const total = studentAttendanceHistory.length;
    const hadir = studentAttendanceHistory.filter(a => a.status === 'Hadir').length;
    const sakit = studentAttendanceHistory.filter(a => a.status === 'Sakit').length;
    const izin = studentAttendanceHistory.filter(a => a.status === 'Izin').length;
    const alpa = studentAttendanceHistory.filter(a => a.status === 'Alpa').length;
    const rate = total > 0 ? Math.round((hadir / total) * 100) : 100;
    return { total, hadir, sakit, izin, alpa, rate };
  }, [studentAttendanceHistory]);

  const availableAttendanceMonths = useMemo(() => {
    const months = new Set<string>();
    studentAttendanceHistory.forEach(a => {
      if (a.date && a.date.length >= 7) {
        months.add(a.date.slice(0, 7)); // YYYY-MM
      }
    });
    return Array.from(months).sort().reverse();
  }, [studentAttendanceHistory]);

  const filteredAttendanceHistory = useMemo(() => {
    if (presensiFilterMonth === 'Semua') return studentAttendanceHistory;
    return studentAttendanceHistory.filter(a => a.date?.startsWith(presensiFilterMonth));
  }, [studentAttendanceHistory, presensiFilterMonth]);

  // Filter activities matching student's subject or "Semua Mata Pelajaran"
  const relevantActivities = activities.filter(
    act => act.targetClass === 'Semua Mata Pelajaran' || act.targetClass === 'Semua Kelas' || act.targetClass === currentStudent.className
  );

  const filteredActivities = activityFilter === 'Semua' 
    ? relevantActivities 
    : relevantActivities.filter(act => act.targetClass === activityFilter);

  // Filter schedules specifically for this student or general class schedules
  const studentSchedules = schedules.filter(sch => {
    if (sch.studentId && sch.studentId !== 'all') {
      return sch.studentId === currentStudent.id || sch.studentName?.toLowerCase().trim() === currentStudent.name.toLowerCase().trim();
    }
    return sch.className === currentStudent.className;
  });

  // Extract all distinct available subjects for current student & bimbel programs
  const studentAvailableSubjects = useMemo(() => {
    const subs = new Set<string>();
    if (currentStudent.className) subs.add(currentStudent.className);
    if (currentStudent.subject) subs.add(currentStudent.subject);
    if (Array.isArray((currentStudent as any).enrolledSubjects)) {
      (currentStudent as any).enrolledSubjects.forEach((s: string) => { if (s) subs.add(s); });
    }
    studentSchedules.forEach(sch => {
      if (sch.subject) subs.add(sch.subject);
      if (sch.className) subs.add(sch.className);
    });
    // Add distinct subjects from registered teacher users
    users.filter(u => u.role === 'teacher' && u.subject && u.subject !== 'Semua Mata Pelajaran').forEach(u => {
      subs.add(u.subject!);
    });
    // Ensure core bimbel subjects are selectable
    ['Membaca', 'Berhitung', 'Mengaji'].forEach(s => subs.add(s));
    return Array.from(subs).filter(Boolean);
  }, [currentStudent, studentSchedules, users]);

  // Selected chat subject state (contextual per active course / module)
  const [selectedChatSubject, setSelectedChatSubject] = useState<string>('');

  // Active chat subject derived from manual selection, current student class/subject, or first available
  const activeChatSubject = selectedChatSubject || currentStudent.className || currentStudent.subject || studentAvailableSubjects[0] || 'Membaca';

  // Dynamic Teacher Resolution for the active Subject (strictly no hardcoded fallback)
  const resolvedTeacherInfo = useMemo(() => {
    const activeSubj = activeChatSubject;
    const activeSubjLower = activeSubj.toLowerCase().trim();

    // 1. Find teacher in users whose subject directly matches activeSubj
    const teacherBySubj = users.find(u => {
      if (u.role !== 'teacher') return false;
      const subj = (u.subject || '').toLowerCase().trim();
      return subj === activeSubjLower || subj.includes(activeSubjLower) || activeSubjLower.includes(subj);
    });

    // 2. Find teacher in student's schedule for this subject
    const matchingSched = studentSchedules.find(s => {
      const schSubj = (s.subject || s.className || '').toLowerCase().trim();
      return schSubj === activeSubjLower || schSubj.includes(activeSubjLower) || activeSubjLower.includes(schSubj);
    });
    const schedTeacherName = matchingSched?.teacherName;
    const teacherBySched = (schedTeacherName && !schedTeacherName.toLowerCase().includes('sarah'))
      ? users.find(u => u.role === 'teacher' && u.name.toLowerCase().trim() === schedTeacherName.toLowerCase().trim())
      : null;

    // 3. Match from student's teacher assignment (if valid and not legacy hardcoded string)
    const studentTeacherName = currentStudent.teacherName;
    const isLegacySarah = studentTeacherName?.toLowerCase().includes('sarah');
    const teacherByStudent = (!isLegacySarah && studentTeacherName)
      ? users.find(u => u.role === 'teacher' && u.name.toLowerCase().trim() === studentTeacherName.toLowerCase().trim())
      : null;

    // 4. Fallback to general teacher in users
    const teacherUser = teacherBySubj || teacherBySched || teacherByStudent || 
      users.find(u => u.role === 'teacher' && u.subject === 'Semua Mata Pelajaran') || 
      users.find(u => u.role === 'teacher') || null;

    // 5. Final resolved teacher name and ID
    const finalTeacherName = teacherUser?.name || (schedTeacherName && !schedTeacherName.toLowerCase().includes('sarah') ? schedTeacherName : undefined) || (isLegacySarah ? undefined : currentStudent.teacherName) || 'Guru Pengampu';
    const finalTeacherId = teacherUser?.id || (currentStudent.teacherId && !isLegacySarah ? currentStudent.teacherId : 'teacher-default');

    return {
      subject: activeSubj,
      teacherUser,
      teacherName: finalTeacherName,
      teacherId: finalTeacherId,
    };
  }, [activeChatSubject, currentStudent, users, studentSchedules]);

  const assignedTeacher = resolvedTeacherInfo.teacherName;
  const assignedTeacherId = resolvedTeacherInfo.teacherId;
  
  // Deduplicate and filter chats for current active student
  const studentChats = useMemo(() => {
    const deduped = deduplicateChats(chats);
    return deduped.filter(c => !c.studentId || c.studentId === currentStudent.id);
  }, [chats, currentStudent.id]);

  // Centralized Single Source of Truth for unread messages with debounce & deduplication
  const parentStudentIds = useMemo(() => displayStudents.map(s => s.id), [displayStudents]);
  const unreadCount = useDebouncedUnreadCount(
    chats,
    useMemo(() => ({
      targetRole: 'parent' as const,
      studentIds: parentStudentIds,
    }), [parentStudentIds]),
    350
  );

  // Lock scroll position: ONLY scroll when chat is opened, student changed, or a new message is added
  useEffect(() => {
    const isNowOpen = isChatOpen;
    const wasOpen = prevChatOpenRef.current;
    const studentChanged = prevSelectedStudentIdRef.current !== selectedStudentId;
    const currentCount = studentChats.length;
    const countIncreased = currentCount > prevStudentChatsCountRef.current;

    prevChatOpenRef.current = isNowOpen;
    prevSelectedStudentIdRef.current = selectedStudentId;
    prevStudentChatsCountRef.current = currentCount;

    if (isNowOpen) {
      if (!wasOpen || studentChanged) {
        requestAnimationFrame(() => {
          scrollToBottom(false);
        });
      } else if (countIncreased) {
        requestAnimationFrame(() => {
          scrollToBottom(true);
        });
      }
    }
  }, [isChatOpen, selectedStudentId, studentChats.length, scrollToBottom]);

  // Real-time audio chime and toast notification listener
  useEffect(() => {
    const currentIds = new Set(chats.map(c => c.id));
    if (isInitialMountRef.current) {
      prevChatIdsRef.current = currentIds;
      isInitialMountRef.current = false;
      return;
    }

    const newIncoming = chats.filter(c => 
      !prevChatIdsRef.current.has(c.id) && 
      c.sender === 'guru' &&
      (!c.studentId || displayStudents.some(s => s.id === c.studentId))
    );

    prevChatIdsRef.current = currentIds;

    if (newIncoming.length > 0) {
      const latest = newIncoming[newIncoming.length - 1];
      if (!isChatOpen) {
        playChatNotificationSound();
        setChatToast({
          id: latest.id,
          sender: latest.senderName || assignedTeacher,
          text: latest.message,
          studentName: latest.studentName || currentStudent.name,
        });
      }
    }
  }, [chats, isChatOpen, displayStudents, assignedTeacher, currentStudent.name]);

  // Auto-dismiss chat notification toast after 6 seconds
  useEffect(() => {
    if (chatToast) {
      const timer = setTimeout(() => {
        setChatToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [chatToast]);

  // Auto-mark unread messages as read ONLY when parent opens the chat window or switches active student
  useEffect(() => {
    if (isChatOpen && onMarkChatsAsRead && currentStudent) {
      const unreadForCurrentStudent = chats.filter(c => 
        c.sender === 'guru' && 
        (!c.studentId || c.studentId === currentStudent.id) && 
        c.status !== 'read' && 
        !c.isRead
      );
      const unreadIds = unreadForCurrentStudent.map(c => c.id);
      const unreadKey = unreadIds.sort().join(',');

      if (unreadIds.length > 0 && unreadKey !== prevUnreadKeyRef.current) {
        prevUnreadKeyRef.current = unreadKey;
        onMarkChatsAsRead(unreadIds);
      } else if (unreadIds.length === 0) {
        prevUnreadKeyRef.current = '';
      }
    }
  }, [isChatOpen, selectedStudentId, chats, onMarkChatsAsRead, currentStudent]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const parentDisplayName = currentStudent.parentName || currentUser?.name || 'Wali Murid';
    onAddChatMessage(
      'orangtua', 
      parentDisplayName, 
      chatInput.trim(),
      currentStudent.id,
      currentStudent.name,
      assignedTeacher,
      parentDisplayName,
      currentUser?.id || currentStudent.parentPhone || 'parent-user',
      assignedTeacherId,
      assignedTeacherId,
      currentUser?.id
    );
    setChatInput('');
  };

  // Smart greeting formatter with natural Indonesian grammar
  const getParentGreeting = () => {
    const isSpecialistRole = currentUser && (
      currentUser.role === 'admin' || 
      currentUser.role === 'teacher' || 
      currentUser.name.toLowerCase().includes('admin') || 
      currentUser.name.toLowerCase().includes('pemilik') ||
      currentUser.name.toLowerCase().includes('guru')
    );
    
    if (isSpecialistRole) {
      return {
        title: 'Selamat Datang di Portal Wali Murid',
        subtitle: (
          <>
            Laporan evaluasi perkembangan belajar, riwayat kehadiran harian, dan catatan pengajar untuk Ananda{' '}
            <span className="font-extrabold text-brand-primary">{currentStudent.name}</span>
          </>
        ),
        badgeText: 'Pratinjau Wali Murid'
      };
    }

    const rawName = (currentUser?.role === 'parent' ? currentUser.name : currentStudent.parentName) || 'Wali Murid';
    const prefixPattern = /^(Ayah\/Bunda|Ayah|Bunda|Mama|Papa|Ibu|Bapak|Pak|Bu)\s+/i;
    const formattedGreetingName = prefixPattern.test(rawName.trim()) 
      ? rawName.trim() 
      : `Ayah/Bunda ${rawName.trim()}`;

    return {
      title: `Selamat Datang, ${formattedGreetingName}`,
      subtitle: (
        <>
          Laporan evaluasi perkembangan belajar, riwayat kehadiran harian, dan catatan pengajar untuk Ananda{' '}
          <span className="font-extrabold text-brand-primary">{currentStudent.name}</span>
        </>
      ),
      badgeText: 'Wali Murid Resmi'
    };
  };

  // Helper for Aspect descriptions and icons
  const getAspectInfo = (name: string) => {
    const meta: Record<string, { icon: string; title: string; desc: string }> = {
      'Pemahaman': { icon: '🧠', title: 'Pemahaman', desc: 'Daya tangkap materi & konsep pembelajaran' },
      'Pemahaman Materi': { icon: '🧠', title: 'Pemahaman Materi', desc: 'Daya tangkap materi & konsep pembelajaran' },
      'Fokus & Konsentrasi': { icon: '🎯', title: 'Fokus & Konsentrasi', desc: 'Ketahanan atensi dan fokus selama sesi' },
      'Fokus Belajar': { icon: '🎯', title: 'Fokus Belajar', desc: 'Ketahanan atensi dan fokus selama sesi' },
      'Kemandirian': { icon: '🚀', title: 'Kemandirian', desc: 'Inisiatif, percaya diri & eksplorasi mandiri' },
      'Keaktifan': { icon: '🚀', title: 'Keaktifan', desc: 'Keaktifan bertanya & respon positif di kelas' },
      'Kedisiplinan': { icon: '⏰', title: 'Kedisiplinan', desc: 'Ketertiban, kerapian & kepatuhan arahan' },
      'Kerapian': { icon: '✨', title: 'Kerapian', desc: 'Kerapian tulisan & pengerjaan latihan' },
    };
    return meta[name] || { icon: '⭐', title: name, desc: 'Indikator tumbuh kembang ananda' };
  };

  const getScoreGrade = (score: number) => {
    if (score >= 5) return { label: 'Istimewa', stars: 5, percent: 100, badgeClass: 'text-purple-700 bg-purple-100/80 border border-purple-200' };
    if (score >= 4) return { label: 'Sangat Baik', stars: 4, percent: 80, badgeClass: 'text-emerald-700 bg-emerald-100/80 border border-emerald-200' };
    if (score >= 3) return { label: 'Berkembang', stars: 3, percent: 60, badgeClass: 'text-blue-700 bg-blue-100/80 border border-blue-200' };
    return { label: 'Perlu Latihan', stars: 2, percent: 40, badgeClass: 'text-amber-700 bg-amber-100/80 border border-amber-200' };
  };

  // Helper to generate dynamic radar/spider chart vertices based on 4 aspects
  const renderRadarChart = (assessment: Assessment) => {
    const aspects = assessment.aspects;
    if (aspects.length < 3) return null;

    // Responsive SVG coordinate calculation with generous viewBox to eliminate any text clipping
    const viewBoxWidth = 460;
    const viewBoxHeight = 290;
    const centerX = viewBoxWidth / 2; // 230
    const centerY = 145;
    const radius = 82;
    const maxScore = 5;

    // Calculate (x, y) coordinates for any score (1-5) and aspect index
    const getCoordinates = (index: number, score: number) => {
      const angle = (Math.PI * 2 / aspects.length) * index - Math.PI / 2;
      const length = (score / maxScore) * radius;
      const x = centerX + length * Math.cos(angle);
      const y = centerY + length * Math.sin(angle);
      return { x, y };
    };

    // Calculate background axes and concentric web polygons
    const backgroundCircles = [1, 2, 3, 4, 5];
    const webPaths = backgroundCircles.map(level => {
      const points = aspects.map((_, i) => {
        const { x, y } = getCoordinates(i, level);
        return `${x},${y}`;
      }).join(' ');
      return (
        <polygon 
          key={level} 
          points={points} 
          fill={level % 2 === 0 ? 'rgba(138, 76, 147, 0.03)' : 'none'} 
          stroke="currentColor" 
          className="text-[#E2D6E6]" 
          strokeWidth={level === 5 ? "1.5" : "1"} 
          strokeDasharray={level === 5 ? "none" : "2,2"} 
        />
      );
    });

    // Calculate the student's actual score polygon
    const studentPoints = aspects.map((asp, i) => {
      const { x, y } = getCoordinates(i, asp.score);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="flex flex-col items-center bg-brand-light rounded-3xl p-3 sm:p-5 border border-[#EFEAE2] shadow-xs relative w-full overflow-hidden transition-all">
        
        {/* Top Chart Header & View Mode Switcher */}
        <div className="w-full flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#EFEAE2]">
          <div className="bg-white px-3 py-1.5 rounded-xl border border-[#E4D8E6] flex items-center gap-2 shadow-2xs">
            <TrendingUp className="w-4 h-4 text-brand-primary animate-pulse" />
            <span className="text-[11px] font-extrabold text-brand-dark uppercase tracking-wider">
              Grafik Potensi 4 Pilar
            </span>
          </div>

          {/* Toggle Radar / Bar Metrics */}
          <div className="flex bg-white p-1 rounded-xl border border-[#E4D8E6] text-[10px] font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setReportViewMode('radar')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                reportViewMode === 'radar'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-gray-600 hover:text-brand-dark'
              }`}
            >
              <Activity className="w-3 h-3" />
              Radar
            </button>
            <button
              type="button"
              onClick={() => setReportViewMode('bars')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                reportViewMode === 'bars'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-gray-600 hover:text-brand-dark'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              Metrik
            </button>
          </div>
        </div>

        {/* View Mode 1: Radar Chart */}
        {reportViewMode === 'radar' ? (
          <div className="w-full flex items-center justify-center py-1 select-none">
            <svg 
              viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
              className="w-full max-w-[460px] h-auto overflow-visible select-none drop-shadow-xs"
            >
              <defs>
                <linearGradient id="radarAreaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8A4C93" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#E2B34B" stopOpacity="0.25" />
                </linearGradient>
                <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Concentric grid webs */}
              {webPaths}

              {/* Cross axis lines */}
              {aspects.map((_, i) => {
                const { x, y } = getCoordinates(i, 5);
                return (
                  <line 
                    key={i} 
                    x1={centerX} 
                    y1={centerY} 
                    x2={x} 
                    y2={y} 
                    stroke="currentColor" 
                    className="text-[#E4D8E6]" 
                    strokeWidth="1.5" 
                  />
                );
              })}

              {/* Filled Student Progress Area with Gradient & Glow */}
              <polygon 
                points={studentPoints} 
                fill="url(#radarAreaGradient)" 
                stroke="#8A4C93" 
                strokeWidth="2.5" 
                strokeLinejoin="round" 
                className="transition-all duration-500"
              />

              {/* Node Dots on vertices */}
              {aspects.map((asp, i) => {
                const { x, y } = getCoordinates(i, asp.score);
                return (
                  <g key={i} className="transition-all duration-300">
                    <circle cx={x} cy={y} r="7" fill="#8A4C93" fillOpacity="0.2" />
                    <circle cx={x} cy={y} r="5" fill="#E2B34B" stroke="#8A4C93" strokeWidth="1.5" />
                    <circle cx={x} cy={y} r="2" fill="#FFFFFF" />
                  </g>
                );
              })}

              {/* Safe, Beautiful Non-Clipping Aspect Labels with Badge Backgrounds */}
              {aspects.map((asp, i) => {
                const info = getAspectInfo(asp.name);
                let labelX = centerX;
                let labelY = centerY;
                let anchor: 'middle' | 'start' | 'end' = 'middle';

                if (i === 0) {
                  // Top (Pemahaman)
                  labelX = centerX;
                  labelY = 28;
                  anchor = 'middle';
                } else if (i === 1) {
                  // Right (Fokus & Konsentrasi)
                  labelX = centerX + radius + 22;
                  labelY = centerY - 6;
                  anchor = 'start';
                } else if (i === 2) {
                  // Bottom (Kemandirian)
                  labelX = centerX;
                  labelY = centerY + radius + 32;
                  anchor = 'middle';
                } else if (i === 3) {
                  // Left (Kedisiplinan)
                  labelX = centerX - radius - 22;
                  labelY = centerY - 6;
                  anchor = 'end';
                }

                return (
                  <g key={asp.name} className="transition-all">
                    {/* Aspect Name */}
                    <text 
                      x={labelX} 
                      y={labelY} 
                      textAnchor={anchor} 
                      className="text-[12px] font-extrabold fill-[#1E1B24]"
                    >
                      {info.icon} {asp.name}
                    </text>
                    
                    {/* Aspect Score Subtitle */}
                    <text 
                      x={labelX} 
                      y={labelY + 14} 
                      textAnchor={anchor} 
                      className="text-[11px] font-bold fill-[#8A4C93]"
                    >
                      Nilai: {asp.score}/5 ★
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          /* View Mode 2: Bar Progress Metrics */
          <div className="w-full space-y-3 py-2 px-1">
            {aspects.map((asp, i) => {
              const info = getAspectInfo(asp.name);
              const grade = getScoreGrade(asp.score);
              return (
                <div 
                  key={i} 
                  className="bg-white p-3 rounded-2xl border border-[#ECE3DA] space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{info.icon}</span>
                      <div>
                        <span className="font-extrabold text-brand-dark block">{asp.name}</span>
                        <span className="text-[10px] text-gray-500 leading-tight">{info.desc}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${grade.badgeClass}`}>
                        {grade.label}
                      </span>
                      <span className="font-extrabold text-brand-primary text-xs">
                        {asp.score}/5
                      </span>
                    </div>
                  </div>

                  {/* Progress Meter Bar */}
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent transition-all duration-500" 
                      style={{ width: `${grade.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const parentGreeting = getParentGreeting();

  return (
    <div id="parent-portal-root" className="space-y-6 sm:space-y-8 animate-fade-in">
      
      {/* Header Selector & Profile Overview */}
      <div className="bg-white rounded-3xl border border-[#E4D8E6] p-5 sm:p-7 md:p-8 shadow-premium transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-extrabold text-brand-dark tracking-tight">
                {parentGreeting.title}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl font-medium">
              {parentGreeting.subtitle}
            </p>
          </div>

          {/* Controls: Student Picker & PDF Export */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            {displayStudents.length > 1 && (
              <div className="flex items-center gap-2 bg-brand-light p-2 rounded-2xl border border-[#EFEAE2] shrink-0 shadow-xs">
                <span className="text-xs font-bold text-gray-700 pl-1.5">Profil:</span>
                <div className="relative">
                  <select
                    id="student-picker"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="appearance-none bg-white border border-[#E4D8E6] rounded-xl px-3 py-1.5 pr-8 text-xs font-extrabold text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-xs cursor-pointer"
                  >
                    {displayStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.className})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-brand-primary">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )}

            {/* Print & Export PDF Button */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-brand-light text-brand-dark border border-[#E4D8E6] hover:border-brand-primary/40 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
              title="Unduh & Cetak Rapor Belajar, Absensi, atau Kartu SPP ke PDF"
            >
              <Printer className="w-3.5 h-3.5 text-brand-primary" />
              <span>Cetak / PDF Rapor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area with smooth transition between subtabs */}
      <div className="w-full min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="space-y-6"
          >
              {/* SUBTAB 0: DASHBOARD OVERVIEW (RINGKASAN & INFORMASI) */}
              {activeSubTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* In-App Announcement Card (Only on Dashboard) */}
                  {broadcasts && broadcasts.length > 0 && (
                    <AnnouncementCard broadcasts={broadcasts} />
                  )}

                  {/* 4 Concise Quick Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Status Kehadiran Hari Ini */}
                    <div className="bg-white p-5 rounded-3xl border border-[#E4D8E6] shadow-premium flex flex-col justify-between hover:border-emerald-300 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Presensi Hari Ini</span>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                          currentAttendance?.status === 'Hadir' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                            currentAttendance?.status === 'Hadir' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : currentAttendance?.status === 'Izin' || currentAttendance?.status === 'Sakit'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {currentAttendance?.status === 'Hadir' ? 'Hadir di Bimbel' : currentAttendance?.status || 'Belum Presensi'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2 font-medium">Tanggal: {todayStr}</p>
                      </div>
                    </div>

                    {/* 2. Rapor & Capaian Terkini */}
                    <div className="bg-white p-5 rounded-3xl border border-[#E4D8E6] shadow-premium flex flex-col justify-between hover:border-purple-300 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Rapor Ananda</span>
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                          <Award className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <div className="text-xl font-extrabold text-brand-dark">
                          {latestAssessment && latestAssessment.aspects && latestAssessment.aspects.length > 0 ? (
                            <span>
                              {Math.round(
                                (latestAssessment.aspects.reduce((acc, a) => acc + a.score, 0) / latestAssessment.aspects.length) * 20
                              )}/100
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Belum Ada</span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 font-medium">
                          {latestAssessment ? `Update: ${latestAssessment.date}` : 'Evaluasi 4 Pilar'}
                        </p>
                      </div>
                    </div>

                    {/* 3. Status Tagihan SPP */}
                    <div className="bg-white p-5 rounded-3xl border border-[#E4D8E6] shadow-premium flex flex-col justify-between hover:border-blue-300 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Status Tagihan SPP</span>
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <CreditCard className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        {studentInvoices.some(i => i.status === 'Belum Bayar' || i.status === 'Terlambat') ? (
                          <div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
                              Ada Tagihan Aktif
                            </span>
                            <p className="text-[11px] text-gray-400 mt-2 font-medium">
                              Rp {studentInvoices.filter(i => i.status !== 'Lunas').reduce((acc, i) => acc + (i.amount || 0), 0).toLocaleString('id-ID')}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                              Semua Lunas
                            </span>
                            <p className="text-[11px] text-emerald-600 mt-2 font-semibold">Tidak ada tunggakan</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4. Jadwal Belajar */}
                    <div className="bg-white p-5 rounded-3xl border border-[#E4D8E6] shadow-premium flex flex-col justify-between hover:border-amber-300 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Jadwal Belajar</span>
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Calendar className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-brand-dark truncate">
                          {studentSchedules.length > 0 ? studentSchedules[0].day : 'Senin - Jumat'}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 font-medium truncate">
                          {studentSchedules.length > 0 ? studentSchedules[0].timeSlot : '14:00 - 15:30 WIB'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 1: PRESENSI & KEHADIRAN BELAJAR */}
              {activeSubTab === 'presensi' && (
                <div className="bg-white rounded-3xl border border-[#E4D8E6] p-5 sm:p-7 md:p-8 shadow-premium transition-all space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F3EDF5]">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shrink-0 shadow-2xs">
                        <ShieldCheck className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-xl font-extrabold text-brand-dark">Presensi & Kehadiran Belajar</h3>
                        <p className="text-xs sm:text-sm text-gray-500 font-medium">Log kehadiran harian & pencatatan kedatangan siswa di bimbel</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center bg-brand-light px-3 py-1.5 rounded-xl border border-[#EDE4D8]">
                      <span className="text-xs font-bold text-gray-500">Tingkat Kehadiran:</span>
                      <span className="text-xs font-black text-brand-primary font-mono">{attendanceStats.rate}%</span>
                    </div>
                  </div>

                  {/* Status Hari Ini */}
                  <div>
                    <div className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-brand-primary" />
                      Status Kehadiran Hari Ini
                    </div>
                    {currentAttendance ? (
                      <div className="bg-brand-light p-5 sm:p-6 rounded-2xl border border-[#EFEAE2] shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E1D7]">
                          <div>
                            <span className="text-base font-extrabold text-brand-dark">{currentAttendance.date}</span>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Waktu Belajar: {currentStudent.className} • Terverifikasi Pengajar</p>
                          </div>
                          <span className={`self-start sm:self-auto px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                            currentAttendance.status === 'Hadir' ? 'bg-green-100 text-green-700 border border-green-200' :
                            currentAttendance.status === 'Alpa' ? 'bg-red-100 text-red-700 border border-red-200' :
                            'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {currentAttendance.status === 'Hadir' ? '✓ Hadir di Bimbel' : currentAttendance.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                          Catatan kehadiran ananda <strong className="text-brand-dark font-bold">{currentStudent.name}</strong> diverifikasi langsung oleh guru pengajar dan staf Rumah CahayaQu.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 px-4 text-center bg-brand-light rounded-2xl border border-[#EFEAE2]">
                        <AlertCircle className="w-9 h-9 text-gray-400 mb-1.5" />
                        <h4 className="text-sm font-bold text-brand-dark">Presensi Belum Tercatat Hari Ini</h4>
                        <p className="text-xs text-gray-500 max-w-sm mt-1 leading-relaxed font-medium">
                          Ananda {currentStudent.name} belum tercatat dalam presensi hari ini. Jika ananda berhalangan hadir, silakan kabari guru melalui tombol chat di kanan bawah.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sub-seksi: Riwayat Kehadiran Ananda */}
                  <div className="pt-3 border-t border-[#F3EDF5] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-brand-dark flex items-center gap-2">
                          <Activity className="w-4 h-4 text-brand-primary" />
                          Riwayat Kehadiran Ananda
                        </h4>
                        <p className="text-xs text-gray-500 font-medium">Rekapitulasi catatan absensi sesi belajar sebelumnya</p>
                      </div>

                      {availableAttendanceMonths.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400">Bulan:</span>
                          <select
                            value={presensiFilterMonth}
                            onChange={(e) => setPresensiFilterMonth(e.target.value)}
                            className="bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-1.5 text-xs font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          >
                            <option value="Semua">Semua Bulan</option>
                            {availableAttendanceMonths.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Summary Badges Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      <div className="bg-brand-light p-3 rounded-xl border border-[#ECE4D8] text-center">
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Total Sesi</div>
                        <div className="text-base font-extrabold text-brand-dark font-mono">{attendanceStats.total}</div>
                      </div>
                      <div className="bg-green-50/70 p-3 rounded-xl border border-green-200 text-center">
                        <div className="text-[10px] font-bold text-green-700 uppercase">Hadir</div>
                        <div className="text-base font-extrabold text-green-800 font-mono">{attendanceStats.hadir}</div>
                      </div>
                      <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-center">
                        <div className="text-[10px] font-bold text-amber-700 uppercase">Izin</div>
                        <div className="text-base font-extrabold text-amber-800 font-mono">{attendanceStats.izin}</div>
                      </div>
                      <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-center">
                        <div className="text-[10px] font-bold text-blue-700 uppercase">Sakit</div>
                        <div className="text-base font-extrabold text-blue-800 font-mono">{attendanceStats.sakit}</div>
                      </div>
                      <div className="bg-red-50/70 p-3 rounded-xl border border-red-200 text-center col-span-2 sm:col-span-1">
                        <div className="text-[10px] font-bold text-red-700 uppercase">Alpa</div>
                        <div className="text-base font-extrabold text-red-800 font-mono">{attendanceStats.alpa}</div>
                      </div>
                    </div>

                    {/* Attendance Logs List / Table */}
                    {filteredAttendanceHistory.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-[#EDE6DD]">
                        <table className="w-full text-left text-xs border-collapse bg-white">
                          <thead>
                            <tr className="bg-brand-light border-b border-[#EDE6DD] text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                              <th className="py-3 px-4">Tanggal</th>
                              <th className="py-3 px-4">Mata Pelajaran / Program</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4 text-right">Verifikasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F5EFE6]">
                            {filteredAttendanceHistory.map((rec) => (
                              <tr key={rec.id || `${rec.studentId}-${rec.date}`} className="hover:bg-brand-light/40 transition-colors">
                                <td className="py-3 px-4 font-bold text-brand-dark whitespace-nowrap">
                                  {rec.date}
                                </td>
                                <td className="py-3 px-4 text-gray-600 font-medium whitespace-nowrap">
                                  {currentStudent.className}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                                    rec.status === 'Hadir' ? 'bg-green-100 text-green-700 border border-green-200' :
                                    rec.status === 'Alpa' ? 'bg-red-100 text-red-700 border border-red-200' :
                                    rec.status === 'Sakit' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                    'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}>
                                    {rec.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right text-emerald-700 font-bold text-[11px] whitespace-nowrap">
                                  ✓ Guru Pengajar
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-gray-400 bg-brand-light/50 rounded-xl border border-[#EDE6DD]">
                        Belum ada riwayat kehadiran tercatat untuk filter ini.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB 2: RAPOR TUMBUH KEMBANG & EVALUASI BELAJAR */}
              {activeSubTab === 'rapor' && (
                <div className="bg-white rounded-3xl border border-[#E4D8E6] p-5 sm:p-7 md:p-8 shadow-premium overflow-hidden transition-all">
                  <div className="flex items-center justify-between mb-5 sm:mb-7 pb-4 border-b border-[#F3EDF5]">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 shadow-2xs">
                        <TrendingUp className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-xl font-extrabold text-brand-dark">Rapor Tumbuh Kembang & Evaluasi Belajar</h3>
                        <p className="text-xs sm:text-sm text-gray-500 font-medium">Transparansi pemahaman materi, konsentrasi, kemandirian, dan kedisiplinan</p>
                      </div>
                    </div>
                  </div>

                  {latestAssessment ? (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
                      {/* Visual Graph Panel (radar / bar chart) */}
                      <div className="lg:col-span-3 min-w-0">
                        {renderRadarChart(latestAssessment)}
                      </div>

                      {/* Narrative Assessment Card */}
                      <div className="lg:col-span-2 flex flex-col justify-between space-y-3.5">
                        <div className="bg-brand-light rounded-3xl p-5 sm:p-6 border border-[#EFEAE2] relative shadow-2xs flex flex-col justify-between h-full">
                          <div>
                            <div className="flex items-center justify-end mb-2">
                              <Sparkles className="w-5 h-5 fill-amber-500 text-amber-500" />
                            </div>

                            <h4 className="text-base sm:text-lg font-extrabold text-brand-dark mt-1 mb-1">
                              {latestAssessment.subject}
                            </h4>
                            <p className="text-xs text-gray-600 mb-4 font-medium">
                              {latestAssessment.date} • Dibimbing oleh <strong className="text-brand-dark font-bold">{latestAssessment.teacherName}</strong>
                            </p>
                            
                            <div className="p-4 sm:p-5 bg-white rounded-2xl border border-[#E4D8E6] shadow-2xs">
                              <p className="text-xs sm:text-sm text-gray-900 leading-relaxed italic font-serif">
                                "{latestAssessment.notes}"
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 pt-3.5 border-t border-[#EFEAE2] bg-amber-50/90 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 rounded-b-3xl text-xs text-amber-950 leading-relaxed font-medium">
                            <strong className="font-extrabold text-amber-950 flex items-center gap-1.5 mb-1.5 text-xs sm:text-sm">
                              <Heart className="w-4 h-4 fill-amber-500 text-amber-500" />
                              Saran Pendampingan di Rumah:
                            </strong>
                            Luangkan waktu 10–15 menit untuk membaca atau berlatih santai bersama ananda, dan beri apresiasi hangat atas ketekunannya hari ini.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-5 text-center bg-brand-light rounded-2xl border border-[#EFEAE2]">
                      <AlertCircle className="w-10 h-10 text-gray-400 mb-3" />
                      <h4 className="text-sm font-bold text-brand-dark">Catatan Perkembangan Sedang Disiapkan</h4>
                      <p className="text-xs text-gray-500 max-w-sm mt-1 leading-relaxed">
                        Guru sedang mendampingi ananda {currentStudent.name} dalam proses belajar. Rangkuman penilaian visual akan diperbarui secara berkala setelah sesi selesai.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 3: GALERI & DOKUMENTASI KEGIATAN */}
              {activeSubTab === 'galeri' && (
                <div className="bg-white rounded-3xl border border-[#E4D8E6] p-5 sm:p-7 md:p-8 shadow-premium transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 sm:mb-7 pb-4 border-b border-[#F3EDF5]">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent shrink-0 shadow-2xs">
                        <BookOpen className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-xl font-extrabold text-brand-dark">Galeri & Dokumentasi Kegiatan</h3>
                        <p className="text-xs sm:text-sm text-gray-500 font-medium">Momen interaktif anak saat bereksplorasi dan belajar di kelas</p>
                      </div>
                    </div>

                    {/* Mini filters */}
                    <div className="flex items-center gap-1.5 bg-brand-light p-1.5 rounded-2xl border border-[#EFEAE2] overflow-x-auto no-scrollbar self-start sm:self-center max-w-full shadow-2xs">
                      {['Semua', 'Membaca', 'Berhitung', 'Mengaji'].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setActivityFilter(filter)}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                            activityFilter === filter
                              ? 'bg-brand-primary text-white shadow-xs'
                              : 'text-gray-600 hover:text-brand-primary hover:bg-white'
                          }`}
                        >
                          {filter === 'Semua' ? 'Tampilkan Semua' : filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredActivities.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredActivities.map((act) => (
                        <div key={act.id} className="group flex flex-col bg-brand-light rounded-2xl border border-[#EFEAE2] shadow-xs hover:shadow-premium hover:border-brand-primary/30 transition-all overflow-hidden">
                          <div className="relative h-48 overflow-hidden bg-gray-100">
                            <img 
                              src={act.mediaUrl} 
                              alt={act.title} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            />
                            <div className="absolute top-3 left-3 bg-brand-primary/95 text-white font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm shadow-xs">
                              {act.targetClass}
                            </div>
                            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm">
                              {act.date}
                            </div>
                          </div>
                          <div className="p-4.5 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <h4 className="font-extrabold text-brand-dark text-base mb-1.5 group-hover:text-brand-primary transition-colors">{act.title}</h4>
                              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed line-clamp-3">{act.description}</p>
                            </div>
                            <div className="pt-3 border-t border-[#EFEAE2] flex items-center gap-1.5 text-xs font-bold text-brand-accent">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Dokumentasi Terverifikasi Pengajar</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-5 text-center bg-brand-light rounded-2xl border border-[#EFEAE2]">
                      <ImageIcon className="w-10 h-10 text-gray-400 mb-3" />
                      <h4 className="text-sm font-bold text-brand-dark">Dokumentasi Belum Diunggah</h4>
                      <p className="text-xs text-gray-500 max-w-sm mt-1 leading-relaxed">
                        Belum ada foto atau media dokumentasi untuk kategori "{activityFilter}". Guru akan membagikan liputan kegiatan setelah sesi berlangsung.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 4: JADWAL SESI BELAJAR */}
              {activeSubTab === 'jadwal' && (
                <div className="bg-white rounded-3xl border border-[#E4D8E6] p-5 sm:p-7 md:p-8 shadow-premium transition-all">
                  <div className="flex items-center gap-3.5 mb-5 sm:mb-6 pb-4 border-b border-[#F3EDF5]">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center text-brand-accent shrink-0 shadow-2xs">
                      <Calendar className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-xl font-extrabold text-brand-dark">Jadwal Sesi Belajar Ananda</h3>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">Agenda pembelajaran rutin mingguan ananda {currentStudent.name}</p>
                    </div>
                  </div>

                  {studentSchedules.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {studentSchedules.map((sch) => (
                        <div key={sch.id} className="p-4.5 rounded-2xl bg-brand-light border border-[#EFEAE2] flex flex-col justify-between gap-3 shadow-2xs hover:border-brand-primary/20 transition-all">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold uppercase text-amber-950 bg-amber-100/90 px-3 py-1 rounded-lg inline-block border border-amber-300 shadow-2xs tracking-wide">
                                {sch.day}
                              </span>
                              <span className="flex items-center gap-1 text-brand-primary text-xs font-extrabold bg-brand-primary/10 px-2.5 py-1 rounded-xl">
                                <Clock className="w-3.5 h-3.5" />
                                {sch.timeSlot.split(' ')[0]}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-brand-dark text-base">{sch.className} - {sch.subject}</h4>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-gray-400" /> Guru Pembimbing: <strong className="text-brand-dark font-bold">{sch.teacherName}</strong>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedChatSubject(sch.className || sch.subject || 'Membaca');
                              setIsChatOpen(true);
                            }}
                            className="w-full mt-2 py-2 px-3 rounded-xl bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Hubungi {sch.teacherName} ({sch.className})</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-brand-light rounded-2xl border border-[#EFEAE2]">
                      <Calendar className="w-10 h-10 text-gray-400 mb-2" />
                      <h4 className="text-sm font-bold text-brand-dark">Jadwal Sedang Diselaraskan</h4>
                      <p className="text-xs text-gray-500 max-w-xs mt-1 leading-relaxed font-medium">
                        Belum ada jadwal tetap untuk program "{currentStudent.className}". Tim kami akan segera mengabari Ayah/Bunda.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 5: KARTU SPP & IURAN BELAJAR */}
              {activeSubTab === 'spp' && (
                <div className="bg-white rounded-3xl border border-[#E4D8E6] p-5 sm:p-7 md:p-8 shadow-premium transition-all space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F3EDF5]">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold shrink-0 shadow-2xs">
                        <CreditCard className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-xl font-extrabold text-brand-dark">Kartu SPP & Iuran Belajar</h3>
                        <p className="text-xs sm:text-sm text-gray-500 font-medium">Transparansi administrasi, rekening transfer resmi, dan status tagihan</p>
                      </div>
                    </div>
                  </div>

                  {/* Official Bank Account & Payment Instructions Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    
                    {/* Left Card: Rekening Pembayaran */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#DFD6C2] shadow-xs space-y-3 flex flex-col justify-between">
                      <div>
                        {/* Sub Judul & Badge */}
                        <div className="text-xs font-extrabold text-brand-dark border-b border-[#F0EBE1] pb-2 flex items-center justify-between mb-3">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-brand-primary" />
                            Rekening Pembayaran:
                          </span>
                          <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full border border-brand-primary/20">
                            Resmi Bimbel
                          </span>
                        </div>

                        {/* Account Number Box with Copy Button */}
                        <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#ECE5DB] flex items-center justify-between gap-3 shadow-2xs mb-3">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide block truncate">
                              {activeBank.bankName}
                            </span>
                            <span className="text-base sm:text-lg font-mono font-extrabold text-brand-dark tracking-wider block">
                              {activeBank.accountNumber}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={handleCopyAccountNumber}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-brand-primary/10 border border-[#DFD6C2] text-brand-primary font-extrabold rounded-xl text-xs transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                            title="Salin Nomor Rekening"
                          >
                            {isCopiedAccount ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold text-xs">Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-xs">Salin Rekening</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* a.n. Rekening */}
                        <div className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-brand-light/50 rounded-lg border border-[#F0EBE1]">
                          <span className="text-brand-dark font-extrabold text-xs">
                            a.n. {activeBank.accountHolder}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px] text-emerald-900 bg-emerald-50/80 px-3 py-2 rounded-xl border border-emerald-200/80 mt-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-gray-600">No. WA Admin:</span>
                          <strong className="font-extrabold text-emerald-950 font-mono">0812-3456-7800</strong>
                        </div>
                        <a
                          href="https://wa.me/6281234567800"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold shrink-0 transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1"
                        >
                          Hubungi WA
                        </a>
                      </div>
                    </div>

                    {/* Right Card: 3-Step Payment Guide */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#DFD6C2] shadow-xs space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-extrabold text-brand-dark border-b border-[#F0EBE1] pb-2 flex items-center justify-between mb-3">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Alur Cara Bayar SPP:
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            3 Langkah
                          </span>
                        </div>
                        <ul className="text-xs text-gray-700 space-y-2.5 font-medium leading-tight">
                          <li className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-brand-primary text-white font-extrabold flex items-center justify-center shrink-0 text-[11px] shadow-2xs">
                              1
                            </span>
                            <div>
                              <strong className="text-brand-dark block text-[11.5px] mb-0.5">Transfer Nominal SPP</strong>
                              <span className="text-[11px] text-gray-600 leading-relaxed block">
                                Transfer nominal tagihan ke rekening {activeBank.bankName}.
                              </span>
                            </div>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-brand-accent text-white font-extrabold flex items-center justify-center shrink-0 text-[11px] shadow-2xs">
                              2
                            </span>
                            <div>
                              <strong className="text-brand-dark block text-[11.5px] mb-0.5">Screenshot Tangkapan Layar</strong>
                              <span className="text-[11px] text-gray-600 leading-relaxed block">
                                Ambil screenshot / tangkapan layar bukti transfer Anda yang berhasil.
                              </span>
                            </div>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center shrink-0 text-[11px] shadow-2xs">
                              3
                            </span>
                            <div>
                              <strong className="text-brand-dark block text-[11.5px] mb-0.5">Kirim via WA Admin</strong>
                              <span className="text-[11px] text-gray-600 leading-relaxed block">
                                Kirimkan screenshot bukti transfer via WhatsApp Admin.
                              </span>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>

                  </div>

                  {/* Invoices List with Sub-sections */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#F0EBE1]">
                      <div>
                        <h4 className="text-sm font-extrabold text-brand-dark flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-brand-primary" />
                          Daftar Tagihan &amp; Riwayat Pembayaran SPP
                        </h4>
                        <p className="text-xs text-gray-500 font-medium">Tagihan bulanan aktif serta arsip kuitansi pelunasan resmi</p>
                      </div>

                      {/* Sub-tabs for SPP */}
                      <div className="flex items-center gap-1 bg-brand-light p-1 rounded-xl border border-[#ECE4D8] self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setSppTabFilter('semua')}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            sppTabFilter === 'semua' ? 'bg-brand-primary text-white shadow-2xs' : 'text-gray-600 hover:text-brand-dark'
                          }`}
                        >
                          Semua ({studentInvoices.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSppTabFilter('aktif')}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            sppTabFilter === 'aktif' ? 'bg-brand-primary text-white shadow-2xs' : 'text-gray-600 hover:text-brand-dark'
                          }`}
                        >
                          Tagihan Aktif ({unpaidInvoices.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSppTabFilter('riwayat')}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            sppTabFilter === 'riwayat' ? 'bg-brand-primary text-white shadow-2xs' : 'text-gray-600 hover:text-brand-dark'
                          }`}
                        >
                          Riwayat Lunas ({paidInvoices.length})
                        </button>
                      </div>
                    </div>

                    {(() => {
                      const displayedList = 
                        sppTabFilter === 'aktif' ? unpaidInvoices :
                        sppTabFilter === 'riwayat' ? paidInvoices :
                        studentInvoices;

                      if (displayedList.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-brand-light rounded-2xl border border-[#EFEAE2]">
                            <CreditCard className="w-10 h-10 text-gray-400 mb-2" />
                            <h4 className="text-sm font-bold text-brand-dark">
                              {sppTabFilter === 'aktif' ? 'Tidak Ada Tagihan Belum Dibayar' :
                               sppTabFilter === 'riwayat' ? 'Belum Ada Riwayat Pembayaran' :
                               'Semua Tagihan Sudah Rapi'}
                            </h4>
                            <p className="text-xs text-gray-500 max-w-xs mt-1 leading-relaxed font-medium">
                              {sppTabFilter === 'aktif' 
                                ? 'Alhamdulillah, seluruh tagihan SPP ananda saat ini sudah lunas terbayar.'
                                : 'Riwayat bukti pelunasan kuitansi resmi akan tercatat otomatis di sini.'}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {displayedList.map((inv) => {
                            const isPaid = inv.status === 'Lunas';
                            const waMsg = encodeURIComponent(
                              `Halo Admin Rumah CahayaQu, saya Ayah/Bunda dari Ananda ${inv.studentName} ingin konfirmasi pembayaran tagihan SPP (${inv.billingMonth}) No. Invoice: ${inv.invoiceNo} sejumlah Rp ${inv.amount.toLocaleString('id-ID')} yang telah ditransfer ke rekening ${activeBank.bankName}.\n\nBerikut saya lampirkan screenshot tangkapan layar bukti transfernya untuk diverifikasi. Terima kasih!`
                            );
                            const adminPhone = '081234567800';
                            const waCleanPhone = adminPhone.replace(/\D/g, '');
                            const waPhoneFormatted = waCleanPhone.startsWith('0') ? '62' + waCleanPhone.slice(1) : waCleanPhone;
                            const waUrl = `https://wa.me/${waPhoneFormatted}?text=${waMsg}`;

                            return (
                              <div key={inv.id} className="p-5 rounded-2xl bg-brand-light border border-[#EFEAE2] flex flex-col justify-between gap-4 shadow-2xs hover:border-brand-primary/20 transition-all">
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="font-extrabold text-brand-dark text-base">{inv.billingMonth}</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                      isPaid ? 'bg-green-100 text-green-700 border border-green-200' :
                                      inv.status === 'Terlambat' ? 'bg-red-100 text-red-700 border border-red-200' :
                                      'bg-amber-100 text-amber-800 border border-amber-200'
                                    }`}>
                                      {isPaid ? 'Lunas' : inv.status === 'Terlambat' ? 'Jatuh Tempo Terlewati' : 'Menunggu Pembayaran'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 font-medium">
                                    No. Invoice: <span className="font-mono font-bold text-brand-dark">{inv.invoiceNo}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 font-medium">
                                    Batas Pembayaran: <span className="font-semibold text-gray-800">{inv.dueDate}</span>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-[#EFEAE2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="text-lg font-extrabold text-brand-primary font-mono">
                                    Rp {inv.amount.toLocaleString('id-ID')}
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap">
                                    {!isPaid ? (
                                      <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer active:scale-95"
                                      >
                                        <PhoneCall className="w-3.5 h-3.5" />
                                        Konfirmasi Bayar
                                      </a>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedReceiptInvoice(inv);
                                          setIsReceiptModalOpen(true);
                                        }}
                                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-brand-primary/10 border border-[#DFD6C8] text-brand-primary hover:text-brand-dark rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer active:scale-95"
                                        title="Unduh / Lihat Bukti Kuitansi"
                                      >
                                        <Printer className="w-3.5 h-3.5 text-brand-primary" />
                                        <span>Unduh / Bukti Kuitansi</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      {/* Floating Chat Icon & Smooth Animated Chat Drawer/Modal */}
      <div 
        className="fixed bottom-6 right-5 z-[9999] flex flex-col items-end"
        style={{ position: 'fixed', bottom: '24px', right: '20px', zIndex: 9999 }}
      >
        
        {/* Animated Floating Chat Window */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              style={{ transformOrigin: 'bottom right' }}
              className="mb-4 w-[calc(100vw-2.5rem)] sm:w-[400px] h-[520px] max-h-[78vh] bg-white rounded-3xl border border-[#E4D8E6] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="bg-brand-primary p-4 text-white flex items-center justify-between shadow-xs shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/30 shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold tracking-tight">Ruang Komunikasi Guru</h3>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                      </span>
                    </div>
                    <p className="text-[11px] text-white/90 truncate max-w-[240px] font-medium">
                      👩‍🏫 {assignedTeacher} • Ananda {currentStudent.name}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer"
                  title="Tutup Ruang Chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contextual Subject / Mata Pelajaran Switcher Ribbon */}
              <div className="px-3.5 py-2 bg-purple-50/80 border-b border-purple-100 flex items-center justify-between gap-2 shrink-0">
                <span className="text-[10px] font-bold text-purple-900 flex items-center gap-1 shrink-0">
                  <span>Mata Pelajaran:</span>
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {studentAvailableSubjects.map((subj) => {
                    const isActive = (activeChatSubject.toLowerCase() === subj.toLowerCase());
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => setSelectedChatSubject(subj)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-brand-primary text-white shadow-xs'
                            : 'bg-white text-gray-600 hover:text-brand-dark hover:bg-purple-100/50 border border-purple-200/60'
                        }`}
                      >
                        {subj === 'Mengaji' ? '📖 Mengaji' : subj === 'Membaca' ? '📚 Membaca' : subj === 'Berhitung' ? '🧮 Berhitung' : subj}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Privacy Banner */}
              <div className="px-3.5 py-1.5 bg-amber-50 border-b border-amber-200/80 flex items-center gap-2 text-[10px] text-amber-900 leading-tight shrink-0">
                <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>
                  <strong>Pesan Privat:</strong> Terhubung ke <strong>{assignedTeacher}</strong> ({activeChatSubject}). Hanya Anda dan pengampu yang dapat melihat percakapan ini.
                </span>
              </div>

              {/* Chat Body Messages */}
              <div ref={chatBodyRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 pr-2 text-xs bg-brand-light/60">
                {studentChats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-5">
                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-2.5">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h4 className="text-xs font-extrabold text-brand-dark">Terhubung dengan {assignedTeacher}</h4>
                    <p className="text-[11px] text-gray-500 max-w-[260px] mt-1.5 leading-relaxed font-medium">
                      Sampaikan kabar izin sakit, koordinasi jadwal, atau pertanyaan seputar materi belajar {currentStudent.name} langsung kepada {assignedTeacher}.
                    </p>
                  </div>
                ) : (
                  studentChats.map((chat) => {
                    const isParent = chat.sender === 'orangtua';
                    return (
                      <div 
                        key={chat.id} 
                        className={`flex flex-col max-w-[85%] ${isParent ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <span className="text-[10px] font-bold text-gray-500 mb-1 px-1">
                          {isParent ? `👨‍👩‍👦 ${chat.senderName || currentStudent.parentName || 'Wali Murid'}` : `👩‍🏫 ${chat.senderName || chat.teacherName || assignedTeacher}`}
                        </span>
                        <div className={`p-3.5 rounded-2xl leading-relaxed text-xs sm:text-sm font-medium ${
                          isParent 
                            ? 'bg-brand-primary text-white rounded-tr-none shadow-xs' 
                            : 'bg-white text-brand-dark border border-[#EFEAE2] rounded-tl-none shadow-xs'
                        }`}>
                          <div>{chat.message}</div>
                          <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] ${isParent ? 'justify-end text-white/80' : 'justify-start text-gray-400'}`}>
                            <span>{new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isParent && (
                              <span className="inline-flex items-center ml-0.5" title={
                                chat.status === 'read' || chat.isRead 
                                  ? 'Dibaca oleh guru (Centang 2 Biru)' 
                                  : chat.status === 'delivered' 
                                  ? 'Tersampaikan ke guru (Centang 2 Abu-abu)' 
                                  : 'Terkirim ke server (Centang 1 Abu-abu)'
                              }>
                                {chat.status === 'read' || chat.isRead ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-300 stroke-[2.5]" />
                                ) : chat.status === 'delivered' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-white/60 stroke-[2]" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-white/60 stroke-[2]" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-[#F3EDF5] flex items-center gap-2 shrink-0">
                <input
                  id="parent-floating-chat-input"
                  type="text"
                  placeholder="Tulis pesan, kabar, atau pertanyaan ke guru..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] text-brand-dark placeholder-gray-400 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                />
                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-primary/90 text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                  title="Kirim Pesan ke Guru"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-time Toast Alert for New Chat */}
        <AnimatePresence>
          {chatToast && !isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              onClick={() => {
                setIsChatOpen(true);
                setChatToast(null);
              }}
              className="mb-3 w-80 max-w-[calc(100vw-3rem)] bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-brand-primary/30 shadow-xl cursor-pointer hover:shadow-2xl transition-all flex items-start gap-3 group relative z-50"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-primary text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <MessageSquare className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center justify-between gap-1">
                  <h5 className="text-xs font-bold text-brand-dark truncate">{chatToast.sender}</h5>
                  <span className="text-[10px] text-brand-primary font-semibold">Pesan Baru</span>
                </div>
                <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5 leading-snug">{chatToast.text}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setChatToast(null);
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                title="Tutup Notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toggle Button with Badge & Bounce Animation */}
        <div className="relative">
          <button
            id="parent-floating-chat-toggle"
            type="button"
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              setChatToast(null);
            }}
            className={`w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg hover:bg-brand-primary/90 active:scale-95 transition-all cursor-pointer relative ${
              unreadCount > 0 && !isChatOpen ? 'animate-bounce ring-4 ring-brand-primary/20' : ''
            }`}
            title={isChatOpen ? 'Tutup Chat' : 'Konsultasi Guru'}
          >
            {isChatOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            {unreadCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-red-600 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white shadow-md">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* MODAL: CETAK & EKSPOR LAPORAN BIMBEL (STRICT PARENT DATA ISOLATION) */}
      {isExportModalOpen && (
        <ReportExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          state={{
            users: currentUser ? [currentUser] : [],
            students: displayStudents,
            attendance: attendance.filter(a => 
              displayStudents.some(s => s.id === a.studentId || (s.name && a.studentName && s.name.toLowerCase().trim() === a.studentName.toLowerCase().trim()))
            ),
            assessments: assessments.filter(a => 
              displayStudents.some(s => s.id === a.studentId || (s.name && a.studentName && s.name.toLowerCase().trim() === a.studentName.toLowerCase().trim()))
            ),
            activities,
            chats: studentChats,
            schedules: studentSchedules,
            invoices: studentInvoices,
            broadcasts,
            teacherAttendance: [],
            bankAccount: activeBank,
            locations: [],
            activeLocationId: '',
          }}
          userRole="parent"
          preselectedStudentId={currentStudent.id}
        />
      )}

      {/* MODAL: KUITANSI PEMBAYARAN SPP RESMI */}
      {isReceiptModalOpen && selectedReceiptInvoice && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setSelectedReceiptInvoice(null);
          }}
          invoice={selectedReceiptInvoice}
          bankAccount={activeBank}
          parentName={currentStudent.parentName}
          studentClass={currentStudent.className}
        />
      )}

    </div>
  );
}
