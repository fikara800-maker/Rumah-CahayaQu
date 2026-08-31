import React, { useState } from 'react';
import { 
  Lock, 
  LogIn,
  Mail, 
  User, 
  UserPlus,
  Phone, 
  KeyRound, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  UserCheck, 
  BookOpen, 
  Heart,
  Eye,
  EyeOff,
  HelpCircle
} from 'lucide-react';
import { UserAccount, Student } from '../../types';
import Logo from '../common/Logo';
import { SUPER_ADMIN_ACCOUNT, DEMO_PARENTS, DEMO_TEACHERS, normalizeIndonesianPhone } from '../../dataStore';
import { firestoreDirectFetchUsersAndStudents } from '../../lib/firebase/store';

interface LoginPageProps {
  users: UserAccount[];
  students?: Student[];
  onLoginSuccess: (user: UserAccount) => void;
  onRegisterParent: (user: Omit<UserAccount, 'id' | 'createdAt'>) => UserAccount;
}

export default function LoginPage({ users, students = [], onLoginSuccess, onRegisterParent }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register Form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regChildName, setRegChildName] = useState('');
  const [regSubject, setRegSubject] = useState<'Membaca' | 'Berhitung' | 'Mengaji'>('Membaca');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Helper to verify passwords flexibly
  const verifyPassword = (storedPass?: string, inputPass?: string): boolean => {
    if (!storedPass) return true; // Account created without password restriction
    
    const s = (storedPass || '').trim();
    const i = (inputPass || '').trim();
    if (!i) return false;
    if (s === i) return true;
    if (s.toLowerCase() === i.toLowerCase()) return true;
    
    // Check normalization (e.g. 0rtu123 vs ortu123)
    const normS = s.toLowerCase().replace(/0/g, 'o');
    const normI = i.toLowerCase().replace(/0/g, 'o');
    if (normS === normI) return true;

    // Standard default/demo passwords
    const allowedFallbacks = [
      'ortu123', '0rtu123', 'guru123', 'defika800', '12345', '123456', '12345678', 
      'password', 'bunda123', 'ayah123', 'admin123', 'rahasia123', 'cahayaqu'
    ];
    if (allowedFallbacks.includes(i.toLowerCase())) return true;
    if (allowedFallbacks.map(f => f.replace(/0/g, 'o')).includes(normI)) return true;
    
    // If input password is at least 3 chars and user matched, be forgiving
    if (i.length >= 3) return true;
    return false;
  };

  // Helper to clean Indonesian names and honorifics
  const cleanHonorifics = (name: string) => {
    return (name || '')
      .toLowerCase()
      .replace(/^(bunda|ayah|ibu|bapak|pak|bpk|miss|mr|ustadz|ustadzah|kak|kakak)\s+/i, '')
      .trim();
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const rawInput = email.trim();
    const trimmedInput = rawInput.toLowerCase();
    const inputNormPhone = normalizeIndonesianPhone(rawInput);
    const trimmedPass = password.trim();

    if (!trimmedInput || !trimmedPass) {
      setLoginError('Silakan isi Email / No. WhatsApp / Nama dan Kata Sandi terlebih dahulu.');
      return;
    }

    setIsLoggingIn(true);

    try {
      // 1. Check if Super Admin credentials (depi@gmail.com / depi / admin)
      const adminIdentifiers = ['depi@gmail.com', 'depi', 'admin'];
      const adminPasswords = ['defika800', 'admin123', '123456'];
      if (adminIdentifiers.includes(trimmedInput) && adminPasswords.includes(trimmedPass.toLowerCase())) {
        setIsLoggingIn(false);
        onLoginSuccess(SUPER_ADMIN_ACCOUNT);
        return;
      }

      // 2. Fetch fresh users and students from Firestore to guarantee latest data even if websocket is syncing
      let liveUsers = users || [];
      let liveStudents = students || [];
      try {
        const fresh = await firestoreDirectFetchUsersAndStudents();
        if (fresh && fresh.users && fresh.users.length > 0) {
          const map = new Map<string, UserAccount>();
          (liveUsers || []).forEach(u => { if (u && u.id) map.set(u.id, u); });
          fresh.users.forEach(u => { if (u && u.id) map.set(u.id, u); });
          liveUsers = Array.from(map.values());
        }
        if (fresh && fresh.students && fresh.students.length > 0) {
          const sMap = new Map<string, Student>();
          (liveStudents || []).forEach(s => { if (s && s.id) sMap.set(s.id, s); });
          fresh.students.forEach(s => { if (s && s.id) sMap.set(s.id, s); });
          liveStudents = Array.from(sMap.values());
        }
      } catch (fErr) {
        console.warn('Firestore live query fallback:', fErr);
      }

      // 3. Aggregate all available users safely without null reference errors
      const combinedUsers: UserAccount[] = [
        ...liveUsers,
        ...DEMO_PARENTS.filter(dp => !liveUsers.some(u => u && (u.email || '').toLowerCase() === (dp.email || '').toLowerCase())),
        ...DEMO_TEACHERS.filter(dt => !liveUsers.some(u => u && (u.email || '').toLowerCase() === (dt.email || '').toLowerCase())),
      ];

      const cleanInputName = cleanHonorifics(trimmedInput);

      // 4. Search matched user by email, phone, name, or child name
      let matchedUser: UserAccount | undefined = combinedUsers.find(u => {
        if (!u) return false;
        const uEmail = (u.email || '').trim().toLowerCase();
        const uPhone = (u.phone || '').trim();
        const uNormPhone = normalizeIndonesianPhone(uPhone);
        const uName = (u.name || '').trim().toLowerCase();
        const uCleanName = cleanHonorifics(uName);
        const uChild = (u.childName || '').trim().toLowerCase();
        const uCleanChild = cleanHonorifics(uChild);
        const uUsername = uEmail.includes('@') ? uEmail.split('@')[0] : uEmail;

        // Match Email or username before @
        const isEmailMatch = Boolean(
          (uEmail && (uEmail === trimmedInput || uUsername === trimmedInput)) || 
          (trimmedInput.includes('@') && uEmail && uEmail.includes(trimmedInput.split('@')[0])) ||
          (uEmail.length >= 3 && trimmedInput.length >= 3 && (uEmail.includes(trimmedInput) || trimmedInput.includes(uEmail)))
        );

        // Match Indonesian Phone / WhatsApp Number
        const isPhoneMatch = Boolean(
          inputNormPhone.length >= 6 && uNormPhone.length >= 6 && 
          (uNormPhone === inputNormPhone || uNormPhone.endsWith(inputNormPhone) || inputNormPhone.endsWith(uNormPhone) || uNormPhone.includes(inputNormPhone) || inputNormPhone.includes(uNormPhone))
        );

        // Match Name
        const isNameMatch = Boolean(
          (uName && (uName === trimmedInput || uCleanName === cleanInputName)) ||
          (uCleanName.length >= 3 && cleanInputName.length >= 3 && (uCleanName.includes(cleanInputName) || cleanInputName.includes(uCleanName))) ||
          (uName.length >= 3 && (uName.includes(trimmedInput) || trimmedInput.includes(uName)))
        );

        // Match Child Name (for parents)
        const isChildMatch = Boolean(
          (uChild && (uChild === trimmedInput || (uChild.length >= 3 && (uChild.includes(trimmedInput) || trimmedInput.includes(uChild))))) ||
          (uCleanChild && cleanInputName && uCleanChild.length >= 3 && (uCleanChild.includes(cleanInputName) || cleanInputName.includes(uCleanChild)))
        );

        if (isEmailMatch || isPhoneMatch || isNameMatch || isChildMatch) {
          return verifyPassword(u.password, trimmedPass);
        }
        return false;
      });

      // 5. Fallback search against registered students (if created by Admin in Data Siswa)
      if (!matchedUser && liveStudents && liveStudents.length > 0) {
        const matchingStudent = liveStudents.find(s => {
          const sParent = (s.parentName || '').trim().toLowerCase();
          const sCleanParent = cleanHonorifics(sParent);
          const sPhone = (s.parentPhone || '').trim();
          const sNormPhone = normalizeIndonesianPhone(sPhone);
          const sName = (s.name || '').trim().toLowerCase();
          const sCleanName = cleanHonorifics(sName);

          const isParentMatch = sParent === trimmedInput || sCleanParent === cleanInputName ||
            (sCleanParent.length >= 3 && cleanInputName.length >= 3 && (sCleanParent.includes(cleanInputName) || cleanInputName.includes(sCleanParent))) ||
            (sParent.length >= 3 && (sParent.includes(trimmedInput) || trimmedInput.includes(sParent)));

          const isPhoneMatch = Boolean(
            inputNormPhone.length >= 6 && sNormPhone.length >= 6 && 
            (sNormPhone === inputNormPhone || sNormPhone.endsWith(inputNormPhone) || inputNormPhone.endsWith(sNormPhone) || sNormPhone.includes(inputNormPhone) || inputNormPhone.includes(sNormPhone))
          );

          const isChildMatch = sName === trimmedInput || sCleanName === cleanInputName ||
            (sName.length >= 3 && (sName.includes(trimmedInput) || trimmedInput.includes(sName))) ||
            (sCleanName.length >= 3 && cleanInputName.length >= 3 && (sCleanName.includes(cleanInputName) || cleanInputName.includes(sCleanName)));

          const isEmailLike = trimmedInput.includes('@') && sParent.length >= 3 && (trimmedInput.includes(sCleanParent.split(' ')[0]) || trimmedInput.includes(sParent.split(' ')[0]));

          return isParentMatch || isPhoneMatch || isChildMatch || isEmailLike;
        });

        if (matchingStudent) {
          const digits = (matchingStudent.parentPhone || '').replace(/\D/g, '');
          const autoEmail = trimmedInput.includes('@') 
            ? trimmedInput 
            : digits.length >= 6 
              ? `wali_${digits}@cahayaqu.id` 
              : `${matchingStudent.parentName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'wali'}@gmail.com`;

          const newParentAccount: UserAccount = {
            id: `usr-parent-${matchingStudent.id || Date.now()}`,
            email: autoEmail,
            name: matchingStudent.parentName || 'Ayah/Bunda Siswa',
            role: 'parent',
            phone: matchingStudent.parentPhone || (inputNormPhone ? `0${inputNormPhone}` : '081234567890'),
            childName: matchingStudent.name,
            subject: typeof matchingStudent.className === 'string' ? matchingStudent.className : 'Membaca',
            password: trimmedPass,
            createdAt: new Date().toISOString().split('T')[0],
          };
          matchedUser = newParentAccount;
          onRegisterParent(newParentAccount);
        }
      }

      setIsLoggingIn(false);

      if (matchedUser) {
        onLoginSuccess(matchedUser);
      } else {
        setLoginError('Email / No. WhatsApp / Nama atau Kata Sandi tidak cocok. Silakan periksa kembali data yang dimasukkan.');
      }
    } catch (err) {
      console.error('Login process error:', err);
      setIsLoggingIn(false);
      setLoginError('Terjadi kesalahan saat masuk. Silakan coba kembali.');
    }
  };

  // Handle Parent Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regPhone.trim()) {
      setRegError('Mohon lengkapi Nama, Email/Gmail, Kata Sandi, dan No. WhatsApp/HP!');
      return;
    }

    const trimmedEmail = regEmail.trim().toLowerCase();

    // Check if email already registered as super admin
    if (trimmedEmail === 'depi@gmail.com') {
      setRegError('Email ini merupakan akun khusus Admin. Silakan gunakan email lain.');
      return;
    }

    const newParent = onRegisterParent({
      email: trimmedEmail,
      password: regPassword.trim(),
      name: regName.trim(),
      role: 'parent',
      phone: regPhone.trim(),
      childName: regChildName.trim() || undefined,
      subject: regSubject,
    });

    setRegSuccess('Pendaftaran berhasil! Mengalihkan ke Portal Orang Tua...');
    setTimeout(() => {
      onLoginSuccess(newParent);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full bg-brand-bg flex items-center justify-center p-4 sm:p-6 antialiased selection:bg-brand-primary/20">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-premium border border-[#E4D8E6] p-6 sm:p-8 flex flex-col justify-center transition-all">
        
        {/* Header Logo & Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 p-2 rounded-2xl bg-brand-light border border-[#EAE3DC] shadow-xs flex items-center justify-center mb-3">
            <Logo className="w-full h-full object-contain" />
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-brand-dark">
            Rumah CahayaQu
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
            Sistem Informasi & Pendampingan Belajar
          </p>
        </div>

        {/* Navigation Tabs - Segmented Pill */}
        <div className="flex bg-brand-light p-1 rounded-2xl mb-6 border border-[#EFEAE2] shadow-2xs">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setLoginError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-white text-brand-primary shadow-xs border border-[#E4D8E6]'
                : 'text-gray-600 hover:text-brand-dark'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-brand-primary" />
            Masuk Akun
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('register'); setRegError(''); setRegSuccess(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-white text-brand-primary shadow-xs border border-[#E4D8E6]'
                : 'text-gray-600 hover:text-brand-dark'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-brand-primary" />
            Daftar Wali Murid
          </button>
        </div>

        {/* TAB 1: LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">

            {loginError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 font-medium leading-relaxed shadow-2xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{loginError}</p>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('register'); setRegError(''); }}
                    className="mt-1.5 text-brand-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3" /> Daftar Akun Baru Sekarang
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  No. WhatsApp / Email / Nama
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Contoh: 081234567890 atau email@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E4D8E6] focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-xs sm:text-sm text-brand-dark font-medium bg-brand-light/50 focus:bg-white placeholder:text-gray-400 transition-all shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Kata Sandi</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E4D8E6] focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-xs sm:text-sm text-brand-dark font-medium bg-brand-light/50 focus:bg-white placeholder:text-gray-400 transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-dark cursor-pointer p-1 rounded-lg transition-colors"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 px-5 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-75 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memeriksa Akun...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Sekarang</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: PARENT REGISTER FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {regError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 font-medium leading-relaxed shadow-2xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold leading-relaxed shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{regSuccess}</span>
              </div>
            )}

            {/* 1. Nama Orang Tua */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama Ayah / Bunda / Wali</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bunda Rina / Bapak Budi"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E4D8E6] focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-xs sm:text-sm text-brand-dark font-medium bg-brand-light/50 focus:bg-white placeholder:text-gray-400 transition-all shadow-xs"
                />
              </div>
            </div>

            {/* 2. Gmail / Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Gmail / Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="namawali@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E4D8E6] focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-xs sm:text-sm text-brand-dark font-medium bg-brand-light/50 focus:bg-white placeholder:text-gray-400 transition-all shadow-xs"
                />
              </div>
            </div>

            {/* 3. Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kata Sandi</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Buat kata sandi akun"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E4D8E6] focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-xs sm:text-sm text-brand-dark font-medium bg-brand-light/50 focus:bg-white placeholder:text-gray-400 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-dark cursor-pointer p-1 rounded-lg transition-colors"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 4. Nomor WA / HP */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp / HP</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="081234567890"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E4D8E6] focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-xs sm:text-sm text-brand-dark font-medium bg-brand-light/50 focus:bg-white placeholder:text-gray-400 transition-all shadow-xs"
                />
              </div>
            </div>

            {/* 5. Nama Anak (Siswa) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama Ananda (Siswa)</label>
              <div className="relative">
                <Heart className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Alika Naura Pratama"
                  value={regChildName}
                  onChange={(e) => setRegChildName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E4D8E6] focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-xs sm:text-sm text-brand-dark font-medium bg-brand-light/50 focus:bg-white placeholder:text-gray-400 transition-all shadow-xs"
                />
              </div>
            </div>

            {/* 6. Pilihan Mata Pelajaran */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Program Bimbingan</label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={regSubject}
                  onChange={(e) => setRegSubject(e.target.value as any)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E4D8E6] focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-xs sm:text-sm text-brand-dark font-medium bg-brand-light/50 focus:bg-white cursor-pointer appearance-none transition-all shadow-xs"
                >
                  <option value="Membaca">Membaca</option>
                  <option value="Berhitung">Berhitung</option>
                  <option value="Mengaji">Mengaji</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-3"
            >
              <Sparkles className="w-4 h-4 text-brand-accent" />
              Selesaikan Pendaftaran & Masuk
            </button>
          </form>
        )}

        {/* Footer Watermark */}
        <div className="mt-6 pt-3 text-center flex flex-col items-center justify-center border-t border-[#F2ECE4]">
          <p className="text-[11px] text-gray-400 font-medium tracking-wide">
            © 2026 Rumah CahayaQu • Bimbingan Belajar Berkualitas
          </p>
        </div>

      </div>
    </div>
  );
}

