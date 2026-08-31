import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Sparkles, 
  Trash2, 
  Heart, 
  Layers, 
  MessageCircleCode, 
  Users, 
  Megaphone, 
  CheckCircle, 
  HelpCircle, 
  School, 
  Clock, 
  ExternalLink, 
  Database, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  User, 
  Sun, 
  Moon, 
  ChevronDown,
  X,
  Menu,
  ArrowLeft,
  TrendingUp,
  FileText,
  Calendar,
  BookOpen,
  Award,
  SlidersHorizontal,
  Camera,
  ImageIcon,
  MessageSquare,
  CreditCard,
  LayoutDashboard
} from 'lucide-react';
import { 
  BimbelState, 
  UserAccount,
  Student, 
  Attendance, 
  TeacherAttendance,
  Assessment, 
  DailyActivity, 
  ChatMessage, 
  Invoice, 
  ScheduleItem, 
  BroadcastMessage,
  BankAccountInfo,
  BimbelLocation,
  BimbelBrandingSettings
} from './types';
import { 
  loadBimbelState, 
  saveBimbelState, 
  INITIAL_EMPTY_STATE, 
  DEMO_STATE,
  DEFAULT_BRANDING_SETTINGS
} from './dataStore';
import {
  subscribeToBimbelState,
  syncStateToFirestore,
  clearFirestoreCollections,
  firestoreAddUser,
  firestoreUpdateUser,
  firestoreDeleteUser,
  firestoreAddStudent,
  firestoreUpdateStudent,
  firestoreDeleteStudent,
  firestoreAddAssessment,
  firestoreUpdateAssessment,
  firestoreDeleteAssessment,
  firestoreAddActivity,
  firestoreAddBroadcast,
  firestoreUpdateBroadcast,
  firestoreDeleteBroadcast,
  firestoreAddChatMessage,
  firestoreUpdateChatMessage,
  firestoreMarkChatsAsRead,
  firestoreSaveAttendanceBulk,
  firestoreDeleteAttendance,
  firestoreSaveTeacherAttendanceBulk,
  firestoreDeleteTeacherAttendance,
  firestoreDeleteInvoice,
  firestoreAddSchedule,
  firestoreDeleteSchedule,
  firestoreUpdateBankAccount,
  firestoreUpdateBranding,
  firestoreAddLocation,
  firestoreUpdateLocation,
  firestoreDeleteLocation
} from './lib/firebaseStore';

import { 
  ParentPortal, 
  TeacherPortal, 
  AdminPortal, 
  LoginPage, 
  Logo, 
  ErrorBoundary,
  type ParentSubTab,
  type TeacherSubTab
} from './components';


export default function App() {
  // Navigation tabs: 'parent' | 'teacher' | 'admin'
  const [activePortal, setActivePortal] = useState<'parent' | 'teacher' | 'admin'>('parent');

  // Sub-tabs for each portal synchronized with Slide-Out Sidebar Drawer
  const [adminActiveTab, setAdminActiveTab] = useState<'kesehatan' | 'tagihan' | 'jadwal' | 'siswa' | 'guru' | 'absensi-guru' | 'laporan' | 'lokasi' | 'pengaturan' | 'pengumuman'>('kesehatan');
  const [teacherActiveTab, setTeacherActiveTab] = useState<TeacherSubTab>('dashboard');
  const [parentActiveTab, setParentActiveTab] = useState<ParentSubTab>('dashboard');

  // Currently Logged-in User State (null = show Login Page)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // User Dropdown & Dark Mode & Mobile Drawer States
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [dismissedBroadcastId, setDismissedBroadcastId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('theme') === 'dark';
      } catch {
        return false;
      }
    }
    return false;
  });
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Toggle Dark Mode Class on Document Root
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (e) {
      console.warn('Could not persist theme preference:', e);
    }
  }, [isDarkMode]);

  // Click Outside Listener for User Menu Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Unified State
  const [state, setState] = useState<BimbelState>({
    users: [],
    students: [],
    attendance: [],
    assessments: [],
    activities: [],
    chats: [],
    invoices: [],
    schedules: [],
    broadcasts: [],
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  // Subscribe to Firebase Firestore real-time sync
  useEffect(() => {
    const loadedState = loadBimbelState();
    setState(loadedState);

    const unsubscribe = subscribeToBimbelState(
      (firestoreState) => {
        setState(firestoreState);
        saveBimbelState(firestoreState);
      },
      (connected) => {
        setIsFirebaseConnected(connected);
      }
    );

    return () => unsubscribe();
  }, []);

  // Save to local storage whenever state changes
  const updateAndSaveState = (newState: BimbelState) => {
    setState(newState);
    saveBimbelState(newState);
    syncStateToFirestore(newState);
  };

  // Auth Handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    if (!state.users.some(u => u.id === user.id || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()))) {
      setState(prev => ({
        ...prev,
        users: [...prev.users, user],
      }));
    }
    if (user.role === 'admin') {
      setActivePortal('admin');
    } else if (user.role === 'teacher') {
      setActivePortal('teacher');
    } else {
      setActivePortal('parent');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleAddUser = (newUser: Omit<UserAccount, 'id' | 'createdAt'>) => {
    const id = `usr-${Date.now()}`;
    const userWithId: UserAccount = {
      ...newUser,
      id,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const nextState: BimbelState = {
      ...state,
      users: [...state.users, userWithId],
    };

    firestoreAddUser(userWithId);
    updateAndSaveState(nextState);
  };

  const handleUpdateUser = (updatedUser: UserAccount) => {
    const oldUser = state.users.find(u => u.id === updatedUser.id);
    const oldName = oldUser?.name;
    const nameChanged = oldName && oldName !== updatedUser.name;

    // If teacher's name changed, sync associated students and schedules
    let nextStudents = state.students;
    let nextSchedules = state.schedules;
    if (updatedUser.role === 'teacher' && nameChanged) {
      nextStudents = state.students.map(s => {
        if (s.teacherId === updatedUser.id || s.teacherName === oldName) {
          const updatedStudent = { ...s, teacherName: updatedUser.name };
          firestoreUpdateStudent(updatedStudent);
          return updatedStudent;
        }
        return s;
      });

      nextSchedules = state.schedules.map(sch => {
        if (sch.teacherName === oldName) {
          const updatedSch = { ...sch, teacherName: updatedUser.name };
          firestoreAddSchedule(updatedSch);
          return updatedSch;
        }
        return sch;
      });
    }

    const nextState: BimbelState = {
      ...state,
      users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u),
      students: nextStudents,
      schedules: nextSchedules,
    };

    firestoreUpdateUser(updatedUser);
    updateAndSaveState(nextState);
  };

  const handleDeleteUser = (userId: string) => {
    const nextState: BimbelState = {
      ...state,
      users: state.users.filter(u => u.id !== userId),
    };

    firestoreDeleteUser(userId);
    updateAndSaveState(nextState);
  };

  const handleRegisterParent = (newParent: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount => {
    const id = `usr-parent-${Date.now()}`;
    const userWithId: UserAccount = {
      ...newParent,
      id,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Auto-create Student linked to this Parent so data is immediately available in Parent Portal
    const childName = newParent.childName?.trim() || `Anak ${newParent.name}`;
    const studentSubject = newParent.subject || 'Membaca';
    const studentId = `stud-${Date.now()}`;
    const assignedTeacher = state.users.find(u => u.role === 'teacher')?.name || 'Guru Pembimbing';

    const newStudent: Student = {
      id: studentId,
      name: childName,
      className: studentSubject,
      subject: studentSubject,
      parentName: newParent.name,
      parentPhone: newParent.phone || '-',
      teacherName: assignedTeacher,
    };

    // Auto-assign schedule for that student
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;
    const randomDay = dayNames[Math.floor(Math.random() * dayNames.length)];
    const newSchedule: ScheduleItem = {
      id: `sch-${Date.now()}`,
      day: randomDay,
      timeSlot: '14:00 - 15:30',
      className: studentSubject,
      subject: studentSubject === 'Membaca' ? 'Membaca & Menulis' : studentSubject === 'Berhitung' ? 'Berhitung Cepat' : 'Membaca Al-Qur\'an & Iqro',
      teacherName: assignedTeacher,
      studentId: newStudent.id,
      studentName: newStudent.name,
    };

    // Auto-create initial Attendance & Assessment so parent dashboard is immediately rich
    const todayStr = new Date().toISOString().split('T')[0];
    const newAttendance: Attendance = {
      id: `att-${Date.now()}`,
      studentId,
      studentName: childName,
      date: todayStr,
      timeIn: '14:00',
      timeOut: '15:30',
      status: 'Hadir',
    };

    const newAssessment: Assessment = {
      id: `ass-${Date.now()}`,
      studentId,
      studentName: childName,
      subject: studentSubject,
      date: todayStr,
      aspects: [
        { name: 'Pemahaman', score: 5 },
        { name: 'Fokus & Konsentrasi', score: 4 },
        { name: 'Kemandirian', score: 4 },
        { name: 'Kedisiplinan', score: 5 },
      ],
      notes: `Siswa ${childName} telah terdaftar dan siap mengikuti pembelajaran modul ${studentSubject}.`,
      teacherName: assignedTeacher,
    };

    const nextState: BimbelState = {
      ...state,
      users: [...state.users, userWithId],
      students: [...state.students, newStudent],
      schedules: [...state.schedules, newSchedule],
      attendance: [...state.attendance, newAttendance],
      assessments: [...state.assessments, newAssessment],
    };

    firestoreAddUser(userWithId);
    firestoreAddStudent(newStudent, null, newSchedule);
    firestoreSaveAttendanceBulk([newAttendance]);
    firestoreAddAssessment(newAssessment);
    updateAndSaveState(nextState);
    return userWithId;
  };

  // State handlers to pass down to portals
  const handleAddStudent = (newStudent: Omit<Student, 'id'>) => {
    const id = `stud-${Date.now()}`;
    const assignedTeacher = newStudent.teacherName || state.users.find(u => u.role === 'teacher')?.name || 'Guru Pembimbing';
    const studentWithId: Student = { 
      ...newStudent, 
      id,
      teacherName: assignedTeacher 
    };

    // Auto-assign a basic starting schedule for that student
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;
    const randomDay = dayNames[Math.floor(Math.random() * dayNames.length)];
    const newSchedule: ScheduleItem = {
      id: `sch-${Date.now()}`,
      day: randomDay,
      timeSlot: '14:00 - 15:30',
      className: studentWithId.className,
      subject: studentWithId.className === 'Membaca' ? 'Membaca & Menulis' : studentWithId.className === 'Berhitung' ? 'Berhitung Cepat' : 'Membaca Al-Qur\'an & Iqro',
      teacherName: assignedTeacher,
      studentId: studentWithId.id,
      studentName: studentWithId.name,
    };

    // Auto-create / sync parent account so parents can immediately log in with WhatsApp or Name
    const parentPhoneDigits = (studentWithId.parentPhone || '').replace(/\D/g, '');
    const cleanParentEmail = parentPhoneDigits.length >= 6
      ? `wali_${parentPhoneDigits}@cahayaqu.id`
      : `${studentWithId.parentName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'wali'}@gmail.com`;

    const existingParentUser = state.users.find(u => {
      const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
      const phoneMatch = Boolean(parentPhoneDigits.length >= 6 && uPhoneDigits.length >= 6 && (parentPhoneDigits === uPhoneDigits || uPhoneDigits.endsWith(parentPhoneDigits) || parentPhoneDigits.endsWith(uPhoneDigits)));
      const nameMatch = u.name.toLowerCase() === studentWithId.parentName.toLowerCase();
      return phoneMatch || nameMatch;
    });

    let nextUsers = state.users;
    if (!existingParentUser && studentWithId.parentName) {
      const parentUserAccount: UserAccount = {
        id: `usr-parent-${Date.now()}`,
        name: studentWithId.parentName,
        email: cleanParentEmail,
        phone: studentWithId.parentPhone || '081234567890',
        childName: studentWithId.name,
        subject: typeof studentWithId.className === 'string' ? studentWithId.className : 'Membaca',
        role: 'parent',
        password: 'ortu123',
        createdAt: new Date().toISOString().split('T')[0],
      };
      nextUsers = [...state.users, parentUserAccount];
      firestoreAddUser(parentUserAccount);
    }

    const nextState: BimbelState = {
      ...state,
      users: nextUsers,
      students: [...state.students, studentWithId],
      schedules: [...state.schedules, newSchedule],
    };

    firestoreAddStudent(studentWithId, null, newSchedule);
    updateAndSaveState(nextState);
  };

  const handleUpdateStudent = (updatedStudent: Student, syncSchedules: boolean = true) => {
    let nextSchedules = state.schedules;
    if (syncSchedules) {
      // If student lesson/class changed, optionally update their assigned schedules
      nextSchedules = state.schedules.map(sch => {
        if (sch.studentId === updatedStudent.id) {
          const newSubject = updatedStudent.className === 'Membaca' 
            ? 'Membaca & Menulis' 
            : updatedStudent.className === 'Berhitung' 
              ? 'Berhitung Cepat' 
              : 'Membaca Al-Qur\'an & Iqro';
          const updatedSch: ScheduleItem = {
            ...sch,
            className: updatedStudent.className,
            subject: newSubject,
            teacherName: updatedStudent.teacherName || sch.teacherName,
            studentName: updatedStudent.name,
          };
          firestoreAddSchedule(updatedSch);
          return updatedSch;
        }
        return sch;
      });
    }

    const nextState: BimbelState = {
      ...state,
      students: state.students.map(s => s.id === updatedStudent.id ? updatedStudent : s),
      schedules: nextSchedules,
    };

    firestoreUpdateStudent(updatedStudent);
    updateAndSaveState(nextState);
  };

  const handleDeleteStudent = (studentId: string) => {
    const studentToDelete = state.students.find(s => s.id === studentId);
    const nextState: BimbelState = {
      ...state,
      students: state.students.filter(s => s.id !== studentId),
      schedules: state.schedules.filter(sch => sch.studentId !== studentId),
      attendance: state.attendance.filter(att => att.studentId !== studentId),
      assessments: state.assessments.filter(ass => ass.studentId !== studentId),
    };

    firestoreDeleteStudent(studentId);
    updateAndSaveState(nextState);
  };

  const handleAddAssessment = (newAssessment: Omit<Assessment, 'id'>) => {
    const id = `ass-${Date.now()}`;
    const assessmentWithId: Assessment = { ...newAssessment, id };
    
    const nextState: BimbelState = {
      ...state,
      assessments: [...state.assessments, assessmentWithId],
    };

    firestoreAddAssessment(assessmentWithId);
    updateAndSaveState(nextState);
  };

  const handleUpdateAssessment = (updatedAssessment: Assessment) => {
    const nextState: BimbelState = {
      ...state,
      assessments: state.assessments.map(a => a.id === updatedAssessment.id ? updatedAssessment : a),
    };

    firestoreUpdateAssessment(updatedAssessment);
    updateAndSaveState(nextState);
  };

  const handleDeleteAssessment = (assessmentId: string) => {
    const nextState: BimbelState = {
      ...state,
      assessments: state.assessments.filter(a => a.id !== assessmentId),
    };

    firestoreDeleteAssessment(assessmentId);
    updateAndSaveState(nextState);
  };

  const handleUpdateAttendanceBulk = (records: Attendance[]) => {
    if (records.length === 0) return;
    const targetStudentDateKeys = new Set(records.map(r => `${r.studentId}_${r.date}`));

    // Filter out records that are being updated
    const currentList = state.attendance || [];
    const remaining = currentList.filter(
      a => !targetStudentDateKeys.has(`${a.studentId}_${a.date}`)
    );

    const nextState: BimbelState = {
      ...state,
      attendance: [...remaining, ...records],
    };

    firestoreSaveAttendanceBulk(records);
    updateAndSaveState(nextState);
  };

  const handleDeleteAttendance = (id: string) => {
    const currentList = state.attendance || [];
    const nextState: BimbelState = {
      ...state,
      attendance: currentList.filter(a => a.id !== id),
    };

    firestoreDeleteAttendance(id);
    updateAndSaveState(nextState);
  };

  const handleUpdateTeacherAttendanceBulk = (records: TeacherAttendance[]) => {
    if (records.length === 0) return;
    const targetDates = new Set(records.map(r => r.date));
    const targetTeacherIds = new Set(records.map(r => `${r.teacherId}_${r.date}`));
    
    // Filter out records that are being updated
    const currentList = state.teacherAttendance || [];
    const remaining = currentList.filter(
      r => !targetTeacherIds.has(`${r.teacherId}_${r.date}`)
    );

    const nextState: BimbelState = {
      ...state,
      teacherAttendance: [...remaining, ...records],
    };

    firestoreSaveTeacherAttendanceBulk(records);
    updateAndSaveState(nextState);
  };

  const handleDeleteTeacherAttendance = (id: string) => {
    const currentList = state.teacherAttendance || [];
    const nextState: BimbelState = {
      ...state,
      teacherAttendance: currentList.filter(r => r.id !== id),
    };

    firestoreDeleteTeacherAttendance(id);
    updateAndSaveState(nextState);
  };

  const handleAddActivity = (newActivity: Omit<DailyActivity, 'id'>) => {
    const id = `act-${Date.now()}`;
    const activityWithId: DailyActivity = { ...newActivity, id };

    const nextState: BimbelState = {
      ...state,
      activities: [activityWithId, ...state.activities], // Put newest activity at top
    };

    firestoreAddActivity(activityWithId);
    updateAndSaveState(nextState);
  };

  const handleAddBroadcast = (newBroadcast: Omit<BroadcastMessage, 'id'>) => {
    const id = `bc-${Date.now()}`;
    const broadcastWithId: BroadcastMessage = { ...newBroadcast, id };

    const nextState: BimbelState = {
      ...state,
      broadcasts: [broadcastWithId, ...state.broadcasts],
    };

    firestoreAddBroadcast(broadcastWithId);
    updateAndSaveState(nextState);
  };

  const handleDeleteBroadcast = (broadcastId: string) => {
    const nextState: BimbelState = {
      ...state,
      broadcasts: state.broadcasts.filter(bc => bc.id !== broadcastId),
    };

    firestoreDeleteBroadcast(broadcastId);
    updateAndSaveState(nextState);
  };

  const handleUpdateBroadcast = (updatedBroadcast: BroadcastMessage) => {
    const nextState: BimbelState = {
      ...state,
      broadcasts: state.broadcasts.map(bc => bc.id === updatedBroadcast.id ? updatedBroadcast : bc),
    };

    firestoreUpdateBroadcast(updatedBroadcast);
    updateAndSaveState(nextState);
  };

  const handleMarkChatsAsRead = useCallback((chatIds: string[]) => {
    if (!chatIds || chatIds.length === 0) return;
    const nowStr = new Date().toISOString();
    
    setState((curr) => {
      let hasChanges = false;
      const updatedChats = curr.chats.map(c => {
        if (chatIds.includes(c.id) && (c.status !== 'read' || !c.isRead)) {
          hasChanges = true;
          return {
            ...c,
            status: 'read' as const,
            isRead: true,
            readAt: nowStr,
          };
        }
        return c;
      });

      if (!hasChanges) return curr;

      firestoreMarkChatsAsRead(chatIds);
      const nextState = { ...curr, chats: updatedChats };
      saveBimbelState(nextState);
      return nextState;
    });
  }, []);

  const handleAddChatMessage = useCallback((
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
  ) => {
    const id = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newChat: ChatMessage = {
      id,
      sender,
      senderName,
      senderId,
      receiverId,
      message,
      timestamp: new Date().toISOString(),
      studentId,
      studentName,
      teacherName,
      teacherId,
      parentName,
      parentId,
      status: 'sent',
      isRead: false,
    };

    firestoreAddChatMessage(newChat);
    setState((curr) => {
      const nextChats = [...curr.chats, newChat];
      const nextState = { ...curr, chats: nextChats };
      saveBimbelState(nextState);
      return nextState;
    });

    // Transition message to 'delivered' (Centang 2 Abu-abu) upon server receipt if not yet read by recipient
    setTimeout(() => {
      setState((curr) => {
        const item = curr.chats.find(c => c.id === id);
        if (item && item.status === 'sent' && !item.isRead) {
          const deliveredItem: ChatMessage = {
            ...item,
            status: 'delivered',
            deliveredAt: new Date().toISOString(),
          };
          firestoreUpdateChatMessage(deliveredItem);
          const nextChats = curr.chats.map(c => c.id === id ? deliveredItem : c);
          const s = { ...curr, chats: nextChats };
          saveBimbelState(s);
          return s;
        }
        return curr;
      });
    }, 450);
  }, []);

  const handleMarkInvoicePaid = (invoiceId: string) => {
    const updatedInvoices = state.invoices.map(inv => {
      if (inv.id === invoiceId) {
        return { ...inv, status: 'Lunas' as const };
      }
      return inv;
    });

    const nextState: BimbelState = {
      ...state,
      invoices: updatedInvoices,
    };

    updateAndSaveState(nextState);
  };

  const handleAddInvoice = (newInvoice: Omit<Invoice, 'id' | 'invoiceNo'>) => {
    const id = `inv-${Date.now()}`;
    const invoiceNo = `INV/202607/${Math.floor(100 + Math.random() * 900)}`;
    const invoiceWithId: Invoice = { ...newInvoice, id, invoiceNo };

    const nextState: BimbelState = {
      ...state,
      invoices: [...state.invoices, invoiceWithId],
    };

    updateAndSaveState(nextState);
  };

  const handleDeleteInvoice = (id: string) => {
    const nextState: BimbelState = {
      ...state,
      invoices: state.invoices.filter(inv => inv.id !== id),
    };

    firestoreDeleteInvoice(id);
    updateAndSaveState(nextState);
  };

  const handleAddSchedule = (newSchedule: Omit<ScheduleItem, 'id'>) => {
    const id = `sch-${Date.now()}`;
    const scheduleWithId: ScheduleItem = { ...newSchedule, id };

    // If schedule is for a specific student, keep their student record's className & teacher synced
    let nextStudents = state.students;
    if (scheduleWithId.studentId && scheduleWithId.className) {
      nextStudents = state.students.map(s => {
        if (s.id === scheduleWithId.studentId) {
          const updated = {
            ...s,
            className: scheduleWithId.className,
            teacherName: scheduleWithId.teacherName || s.teacherName,
          };
          firestoreUpdateStudent(updated);
          return updated;
        }
        return s;
      });
    }

    const nextState: BimbelState = {
      ...state,
      students: nextStudents,
      schedules: [...state.schedules, scheduleWithId],
    };

    firestoreAddSchedule(scheduleWithId);
    updateAndSaveState(nextState);
  };

  const handleDeleteSchedule = (id: string) => {
    const nextState: BimbelState = {
      ...state,
      schedules: state.schedules.filter(sch => sch.id !== id),
    };

    firestoreDeleteSchedule(id);
    updateAndSaveState(nextState);
  };

  const handleUpdateBankAccount = (bankAccount: BankAccountInfo) => {
    const nextState: BimbelState = {
      ...state,
      bankAccount,
    };

    firestoreUpdateBankAccount(bankAccount);
    updateAndSaveState(nextState);
  };

  const handleAddLocation = (newLoc: Omit<BimbelLocation, 'id'>) => {
    const id = `loc-${Date.now()}`;
    const locationWithId: BimbelLocation = { ...newLoc, id };
    const currentLocations = state.locations || [];
    const updatedLocations: BimbelLocation[] = locationWithId.isDefault
      ? [...currentLocations.map(l => ({ ...l, isDefault: false })), locationWithId]
      : [...currentLocations, locationWithId];

    const nextState: BimbelState = {
      ...state,
      locations: updatedLocations,
      activeLocationId: locationWithId.isDefault ? id : state.activeLocationId || id,
    };

    firestoreAddLocation(locationWithId);
    updateAndSaveState(nextState);
  };

  const handleUpdateLocation = (updatedLoc: BimbelLocation) => {
    const currentLocations = state.locations || [];
    const updatedLocations = currentLocations.map(l => {
      if (l.id === updatedLoc.id) {
        return updatedLoc;
      }
      if (updatedLoc.isDefault) {
        return { ...l, isDefault: false };
      }
      return l;
    });

    const nextState: BimbelState = {
      ...state,
      locations: updatedLocations,
      activeLocationId: updatedLoc.isDefault ? updatedLoc.id : state.activeLocationId,
    };

    firestoreUpdateLocation(updatedLoc);
    updateAndSaveState(nextState);
  };

  const handleDeleteLocation = (id: string) => {
    const currentLocations = state.locations || [];
    const updatedLocations = currentLocations.filter(l => l.id !== id);

    const nextState: BimbelState = {
      ...state,
      locations: updatedLocations,
    };

    firestoreDeleteLocation(id);
    updateAndSaveState(nextState);
  };

  const handleSetDefaultLocation = (id: string) => {
    const currentLocations = state.locations || [];
    const updatedLocations = currentLocations.map(l => ({
      ...l,
      isDefault: l.id === id,
    }));

    const nextState: BimbelState = {
      ...state,
      locations: updatedLocations,
      activeLocationId: id,
    };

    updatedLocations.forEach(loc => firestoreUpdateLocation(loc));
    updateAndSaveState(nextState);
  };

  const handleUpdateBranding = (newBranding: Partial<BimbelBrandingSettings>) => {
    const updatedBranding: BimbelBrandingSettings = {
      ...(state.branding || DEFAULT_BRANDING_SETTINGS),
      ...newBranding,
      updatedAt: new Date().toISOString(),
    };

    const nextState: BimbelState = {
      ...state,
      branding: updatedBranding,
    };

    firestoreUpdateBranding(newBranding);
    updateAndSaveState(nextState);
  };

  // Clear state to have a 100% empty canvas ready for the user
  const clearToEmptyState = async () => {
    await clearFirestoreCollections();
    updateAndSaveState({ ...INITIAL_EMPTY_STATE });
    setIsDemoMode(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const activeBroadcasts = state.broadcasts.filter(bc => !bc.expiresAt || bc.expiresAt >= todayStr);
  const latestBroadcast = activeBroadcasts.length > 0 ? activeBroadcasts[0] : null;

  // Determine if current view is a sub-page/detail view for dynamic back button
  const isSubPage = useMemo(() => {
    if (activePortal === 'admin') return adminActiveTab !== 'kesehatan';
    if (activePortal === 'teacher') return teacherActiveTab !== 'dashboard';
    if (activePortal === 'parent') return parentActiveTab !== 'dashboard';
    return false;
  }, [activePortal, adminActiveTab, teacherActiveTab, parentActiveTab]);

  const handleNavigateBack = useCallback(() => {
    if (activePortal === 'admin') setAdminActiveTab('kesehatan');
    else if (activePortal === 'teacher') setTeacherActiveTab('dashboard');
    else if (activePortal === 'parent') setParentActiveTab('dashboard');
  }, [activePortal]);

  // Show Login Page if not logged in
  if (!currentUser) {
    return (
      <ErrorBoundary>
        <LoginPage
          users={state.users}
          students={state.students}
          onLoginSuccess={handleLoginSuccess}
          onRegisterParent={handleRegisterParent}
        />
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg antialiased selection:bg-brand-primary/20 flex flex-col md:flex-row relative">
      
      {/* ========================================================================= */}
      {/* 1. FIXED LEFT SIDEBAR (DESKTOP & TABLET >= 768px)                         */}
      {/* ========================================================================= */}
      <aside 
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-[260px] z-[100] bg-white border-r border-[#EDE6DD] flex-col p-4 shadow-xs select-none overflow-hidden"
        style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '260px', zIndex: 100 }}
      >
        {/* Top Fixed Area: Logo & Brand Header */}
        <div className="shrink-0 pb-3">
          {/* Logo & Brand Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-[#EDE6DD]">
            <div className="w-10 h-10 rounded-2xl bg-brand-light p-2 flex items-center justify-center shadow-xs border border-[#EAE3DC] shrink-0">
              <Logo className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-base text-brand-dark leading-tight tracking-tight font-display truncate">
                Rumah CahayaQu
              </span>
              <span className="text-[11px] font-semibold text-brand-muted truncate">
                Portal Bimbel Terpadu
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Menu Area (Scrollbar sleek 4px only here) */}
        <div className="flex-1 overflow-y-auto pr-1 sleek-scrollbar space-y-1.5 my-1">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block px-1 mb-1.5 sticky top-0 bg-white py-1 z-10">
            MENU UTAMA
          </span>

          {/* Admin Menu List */}
          {activePortal === 'admin' && (
            <>
              {[
                { id: 'kesehatan', label: 'Dashboard', desc: 'Ringkasan & Keuangan', icon: LayoutDashboard },
                { id: 'absensi-guru', label: 'Presensi', desc: 'Absensi Selfie & GPS', icon: Camera },
                { id: 'jadwal', label: 'Jadwal & Ruang', desc: 'Alokasi Ruang & Sesi', icon: Calendar },
                { id: 'laporan', label: 'Rapor & Evaluasi', desc: 'Evaluasi 4 Pilar Murid', icon: Award },
                { id: 'tagihan', label: 'Keuangan & SPP', desc: 'Kelola Tagihan SPP', icon: CreditCard },
                { id: 'siswa', label: 'Data Siswa', desc: 'Database Murid Aktif', icon: Users },
                { id: 'guru', label: 'Data Guru', desc: 'Daftar Pengajar & Staf', icon: BookOpen },
                { id: 'pengaturan', label: 'Pengaturan & Info', desc: 'Profil, Bank & Broadcast', icon: SlidersHorizontal }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = adminActiveTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAdminActiveTab(item.id as any)}
                    className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer min-h-[46px] ${
                      isActive
                        ? 'bg-brand-primary text-white shadow-md font-extrabold'
                        : 'text-gray-700 hover:bg-brand-light hover:text-brand-dark'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-left min-w-0 flex-1">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-brand-light text-brand-primary'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 py-0.5">
                        <span className="block leading-snug text-xs truncate font-extrabold">{item.label}</span>
                        <span className={`text-[11px] font-medium leading-snug truncate block pb-0.5 ${isActive ? 'text-white/90' : 'text-gray-500'}`}>
                          {item.desc}
                        </span>
                      </div>
                    </div>
                    {isActive && <CheckCircle className="w-3.5 h-3.5 text-brand-accent shrink-0 ml-1.5" />}
                  </button>
                );
              })}
            </>
          )}

          {/* Teacher Menu List */}
          {activePortal === 'teacher' && (
            <>
              {[
                { id: 'dashboard', label: 'Dashboard', desc: 'Ringkasan & Informasi', icon: LayoutDashboard },
                { id: 'presensi-guru', label: 'Presensi', desc: 'Absensi Selfie & GPS', icon: Camera },
                { id: 'absensi-siswa', label: 'Presensi Siswa', desc: 'Presensi Kelas Harian', icon: UserCheck },
                { id: 'evaluasi-rapor', label: 'Rapor & Evaluasi', desc: 'Input Capaian 4 Pilar', icon: Award },
                { id: 'galeri', label: 'Galeri Aktivitas', desc: 'Dokumentasi Kelas', icon: ImageIcon },
                { id: 'chat', label: 'Ruang Chat', desc: 'Konsultasi Wali Murid', icon: MessageSquare }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = teacherActiveTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTeacherActiveTab(item.id as TeacherSubTab)}
                    className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer min-h-[46px] ${
                      isActive
                        ? 'bg-brand-primary text-white shadow-md font-extrabold'
                        : 'text-gray-700 hover:bg-brand-light hover:text-brand-dark'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-left min-w-0 flex-1">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-brand-light text-brand-primary'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 py-0.5">
                        <span className="block leading-snug text-xs truncate font-extrabold">{item.label}</span>
                        <span className={`text-[11px] font-medium leading-snug truncate block pb-0.5 ${isActive ? 'text-white/90' : 'text-gray-500'}`}>
                          {item.desc}
                        </span>
                      </div>
                    </div>
                    {isActive && <CheckCircle className="w-3.5 h-3.5 text-brand-accent shrink-0 ml-1.5" />}
                  </button>
                );
              })}
            </>
          )}

          {/* Parent Menu List */}
          {activePortal === 'parent' && (
            <>
              {[
                { id: 'dashboard', label: 'Dashboard', desc: 'Ringkasan & Informasi', icon: LayoutDashboard },
                { id: 'presensi', label: 'Presensi', desc: 'Absensi & Log Kehadiran', icon: ShieldCheck },
                { id: 'jadwal', label: 'Jadwal & Ruang', desc: 'Agenda Rutin Mingguan', icon: Calendar },
                { id: 'rapor', label: 'Rapor & Evaluasi', desc: 'Grafik Capaian Anak', icon: Award },
                { id: 'spp', label: 'Keuangan & SPP', desc: 'Kartu SPP & Rekening', icon: CreditCard },
                { id: 'galeri', label: 'Galeri Aktivitas', desc: 'Dokumentasi Kelas', icon: ImageIcon }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = parentActiveTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setParentActiveTab(item.id as ParentSubTab)}
                    className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer min-h-[46px] ${
                      isActive
                        ? 'bg-brand-primary text-white shadow-md font-extrabold'
                        : 'text-gray-700 hover:bg-brand-light hover:text-brand-dark'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-left min-w-0 flex-1">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-brand-light text-brand-primary'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 py-0.5">
                        <span className="block leading-snug text-xs truncate font-extrabold">{item.label}</span>
                        <span className={`text-[11px] font-medium leading-snug truncate block pb-0.5 ${isActive ? 'text-white/90' : 'text-gray-500'}`}>
                          {item.desc}
                        </span>
                      </div>
                    </div>
                    {isActive && <CheckCircle className="w-3.5 h-3.5 text-brand-accent shrink-0 ml-1.5" />}
                  </button>
                );
              })}
            </>
          )}

        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA (OFFSET BY margin-left: 260px ON DESKTOP)            */}
      {/* ========================================================================= */}
      <div 
        className="flex-1 flex flex-col min-w-0 md:ml-[260px] min-h-screen bg-brand-bg transition-all"
      >
        
        {/* Top Header Bar */}
        <header className="w-full bg-white border-b border-[#EDE6DD] sticky top-0 z-30 shrink-0 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 gap-3">
              
              {/* Mobile View: Dynamic Button (Back or Hamburger) + Logo & Brand Name */}
              <div className="flex items-center gap-2.5 md:hidden">
                {isSubPage ? (
                  <button
                    type="button"
                    onClick={handleNavigateBack}
                    className="w-10 h-10 rounded-xl bg-brand-light hover:bg-brand-primary/10 border border-[#EBE3D9] text-brand-dark transition-all cursor-pointer min-h-[44px] min-w-[44px] shadow-2xs flex items-center justify-center aspect-square active:scale-95 shrink-0"
                    title="Kembali ke Halaman Utama"
                    aria-label="Kembali ke Halaman Utama"
                  >
                    <ArrowLeft className="w-5 h-5 text-brand-primary shrink-0" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(true)}
                    className="p-2.5 rounded-xl bg-brand-light hover:bg-brand-primary/10 border border-[#EBE3D9] text-brand-dark transition-all cursor-pointer flex items-center justify-center min-h-[44px] min-w-[44px] shadow-2xs active:scale-95"
                    title="Buka Menu Navigasi"
                    aria-label="Buka Menu Navigasi"
                  >
                    <Menu className="w-5 h-5 text-brand-dark" />
                  </button>
                )}

                <div className="w-8 h-8 rounded-xl bg-brand-light p-1 flex items-center justify-center shadow-xs border border-[#EAE3DC] shrink-0">
                  <Logo className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-sm text-brand-dark leading-tight tracking-tight font-display truncate">
                    Rumah CahayaQu
                  </span>
                  <span className="text-[10px] font-semibold text-brand-muted truncate">
                    {activePortal === 'admin' ? 'Admin Portal' : activePortal === 'teacher' ? 'Guru Portal' : 'Wali Murid Portal'}
                  </span>
                </div>
              </div>

              {/* Desktop View: Spacer (Clean Header without redundant breadcrumbs) */}
              <div className="hidden md:block" />

              {/* Right Side: Quick User Profile & Logout Dropdown */}
              <div className="relative shrink-0" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#EBE3D9] bg-brand-light/60 hover:bg-brand-light text-xs font-bold text-brand-dark transition-all cursor-pointer shadow-xs min-h-[44px]"
                  title="Menu Pengguna"
                >
                  <div className="w-7 h-7 rounded-lg bg-brand-primary/15 text-brand-primary flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-bold text-brand-dark max-w-[120px] truncate">{currentUser.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E2DBD0] p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* User Profile Header */}
                    <div className="p-3 rounded-xl bg-brand-light flex items-center gap-3 mb-1 border border-[#EAE3DC]">
                      <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-xs text-brand-dark truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-gray-500 font-medium truncate">{currentUser.email}</p>
                        <span className="inline-block mt-0.5 text-[10px] text-brand-primary font-bold capitalize">
                          {currentUser.role === 'admin' ? 'Pemilik Bimbel (Admin)' : currentUser.role === 'teacher' ? 'Guru Pengajar' : 'Wali Murid'}
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-[#F0EAE1] my-1" />

                    {/* Dark Mode / Light Mode Toggle */}
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-brand-dark hover:bg-brand-light transition-colors cursor-pointer min-h-[44px]"
                    >
                      <div className="flex items-center gap-2.5">
                        {isDarkMode ? (
                          <Moon className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Sun className="w-4 h-4 text-amber-500" />
                        )}
                        <span>{isDarkMode ? 'Mode Gelap' : 'Mode Terang'}</span>
                      </div>
                      <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center ${isDarkMode ? 'bg-brand-primary justify-end' : 'bg-gray-300 justify-start'}`}>
                        <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                      </div>
                    </button>

                    <div className="h-px bg-[#F0EAE1] my-1" />

                    {/* Logout Button */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer min-h-[44px]"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </header>

        {/* Slide-out Navigation Drawer (Mobile / Tablet < 768px) */}
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
              onClick={() => setIsMobileDrawerOpen(false)}
            />

            {/* Drawer Panel (Slides out from Left) */}
            <div 
              className="sidebar-mobile-container relative w-[85vw] max-w-xs bg-white h-full max-h-[100vh] shadow-2xl z-10 flex flex-col justify-between p-5 overflow-y-auto animate-in slide-in-from-left duration-300"
              style={{ maxHeight: '100vh', overflowY: 'auto' }}
            >
              <div className="space-y-4 pb-8">
                
                {/* Drawer Top / Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-light p-1.5 flex items-center justify-center shadow-xs border border-[#EAE3DC] shrink-0">
                      <Logo className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-brand-dark leading-tight">Rumah CahayaQu</h3>
                      <p className="text-[10px] text-gray-500 font-semibold">Portal Bimbel Terpadu</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Tutup Menu"
                    aria-label="Tutup Menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Menu List for Active Portal */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                      Menu Navigasi
                    </span>
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md capitalize">
                      {activePortal === 'admin' ? 'Admin' : activePortal === 'teacher' ? 'Guru' : 'Wali Murid'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {/* Admin Portal Menus */}
                    {activePortal === 'admin' && (
                      <>
                        {[
                          { id: 'kesehatan', label: 'Dashboard', desc: 'Ringkasan & Keuangan', icon: LayoutDashboard },
                          { id: 'absensi-guru', label: 'Presensi', desc: 'Absensi Selfie & GPS', icon: Camera },
                          { id: 'jadwal', label: 'Jadwal & Ruang', desc: 'Alokasi Ruang & Sesi', icon: Calendar },
                          { id: 'laporan', label: 'Rapor & Evaluasi', desc: 'Evaluasi 4 Pilar Murid', icon: Award },
                          { id: 'tagihan', label: 'Keuangan & SPP', desc: 'Kelola Tagihan SPP', icon: CreditCard },
                          { id: 'siswa', label: 'Data Siswa', desc: 'Database Murid Aktif', icon: Users },
                          { id: 'guru', label: 'Data Guru', desc: 'Daftar Pengajar & Staf', icon: BookOpen },
                          { id: 'pengaturan', label: 'Pengaturan & Info', desc: 'Profil, Bank & Broadcast', icon: SlidersHorizontal }
                        ].map((item) => {
                          const Icon = item.icon;
                          const isActive = adminActiveTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setAdminActiveTab(item.id as any);
                                setIsMobileDrawerOpen(false);
                              }}
                              className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer min-h-[46px] ${
                                isActive
                                  ? 'bg-brand-primary text-white shadow-md font-extrabold'
                                  : 'text-gray-700 hover:bg-brand-light/80 hover:text-brand-dark'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 text-left min-w-0 flex-1">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isActive ? 'bg-white/20 text-white' : 'bg-brand-light text-brand-primary'
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1 py-0.5">
                                  <span className="block leading-snug text-xs truncate font-extrabold">{item.label}</span>
                                  <span className={`text-[11px] font-medium leading-snug truncate block pb-0.5 ${isActive ? 'text-white/90' : 'text-gray-500'}`}>
                                    {item.desc}
                                  </span>
                                </div>
                              </div>
                              {isActive && <CheckCircle className="w-3.5 h-3.5 text-brand-accent shrink-0 ml-1.5" />}
                            </button>
                          );
                        })}
                      </>
                    )}

                    {/* Teacher Portal Menus */}
                    {activePortal === 'teacher' && (
                      <>
                        {[
                          { id: 'dashboard', label: 'Dashboard', desc: 'Ringkasan & Informasi', icon: LayoutDashboard },
                          { id: 'presensi-guru', label: 'Presensi', desc: 'Absensi Selfie & GPS', icon: Camera },
                          { id: 'absensi-siswa', label: 'Presensi Siswa', desc: 'Presensi Kelas Harian', icon: UserCheck },
                          { id: 'evaluasi-rapor', label: 'Rapor & Evaluasi', desc: 'Input Capaian 4 Pilar', icon: Award },
                          { id: 'galeri', label: 'Galeri Aktivitas', desc: 'Dokumentasi Kelas', icon: ImageIcon },
                          { id: 'chat', label: 'Ruang Chat', desc: 'Konsultasi Wali Murid', icon: MessageSquare }
                        ].map((item) => {
                          const Icon = item.icon;
                          const isActive = teacherActiveTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setTeacherActiveTab(item.id as TeacherSubTab);
                                setIsMobileDrawerOpen(false);
                              }}
                              className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer min-h-[46px] ${
                                isActive
                                  ? 'bg-brand-primary text-white shadow-md font-extrabold'
                                  : 'text-gray-700 hover:bg-brand-light/80 hover:text-brand-dark'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 text-left min-w-0 flex-1">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isActive ? 'bg-white/20 text-white' : 'bg-brand-light text-brand-primary'
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1 py-0.5">
                                  <span className="block leading-snug text-xs truncate font-extrabold">{item.label}</span>
                                  <span className={`text-[11px] font-medium leading-snug truncate block pb-0.5 ${isActive ? 'text-white/90' : 'text-gray-500'}`}>
                                    {item.desc}
                                  </span>
                                </div>
                              </div>
                              {isActive && <CheckCircle className="w-3.5 h-3.5 text-brand-accent shrink-0 ml-1.5" />}
                            </button>
                          );
                        })}
                      </>
                    )}

                    {/* Parent Portal Menus */}
                    {activePortal === 'parent' && (
                      <>
                        {[
                          { id: 'dashboard', label: 'Dashboard', desc: 'Ringkasan & Informasi', icon: LayoutDashboard },
                          { id: 'presensi', label: 'Presensi', desc: 'Absensi & Log Kehadiran', icon: ShieldCheck },
                          { id: 'jadwal', label: 'Jadwal & Ruang', desc: 'Agenda Rutin Mingguan', icon: Calendar },
                          { id: 'rapor', label: 'Rapor & Evaluasi', desc: 'Grafik Capaian Anak', icon: Award },
                          { id: 'spp', label: 'Keuangan & SPP', desc: 'Kartu SPP & Rekening', icon: CreditCard },
                          { id: 'galeri', label: 'Galeri Aktivitas', desc: 'Dokumentasi Kelas', icon: ImageIcon }
                        ].map((item) => {
                          const Icon = item.icon;
                          const isActive = parentActiveTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setParentActiveTab(item.id as ParentSubTab);
                                setIsMobileDrawerOpen(false);
                              }}
                              className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer min-h-[46px] ${
                                isActive
                                  ? 'bg-brand-primary text-white shadow-md font-extrabold'
                                  : 'text-gray-700 hover:bg-brand-light/80 hover:text-brand-dark'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 text-left min-w-0 flex-1">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isActive ? 'bg-white/20 text-white' : 'bg-brand-light text-brand-primary'
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1 py-0.5">
                                  <span className="block leading-snug text-xs truncate font-extrabold">{item.label}</span>
                                  <span className={`text-[11px] font-medium leading-snug truncate block pb-0.5 ${isActive ? 'text-white/90' : 'text-gray-500'}`}>
                                    {item.desc}
                                  </span>
                                </div>
                              </div>
                              {isActive && <CheckCircle className="w-3.5 h-3.5 text-brand-accent shrink-0 ml-1.5" />}
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-[80px] lg:pb-8">
          <ErrorBoundary>
            {/* Dynamic Portal Loading based on tab */}
            {activePortal === 'parent' && (
              <ParentPortal
                users={state.users}
                currentUser={currentUser}
                students={state.students}
                attendance={state.attendance}
                assessments={state.assessments}
                activities={state.activities}
                chats={state.chats}
                schedules={state.schedules}
                invoices={state.invoices}
                broadcasts={state.broadcasts}
                bankAccount={state.bankAccount}
                activeSubTab={parentActiveTab}
                onSubTabChange={setParentActiveTab}
                onAddChatMessage={handleAddChatMessage}
                onMarkChatsAsRead={handleMarkChatsAsRead}
              />
            )}

            {activePortal === 'teacher' && (
              <TeacherPortal
                users={state.users}
                currentUser={currentUser}
                students={state.students}
                attendance={state.attendance}
                assessments={state.assessments}
                activities={state.activities}
                chats={state.chats}
                broadcasts={state.broadcasts}
                teacherAttendance={state.teacherAttendance || []}
                locations={state.locations || []}
                activeLocationId={state.activeLocationId}
                activeSubTab={teacherActiveTab}
                onSubTabChange={setTeacherActiveTab}
                onUpdateTeacherAttendanceBulk={handleUpdateTeacherAttendanceBulk}
                onAddAssessment={handleAddAssessment}
                onUpdateAttendanceBulk={handleUpdateAttendanceBulk}
                onAddActivity={handleAddActivity}
                onAddChatMessage={handleAddChatMessage}
                onMarkChatsAsRead={handleMarkChatsAsRead}
                onAddBroadcast={handleAddBroadcast}
                onDeleteBroadcast={handleDeleteBroadcast}
              />
            )}

            {activePortal === 'admin' && (
              <AdminPortal
                users={state.users}
                students={state.students}
                invoices={state.invoices}
                schedules={state.schedules}
                broadcasts={state.broadcasts}
                bankAccount={state.bankAccount}
                branding={state.branding}
                onUpdateBranding={handleUpdateBranding}
                teacherAttendance={state.teacherAttendance || []}
                locations={state.locations || []}
                assessments={state.assessments || []}
                attendance={state.attendance || []}
                activeSubTab={adminActiveTab}
                onSubTabChange={setAdminActiveTab}
                onUpdateAssessment={handleUpdateAssessment}
                onDeleteAssessment={handleDeleteAssessment}
                onAddAssessment={handleAddAssessment}
                onUpdateTeacherAttendanceBulk={handleUpdateTeacherAttendanceBulk}
                onDeleteTeacherAttendance={handleDeleteTeacherAttendance}
                onUpdateAttendanceBulk={handleUpdateAttendanceBulk}
                onDeleteAttendance={handleDeleteAttendance}
                onAddStudent={handleAddStudent}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                onAddInvoice={handleAddInvoice}
                onAddSchedule={handleAddSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onMarkInvoicePaid={handleMarkInvoicePaid}
                onDeleteInvoice={handleDeleteInvoice}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onAddBroadcast={handleAddBroadcast}
                onUpdateBroadcast={handleUpdateBroadcast}
                onDeleteBroadcast={handleDeleteBroadcast}
                onUpdateBankAccount={handleUpdateBankAccount}
                onAddLocation={handleAddLocation}
                onUpdateLocation={handleUpdateLocation}
                onDeleteLocation={handleDeleteLocation}
                onSetDefaultLocation={handleSetDefaultLocation}
                onResetDatabase={clearToEmptyState}
              />
            )}
          </ErrorBoundary>
        </main>

      </div>

    </div>
  );
}
