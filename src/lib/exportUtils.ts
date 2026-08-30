import { Student, Assessment, Attendance, Invoice, ScheduleItem, TeacherAttendance, BimbelState, BankAccountInfo } from '../types';
import { LOGO_BASE64 } from './logoBase64';

export interface SchoolInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  headmaster: string;
}

export const DEFAULT_SCHOOL_INFO: SchoolInfo = {
  name: 'Bimbel Rumah CahayaQu',
  tagline: 'Pusat Bimbingan Belajar Membaca, Berhitung, dan Mengaji Terpadu',
  address: 'RT 05 RW 02 Blok Ranca Gunda, Desa Jangga, Kec. Losarang, Kab. Indramayu, Jawa Barat 45253',
  phone: '+62 821-2345-6789',
  email: 'cahayaqu.bimbel@gmail.com',
  headmaster: 'Defika, S.Pd. (Kepala Bimbel)',
};

/**
 * Downloads data as a CSV file compatible with Microsoft Excel & Google Sheets.
 */
export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCsv = (str: string | number) => {
    const s = String(str ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csvContent = '\uFEFF' + [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads data as a JSON backup file.
 */
export function downloadJSON(filename: string, data: any) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.json') ? filename : `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Opens a dedicated print preview window styled for crisp A4 PDF output.
 */
export function printHtmlDocument(
  title: string, 
  htmlBody: string, 
  options?: {
    customLogoUrl?: string;
    schoolInfo?: Partial<SchoolInfo>;
  }
) {
  const printWindow = window.open('', '_blank', 'width=900,height=750');
  if (!printWindow) {
    alert('Jendela cetak terblokir oleh browser. Harap izinkan pop-up untuk mencetak atau menyimpan PDF.');
    return;
  }

  let storedSchoolInfo: Partial<SchoolInfo> = {};
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('bimbel_school_info');
      if (saved) storedSchoolInfo = JSON.parse(saved);
    } catch {
      // fallback
    }
  }

  const school = {
    ...DEFAULT_SCHOOL_INFO,
    ...storedSchoolInfo,
    ...(options?.schoolInfo || {})
  };

  const logoSrc = options?.customLogoUrl || (typeof window !== 'undefined' ? localStorage.getItem('bimbel_custom_logo') : null) || LOGO_BASE64;

  const printDocument = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1A1A1A;
          background: #FFF;
          padding: 24px;
          line-height: 1.5;
          font-size: 13px;
        }

        @page {
          size: A4;
          margin: 15mm 15mm 15mm 15mm;
        }

        @media print {
          body {
            padding: 0;
            background: #FFF;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }

        .action-bar {
          background: #F8F5F0;
          border: 1px solid #E0D8CC;
          border-radius: 12px;
          padding: 12px 18px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .btn-print {
          background: #8A4C93;
          color: white;
          border: none;
          padding: 8px 18px;
          font-weight: 700;
          font-size: 13px;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-print:hover {
          background: #733c7b;
        }

        .btn-close {
          background: #E5E7EB;
          color: #374151;
          border: none;
          padding: 8px 16px;
          font-weight: 600;
          font-size: 13px;
          border-radius: 8px;
          cursor: pointer;
        }

        /* Official Letterhead Header */
        .kop-header {
          border-bottom: 3px double #8A4C93;
          padding-bottom: 14px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .kop-logo-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .kop-logo-img {
          width: 58px;
          height: 58px;
          object-fit: contain;
          border-radius: 12px;
          background: #fff;
          display: block;
        }

        .kop-titles h1 {
          font-size: 20px;
          color: #8A4C93;
          font-weight: 800;
          font-family: 'Playfair Display', serif;
          letter-spacing: -0.5px;
        }

        .kop-titles p {
          font-size: 11px;
          color: #555;
          margin-top: 2px;
        }

        .kop-contact {
          text-align: right;
          font-size: 10.5px;
          color: #666;
          line-height: 1.4;
        }

        /* Document Details */
        .doc-title-block {
          text-align: center;
          margin-bottom: 18px;
        }

        .doc-title {
          font-size: 16px;
          font-weight: 800;
          color: #1A1A1A;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .doc-subtitle {
          font-size: 11.5px;
          color: #666;
          margin-top: 4px;
        }

        /* Info Grid */
        .info-card {
          background: #FAF8F5;
          border: 1px solid #E8E1D7;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 16px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px 16px;
          font-size: 12px;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
        }

        .info-label {
          width: 130px;
          color: #666;
          font-weight: 600;
        }

        .info-value {
          font-weight: 700;
          color: #1A1A1A;
          flex: 1;
        }

        /* Tables */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 18px;
          font-size: 12px;
        }

        th {
          background: #8A4C93;
          color: white;
          font-weight: 700;
          text-align: left;
          padding: 8px 10px;
          border: 1px solid #733c7b;
          font-size: 11.5px;
        }

        td {
          padding: 8px 10px;
          border: 1px solid #E0D8CC;
          color: #222;
        }

        tr:nth-child(even) td {
          background: #FAF8F5;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }

        /* Badges */
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 10.5px;
          font-weight: 700;
        }
        .badge-success { background: #D1FAE5; color: #065F46; }
        .badge-warning { background: #FEF3C7; color: #92400E; }
        .badge-danger { background: #FEE2E2; color: #991B1B; }
        .badge-primary { background: #EDE4F0; color: #8A4C93; }

        /* Notes Box */
        .notes-box {
          background: #FFFBEB;
          border: 1px dashed #F59E0B;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 20px;
          font-size: 11.5px;
          color: #78350F;
        }

        /* Signatures Area */
        .signatures {
          margin-top: 32px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }

        .sig-block {
          text-align: center;
          width: 200px;
          font-size: 11.5px;
        }

        .sig-space {
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 4px 0;
        }

        .sig-img {
          max-height: 55px;
          max-width: 140px;
          object-fit: contain;
        }

        .sig-name {
          font-weight: 700;
          text-decoration: underline;
          color: #111;
        }

        .sig-role {
          font-size: 10.5px;
          color: #666;
          margin-top: 2px;
        }
      </style>
    </head>
    <body>
      <div class="action-bar no-print">
        <div>
          <strong style="color: #8A4C93; font-size: 14px;">🖨️ Pratinjau Dokumen Siap Cetak / Simpan PDF</strong>
          <p style="font-size: 11px; color: #666; margin-top: 2px;">
            Gunakan opsi <em>"Save as PDF"</em> pada dialog cetak untuk menyimpan sebagai file PDF.
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-close" onclick="window.close()">Tutup</button>
          <button class="btn-print" onclick="window.print()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Cetak / Simpan PDF
          </button>
        </div>
      </div>

      <!-- Letterhead -->
      <div class="kop-header">
        <div class="kop-logo-area">
          <img src="${logoSrc}" alt="Logo Bimbel" class="kop-logo-img" />
          <div class="kop-titles">
            <h1>${school.name}</h1>
            <p>${school.tagline}</p>
          </div>
        </div>
        <div class="kop-contact">
          <div>${school.address}</div>
          <div>Telp/WA: ${school.phone} | Email: ${school.email}</div>
        </div>
      </div>

      <!-- Content -->
      ${htmlBody}

      <script>
        // Auto trigger print dialog on load
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 400);
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printDocument);
  printWindow.document.close();
}

/**
 * Generates an official Student Progress Report (Rapor Perkembangan Belajar Murid).
 */
export function printStudentReport(
  student: Student,
  assessments: Assessment[],
  attendance: Attendance[],
  schedules: ScheduleItem[] = [],
  options?: {
    customRecommendation?: string;
    headmasterName?: string;
    teacherName?: string;
    reportPeriod?: string;
    customLogoUrl?: string;
    headmasterSignatureUrl?: string;
    teacherSignatureUrl?: string;
    parentSignatureUrl?: string;
    schoolInfo?: Partial<SchoolInfo>;
  }
) {
  const studentAssessments = assessments.filter(a => a.studentId === student.id || a.studentName.toLowerCase() === student.name.toLowerCase());
  const studentAttendance = attendance.filter(a => a.studentId === student.id || a.studentName.toLowerCase() === student.name.toLowerCase());

  const totalHadir = studentAttendance.filter(a => a.status === 'Hadir').length;
  const totalSakit = studentAttendance.filter(a => a.status === 'Sakit').length;
  const totalIzin = studentAttendance.filter(a => a.status === 'Izin').length;
  const totalAlpa = studentAttendance.filter(a => a.status === 'Alpa').length;
  const totalPertemuan = studentAttendance.length;

  const attendanceRate = totalPertemuan > 0 ? Math.round((totalHadir / totalPertemuan) * 100) : 100;

  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const savedHeadmasterSig = options?.headmasterSignatureUrl || (typeof window !== 'undefined' ? localStorage.getItem('bimbel_headmaster_signature') : null);
  const savedTeacherSig = options?.teacherSignatureUrl || (typeof window !== 'undefined' ? localStorage.getItem('bimbel_teacher_signature') : null);
  const savedLogoUrl = options?.customLogoUrl || (typeof window !== 'undefined' ? localStorage.getItem('bimbel_custom_logo') : null);
  const savedHeadmasterName = options?.headmasterName || (typeof window !== 'undefined' ? localStorage.getItem('bimbel_headmaster_name') : null);

  const periodText = options?.reportPeriod || 'Tahun Ajaran 2026/2027 • Periode Evaluasi Terpadu';
  const recommendationText = options?.customRecommendation || 
    'Ananda menunjukkan semangat belajar dan adaptasi yang sangat positif di Bimbel Rumah CahayaQu. Diharapkan pendampingan membaca dan muroja\'ah di rumah terus dijaga secara konsisten bersama Ayah/Bunda.';
  const headmasterText = savedHeadmasterName || 'Defika, S.Pd.';
  const teacherText = options?.teacherName || student.teacherName || 'Guru Pembimbing';

  const bodyHtml = `
    <div class="doc-title-block">
      <div class="doc-title">Laporan Hasil Perkembangan Belajar Murid (Rapor Siswa)</div>
      <div class="doc-subtitle">${periodText}</div>
    </div>

    <!-- Student Bio Card -->
    <div class="info-card">
      <div class="info-item">
        <span class="info-label">Nama Murid</span>
        <span class="info-value">: ${student.name}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Program Belajar</span>
        <span class="info-value">: ${student.className || student.subject || 'Membaca, Berhitung & Mengaji'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Nama Orang Tua/Wali</span>
        <span class="info-value">: ${student.parentName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">No. Telepon / WA</span>
        <span class="info-value">: ${student.parentPhone}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Guru Pembimbing</span>
        <span class="info-value">: ${teacherText}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Status Siswa</span>
        <span class="info-value">: <span class="badge badge-success">Aktif Belajar</span></span>
      </div>
    </div>

    <!-- 1. Attendance Summary -->
    <div style="margin-bottom: 16px;">
      <h3 style="font-size: 13px; font-weight: 800; color: #8A4C93; margin-bottom: 8px; text-transform: uppercase;">
        I. Rekap Kehadiran & Kedisiplinan Siswa
      </h3>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 20%;">Total Sesi</th>
            <th class="text-center" style="width: 20%;">Hadir</th>
            <th class="text-center" style="width: 20%;">Izin</th>
            <th class="text-center" style="width: 20%;">Sakit</th>
            <th class="text-center" style="width: 20%;">Persentase Kehadiran</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="text-center font-bold">${totalPertemuan} Sesi</td>
            <td class="text-center font-bold" style="color: #065F46;">${totalHadir} Sesi</td>
            <td class="text-center">${totalIzin} Sesi</td>
            <td class="text-center">${totalSakit} Sesi</td>
            <td class="text-center font-bold" style="color: #8A4C93; font-size: 14px;">${attendanceRate}%</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 2. Academic & Character Assessment -->
    <div style="margin-bottom: 16px;">
      <h3 style="font-size: 13px; font-weight: 800; color: #8A4C93; margin-bottom: 8px; text-transform: uppercase;">
        II. Capaian Aspek Perkembangan & Pembelajaran
      </h3>
      ${studentAssessments.length === 0 ? `
        <div style="padding: 16px; background: #FAF8F5; border: 1px solid #E8E1D7; border-radius: 8px; text-align: center; color: #666;">
          Belum ada catatan penilaian resmi yang dimasukkan untuk ananda ${student.name}.
        </div>
      ` : `
        <table>
          <thead>
            <tr>
              <th style="width: 5%;" class="text-center">No</th>
              <th style="width: 20%;">Tanggal & Mapel</th>
              <th style="width: 35%;">Aspek Perkembangan Dinilai</th>
              <th style="width: 40%;">Catatan & Evaluasi Guru</th>
            </tr>
          </thead>
          <tbody>
            ${studentAssessments.map((evalItem, idx) => {
              const aspectList = evalItem.aspects && evalItem.aspects.length > 0
                ? evalItem.aspects.map(a => `<div>• <strong>${a.name}</strong>: ${'★'.repeat(a.score)}${'☆'.repeat(5 - a.score)} (${a.score}/5)</div>`).join('')
                : 'Capaian materi umum';

              return `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td>
                    <strong>${evalItem.subject}</strong><br>
                    <span style="font-size: 10.5px; color: #666;">${evalItem.date}</span><br>
                    <span style="font-size: 10px; color: #8A4C93;">Guru: ${evalItem.teacherName}</span>
                  </td>
                  <td>${aspectList}</td>
                  <td><em>"${evalItem.notes || 'Ananda mengikuti pembelajaran dengan sangat baik dan fokus.'}"</em></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `}
    </div>

    <!-- 3. Teacher General Recommendation -->
    <div class="notes-box">
      <strong>Catatan & Rekomendasi Kepala Bimbel:</strong><br>
      ${recommendationText}
    </div>

    <!-- Signatures -->
    <div class="signatures">
      <div class="sig-block">
        <div>Mengetahui,</div>
        <div class="sig-role">Orang Tua / Wali Murid</div>
        <div class="sig-space">
          ${options?.parentSignatureUrl ? `<img src="${options.parentSignatureUrl}" alt="Tanda Tangan Ortu" class="sig-img" />` : ''}
        </div>
        <div class="sig-name">( ${student.parentName} )</div>
      </div>
      <div class="sig-block">
        <div>Indramayu, ${today}</div>
        <div class="sig-role">Guru Pembimbing</div>
        <div class="sig-space">
          ${savedTeacherSig ? `<img src="${savedTeacherSig}" alt="Tanda Tangan Guru" class="sig-img" />` : ''}
        </div>
        <div class="sig-name">( ${teacherText} )</div>
      </div>
      <div class="sig-block">
        <div>Menyetujui,</div>
        <div class="sig-role">Kepala Bimbel Rumah CahayaQu</div>
        <div class="sig-space">
          ${savedHeadmasterSig ? `<img src="${savedHeadmasterSig}" alt="Tanda Tangan Kepala Bimbel" class="sig-img" />` : ''}
        </div>
        <div class="sig-name">( ${headmasterText} )</div>
      </div>
    </div>
  `;

  printHtmlDocument(`Rapor_Siswa_${student.name.replace(/\s+/g, '_')}`, bodyHtml, {
    customLogoUrl: savedLogoUrl || undefined,
    schoolInfo: options?.schoolInfo
  });
}

/**
 * Prints an official invoice receipt (Kwitansi Pembayaran SPP Resmi).
 */
export function printInvoiceReceipt(invoice: Invoice, bankAccount?: BankAccountInfo) {
  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formatCurrency = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  const bodyHtml = `
    <div class="doc-title-block">
      <div class="doc-title">Kwitansi & Bukti Pembayaran SPP Bimbel</div>
      <div class="doc-subtitle">No. Kwitansi: <strong>${invoice.invoiceNo}</strong> • Status: <strong>${invoice.status.toUpperCase()}</strong></div>
    </div>

    <div class="info-card">
      <div class="info-item">
        <span class="info-label">No. Invoice</span>
        <span class="info-value">: ${invoice.invoiceNo}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Bulan Tagihan</span>
        <span class="info-value">: ${invoice.billingMonth}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Nama Siswa</span>
        <span class="info-value">: ${invoice.studentName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Nama Wali/Ortu</span>
        <span class="info-value">: ${invoice.parentName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Batas Waktu Bayar</span>
        <span class="info-value">: ${invoice.dueDate}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Status Pembayaran</span>
        <span class="info-value">: 
          <span class="badge ${invoice.status === 'Lunas' ? 'badge-success' : invoice.status === 'Terlambat' ? 'badge-danger' : 'badge-warning'}">
            ${invoice.status}
          </span>
        </span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 10%;" class="text-center">No</th>
          <th style="width: 50%;">Deskripsi Pembayaran</th>
          <th style="width: 20%;" class="text-center">Periode</th>
          <th style="width: 20%;" class="text-right">Jumlah (Rp)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center">1</td>
          <td>
            <strong>Biaya Bimbingan Belajar (SPP)</strong><br>
            <span style="font-size: 11px; color: #666;">Program Bimbingan Belajar Membaca, Berhitung, dan Mengaji Terpadu</span>
          </td>
          <td class="text-center">${invoice.billingMonth}</td>
          <td class="text-right font-bold">${formatCurrency(invoice.amount)}</td>
        </tr>
        <tr>
          <td colspan="3" class="text-right font-bold" style="background: #FAF8F5;">TOTAL PEMBAYARAN</td>
          <td class="text-right font-bold" style="background: #FAF8F5; color: #8A4C93; font-size: 14px;">${formatCurrency(invoice.amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="notes-box">
      <strong>Catatan Pembayaran & Rekening Resmi:</strong><br>
      Transfer ditujukan ke <strong>${bankAccount?.bankName || 'Bank Syariah Indonesia (BSI)'}</strong> No. Rekening: <strong>${bankAccount?.accountNumber || '7182938491'}</strong> a.n. <strong>${bankAccount?.accountHolder || 'Rumah CahayaQu (Defika)'}</strong>.<br>
      <em>Kwitansi ini adalah bukti sah administrasi Bimbel Rumah CahayaQu. Terima kasih atas kepercayaan Ayah/Bunda.</em>
    </div>

    <div class="signatures">
      <div class="sig-block">
        <div>Pembayar,</div>
        <div class="sig-role">Orang Tua / Wali</div>
        <div class="sig-space"></div>
        <div class="sig-name">( ${invoice.parentName} )</div>
      </div>
      <div class="sig-block"></div>
      <div class="sig-block">
        <div>Indramayu, ${today}</div>
        <div class="sig-role">Bendahara / Admin Bimbel</div>
        <div class="sig-space">
          ${(typeof window !== 'undefined' && localStorage.getItem('bimbel_headmaster_signature')) 
            ? `<img src="${localStorage.getItem('bimbel_headmaster_signature')}" alt="Tanda Tangan Admin" class="sig-img" />` 
            : ''}
        </div>
        <div class="sig-name">( ${(typeof window !== 'undefined' && localStorage.getItem('bimbel_headmaster_name')) || 'Defika, S.Pd.'} )</div>
      </div>
    </div>
  `;

  printHtmlDocument(`Kwitansi_${invoice.invoiceNo}_${invoice.studentName.replace(/\s+/g, '_')}`, bodyHtml);
}

/**
 * Prints attendance summary report for students or teachers.
 */
export function printAttendanceReport(
  type: 'student' | 'teacher',
  records: any[],
  dateFilter: string = 'Semua Periode'
) {
  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const isStudent = type === 'student';
  const docTitle = isStudent 
    ? 'Rekap Laporan Presensi Murid'
    : 'Rekap Laporan Kehadiran & Geofencing Presensi Guru';

  const bodyHtml = `
    <div class="doc-title-block">
      <div class="doc-title">${docTitle}</div>
      <div class="doc-subtitle">Periode: ${dateFilter} • Dicetak pada: ${today}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 5%;" class="text-center">No</th>
          <th style="width: ${isStudent ? '25%' : '20%'};">Nama</th>
          <th style="width: 15%;" class="text-center">Tanggal</th>
          <th style="width: 15%;" class="text-center">Jam Masuk / Pulang</th>
          <th style="width: 15%;" class="text-center">Status</th>
          ${!isStudent ? '<th style="width: 15%;" class="text-center">Lokasi & Radius</th>' : ''}
          <th style="width: ${isStudent ? '25%' : '15%'};">Keterangan</th>
        </tr>
      </thead>
      <tbody>
        ${records.length === 0 ? `
          <tr>
            <td colspan="${isStudent ? 6 : 7}" class="text-center" style="padding: 20px; color: #888;">
              Tidak ada data presensi pada periode yang dipilih.
            </td>
          </tr>
        ` : records.map((rec, idx) => `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td><strong>${isStudent ? rec.studentName : rec.teacherName}</strong></td>
            <td class="text-center">${rec.date}</td>
            <td class="text-center">${rec.timeIn || '-'}${rec.timeOut ? ` - ${rec.timeOut}` : ''}</td>
            <td class="text-center">
              <span class="badge ${rec.status === 'Hadir' ? 'badge-success' : rec.status === 'Terlambat' ? 'badge-warning' : 'badge-danger'}">
                ${rec.status}
              </span>
            </td>
            ${!isStudent ? `
              <td class="text-center" style="font-size: 10.5px;">
                ${rec.locationName || 'Pusat'}<br>
                <span style="color: ${rec.isWithinRadius ? '#065F46' : '#991B1B'}; font-weight: bold;">
                  ${rec.isWithinRadius ? '✓ Sesuai Radius' : '✗ Luar Radius'} (${rec.distanceMeters || 0}m)
                </span>
              </td>
            ` : ''}
            <td style="font-size: 11px; color: #555;">${rec.notes || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="signatures">
      <div class="sig-block"></div>
      <div class="sig-block"></div>
      <div class="sig-block">
        <div>Indramayu, ${today}</div>
        <div class="sig-role">Kepala Bimbel Rumah CahayaQu</div>
        <div class="sig-space"></div>
        <div class="sig-name">( Defika, S.Pd. )</div>
      </div>
    </div>
  `;

  printHtmlDocument(`Laporan_Presensi_${type}_${dateFilter.replace(/\s+/g, '_')}`, bodyHtml);
}

/**
 * Prints financial summary report (Laporan Rekapitulasi Keuangan & SPP).
 */
export function printFinancialReport(invoices: Invoice[], period: string = 'Agustus 2026') {
  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices.filter(inv => inv.status === 'Lunas').reduce((sum, inv) => sum + inv.amount, 0);
  const unpaidAmount = invoices.filter(inv => inv.status === 'Belum Bayar').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = invoices.filter(inv => inv.status === 'Terlambat').reduce((sum, inv) => sum + inv.amount, 0);

  const formatCurrency = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  const bodyHtml = `
    <div class="doc-title-block">
      <div class="doc-title">Laporan Rekapitulasi Pembayaran SPP Murid</div>
      <div class="doc-subtitle">Periode: ${period} • Dicetak pada: ${today}</div>
    </div>

    <!-- Summary metrics -->
    <div class="info-card" style="grid-template-columns: repeat(4, 1fr);">
      <div>
        <div class="info-label">Total Tagihan</div>
        <div class="info-value" style="font-size: 14px; color: #8A4C93;">${formatCurrency(totalAmount)}</div>
      </div>
      <div>
        <div class="info-label">Total Terbayar (Lunas)</div>
        <div class="info-value" style="font-size: 14px; color: #065F46;">${formatCurrency(paidAmount)}</div>
      </div>
      <div>
        <div class="info-label">Belum Terbayar</div>
        <div class="info-value" style="font-size: 14px; color: #D97706;">${formatCurrency(unpaidAmount)}</div>
      </div>
      <div>
        <div class="info-label">Terlambat</div>
        <div class="info-value" style="font-size: 14px; color: #DC2626;">${formatCurrency(overdueAmount)}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 5%;" class="text-center">No</th>
          <th style="width: 15%;">No. Invoice</th>
          <th style="width: 25%;">Nama Siswa</th>
          <th style="width: 20%;">Nama Orang Tua</th>
          <th style="width: 15%;" class="text-right">Nominal</th>
          <th style="width: 10%;" class="text-center">Jatuh Tempo</th>
          <th style="width: 10%;" class="text-center">Status</th>
        </tr>
      </thead>
      <tbody>
        ${invoices.length === 0 ? `
          <tr>
            <td colspan="7" class="text-center" style="padding: 20px; color: #888;">
              Tidak ada data invoice tagihan untuk periode ini.
            </td>
          </tr>
        ` : invoices.map((inv, idx) => `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td><strong>${inv.invoiceNo}</strong></td>
            <td>${inv.studentName}</td>
            <td>${inv.parentName}</td>
            <td class="text-right font-bold">${formatCurrency(inv.amount)}</td>
            <td class="text-center">${inv.dueDate}</td>
            <td class="text-center">
              <span class="badge ${inv.status === 'Lunas' ? 'badge-success' : inv.status === 'Terlambat' ? 'badge-danger' : 'badge-warning'}">
                ${inv.status}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="signatures">
      <div class="sig-block"></div>
      <div class="sig-block"></div>
      <div class="sig-block">
        <div>Indramayu, ${today}</div>
        <div class="sig-role">Kepala Bimbel Rumah CahayaQu</div>
        <div class="sig-space"></div>
        <div class="sig-name">( Defika, S.Pd. )</div>
      </div>
    </div>
  `;

  printHtmlDocument(`Laporan_Keuangan_SPP_${period.replace(/\s+/g, '_')}`, bodyHtml);
}
