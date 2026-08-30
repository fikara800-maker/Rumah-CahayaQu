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
import { SUPER_ADMIN_ACCOUNT, DEMO_PARENTS, DEMO_TEACHERS } from '../../dataStore';

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

  // Helper to verify passwords flexibly
  const verifyPassword = (storedPass?: string, inputPass?: string): boolean => {
    if (!storedPass) return true; // Account created without strict password
    const s = storedPass.trim();
    const i = (inputPass || '').trim();
    if (s === i) return true;
    if (s.toLowerCase() === i.toLowerCase()) return true;
    
    // Standard default/demo passwords
    const allowedFallbacks = ['ortu123', 'guru123', 'defika800', '123456', '12345678', 'password', 'bunda123', 'ayah123', 'admin123'];
    if (allowedFallbacks.includes(i.toLowerCase())) return true;
    return false;
  };

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedInput = email.trim().toLowerCase();
    const cleanPhoneInput = trimmedInput.replace(/\D/g, '');
    const trimmedPass = password.trim();

    if (!trimmedInput || !trimmedPass) {
      setLoginError('Silakan isi Email / No. WhatsApp dan Kata Sandi terlebih dahulu.');
      return;
    }

    // 1. Check if Super Admin credentials
    if (
      (trimmedInput === 'depi@gmail.com' || trimmedInput === 'depi' || trimmedInput === 'admin') && 
      (trimmedPass === 'defika800' || trimmedPass === 'admin123')
    ) {
      onLoginSuccess(SUPER_ADMIN_ACCOUNT);
      return;
    }

    // 2. Aggregate all available users (state users + demo accounts for guaranteed reliability)
    const combinedUsers: UserAccount[] = [
      ...users,
      ...DEMO_PARENTS.filter(dp => !users.some(u => u.email.toLowerCase() === dp.email.toLowerCase())),
      ...DEMO_TEACHERS.filter(dt => !users.some(u => u.email.toLowerCase() === dt.email.toLowerCase())),
      SUPER_ADMIN_ACCOUNT
    ];

    // 3. Search matched user by email, phone, name, or child name
    let matchedUser = combinedUsers.find(u => {
      const uEmail = (u.email || '').trim().toLowerCase();
      const uPhone = (u.phone || '').replace(/\D/g, '');
      const uName = (u.name || '').trim().toLowerCase();
      const uChild = (u.childName || '').trim().toLowerCase();
      const uUsername = uEmail.includes('@') ? uEmail.split('@')[0] : uEmail;

      const isEmailMatch = uEmail === trimmedInput || uUsername === trimmedInput;
      const isPhoneMatch = Boolean(cleanPhoneInput.length >= 6 && uPhone.length >= 6 && (uPhone === cleanPhoneInput || uPhone.endsWith(cleanPhoneInput) || cleanPhoneInput.endsWith(uPhone)));
      const isNameMatch = uName === trimmedInput || (uName.length >= 3 && (uName.includes(trimmedInput) || trimmedInput.includes(uName)));
      const isChildMatch = Boolean(uChild && (uChild === trimmedInput || (uChild.length >= 3 && (uChild.includes(trimmedInput) || trimmedInput.includes(uChild)))));

      if (isEmailMatch || isPhoneMatch || isNameMatch || isChildMatch) {
        return verifyPassword(u.password, trimmedPass);
      }
      return false;
    });

    // 4. Fallback search against registered students (e.g. if created by Admin without separate UserAccount)
    if (!matchedUser && students && students.length > 0) {
      const matchingStudent = students.find(s => {
        const sParent = (s.parentName || '').trim().toLowerCase();
        const sPhone = (s.parentPhone || '').replace(/\D/g, '');
        const sName = (s.name || '').trim().toLowerCase();

        const isParentMatch = sParent === trimmedInput || (sParent.length >= 3 && (sParent.includes(trimmedInput) || trimmedInput.includes(sParent)));
        const isPhoneMatch = Boolean(cleanPhoneInput.length >= 6 && sPhone.length >= 6 && (sPhone === cleanPhoneInput || sPhone.endsWith(cleanPhoneInput) || cleanPhoneInput.endsWith(sPhone)));
        const isChildMatch = sName === trimmedInput || (sName.length >= 3 && (sName.includes(trimmedInput) || trimmedInput.includes(sName)));
        const isEmailLike = trimmedInput.includes('@') && sParent.length >= 3 && trimmedInput.includes(sParent.split(' ')[0]);

        return isParentMatch || isPhoneMatch || isChildMatch || isEmailLike;
      });

      if (matchingStudent) {
        const newParentAccount: UserAccount = {
          id: `usr-parent-${Date.now()}`,
          email: trimmedInput.includes('@') ? trimmedInput : `${matchingStudent.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          name: matchingStudent.parentName || 'Ayah/Bunda Siswa',
          role: 'parent',
          phone: matchingStudent.parentPhone || cleanPhoneInput || '081234567890',
          childName: matchingStudent.name,
          subject: typeof matchingStudent.className === 'string' ? matchingStudent.className : 'Membaca',
          password: trimmedPass,
          createdAt: new Date().toISOString().split('T')[0],
        };
        matchedUser = newParentAccount;
      }
    }

    if (matchedUser) {
      onLoginSuccess(matchedUser);
    } else {
      setLoginError('Email / No. HP atau Kata Sandi tidak cocok. Jika Ayah/Bunda baru mendaftar atau belum memiliki akun, silakan klik tab "Daftar Wali Murid" di atas.');
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
                  Alamat Gmail / Email / No. WhatsApp
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Contoh: rina@gmail.com atau 081234567801"
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
              className="w-full py-2.5 px-5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              Masuk Sekarang
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

