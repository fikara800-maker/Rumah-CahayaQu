import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Check, 
  Clock, 
  Plus, 
  Image as ImageIcon, 
  Award, 
  User,
  Users,
  LayoutDashboard,
  ArrowRight,
  Heart, 
  ListTodo, 
  PhoneCall, 
  FileText, 
  MessageSquare, 
  Send,
  X,
  UserCheck,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  History,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  CheckSquare,
  Camera,
  MapPin,
  ShieldCheck,
  Eye,
  Printer,
  Download,
  Lock,
  Filter,
  Layers,
  CheckCheck,
  RefreshCw
} from 'lucide-react';
import { Student, Attendance, Assessment, DailyActivity, UserAccount, ChatMessage, TeacherAttendance, BimbelLocation, BimbelState, BroadcastMessage } from '../../types';
import { TeacherCheckInModal } from '../modals/TeacherCheckInModal';
import { ReportExportModal } from '../modals/ReportExportModal';
import { AnnouncementCard } from '../common/AnnouncementCard';
import { LeafletMapPicker } from '../ui/LeafletMapPicker';
import { playChatNotificationSound } from '../../utils/audioNotification';
import { deduplicateChats, useDebouncedUnreadCount } from '../../utils/chatUtils';

export type TeacherSubTab = 'dashboard' | 'presensi-guru' | 'absensi-siswa' | 'evaluasi-rapor' | 'galeri' | 'chat';

interface TeacherPortalProps {
  users?: UserAccount[];
  currentUser?: UserAccount | null;
  students: Student[];
  attendance: Attendance[];
  assessments: Assessment[];
  activities: DailyActivity[];
  chats?: ChatMessage[];
  broadcasts?: BroadcastMessage[];
  teacherAttendance?: TeacherAttendance[];
  locations?: BimbelLocation[];
  activeLocationId?: string;
  activeSubTab?: TeacherSubTab;
  onSubTabChange?: (tab: TeacherSubTab) => void;
  onAddAssessment: (assessment: Omit<Assessment, 'id'>) => void;
  onUpdateAttendanceBulk: (records: Attendance[]) => void;
  onAddActivity: (activity: Omit<DailyActivity, 'id'>) => void;
  onAddBroadcast?: (broadcast: any) => void;
  onDeleteBroadcast?: (id: string) => void;
  onUpdateTeacherAttendanceBulk?: (records: TeacherAttendance[]) => void;
  onAddChatMessage?: (
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

export default function TeacherPortal({
  users = [],
  currentUser = null,
  students,
  attendance,
  assessments,
  activities,
  chats = [],
  broadcasts = [],
  teacherAttendance = [],
  locations = [],
  activeLocationId,
  activeSubTab: controlledActiveSubTab,
  onSubTabChange,
  onAddAssessment,
  onUpdateAttendanceBulk,
  onAddActivity,
  onUpdateTeacherAttendanceBulk,
  onAddChatMessage,
  onMarkChatsAsRead,
}: TeacherPortalProps) {
  // Floating chat open/close state (identical to ParentPortal)
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Dynamically derive list of teachers
  const teacherUsers = users.filter(u => u.role === 'teacher');

  const defaultTeacherName = currentUser?.role === 'teacher'
    ? currentUser.name
    : (teacherUsers.length > 0 ? teacherUsers[0].name : (currentUser?.name || 'Guru Pembimbing'));

  // Selected teacher for simulation / active teacher account
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    if (currentUser?.role === 'teacher') return currentUser.id;
    if (teacherUsers.length > 0) return teacherUsers[0].id;
    return currentUser?.id || 't1';
  });

  // Sync selected teacher if logged in teacher changes
  useEffect(() => {
    if (currentUser?.role === 'teacher') {
      setSelectedTeacherId(currentUser.id);
    }
  }, [currentUser]);

  const activeTeacherUser: UserAccount = (currentUser?.role === 'teacher' && currentUser.id === selectedTeacherId ? currentUser : undefined) ||
    users.find(u => u.id === selectedTeacherId) || 
    (currentUser?.role === 'teacher' ? currentUser : teacherUsers[0]) || {
      id: currentUser?.id || 'teacher-default',
      name: defaultTeacherName,
      email: currentUser?.email || 'guru@bimbel.id',
      role: 'teacher' as const,
      subject: currentUser?.subject || 'Pengajar Bimbel',
      createdAt: '2026-01-01'
    };

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Student Attendance View Mode & Filters (Input vs Riwayat)
  const [studentAttViewMode, setStudentAttViewMode] = useState<'input' | 'riwayat'>('input');
  const [studentAttFilterClass, setStudentAttFilterClass] = useState<string>('Semua');
  const [studentAttFilterMonth, setStudentAttFilterMonth] = useState<string>('Semua');
  const [studentAttSearch, setStudentAttSearch] = useState<string>('');

  // Real-time User GPS Location State
  const [userLiveCoords, setUserLiveCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(true);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Auto-detect real-time GPS location of user
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setIsLocatingUser(false);
      return;
    }

    let watchId: number | null = null;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLiveCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLocatingUser(false);
        setGeoError(null);
      },
      (error) => {
        console.warn('Geolocation initial error:', error);
        setIsLocatingUser(false);
        setGeoError(error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Watch position for continuous real-time movement
    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLiveCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLocatingUser(false);
        },
        (err) => {
          console.warn('Geolocation watch error:', err);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    } catch (e) {
      console.warn('Watch position unavailable:', e);
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Today string
  const todayStr = new Date().toISOString().split('T')[0];

  // Self Attendance State for Active Teacher
  const [isSubmittingLeave, setIsSubmittingLeave] = useState<boolean>(false);
  const [leaveType, setLeaveType] = useState<'Izin' | 'Sakit'>('Izin');
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [teachingNoteInput, setTeachingNoteInput] = useState<string>('');
  const [isEditingTeachingNote, setIsEditingTeachingNote] = useState<boolean>(false);
  const [showAttendanceHistoryModal, setShowAttendanceHistoryModal] = useState<boolean>(false);
  
  // Live Camera + GPS Modal State
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [checkInModalMode, setCheckInModalMode] = useState<'check-in' | 'check-out'>('check-in');
  const [viewingPhotoModal, setViewingPhotoModal] = useState<{ photo: string; title: string; subtitle: string; address?: string; coords?: string } | null>(null);

  // Derive Today's Attendance Record for Active Teacher
  const activeTeacherTodayAtt = teacherAttendance.find(
    r => r.teacherId === activeTeacherUser.id && r.date === todayStr
  );

  // Format Time HH:mm
  const formatTimeHHmm = (d: Date) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  };

  // Handler to open Check-In Modal
  const handleOpenCheckInModal = () => {
    setCheckInModalMode('check-in');
    setIsCheckInModalOpen(true);
  };

  // Handler to open Check-Out Modal
  const handleOpenCheckOutModal = () => {
    setCheckInModalMode('check-out');
    setIsCheckInModalOpen(true);
  };

  // Callback on successful Check-In or Check-Out with Camera & GPS
  const handleCheckInModalSuccess = (data: {
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
  }) => {
    const existing = activeTeacherTodayAtt;
    const isCheckIn = checkInModalMode === 'check-in';

    // Status logic for Check-In: if after 08:30 WIB, status is Terlambat
    const [h, m] = data.timeHHmm.split(':').map(Number);
    const isLate = (h > 8 || (h === 8 && m > 30));
    const status: 'Hadir' | 'Terlambat' = isLate ? 'Terlambat' : 'Hadir';

    const newRecord: TeacherAttendance = {
      id: existing?.id || `tatt-${activeTeacherUser.id}-${todayStr}`,
      teacherId: activeTeacherUser.id,
      teacherName: activeTeacherUser.name,
      subject: activeTeacherUser.subject || 'Pengajar',
      date: todayStr,
      status: existing?.status || status,
      timeIn: isCheckIn ? data.timeHHmm : (existing?.timeIn || '08:00'),
      timeOut: !isCheckIn ? data.timeHHmm : (existing?.timeOut || null),
      notes: data.notes || existing?.notes || (isCheckIn ? (isLate ? 'Presensi masuk (Terlambat)' : 'Presensi masuk tepat waktu') : 'Selesai tugas mengajar'),
      
      // Master Location Sync
      locationId: data.locationId || existing?.locationId,
      locationName: data.locationName || existing?.locationName,

      // Selfie & GPS Fields
      photoBase64: isCheckIn ? data.photoBase64 : (existing?.photoBase64 || data.photoBase64),
      latitude: data.latitude,
      longitude: data.longitude,
      distanceMeters: data.distanceMeters,
      locationAddress: data.address,
      isWithinRadius: data.isWithinRadius,
      checkInTimestamp: isCheckIn ? data.timestamp : (existing?.checkInTimestamp || data.timestamp),
      
      checkOutPhotoBase64: !isCheckIn ? data.photoBase64 : existing?.checkOutPhotoBase64,
      checkOutLatitude: !isCheckIn ? data.latitude : existing?.checkOutLatitude,
      checkOutLongitude: !isCheckIn ? data.longitude : existing?.checkOutLongitude,
      checkOutAddress: !isCheckIn ? data.address : existing?.checkOutAddress,
      checkOutTimestamp: !isCheckIn ? data.timestamp : existing?.checkOutTimestamp,
    };

    if (onUpdateTeacherAttendanceBulk) {
      onUpdateTeacherAttendanceBulk([newRecord]);
    }

    if (isCheckIn) {
      showFeedback(`Presensi Masuk Berhasil (${data.timeHHmm} WIB) - Lokasi: ${data.locationName || 'Bimbel'} | Terverifikasi!`);
    } else {
      showFeedback(`Presensi Pulang Berhasil (${data.timeHHmm} WIB). Terima kasih atas dedikasinya hari ini!`);
    }
  };

  // Handler for Submitting Leave / Sick (Izin / Sakit)
  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      showFeedback('Harap tuliskan alasan atau keterangan izin/sakit.');
      return;
    }

    const newRecord: TeacherAttendance = {
      id: activeTeacherTodayAtt?.id || `tatt-${activeTeacherUser.id}-${todayStr}`,
      teacherId: activeTeacherUser.id,
      teacherName: activeTeacherUser.name,
      subject: activeTeacherUser.subject || 'Pengajar',
      date: todayStr,
      status: leaveType,
      timeIn: '-',
      timeOut: '-',
      notes: leaveReason.trim(),
    };

    if (onUpdateTeacherAttendanceBulk) {
      onUpdateTeacherAttendanceBulk([newRecord]);
    }

    setIsSubmittingLeave(false);
    setLeaveReason('');
    showFeedback(`Permohonan ${leaveType} berhasil disimpan dan diteruskan ke Admin.`);
  };

  // Handler for saving teaching notes
  const handleSaveTeachingNotes = () => {
    if (!teachingNoteInput.trim()) return;

    const newRecord: TeacherAttendance = {
      id: activeTeacherTodayAtt?.id || `tatt-${activeTeacherUser.id}-${todayStr}`,
      teacherId: activeTeacherUser.id,
      teacherName: activeTeacherUser.name,
      subject: activeTeacherUser.subject || 'Pengajar',
      date: todayStr,
      status: activeTeacherTodayAtt?.status || 'Hadir',
      timeIn: activeTeacherTodayAtt?.timeIn || formatTimeHHmm(new Date()),
      timeOut: activeTeacherTodayAtt?.timeOut || null,
      notes: teachingNoteInput.trim(),
    };

    if (onUpdateTeacherAttendanceBulk) {
      onUpdateTeacherAttendanceBulk([newRecord]);
    }

    setIsEditingTeachingNote(false);
    showFeedback('Catatan pengajaran hari ini berhasil diperbarui!');
  };

  // Calculate my attendance stats this month
  const myAttendanceRecords = teacherAttendance.filter(r => r.teacherId === activeTeacherUser.id);
  const myTotalHadir = myAttendanceRecords.filter(r => r.status === 'Hadir').length;
  const myTotalTerlambat = myAttendanceRecords.filter(r => r.status === 'Terlambat').length;
  const myTotalIzinSakit = myAttendanceRecords.filter(r => r.status === 'Izin' || r.status === 'Sakit').length;

  // Filter students assigned to this teacher (by teacherId, teacherName, or Subject specialization)
  const myAssignedStudents = students.filter(s => {
    if (s.teacherId && s.teacherId === activeTeacherUser.id) return true;
    if (s.teacherName && activeTeacherUser.name && s.teacherName.toLowerCase().trim() === activeTeacherUser.name.toLowerCase().trim()) return true;
    if (activeTeacherUser.subject && activeTeacherUser.subject !== 'Pengajar Bimbel' && activeTeacherUser.subject !== 'Semua Mata Pelajaran') {
      const subj = activeTeacherUser.subject.toLowerCase();
      if (s.className && s.className.toLowerCase().includes(subj)) return true;
      if (s.subject && s.subject.toLowerCase().includes(subj)) return true;
    }
    return false;
  });

  // Student scope toggle: 'my' (assigned to me) vs 'all' (all bimbel students)
  const [studentScope, setStudentScope] = useState<'my' | 'all'>('my');
  const displayStudents = (studentScope === 'my' && myAssignedStudents.length > 0) ? myAssignedStudents : students;

  // Chat pool is strictly the teacher's assigned students (isolated private chat)
  const chatStudentPool = myAssignedStudents.length > 0 ? myAssignedStudents : students;

  // Export / Print Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportPreselectedStudentId, setExportPreselectedStudentId] = useState<string | undefined>();

  // Assessment State
  const [assessmentStudentId, setAssessmentStudentId] = useState<string>('');
  const [assessmentSubject, setAssessmentSubject] = useState<'Membaca' | 'Berhitung' | 'Mengaji'>(() => {
    if (activeTeacherUser.subject === 'Berhitung') return 'Berhitung';
    if (activeTeacherUser.subject === 'Mengaji') return 'Mengaji';
    return 'Membaca';
  });
  const [assessmentAspects, setAssessmentAspects] = useState<{[key: string]: number}>({
    'Pemahaman Materi': 5,
    'Fokus Belajar': 5,
    'Keaktifan': 5,
    'Kerapian': 5,
  });
  const [assessmentNotes, setAssessmentNotes] = useState<string>('');
  const [assessmentTeacher, setAssessmentTeacher] = useState<string>(activeTeacherUser.name || defaultTeacherName);

  // Chat / Ruang Komunikasi State
  const [selectedChatStudentId, setSelectedChatStudentId] = useState<string>('');
  const [teacherChatInput, setTeacherChatInput] = useState<string>('');
  const [chatToast, setChatToast] = useState<{ id: string; sender: string; text: string; studentName: string; studentId?: string } | null>(null);
  const teacherTabChatBodyRef = useRef<HTMLDivElement>(null);
  const teacherFloatingChatBodyRef = useRef<HTMLDivElement>(null);
  const prevTeacherChatIdsRef = useRef<Set<string>>(new Set());
  const isTeacherInitialMountRef = useRef<boolean>(true);
  const prevTeacherStudentChatsCountRef = useRef<number>(0);
  const prevTeacherChatOpenRef = useRef<boolean>(false);
  const prevTeacherSubTabRef = useRef<string>('');
  const prevTeacherSelectedStudentIdRef = useRef<string>('');
  const prevTeacherUnreadKeyRef = useRef<string>('');

  // Sync active teacher into assessment states
  useEffect(() => {
    setAssessmentTeacher(activeTeacherUser.name);
    if (activeTeacherUser.subject === 'Berhitung') setAssessmentSubject('Berhitung');
    else if (activeTeacherUser.subject === 'Mengaji') setAssessmentSubject('Mengaji');
    else if (activeTeacherUser.subject === 'Membaca') setAssessmentSubject('Membaca');
  }, [activeTeacherUser]);

  // Bulk Attendance State (For Students)
  const [bulkAttendanceList, setBulkAttendanceList] = useState<{[key: string]: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat' | null}>(
    students.reduce((acc, stud) => {
      const existing = attendance.find(a => a.studentId === stud.id && a.date === todayStr);
      acc[stud.id] = existing ? existing.status : 'Hadir';
      return acc;
    }, {} as {[key: string]: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat' | null})
  );

  const handleToggleStatus = (studentId: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat') => {
    setBulkAttendanceList(prev => {
      const current = prev[studentId];
      if (current === status) {
        return { ...prev, [studentId]: null };
      }
      return { ...prev, [studentId]: status };
    });
  };
  
  // Media Upload State
  const [mediaTitle, setMediaTitle] = useState<string>('');
  const [mediaDesc, setMediaDesc] = useState<string>('');
  const [mediaClass, setMediaClass] = useState<string>('Semua Mata Pelajaran');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [previewFile, setPreviewFile] = useState<string>('');

  // Notification feedbacks
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const activeTeacherName = activeTeacherUser.name || defaultTeacherName;

  // Subtab navigation state for Teacher Sidebar (Controlled or fallback)
  const [internalActiveSubTab, setInternalActiveSubTab] = useState<TeacherSubTab>('dashboard');
  const activeSubTab = controlledActiveSubTab !== undefined ? controlledActiveSubTab : internalActiveSubTab;
  const setActiveSubTab = (tab: TeacherSubTab) => {
    if (onSubTabChange) onSubTabChange(tab);
    setInternalActiveSubTab(tab);
  };

  const teacherNavItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      desc: 'Ringkasan & Informasi',
      icon: LayoutDashboard,
    },
    {
      id: 'presensi-guru' as const,
      label: 'Presensi',
      desc: 'Absensi Selfie & GPS',
      icon: Camera,
    },
    {
      id: 'absensi-siswa' as const,
      label: 'Presensi Siswa',
      desc: 'Presensi massal harian',
      icon: UserCheck,
    },
    {
      id: 'evaluasi-rapor' as const,
      label: 'Evaluasi & Rapor',
      desc: 'Input nilai & cetak PDF',
      icon: Award,
    },
    {
      id: 'galeri' as const,
      label: 'Galeri Aktivitas',
      desc: 'Posting liputan kelas',
      icon: ImageIcon,
    },
    {
      id: 'chat' as const,
      label: 'Pesan & Chat Wali',
      desc: 'Komunikasi privat wali murid',
      icon: MessageSquare,
    },
  ];

  const navScrollRef = useRef<HTMLElement>(null);
  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      const scrollAmount = 220;
      navScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Select initial student for chat if none selected or if not in current pool
  useEffect(() => {
    if (chatStudentPool.length > 0 && (!selectedChatStudentId || !chatStudentPool.some(s => s.id === selectedChatStudentId))) {
      setSelectedChatStudentId(chatStudentPool[0].id);
    }
  }, [chatStudentPool, selectedChatStudentId]);

  // Select initial student for assessment if none selected
  useEffect(() => {
    if (displayStudents.length > 0 && (!assessmentStudentId || !displayStudents.some(s => s.id === assessmentStudentId))) {
      setAssessmentStudentId(displayStudents[0].id);
    }
  }, [displayStudents, assessmentStudentId]);

  const activeChatStudent = chatStudentPool.find(s => s.id === selectedChatStudentId) || chatStudentPool[0];

  // Isolated chat messages: Only for this student and this teacher (memoized & deduplicated)
  const currentStudentChats = useMemo(() => {
    const deduped = deduplicateChats(chats);
    return deduped.filter(c => 
      activeChatStudent && (!c.studentId || c.studentId === activeChatStudent.id)
    );
  }, [chats, activeChatStudent]);

  // Centralized Single Source of Truth for unread messages with debounce & deduplication
  const unreadCount = useDebouncedUnreadCount(
    chats,
    useMemo(() => ({
      targetRole: 'teacher' as const,
    }), []),
    350
  );

  const scrollTeacherChatToBottom = useCallback((smooth = false) => {
    const scrollElem = (elem: HTMLDivElement | null) => {
      if (!elem) return;
      if (smooth) {
        elem.scrollTo({ top: elem.scrollHeight, behavior: 'smooth' });
      } else {
        elem.scrollTop = elem.scrollHeight;
      }
    };
    scrollElem(teacherTabChatBodyRef.current);
    scrollElem(teacherFloatingChatBodyRef.current);
  }, []);

  // Lock scroll position: ONLY scroll when chat is opened, student changed, or a new message is added
  useEffect(() => {
    const isNowOpen = isChatOpen;
    const wasOpen = prevTeacherChatOpenRef.current;
    const currentSubTab = activeSubTab;
    const wasSubTab = prevTeacherSubTabRef.current;
    const studentChanged = prevTeacherSelectedStudentIdRef.current !== selectedChatStudentId;
    const currentCount = currentStudentChats.length;
    const countIncreased = currentCount > prevTeacherStudentChatsCountRef.current;

    prevTeacherChatOpenRef.current = isNowOpen;
    prevTeacherSubTabRef.current = currentSubTab;
    prevTeacherSelectedStudentIdRef.current = selectedChatStudentId;
    prevTeacherStudentChatsCountRef.current = currentCount;

    const isViewing = isNowOpen || currentSubTab === 'chat';
    const justOpened = (!wasOpen && isNowOpen) || (wasSubTab !== 'chat' && currentSubTab === 'chat');

    if (isViewing) {
      if (justOpened || studentChanged) {
        requestAnimationFrame(() => {
          scrollTeacherChatToBottom(false);
        });
      } else if (countIncreased) {
        requestAnimationFrame(() => {
          scrollTeacherChatToBottom(true);
        });
      }
      // Note: Status changes (read/delivered checkmark) do not trigger scroll
    }
  }, [isChatOpen, activeSubTab, selectedChatStudentId, currentStudentChats.length, scrollTeacherChatToBottom]);

  // Real-time audio chime and toast notification listener for teacher
  useEffect(() => {
    const currentIds = new Set(chats.map(c => c.id));
    if (isTeacherInitialMountRef.current) {
      prevTeacherChatIdsRef.current = currentIds;
      isTeacherInitialMountRef.current = false;
      return;
    }

    const newIncoming = chats.filter(c => 
      !prevTeacherChatIdsRef.current.has(c.id) && 
      c.sender === 'orangtua'
    );

    prevTeacherChatIdsRef.current = currentIds;

    if (newIncoming.length > 0) {
      const latest = newIncoming[newIncoming.length - 1];
      if (!isChatOpen && activeSubTab !== 'chat') {
        playChatNotificationSound();
        setChatToast({
          id: latest.id,
          sender: latest.senderName || 'Wali Murid',
          text: latest.message,
          studentName: latest.studentName || 'Siswa Bimbel',
          studentId: latest.studentId,
        });
      }
    }
  }, [chats, isChatOpen, activeSubTab]);

  // Auto-dismiss toast notification after 6 seconds
  useEffect(() => {
    if (chatToast) {
      const timer = setTimeout(() => {
        setChatToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [chatToast]);

  // Auto-mark unread messages as read when teacher opens chat or views a student
  useEffect(() => {
    if ((isChatOpen || activeSubTab === 'chat') && onMarkChatsAsRead && activeChatStudent) {
      const unreadForThisStudent = chats.filter(c => 
        c.sender === 'orangtua' && 
        (!c.studentId || c.studentId === activeChatStudent.id) && 
        c.status !== 'read' && 
        !c.isRead
      );
      const unreadIds = unreadForThisStudent.map(c => c.id);
      const unreadKey = unreadIds.sort().join(',');

      if (unreadIds.length > 0 && unreadKey !== prevTeacherUnreadKeyRef.current) {
        prevTeacherUnreadKeyRef.current = unreadKey;
        onMarkChatsAsRead(unreadIds);
      } else if (unreadIds.length === 0) {
        prevTeacherUnreadKeyRef.current = '';
      }
    }
  }, [isChatOpen, activeSubTab, selectedChatStudentId, chats, onMarkChatsAsRead, activeChatStudent]);

  // Send message handler for teacher
  const handleTeacherSendMessage = (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msgToSend = (customMsg !== undefined ? customMsg : teacherChatInput).trim();
    if (!msgToSend || !activeChatStudent) return;

    if (onAddChatMessage) {
      onAddChatMessage(
        'guru',
        activeTeacherName,
        msgToSend,
        activeChatStudent.id,
        activeChatStudent.name,
        activeTeacherName,
        activeChatStudent.parentName,
        activeTeacherUser.id,
        activeChatStudent.parentPhone || activeChatStudent.id,
        activeTeacherUser.id,
        undefined
      );
    }

    if (customMsg === undefined) {
      setTeacherChatInput('');
    }
  };

  const handleRatingChange = (aspectName: string, value: number) => {
    setAssessmentAspects(prev => ({
      ...prev,
      [aspectName]: value
    }));
  };

  const handleAddAssessmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const studId = assessmentStudentId || (students[0]?.id || '');
    if (!studId) {
      showFeedback('Kesalahan: Belum ada data siswa terpilih.');
      return;
    }
    const student = students.find(s => s.id === studId);
    if (!student) return;

    const formattedAspects = Object.keys(assessmentAspects).map(key => ({
      name: key,
      score: assessmentAspects[key]
    }));

    onAddAssessment({
      studentId: studId,
      studentName: student.name,
      subject: assessmentSubject,
      date: todayStr,
      aspects: formattedAspects,
      notes: assessmentNotes || 'Anak menyelesaikan sesi dengan baik tanpa kendala.',
      teacherName: assessmentTeacher
    });

    setAssessmentNotes('');
    showFeedback(`Sukses: Rapor tumbuh kembang ${student.name} berhasil diunggah!`);
  };

  const handleBulkAttendanceSubmit = () => {
    const updatedRecords: Attendance[] = [];
    students.forEach(stud => {
      const status = bulkAttendanceList[stud.id];
      if (status) {
        updatedRecords.push({
          id: `att-${stud.id}-${todayStr}`,
          studentId: stud.id,
          studentName: stud.name,
          date: todayStr,
          timeIn: status === 'Hadir' ? '14:00' : status === 'Terlambat' ? '14:20' : '00:00',
          timeOut: status === 'Hadir' ? '15:30' : null,
          status: status
        });
      }
    });
    onUpdateAttendanceBulk(updatedRecords);
    showFeedback(`Sukses: Absensi massal diperbarui (${updatedRecords.length} siswa tersimpan)!`);
  };

  // Convert uploaded image to Base64
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewFile(base64String);
        setMediaUrl(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMediaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaTitle.trim() || !mediaDesc.trim()) {
      showFeedback('Kesalahan: Judul dan deskripsi galeri wajib diisi.');
      return;
    }

    const fallbackImage = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80';

    onAddActivity({
      title: mediaTitle,
      description: mediaDesc,
      mediaUrl: mediaUrl || fallbackImage,
      mediaType: 'image',
      date: todayStr,
      targetClass: mediaClass
    });

    setMediaTitle('');
    setMediaDesc('');
    setPreviewFile('');
    setMediaUrl('');
    showFeedback('Sukses: Liputan aktivitas harian berhasil dipublikasikan!');
  };

  // Quick reply options for teachers
  const quickReplies = [
    "Alhamdulillah ananda sangat bersemangat dan fokus belajar hari ini! 🌟",
    "Materi hari ini sudah dipahami dengan lancar tanpa kendala. 📚",
    "Buku PR & lembar aktivitas sudah dimasukkan rapi ke dalam tas ananda ya Bunda. 🎒",
    "Sesi belajar telah selesai tepat waktu, ananda sedang menunggu di ruang lobi. ⏰",
    "Terima kasih informasinya Ayah/Bunda, kami catat dan dampingi ananda dengan baik. ❤️"
  ];

  if (students.length === 0) {
    return (
      <div id="teacher-empty-state" className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-[#E4D8E6] shadow-premium max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 bg-[#FDF0DF] rounded-2xl flex items-center justify-center text-brand-accent mb-6">
          <User className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-brand-dark mb-2">Belum Ada Data Siswa</h3>
        <p className="text-gray-500 max-w-md mb-8">
          Portal Guru memerlukan siswa aktif untuk melakukan penilaian, absensi, dan komunikasi dengan orang tua. Silakan registrasikan murid baru melalui Portal Admin.
        </p>
      </div>
    );
  }

  return (
    <div id="teacher-portal-root" className="space-y-6 animate-fade-in relative">
      
      {/* Toast Alert Feedback */}
      {feedbackMsg && (
        <div className="fixed top-6 right-6 z-50 bg-brand-dark text-white text-sm font-bold px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-brand-accent/20 animate-bounce">
          <Sparkles className="w-5 h-5 text-brand-accent" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white rounded-3xl border border-[#E4D8E6] p-4 sm:p-6 shadow-premium flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold uppercase bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full">
              Ruang Pengajar
            </span>
            <span className="text-xs font-bold text-gray-500">
              Pengajar: <strong className="text-brand-dark font-extrabold">{activeTeacherName}</strong>
            </span>
            {activeTeacherUser.subject && (
              <span className="text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Mengajar: {activeTeacherUser.subject}
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-brand-dark mt-1">Portal Guru & Tentor</h2>
        </div>

        {/* Action Controls & Scope Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Scope filter: My students vs All students */}
          <div className="bg-brand-light p-1 rounded-2xl border border-[#E4D8E6] flex items-center gap-1">
            <button
              type="button"
              onClick={() => setStudentScope('my')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                studentScope === 'my'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-gray-600 hover:text-brand-dark'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Murid Saya ({myAssignedStudents.length})
            </button>
            <button
              type="button"
              onClick={() => setStudentScope('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                studentScope === 'all'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-gray-600 hover:text-brand-dark'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Semua ({students.length})
            </button>
          </div>

          {/* Cetak & Ekspor PDF Button */}
          <button
            type="button"
            onClick={() => {
              setExportPreselectedStudentId(selectedChatStudentId || myAssignedStudents[0]?.id || students[0]?.id);
              setIsExportModalOpen(true);
            }}
            className="px-3.5 py-2 bg-white hover:bg-brand-light text-brand-dark border border-[#E4D8E6] hover:border-brand-primary/40 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="Cetak & Ekspor Rapor, Absensi, atau Jadwal ke PDF"
          >
            <Printer className="w-3.5 h-3.5 text-brand-primary" />
            <span>Cetak & Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* In-App Announcement Card (Responsive & Expandable) */}
      {broadcasts && broadcasts.length > 0 && (
        <AnnouncementCard broadcasts={broadcasts} />
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
            className="space-y-6"
          >
              {/* SUBTAB 0: DASHBOARD OVERVIEW (CLEAN & STATS ONLY) */}
              {activeSubTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Quick Stat Cards (4 concise cards) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Status Presensi Guru Hari Ini */}
                    <div className="bg-white p-5 rounded-3xl border border-[#E4D8E6] shadow-premium flex flex-col justify-between hover:border-emerald-300 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Status Presensi Hari Ini</span>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                          activeTeacherTodayAtt?.status === 'Hadir' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          <Camera className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                            activeTeacherTodayAtt?.status === 'Hadir'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : activeTeacherTodayAtt?.status === 'Terlambat'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            {activeTeacherTodayAtt ? `${activeTeacherTodayAtt.status} (${activeTeacherTodayAtt.timeIn || '-'} WIB)` : 'Belum Presensi'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </p>
                      </div>
                    </div>

                    {/* 2. Murid Bimbingan Aktif */}
                    <div className="bg-white p-5 rounded-3xl border border-[#E4D8E6] shadow-premium flex flex-col justify-between hover:border-brand-primary/40 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Murid Bimbingan</span>
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-brand-primary">
                          <Users className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-brand-dark">{myAssignedStudents.length} Siswa</div>
                        <p className="text-xs text-gray-500 mt-1 font-medium">{activeTeacherUser.subject || 'Pengajar Bimbel'}</p>
                      </div>
                    </div>

                    {/* 3. Evaluasi & Rapor Terinput */}
                    <div className="bg-white p-5 rounded-3xl border border-[#E4D8E6] shadow-premium flex flex-col justify-between hover:border-brand-primary/40 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Rapor Tersimpan</span>
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                          <Award className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-brand-dark">
                          {assessments.filter(a => a.teacherName === activeTeacherUser.name || !a.teacherName).length} Evaluasi
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Capaian 4 Pilar Belajar</p>
                      </div>
                    </div>

                    {/* 4. Dokumentasi Galeri */}
                    <div className="bg-white p-5 rounded-3xl border border-[#E4D8E6] shadow-premium flex flex-col justify-between hover:border-brand-primary/40 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Galeri Dokumentasi</span>
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-brand-dark">{activities.length} Kegiatan</div>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Liputan Foto Kelas</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 1: PRESENSI MANDIRI GURU */}
              {activeSubTab === 'presensi-guru' && (() => {
                const targetLocation: BimbelLocation = (
                  locations.find(l => l.id === activeLocationId) ||
                  locations.find(l => l.isDefault) ||
                  locations[0] || {
                    id: 'loc-pusat',
                    name: 'Bimbel Rumah CahayaQu (Pusat)',
                    address: 'Blok Ranca Gunda, Desa Jangga, Kec. Losarang, Kab. Indramayu, Jawa Barat 45253',
                    latitude: -6.4063056,
                    longitude: 108.1679722,
                    radiusMeters: 10,
                    isActive: true,
                    isDefault: true,
                  }
                );

                const currentDistance = userLiveCoords ? (() => {
                  const R = 6371000;
                  const dLat = ((targetLocation.latitude - userLiveCoords.latitude) * Math.PI) / 180;
                  const dLon = ((targetLocation.longitude - userLiveCoords.longitude) * Math.PI) / 180;
                  const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos((userLiveCoords.latitude * Math.PI) / 180) *
                      Math.cos((targetLocation.latitude * Math.PI) / 180) *
                      Math.sin(dLon / 2) *
                      Math.sin(dLon / 2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  return Math.round(R * c);
                })() : null;

                const isWithinRadius = currentDistance !== null && currentDistance <= (targetLocation.radiusMeters || 10);

                const handleRefreshGPS = () => {
                  setIsLocatingUser(true);
                  setGeoError(null);
                  if (!navigator.geolocation) {
                    setIsLocatingUser(false);
                    setGeoError('Perangkat tidak mendukung geolokasi');
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setUserLiveCoords({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                      });
                      setIsLocatingUser(false);
                      setGeoError(null);
                      showFeedback('Sinyal GPS berhasil diperbarui secara real-time!');
                    },
                    (err) => {
                      setIsLocatingUser(false);
                      setGeoError(err.message);
                      showFeedback('Gagal mendeteksi GPS. Pastikan izin lokasi aktif di browser Anda.');
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                  );
                };

                return (
                  <div className="bg-white rounded-3xl border border-[#E4D8E6] p-5 sm:p-6 shadow-premium relative overflow-hidden space-y-5">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-brand-primary to-amber-500" />

                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#F3EDF5]">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-brand-dark">Presensi Selfie Wajah &amp; GPS Guru</h3>
                          <p className="text-xs text-gray-500 font-medium">Verifikasi koordinat GPS real-time &amp; batas radius kehadiran bimbel</p>
                        </div>
                      </div>

                      {/* Jam & Riwayat */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="bg-brand-light border border-[#E4D8E6] px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs">
                          <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
                          <span className="font-mono font-black text-brand-dark">
                            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowAttendanceHistoryModal(true)}
                          className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <History className="w-3.5 h-3.5" />
                          Riwayat Presensi ({myAttendanceRecords.length})
                        </button>
                      </div>
                    </div>

                    {/* GPS Telemetry Banner Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* 1. Status Sinyal GPS */}
                      <div className="p-3.5 rounded-2xl bg-[#FAF7F5] border border-[#EFE5DC] flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Status GPS</span>
                          <span className={`w-2.5 h-2.5 rounded-full ${userLiveCoords ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-black text-brand-dark flex items-center gap-1.5">
                            {userLiveCoords ? (
                              <span className="text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sinyal Terkunci
                              </span>
                            ) : (
                              <span className="text-amber-700 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Sedang Mendeteksi
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-gray-500 mt-0.5 truncate">
                            {userLiveCoords ? `${userLiveCoords.latitude.toFixed(5)}, ${userLiveCoords.longitude.toFixed(5)}` : 'Memeriksa GPS...'}
                          </p>
                        </div>
                      </div>

                      {/* 2. Titik Pusat Bimbel Target */}
                      <div className="p-3.5 rounded-2xl bg-[#FAF7F5] border border-[#EFE5DC] flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Pusat Bimbel</span>
                          <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-black text-brand-dark truncate">{targetLocation.name}</div>
                          <p className="text-[11px] font-mono text-gray-500 mt-0.5">
                            {targetLocation.latitude.toFixed(5)}, {targetLocation.longitude.toFixed(5)}
                          </p>
                        </div>
                      </div>

                      {/* 3. Jarak Real-Time */}
                      <div className="p-3.5 rounded-2xl bg-[#FAF7F5] border border-[#EFE5DC] flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Jarak Ke Bimbel</span>
                          <span className="text-[10px] font-bold text-gray-400">Radius: {targetLocation.radiusMeters || 10}m</span>
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-black text-brand-dark flex items-center gap-1">
                            {currentDistance !== null ? (
                              <span className={isWithinRadius ? 'text-emerald-700 font-extrabold' : 'text-amber-700 font-extrabold'}>
                                {currentDistance} Meter
                              </span>
                            ) : (
                              <span className="text-gray-400">Menghitung...</span>
                            )}
                          </div>
                          <span className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                            isWithinRadius 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isWithinRadius ? '✅ Dalam Radius Absen' : '⚠️ Di Luar Radius Bimbel'}
                          </span>
                        </div>
                      </div>

                      {/* 4. Tombol Refresh GPS */}
                      <div className="p-3.5 rounded-2xl bg-white border border-[#E4D8E6] flex flex-col justify-between">
                        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Aksi GPS</span>
                        <div className="mt-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleRefreshGPS}
                            disabled={isLocatingUser}
                            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isLocatingUser ? 'animate-spin' : ''}`} />
                            <span>{isLocatingUser ? 'Memperbarui...' : 'Perbarui GPS'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Crystal Clear Map View */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-brand-dark flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-brand-primary" />
                          <span>Peta Satelit &amp; Koordinat GPS Interaktif (Jelas &amp; Terang)</span>
                        </span>
                        <span className="text-[11px] text-gray-500">
                          Gunakan tombol di pojok kanan peta untuk ganti tampilan (Peta Biasa / Satelit HD / OpenStreetMap)
                        </span>
                      </div>

                      <LeafletMapPicker
                        latitude={targetLocation.latitude}
                        longitude={targetLocation.longitude}
                        radiusMeters={targetLocation.radiusMeters || 10}
                        branchName={targetLocation.name}
                        userLatitude={userLiveCoords ? userLiveCoords.latitude : targetLocation.latitude}
                        userLongitude={userLiveCoords ? userLiveCoords.longitude : targetLocation.longitude}
                        height="340px"
                        isReadOnly={true}
                        showToolbar={true}
                        showUserMarker={true}
                        showTargetCircle={true}
                      />
                    </div>

                    {/* Banner Status Presensi & Action Buttons */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch pt-2">
                      {/* Box Status Presensi & Detail */}
                      <div className="lg:col-span-7 bg-[#FAF7F5] rounded-2xl p-4 sm:p-5 border border-[#ECE2D8] flex flex-col justify-between gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Status Presensi Hari Ini</span>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {activeTeacherTodayAtt ? (
                                <span className={`px-3 py-1 rounded-xl font-extrabold text-xs flex items-center gap-1.5 border shadow-2xs ${
                                  activeTeacherTodayAtt.status === 'Hadir'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : activeTeacherTodayAtt.status === 'Terlambat'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : 'bg-blue-50 text-blue-800 border-blue-300'
                                }`}>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Status: {activeTeacherTodayAtt.status} ({activeTeacherTodayAtt.timeIn || '-'} WIB)
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-xl font-extrabold text-xs bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                  Belum Mengisi Presensi Hari Ini
                                </span>
                              )}
                              <span className="text-xs font-bold text-brand-dark">Guru: {activeTeacherUser.name}</span>
                            </div>
                          </div>
                        </div>

                        {/* Detail Info Selfie, Jam Masuk & Jam Pulang */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                          {/* Selfie Thumbnail */}
                          <div className="bg-white p-2.5 rounded-xl border border-[#E4D8E6] flex flex-col justify-between">
                            <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                              <Camera className="w-3 h-3 text-emerald-600" /> Foto Wajah Live
                            </p>
                            {activeTeacherTodayAtt?.photoBase64 ? (
                              <div 
                                onClick={() => setViewingPhotoModal({
                                  photo: activeTeacherTodayAtt.photoBase64!,
                                  title: `Foto Selfie: ${activeTeacherUser.name}`,
                                  subtitle: `${activeTeacherTodayAtt.date} | Jam ${activeTeacherTodayAtt.timeIn || '-'} WIB`,
                                  address: activeTeacherTodayAtt.locationAddress,
                                  coords: activeTeacherTodayAtt.latitude ? `${activeTeacherTodayAtt.latitude.toFixed(6)}, ${activeTeacherTodayAtt.longitude?.toFixed(6)}` : undefined
                                })}
                                className="mt-1.5 relative aspect-video rounded-lg overflow-hidden border border-[#E4D8E6] cursor-pointer group hover:opacity-90 transition-opacity"
                              >
                                <img src={activeTeacherTodayAtt.photoBase64} alt="Selfie" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Eye className="w-4 h-4" />
                                </div>
                              </div>
                            ) : (
                              <div className="mt-1.5 h-12 bg-gray-50 rounded-lg border border-dashed border-[#E4D8E6] flex items-center justify-center text-gray-400 text-[10px]">
                                Belum ambil foto
                              </div>
                            )}
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-[#E4D8E6]">
                            <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                              <LogIn className="w-3 h-3 text-emerald-600" /> Jam Masuk
                            </p>
                            <p className="text-sm font-black text-brand-dark mt-1 font-mono">{activeTeacherTodayAtt?.timeIn ? `${activeTeacherTodayAtt.timeIn} WIB` : '-'}</p>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-[#E4D8E6]">
                            <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                              <LogOut className="w-3 h-3 text-blue-600" /> Jam Pulang
                            </p>
                            <p className="text-sm font-black text-brand-dark mt-1 font-mono">{activeTeacherTodayAtt?.timeOut ? `${activeTeacherTodayAtt.timeOut} WIB` : '-'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Aksi Buka Kamera Selfie & GPS */}
                      <div className="lg:col-span-5 flex flex-col justify-between gap-3 bg-white p-4.5 rounded-2xl border border-[#E4D8E6]">
                        <span className="text-[11px] font-extrabold text-brand-dark uppercase tracking-wider block">
                          Aksi Presensi Selfie Wajah &amp; GPS
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
                          {/* Tombol Check-In */}
                          <button
                            type="button"
                            onClick={handleOpenCheckInModal}
                            className={`p-3.5 rounded-2xl font-extrabold text-xs transition-all flex flex-col items-center justify-center gap-1.5 border cursor-pointer active:scale-95 shadow-sm ${
                              activeTeacherTodayAtt?.timeIn && activeTeacherTodayAtt.timeIn !== '-'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-emerald-600/20'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Camera className="w-4 h-4" />
                              <LogIn className="w-4 h-4 shrink-0" />
                            </div>
                            <span>{activeTeacherTodayAtt?.timeIn && activeTeacherTodayAtt.timeIn !== '-' ? 'Absen Masuk Ulang' : 'Ambil Selfie Absen Masuk'}</span>
                            <span className="text-[10px] opacity-80 font-normal">Wajah &amp; Otomatis Terkirim</span>
                          </button>

                          {/* Tombol Check-Out */}
                          <button
                            type="button"
                            onClick={handleOpenCheckOutModal}
                            className={`p-3.5 rounded-2xl font-extrabold text-xs transition-all flex flex-col items-center justify-center gap-1.5 border cursor-pointer active:scale-95 shadow-sm ${
                              activeTeacherTodayAtt?.timeOut && activeTeacherTodayAtt.timeOut !== '-'
                                ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                                : 'bg-brand-primary hover:bg-brand-primary/95 text-white border-brand-primary'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Camera className="w-4 h-4" />
                              <LogOut className="w-4 h-4 shrink-0" />
                            </div>
                            <span>{activeTeacherTodayAtt?.timeOut && activeTeacherTodayAtt.timeOut !== '-' ? 'Absen Pulang Ulang' : 'Ambil Selfie Absen Pulang'}</span>
                            <span className="text-[10px] opacity-80 font-normal">Wajah &amp; Otomatis Terkirim</span>
                          </button>
                        </div>

                        <div className="pt-2 border-t border-[#F3EDF5] flex items-center justify-between gap-2 text-[11px] text-gray-500 flex-wrap">
                          <span>Titik Bimbel: <strong className="font-mono">{targetLocation.latitude.toFixed(6)}, {targetLocation.longitude.toFixed(6)}</strong></span>
                          <span className="font-bold text-emerald-700">Toleransi: {targetLocation.radiusMeters || 10}m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

        {/* SUBTAB 2: ABSENSI MASSAL SISWA & RIWAYAT */}
        {activeSubTab === 'absensi-siswa' && (
        <div className="bg-white rounded-3xl border border-[#E4D8E6] p-6 shadow-premium space-y-5">
          {/* Header & Sub-tab Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F3EDF5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ListTodo className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-dark">Presensi &amp; Kehadiran Siswa</h3>
                <p className="text-xs text-gray-400">Input absensi harian dan pantau rekap riwayat kehadiran kelas</p>
              </div>
            </div>

            {/* Sub-section Switcher */}
            <div className="flex items-center gap-1 bg-brand-light p-1 rounded-2xl border border-[#DFD6C2] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setStudentAttViewMode('input')}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  studentAttViewMode === 'input'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-brand-dark'
                }`}
              >
                Input Presensi Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setStudentAttViewMode('riwayat')}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  studentAttViewMode === 'riwayat'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-brand-dark'
                }`}
              >
                Riwayat Kehadiran Siswa
              </button>
            </div>
          </div>

          {/* VIEW 1: INPUT PRESENSI HARI INI */}
          {studentAttViewMode === 'input' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">
                  Daftar Siswa Bimbingan ({displayStudents.length} Siswa)
                </span>
                <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full font-mono">
                  {todayStr}
                </span>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {displayStudents.map((stud) => {
                  const currentStatus = bulkAttendanceList[stud.id];
                  return (
                    <div key={stud.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-brand-light border border-[#EFEAE2] hover:border-brand-primary/20 transition-all">
                      <div className="space-y-0.5">
                        <div className="font-bold text-brand-dark text-sm">{stud.name}</div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-brand-primary font-semibold uppercase">{stud.className}</span>
                          {stud.teacherName && (
                            <span className="text-[10px] text-gray-400 font-medium">• Guru: {stud.teacherName}</span>
                          )}
                        </div>
                      </div>

                      {/* Radio Options */}
                      <div className="flex flex-wrap gap-1.5">
                        {(['Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat'] as const).map((status) => {
                          const isSelected = currentStatus === status;
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleToggleStatus(stud.id, status)}
                              title={isSelected ? `Klik untuk membatalkan ${status}` : `Pilih ${status}`}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                isSelected
                                  ? status === 'Hadir' ? 'bg-green-600 text-white shadow-sm ring-2 ring-green-600/30' :
                                    status === 'Alpa' ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-600/30' :
                                    'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30'
                                  : 'bg-white hover:bg-gray-100 text-gray-500 border border-[#EFEAE2]'
                              }`}
                            >
                              {status}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[#F3EDF5] flex justify-end">
                <button
                  type="button"
                  onClick={handleBulkAttendanceSubmit}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                >
                  <Check className="w-5 h-5" />
                  Simpan Absensi Hari Ini
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: RIWAYAT KEHADIRAN SISWA / KELAS */}
          {studentAttViewMode === 'riwayat' && (() => {
            // Filter attendance records
            const availableClasses = Array.from(new Set(displayStudents.map(s => s.className).filter(Boolean)));
            const availableMonths = Array.from(new Set(attendance.map(a => a.date ? a.date.substring(0, 7) : '').filter(Boolean))).sort().reverse();

            const filteredHistory = attendance.filter(record => {
              // Match student in displayStudents
              const matchingStudent = displayStudents.find(s => 
                s.id === record.studentId || 
                (s.name && record.studentName && s.name.toLowerCase().trim() === record.studentName.toLowerCase().trim())
              );
              if (!matchingStudent) return false;

              // Class filter
              if (studentAttFilterClass !== 'Semua' && matchingStudent.className !== studentAttFilterClass) {
                return false;
              }

              // Month filter
              if (studentAttFilterMonth !== 'Semua' && record.date && !record.date.startsWith(studentAttFilterMonth)) {
                return false;
              }

              // Search query
              if (studentAttSearch.trim()) {
                const q = studentAttSearch.toLowerCase();
                const sName = (record.studentName || matchingStudent.name || '').toLowerCase();
                if (!sName.includes(q)) return false;
              }

              return true;
            });

            // Statistics
            const totalRecords = filteredHistory.length;
            const totalHadir = filteredHistory.filter(r => r.status === 'Hadir' || r.status === 'Terlambat').length;
            const totalSakit = filteredHistory.filter(r => r.status === 'Sakit').length;
            const totalIzin = filteredHistory.filter(r => r.status === 'Izin').length;
            const totalAlpa = filteredHistory.filter(r => r.status === 'Alpa').length;
            const pctHadir = totalRecords > 0 ? Math.round((totalHadir / totalRecords) * 100) : 0;

            return (
              <div className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Filter Kelas / Program</label>
                    <select
                      value={studentAttFilterClass}
                      onChange={(e) => setStudentAttFilterClass(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-brand-light border border-[#DFD6C2] rounded-xl text-brand-dark focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Semua">Semua Kelas</option>
                      {availableClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Filter Periode Bulan</label>
                    <select
                      value={studentAttFilterMonth}
                      onChange={(e) => setStudentAttFilterMonth(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-brand-light border border-[#DFD6C2] rounded-xl text-brand-dark focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Semua">Semua Periode</option>
                      {availableMonths.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Cari Nama Siswa</label>
                    <input
                      type="text"
                      placeholder="Ketik nama ananda..."
                      value={studentAttSearch}
                      onChange={(e) => setStudentAttSearch(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-brand-light border border-[#DFD6C2] rounded-xl text-brand-dark focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className="p-3 rounded-2xl bg-brand-light border border-[#DFD6C2] text-center">
                    <p className="text-[10px] font-extrabold uppercase text-gray-500">Total Sesi</p>
                    <p className="text-base font-black text-brand-dark mt-0.5">{totalRecords}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                    <p className="text-[10px] font-extrabold uppercase text-emerald-700">Hadir ({pctHadir}%)</p>
                    <p className="text-base font-black text-emerald-800 mt-0.5">{totalHadir}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                    <p className="text-[10px] font-extrabold uppercase text-blue-700">Sakit</p>
                    <p className="text-base font-black text-blue-800 mt-0.5">{totalSakit}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                    <p className="text-[10px] font-extrabold uppercase text-amber-700">Izin</p>
                    <p className="text-base font-black text-amber-800 mt-0.5">{totalIzin}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-center col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-extrabold uppercase text-red-700">Alpa</p>
                    <p className="text-base font-black text-red-800 mt-0.5">{totalAlpa}</p>
                  </div>
                </div>

                {/* History Table */}
                <div className="border border-[#EFEAE2] rounded-2xl overflow-hidden">
                  <div className="max-h-[360px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-brand-light text-gray-600 font-extrabold sticky top-0 border-b border-[#EFEAE2]">
                        <tr>
                          <th className="py-2.5 px-3">Tanggal</th>
                          <th className="py-2.5 px-3">Nama Siswa</th>
                          <th className="py-2.5 px-3">Kelas</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFEAE2]">
                        {filteredHistory.length > 0 ? (
                          filteredHistory.map((rec) => {
                            const matchingStudent = displayStudents.find(s => 
                              s.id === rec.studentId || 
                              (s.name && rec.studentName && s.name.toLowerCase().trim() === rec.studentName.toLowerCase().trim())
                            );
                            const isHadir = rec.status === 'Hadir' || rec.status === 'Terlambat';
                            const isAlpa = rec.status === 'Alpa';
                            const isSakit = rec.status === 'Sakit';
                            const isIzin = rec.status === 'Izin';

                            return (
                              <tr key={rec.id} className="hover:bg-brand-light/50 transition-colors">
                                <td className="py-2.5 px-3 font-mono font-semibold text-gray-700 whitespace-nowrap">{rec.date}</td>
                                <td className="py-2.5 px-3 font-bold text-brand-dark">{rec.studentName || matchingStudent?.name || '-'}</td>
                                <td className="py-2.5 px-3 text-gray-600">{matchingStudent?.className || '-'}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                    isHadir ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                    isAlpa ? 'bg-red-100 text-red-700 border border-red-200' :
                                    isSakit ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                    'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}>
                                    {rec.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-gray-500 text-[11px] max-w-xs truncate">{rec.notes || '-'}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-400">
                              Tidak ada riwayat kehadiran yang sesuai dengan filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        )}

        {/* SUBTAB 3: EVALUASI & RAPOR SISWA */}
        {activeSubTab === 'evaluasi-rapor' && (
        <div className="bg-white rounded-3xl border border-[#E4D8E6] p-6 shadow-premium">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#F3EDF5]">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-dark">Input Penilaian Harian (Quick Assessment)</h3>
              <p className="text-xs text-gray-400">Asesmen cepat tumbuh kembang anak per bidang studi</p>
            </div>
          </div>

          <form onSubmit={handleAddAssessmentSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Select Student */}
              <div className="space-y-1.5">
                <label htmlFor="assess-student-select" className="text-xs font-bold text-gray-500 uppercase">Pilih Siswa</label>
                <select
                  id="assess-student-select"
                  value={assessmentStudentId}
                  onChange={(e) => setAssessmentStudentId(e.target.value)}
                  className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {displayStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.className}) - Guru: {s.teacherName || activeTeacherName || 'Guru Pembimbing'}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label htmlFor="assess-subject-select" className="text-xs font-bold text-gray-500 uppercase">Mata Pelajaran</label>
                <select
                  id="assess-subject-select"
                  value={assessmentSubject}
                  onChange={(e) => setAssessmentSubject(e.target.value as any)}
                  className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
                >
                  <option value="Membaca">Membaca</option>
                  <option value="Berhitung">Berhitung</option>
                  <option value="Mengaji">Mengaji</option>
                </select>
              </div>
            </div>

            {/* Star Rating Grid */}
            <div className="bg-[#FAF6F0] rounded-2xl p-4 border border-[#EFEAE2]">
              <span className="text-[10px] font-extrabold uppercase text-brand-accent bg-[#FEF6E8] px-2.5 py-1 rounded-md inline-block mb-3.5 tracking-wider">
                Nilai Aspek Belajar (Skala 1 - 5)
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.keys(assessmentAspects).map((aspect) => (
                  <div key={aspect} className="bg-white p-3.5 rounded-xl border border-[#F3ECE4] flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-dark truncate pr-1">{aspect}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(aspect, star)}
                          className="p-0.5 focus:outline-none transition-transform hover:scale-125"
                        >
                          <Heart 
                            className={`w-4 h-4 ${
                              star <= assessmentAspects[aspect] 
                                ? 'fill-brand-primary text-brand-primary' 
                                : 'text-gray-300'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Anecdotal notes */}
            <div className="space-y-1.5">
              <label htmlFor="assess-notes" className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Catatan Anekdot Singkat (Evaluasi Harian)
              </label>
              <textarea
                id="assess-notes"
                rows={3}
                placeholder="Contoh: Alika sangat lancar mengeja suku kata berakhiran -ng hari ini. Dia juga membantu merapikan mainan balok..."
                value={assessmentNotes}
                onChange={(e) => setAssessmentNotes(e.target.value)}
                className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <button
                  type="submit"
                  className="w-full h-[45px] bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  Simpan Rapor
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const selId = assessmentStudentId || displayStudents[0]?.id;
                    setExportPreselectedStudentId(selId);
                    setIsExportModalOpen(true);
                  }}
                  className="w-full h-[45px] bg-white hover:bg-brand-light text-brand-dark border border-[#E4D8E6] rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4 text-brand-primary" />
                  Cetak Rapor (PDF)
                </button>

                {(() => {
                  const selStudent = displayStudents.find(s => s.id === (assessmentStudentId || displayStudents[0]?.id)) || displayStudents[0];
                  const pPhoneClean = (selStudent?.parentPhone || '08123456789').replace(/\D/g, '');
                  const pPhoneFormatted = pPhoneClean.startsWith('0') ? '62' + pPhoneClean.slice(1) : pPhoneClean;
                  const waReportMsg = encodeURIComponent(
                    `*Laporan Belajar Harian Rumah CahayaQu* 🌟\n\nNama Siswa: ${selStudent?.name || '-'}\nTanggal: ${todayStr}\nMata Pelajaran: ${assessmentSubject}\nPengajar: ${assessmentTeacher}\n\n*Evaluasi & Aspek:*\n${Object.keys(assessmentAspects).map(k => `• ${k}: ${assessmentAspects[k]}/5 ⭐`).join('\n')}\n\n*Catatan Guru:*\n"${assessmentNotes || 'Semangat belajar luar biasa hari ini!'}"\n\nTerima kasih telah memercayakan putra-putri Anda bersama Rumah CahayaQu! ❤️`
                  );
                  const waReportUrl = `https://wa.me/${pPhoneFormatted}?text=${waReportMsg}`;

                  return (
                    <a
                      href={waReportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-[45px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <PhoneCall className="w-4 h-4" />
                      Kirim Rapor ke WA
                    </a>
                  );
                })()}
              </div>
            </div>
          </form>
        </div>
        )}

        {/* SUBTAB 4: MEDIA UPLOADER / GALERI */}
        {activeSubTab === 'galeri' && (
        <div className="bg-white rounded-3xl border border-[#E4D8E6] p-6 shadow-premium">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#F3EDF5]">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-brand-accent">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-dark">Media Uploader Instan</h3>
              <p className="text-xs text-gray-400">Bagikan foto keseruan belajar anak ke galeri portal orang tua</p>
            </div>
          </div>

          <form onSubmit={handleMediaSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="media-title" className="text-xs font-bold text-gray-500 uppercase">Judul Kegiatan</label>
                <input
                  id="media-title"
                  type="text"
                  placeholder="Contoh: Belajar Sains Kimia Pelangi"
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="media-class-select" className="text-xs font-bold text-gray-500 uppercase">Target Mata Pelajaran</label>
                <select
                  id="media-class-select"
                  value={mediaClass}
                  onChange={(e) => setMediaClass(e.target.value)}
                  className="w-full bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
                >
                  <option value="Semua Mata Pelajaran">Semua Mata Pelajaran</option>
                  <option value="Membaca">Membaca</option>
                  <option value="Berhitung">Berhitung</option>
                  <option value="Mengaji">Mengaji</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="media-desc" className="text-xs font-bold text-gray-500 uppercase">Deskripsi Kegiatan</label>
              <textarea
                id="media-desc"
                rows={2}
                placeholder="Ceritakan keseruan belajar anak secara rinci agar orang tua tenang dan terkesan..."
                value={mediaDesc}
                onChange={(e) => setMediaDesc(e.target.value)}
                className="w-full text-sm bg-brand-light border border-[#E4D8E6] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-gray-500 uppercase">Pilih File Foto</span>
              <div className="relative border-2 border-dashed border-[#E4D8E6] bg-brand-light rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-[#FAF6F0] hover:border-brand-primary/50 transition-all cursor-pointer">
                <input
                  id="teacher-media-file"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {previewFile ? (
                  <div className="w-full space-y-2">
                    <div className="relative h-44 rounded-xl overflow-hidden shadow-md">
                      <img src={previewFile} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPreviewFile('')}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 text-xs hover:bg-black"
                      >
                        Hapus
                      </button>
                    </div>
                    <div className="text-center text-[11px] font-bold text-emerald-600">✓ Gambar terkompresi & siap dipublikasikan</div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-brand-dark">Pilih foto dari komputer</p>
                    <p className="text-[10px] text-gray-400 mt-1">Mendukung format PNG, JPG (Maks. 2MB)</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-accent hover:bg-brand-accent/90 text-brand-dark rounded-xl py-3 font-bold text-sm shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-brand-dark" />
              Posting ke Galeri Aktivitas
            </button>
          </form>
        </div>
        )}

        {/* SUBTAB 5: PESAN & CHAT WALI MURID */}
        {activeSubTab === 'chat' && (
        <div className="bg-white rounded-3xl border border-[#E4D8E6] p-5 sm:p-6 shadow-premium space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F3EDF5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-dark">Ruang Komunikasi Wali &amp; Guru</h3>
                <p className="text-xs text-gray-400">Pesan privat &amp; konsultasi perkembangan belajar siswa</p>
              </div>
            </div>

            {/* Student selector dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={selectedChatStudentId}
                onChange={(e) => setSelectedChatStudentId(e.target.value)}
                className="bg-brand-light border border-[#E4D8E6] rounded-xl px-3 py-2 text-xs font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {chatStudentPool.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.className}) — Wali: {s.parentName}
                  </option>
                ))}
              </select>

              {activeChatStudent && (() => {
                const pPhoneClean = (activeChatStudent.parentPhone || '08123456789').replace(/\D/g, '');
                const pPhoneFormatted = pPhoneClean.startsWith('0') ? '62' + pPhoneClean.slice(1) : pPhoneClean;
                const waMsg = encodeURIComponent(`Halo Ayah/Bunda ${activeChatStudent.parentName}, salam hangat dari ${activeTeacherName} (Rumah CahayaQu).`);
                return (
                  <a
                    href={`https://wa.me/${pPhoneFormatted}?text=${waMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
                    title="Hubungi Wali via WhatsApp"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>WA</span>
                  </a>
                );
              })()}
            </div>
          </div>

          {/* Messages Stream View */}
          <div ref={teacherTabChatBodyRef} className="bg-[#FAF7F5] rounded-2xl p-4 border border-[#ECE2D8] h-[380px] overflow-y-auto space-y-3">
            {currentStudentChats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-brand-primary" />
                <p className="text-sm font-bold text-brand-dark">Belum Ada Percakapan</p>
                <p className="text-xs max-w-xs mt-1">
                  Kirimkan pesan pertama untuk menyapa Ayah/Bunda {activeChatStudent?.parentName || 'Wali Murid'}
                </p>
              </div>
            ) : (
              currentStudentChats.map((msg) => {
                const isTeacher = msg.sender === 'guru';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isTeacher ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold text-gray-400">
                        {isTeacher ? `👩‍🏫 ${msg.senderName}` : `🏡 Ayah/Bunda (${msg.senderName})`}
                      </span>
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-2xs ${
                        isTeacher
                          ? 'bg-brand-primary text-white rounded-tr-xs'
                          : 'bg-white text-brand-dark border border-[#E4D8E6] rounded-tl-xs'
                      }`}
                    >
                      <div>{msg.message}</div>
                      <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] ${isTeacher ? 'justify-end text-white/80' : 'justify-start text-gray-400'}`}>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isTeacher && (
                          <span className="inline-flex items-center ml-0.5" title={msg.status === 'read' || msg.isRead ? 'Pesan telah dibaca oleh wali murid' : msg.status === 'delivered' ? 'Pesan telah terkirim ke penerima' : 'Pesan terkirim ke server'}>
                            {msg.status === 'read' || msg.isRead ? (
                              <CheckCheck className="w-3.5 h-3.5 text-sky-300 stroke-[2.5]" />
                            ) : msg.status === 'delivered' ? (
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

          {/* Quick Message Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              'Ananda belajar dengan sangat fokus hari ini 👍',
              'Mohon dampingi membaca 15 menit di rumah ya Bunda 📖',
              'Evaluasi harian ananda sudah kami input ke rapor ⭐',
            ].map((template, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTeacherSendMessage(undefined, template)}
                className="px-2.5 py-1 bg-brand-light hover:bg-white text-gray-600 hover:text-brand-dark border border-[#E4D8E6] rounded-xl text-[11px] font-medium transition-all shrink-0 cursor-pointer"
              >
                {template}
              </button>
            ))}
          </div>

          {/* Input message form */}
          <form onSubmit={(e) => handleTeacherSendMessage(e)} className="flex gap-2">
            <input
              type="text"
              placeholder={`Ketik pesan ke Ayah/Bunda ${activeChatStudent?.parentName || ''}...`}
              value={teacherChatInput}
              onChange={(e) => setTeacherChatInput(e.target.value)}
              className="flex-1 text-xs bg-brand-light border border-[#E4D8E6] text-brand-dark placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary/90 text-white px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer font-bold text-xs flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim</span>
            </button>
          </form>
        </div>
        )}

            </motion.div>
          </AnimatePresence>
        </div>

      {/* Floating Chat Icon & Smooth Animated Chat Drawer/Modal for Teacher */}
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
              className="mb-4 w-[calc(100vw-2.5rem)] sm:w-[420px] h-[550px] max-h-[80vh] bg-white rounded-3xl border border-[#E4D8E6] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="bg-brand-primary p-4 text-white flex items-center justify-between shadow-xs shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/30 shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold tracking-tight">Ruang Komunikasi Wali</h3>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                      </span>
                    </div>
                    <p className="text-[11px] text-white/90 truncate max-w-[240px] font-medium">
                      👩‍🏫 Pengajar: {activeTeacherName}
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

              {/* Student Selector Bar */}
              <div className="p-3 bg-brand-light border-b border-[#F3EDF5] flex items-center justify-between gap-2 shrink-0">
                <div className="flex-1 min-w-0">
                  <select
                    id="teacher-floating-student-select"
                    value={selectedChatStudentId}
                    onChange={(e) => setSelectedChatStudentId(e.target.value)}
                    className="w-full bg-white border border-[#E4D8E6] rounded-xl px-3 py-1.5 text-xs font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    {chatStudentPool.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.className}) — Wali: {s.parentName}
                      </option>
                    ))}
                  </select>
                </div>

                {activeChatStudent && (() => {
                  const pPhoneClean = (activeChatStudent.parentPhone || '08123456789').replace(/\D/g, '');
                  const pPhoneFormatted = pPhoneClean.startsWith('0') ? '62' + pPhoneClean.slice(1) : pPhoneClean;
                  const waMsg = encodeURIComponent(`Halo Ayah/Bunda ${activeChatStudent.parentName}, salam hangat dari ${activeTeacherName} (Rumah CahayaQu).`);
                  return (
                    <a
                      href={`https://wa.me/${pPhoneFormatted}?text=${waMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 shadow-xs"
                      title="Hubungi Wali via WhatsApp"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>WA</span>
                    </a>
                  );
                })()}
              </div>

              {/* Privacy Banner */}
              <div className="px-3.5 py-2 bg-amber-50 border-b border-amber-200/80 flex items-center gap-2 text-[10px] text-amber-900 leading-tight shrink-0">
                <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>
                  <strong>Pesan Privat Terenkripsi:</strong> Hanya Anda ({activeTeacherName} - {activeTeacherUser.subject || 'Pengampu'}) & Wali Ananda <strong>{activeChatStudent?.name || ''}</strong> yang dapat melihat percakapan ini.
                </span>
              </div>

              {/* Chat Body Messages */}
              <div ref={teacherFloatingChatBodyRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 pr-2 text-xs bg-brand-light/60">
                {currentStudentChats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-5">
                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-2.5">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h4 className="text-xs font-extrabold text-brand-dark">Belum Ada Percakapan</h4>
                    <p className="text-[11px] text-gray-500 max-w-[260px] mt-1.5 leading-relaxed font-medium">
                      Sampaikan kabar belajar, pengingat PR, atau koordinasi dengan Ayah/Bunda {activeChatStudent?.parentName}.
                    </p>
                  </div>
                ) : (
                  currentStudentChats.map((chat) => {
                    const isTeacher = chat.sender === 'guru';
                    return (
                      <div 
                        key={chat.id} 
                        className={`flex flex-col max-w-[85%] ${isTeacher ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <span className="text-[10px] font-bold text-gray-500 mb-1 px-1">
                          {isTeacher ? `👩‍🏫 ${chat.senderName || activeTeacherName}` : `👨‍👩‍👦 ${chat.senderName || activeChatStudent?.parentName || 'Wali Murid'}`}
                        </span>
                        <div className={`p-3.5 rounded-2xl leading-relaxed text-xs sm:text-sm font-medium ${
                          isTeacher 
                            ? 'bg-brand-primary text-white rounded-tr-none shadow-xs' 
                            : 'bg-white text-brand-dark border border-[#EFEAE2] rounded-tl-none shadow-xs'
                        }`}>
                          <div>{chat.message}</div>
                          <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] ${isTeacher ? 'justify-end text-white/80' : 'justify-start text-gray-400'}`}>
                            <span>{new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isTeacher && (
                              <span className="inline-flex items-center ml-0.5" title={chat.status === 'read' || chat.isRead ? 'Pesan telah dibaca oleh wali murid' : chat.status === 'delivered' ? 'Pesan telah terkirim ke penerima' : 'Pesan terkirim ke server'}>
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

              {/* Quick Reply Chips */}
              <div className="p-2.5 bg-[#FAF7FB] border-t border-[#F3EDF5] space-y-1 shrink-0">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                  {quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleTeacherSendMessage(undefined, reply)}
                      className="shrink-0 text-[10px] font-medium bg-white hover:bg-brand-primary hover:text-white border border-[#E4D8E6] text-brand-dark px-2.5 py-1 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Form */}
              <form onSubmit={(e) => handleTeacherSendMessage(e)} className="p-3 bg-white border-t border-[#F3EDF5] flex items-center gap-2 shrink-0">
                <input
                  id="teacher-floating-chat-input"
                  type="text"
                  placeholder={`Kirim kabar ke Wali ${activeChatStudent?.name || ''}...`}
                  value={teacherChatInput}
                  onChange={(e) => setTeacherChatInput(e.target.value)}
                  className="flex-1 text-xs sm:text-sm bg-brand-light border border-[#E4D8E6] text-brand-dark placeholder-gray-400 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                />
                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-primary/90 text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                  title="Kirim Pesan ke Wali Murid"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-time Toast Alert for New Chat for Teacher */}
        <AnimatePresence>
          {chatToast && !isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              onClick={() => {
                if (chatToast.studentId) {
                  setSelectedChatStudentId(chatToast.studentId);
                }
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
                  <span className="text-[10px] text-brand-primary font-semibold">Pesan Wali</span>
                </div>
                <p className="text-[10px] text-brand-dark/70 font-semibold truncate">Ananda: {chatToast.studentName}</p>
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

        {/* Floating Toggle Button with Unread Badge & Bounce Animation */}
        <div className="relative">
          <button
            id="teacher-floating-chat-toggle"
            type="button"
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              setChatToast(null);
            }}
            className={`w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg hover:bg-brand-primary/90 active:scale-95 transition-all cursor-pointer relative ${
              unreadCount > 0 && !isChatOpen ? 'animate-bounce ring-4 ring-brand-primary/20' : ''
            }`}
            title={isChatOpen ? 'Tutup Chat' : 'Ruang Komunikasi Wali'}
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

      {/* MODAL: AJUKAN IZIN / SAKIT GURU */}
      {isSubmittingLeave && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E4D8E6] animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3EDF5]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-800 font-bold">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-brand-dark">Pengajuan Izin / Sakit</h3>
                  <p className="text-xs text-gray-500">{activeTeacherUser.name} - Tanggal {todayStr}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmittingLeave(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block">Kategori Ketidakhadiran</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLeaveType('Izin')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      leaveType === 'Izin'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-brand-light text-gray-600 border-[#E4D8E6] hover:bg-gray-100'
                    }`}
                  >
                    Izin Keperluan
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaveType('Sakit')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      leaveType === 'Sakit'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-brand-light text-gray-600 border-[#E4D8E6] hover:bg-gray-100'
                    }`}
                  >
                    Sakit / Istirahat
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block">
                  Alasan / Keterangan Lengkap <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder={
                    leaveType === 'Izin' 
                      ? 'Tuliskan alasan izin (misal: Keperluan keluarga mendesak, dinas luar)...'
                      : 'Tuliskan kondisi sakit atau keterangan dokter...'
                  }
                  className="w-full text-xs bg-brand-light border border-[#E4D8E6] rounded-xl p-3 text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSubmittingLeave(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CATATAN PENGAJARAN */}
      {isEditingTeachingNote && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E4D8E6] animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3EDF5]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-800 font-bold">
                  <Edit3 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-brand-dark">Catatan Aktivitas Mengajar</h3>
                  <p className="text-xs text-gray-500">Tanggal {todayStr} - {activeTeacherUser.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingTeachingNote(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-600 block">
                Tuliskan materi yang diajarkan atau catatan kelas hari ini:
              </label>
              <textarea
                rows={3}
                value={teachingNoteInput}
                onChange={(e) => setTeachingNoteInput(e.target.value)}
                placeholder="Contoh: Mengajar Modul Calistung Level 1 & Evaluasi Kosakata..."
                className="w-full text-xs bg-brand-light border border-[#E4D8E6] rounded-xl p-3 text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingTeachingNote(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveTeachingNotes}
                  className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-brand-accent" />
                  Simpan Catatan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RIWAYAT & REKAP PRESENSI GURU */}
      {showAttendanceHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-[95%] sm:w-[90%] shadow-2xl border border-[#E4D8E6] animate-fade-in max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#F3EDF5] flex items-center justify-between shrink-0 bg-amber-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-brand-dark">Riwayat Presensi Guru</h3>
                  <p className="text-[11px] text-gray-500">{activeTeacherUser.name} ({activeTeacherUser.subject || 'Pengajar'})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAttendanceHistoryModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Quick Stat Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
                <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80 text-center">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Hadir</p>
                  <p className="text-base sm:text-lg font-black text-emerald-800 mt-0.5">{myTotalHadir} <span className="text-xs font-normal">Hari</span></p>
                </div>
                <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80 text-center">
                  <p className="text-[10px] font-bold text-amber-700 uppercase">Terlambat</p>
                  <p className="text-base sm:text-lg font-black text-amber-800 mt-0.5">{myTotalTerlambat} <span className="text-xs font-normal">Hari</span></p>
                </div>
                <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200/80 text-center">
                  <p className="text-[10px] font-bold text-blue-700 uppercase">Izin / Sakit</p>
                  <p className="text-base sm:text-lg font-black text-blue-800 mt-0.5">{myTotalIzinSakit} <span className="text-xs font-normal">Hari</span></p>
                </div>
              </div>

              {/* List of Records */}
              <div className="space-y-2.5">
                {myAttendanceRecords.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 italic text-xs">
                    Belum ada rekaman riwayat presensi tersimpan untuk Anda.
                  </div>
                ) : (
                  myAttendanceRecords.map(record => {
                    let badgeStyle = 'bg-gray-100 text-gray-700 border-gray-200';
                    if (record.status === 'Hadir') badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                    else if (record.status === 'Terlambat') badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300';
                    else if (record.status === 'Izin') badgeStyle = 'bg-blue-50 text-blue-800 border-blue-300';
                    else if (record.status === 'Sakit') badgeStyle = 'bg-purple-50 text-purple-800 border-purple-300';
                    else if (record.status === 'Alpa') badgeStyle = 'bg-rose-50 text-rose-800 border-rose-300';

                    return (
                      <div key={record.id} className="p-3.5 bg-brand-light rounded-2xl border border-[#E4D8E6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {/* Selfie thumbnail if available */}
                          {record.photoBase64 ? (
                            <div 
                              onClick={() => setViewingPhotoModal({
                                photo: record.photoBase64!,
                                title: `Foto Presensi: ${record.teacherName}`,
                                subtitle: `${record.date} | Jam ${record.timeIn || '-'} WIB (${record.status})`,
                                address: record.locationAddress,
                                coords: record.latitude ? `${record.latitude.toFixed(6)}, ${record.longitude?.toFixed(6)}` : undefined
                              })}
                              className="w-12 h-12 rounded-xl overflow-hidden border border-[#E4D8E6] shrink-0 cursor-pointer relative group min-h-[44px] min-w-[44px]"
                            >
                              <img src={record.photoBase64} alt="Selfie" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-200/70 border border-[#E4D8E6] flex items-center justify-center text-gray-400 shrink-0">
                              <Camera className="w-4 h-4 opacity-50" />
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-extrabold text-brand-dark">
                                {new Date(record.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] border ${badgeStyle}`}>
                                {record.status}
                              </span>
                              {record.isWithinRadius !== undefined && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                  record.isWithinRadius ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {record.isWithinRadius ? '✓ Radius Valid' : '⚠ Di Luar Radius'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-600">
                              {record.notes || 'Tidak ada catatan tambahan'}
                            </p>
                            {record.locationAddress && (
                              <p className="text-[10px] text-gray-400 truncate max-w-sm">
                                📍 {record.locationAddress}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-end gap-1.5 self-start sm:self-auto shrink-0">
                          <span className="text-xs font-mono bg-white px-2.5 py-1 rounded-xl border border-[#E4D8E6] text-gray-700 font-bold">
                            {record.timeIn || '-'}{record.timeOut ? ` - ${record.timeOut}` : ''} WIB
                          </span>
                          {record.distanceMeters !== undefined && (
                            <span className="text-[10px] text-gray-500 font-mono">
                              Jarak: {record.distanceMeters}m
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-[#F3EDF5] sticky bottom-0 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setShowAttendanceHistoryModal(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-brand-dark font-bold rounded-xl text-xs transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LIVE CAMERA & GPS GEOFENCING CHECK-IN / CHECK-OUT */}
      <TeacherCheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        teacher={activeTeacherUser}
        locations={locations}
        activeLocationId={activeLocationId}
        mode={checkInModalMode}
        existingRecord={activeTeacherTodayAtt}
        onSuccess={handleCheckInModalSuccess}
      />

      {/* MODAL: FULL PHOTO & GPS DETAILS VIEWER */}
      {viewingPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-[95%] sm:w-full shadow-2xl border border-[#E4D8E6] overflow-hidden animate-fade-in max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-[#F3EDF5] flex items-center justify-between shrink-0">
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm text-brand-dark">{viewingPhotoModal.title}</h4>
                <p className="text-[11px] text-gray-500">{viewingPhotoModal.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingPhotoModal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="aspect-square w-full rounded-2xl overflow-hidden bg-black border border-[#E4D8E6]">
                <img
                  src={viewingPhotoModal.photo}
                  alt="Selfie"
                  className="w-full h-full object-cover"
                />
              </div>

              {viewingPhotoModal.address && (
                <div className="bg-brand-light p-3 rounded-xl border border-[#E4D8E6] text-xs space-y-1">
                  <div className="flex items-center gap-1 font-bold text-gray-500 text-[10px] uppercase">
                    <MapPin className="w-3 h-3 text-brand-primary" /> Alamat Lokasi Presensi
                  </div>
                  <p className="text-brand-dark font-medium leading-relaxed text-xs">
                    {viewingPhotoModal.address}
                  </p>
                  {viewingPhotoModal.coords && (
                    <p className="text-[10px] text-gray-400 font-mono">
                      GPS: {viewingPhotoModal.coords}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 bg-gray-50 border-t border-[#F3EDF5] sticky bottom-0 shrink-0">
              <button
                type="button"
                onClick={() => setViewingPhotoModal(null)}
                className="w-full py-2.5 bg-brand-primary text-white font-bold rounded-xl text-xs min-h-[44px] flex items-center justify-center cursor-pointer hover:bg-brand-primary/95 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CETAK & EKSPOR LAPORAN BIMBEL */}
      {isExportModalOpen && (
        <ReportExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          state={{
            users,
            students,
            attendance,
            assessments,
            activities,
            chats,
            schedules: [],
            invoices: [],
            broadcasts: [],
            teacherAttendance,
            bankAccount: { bankName: '', accountNumber: '', accountHolder: '' },
            locations,
            activeLocationId: '',
          }}
          userRole="teacher"
          preselectedStudentId={exportPreselectedStudentId || activeChatStudent?.id}
        />
      )}

    </div>
  );
}
