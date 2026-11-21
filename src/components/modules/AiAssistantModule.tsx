import React, { useState } from 'react';
import {
  Bot,
  Send,
  Lightbulb,
  FileSpreadsheet,
  BarChart2,
  Copy,
  Check,
  Info,
  Trash2,
} from 'lucide-react';
import { EduSchoolState } from '../../types/eduschool';
import { calculateGPMP, calculateGPS } from '../../utils/academicCalcHelper';
import { formatCurrencyRM } from '../../utils/formatters';
import { ModuleHeader } from '../common/ModuleHeader';

interface AiAssistantModuleProps {
  state: EduSchoolState;
  onBackToDashboard: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'demo-assistant';
  text: string;
  category?: string;
}

const PROMPT_SUGGESTIONS = [
  {
    title: 'Penjanaan Idea Program',
    description: 'Cadangan program peningkatan prestasi Matematik & Sains Tingkatan 5',
    icon: Lightbulb,
    prompt:
      'Cadangkan 3 idea program intervensi berimpak tinggi untuk meningkatkan pencapaian Matematik dan Sains Tingkatan 5 di SMK Salaping.',
  },
  {
    title: 'Bantuan Menyediakan Laporan',
    description: 'Draf laporan ringkas program kecemerlangan sekolah',
    icon: FileSpreadsheet,
    prompt:
      'Sediakan draf laporan ringkas pelaksanaan Hari Anugerah Kecemerlangan Akademik SMK Salaping 2026.',
  },
  {
    title: 'Bantuan Analisis Data',
    description: 'Rumusan GPS semasa, tugasan tertunggak & baki PCG panitia',
    icon: BarChart2,
    prompt:
      'Analisiskan data semasa SMK Salaping termasuk GPS peperiksaan, status tugasan aktif dan kerosakan aset yang perlu diberi keutamaan.',
  },
];

export const AiAssistantModule: React.FC<AiAssistantModuleProps> = ({
  state,
  onBackToDashboard,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'demo-assistant',
      category: 'Mod Simulasi Prototaip',
      text: `Selamat datang ke Pembantu AI Pintar EDUSCHOOL 360 (Mod Simulasi).

Nota Penting: Antaramuka ini berjalan menggunakan simulasi tempatan berpandukan data simulasi SMK Salaping dan belum disambungkan ke mana-mana API model AI luaran pada Fasa 1.

Pilih salah satu kad cadangan di sebelah kiri atau taip arahan anda di bawah untuk melihat contoh penjanaan idea program, draf laporan dan ringkasan analisis data.`,
    },
  ]);

  const generateDemoResponse = (query: string): { text: string; category: string } => {
    const q = query.toLowerCase();
    const gps = calculateGPS(state.examRecords);
    const activeTasks = state.tasks.filter((t) => t.status !== 'Selesai');
    const urgentTasks = activeTasks.filter(
      (t) => t.keutamaan === 'Segera' || t.keutamaan === 'Tinggi'
    );
    const openDamages = state.damageReports.filter((d) => d.statusTindakan !== 'Selesai');

    const sortedByGpmp = [...state.examRecords].sort(
      (a, b) => calculateGPMP(b.gred) - calculateGPMP(a.gred)
    );
    const focusSubject = sortedByGpmp[0];

    const totalPcgRemaining = state.panitiaList.reduce((acc, p) => {
      const alloc = p.rekodKewangan
        .filter((k) => k.jenis === 'Peruntukan')
        .reduce((s, k) => s + k.jumlah, 0);
      const spent = p.rekodKewangan
        .filter((k) => k.jenis === 'Perbelanjaan')
        .reduce((s, k) => s + k.jumlah, 0);
      return acc + (alloc - spent);
    }, 0);

    if (q.includes('idea') || q.includes('program') || q.includes('cadang')) {
      return {
        category: 'Simulasi Penjanaan Idea Program',
        text: `[DRAF SIMULASI — SIMULASI TEMPATAN]

Cadangan Program Peningkatan Akademik SMK Salaping:

1. Klinik Pecutan Berfokus "Sifar Gagal" (${focusSubject ? focusSubject.mataPelajaran : 'Matematik'})
   - Sasaran: Murid kumpulan galus Tingkatan 5 (${state.students.filter((s) => s.statusSusulan !== 'Memuaskan').length} murid dalam senarai pemantauan semasa).
   - Pelaksanaan: Sesi 45 minit dua kali seminggu menggunakan modul soalan berstruktur kertas 1 & 2.
   - Anggaran Sumber: Boleh memanfaatkan baki PCG panitia semasa berjumlah ${formatCurrencyRM(totalPcgRemaining)}.

2. Kem Mentor-Mentee Rakan Sebaya ("Salaping Study Circle")
   - Menggandingkan murid cemerlang TP5/TP6 bersama murid TP2/TP3 untuk latihan latih tubi terpandu.

3. Bengkel Teknik Menjawab Berasaskan Item KBAT
   - Dijadualkan dalam Takwim Sekolah dengan melibatkan Ketua Panitia dan guru berpengalaman daerah.`,
      };
    }

    if (q.includes('laporan') || q.includes('minit') || q.includes('draf') || q.includes('surat')) {
      return {
        category: 'Simulasi Penyediaan Draf Laporan',
        text: `[DRAF SIMULASI — TEMPLAT LAPORAN]

LAPORAN RINGKAS PELAKSANAAN PROGRAM
Sekolah: SMK Salaping, Sabah
Tarikh Draf: 19 November 2026

1. TAJUK PROGRAM
Program Kecemerlangan & Pengiktirafan Akademik SMK Salaping 2026

2. OBJEKTIF
- Mengiktiraf pencapaian murid dalam peperiksaan pertengahan tahun dan percubaan SPM (GPS semasa: ${gps.toFixed(2)}).
- Meningkatkan motivasi warga sekolah dan penglibatan komuniti PIBG.

3. STATUS PELAKSANAAN SEMASA
- Sebanyak ${state.programs.length} program utama direkodkan dalam sistem, dengan ${state.programs.filter((p) => p.status === 'Selesai').length} program telah selesai dilaksanakan.
- Jawatankuasa pelaksana sedang memuktamadkan senarai penerima anugerah serta logistik di Dewan Salaping.

4. CADANGAN PENAMBAHBAIKAN
Memastikan penyelarasan tugasan akhir disempurnakan sebelum tarikh akhir yang ditetapkan dalam Takwim Sekolah.`,
      };
    }

    return {
      category: 'Simulasi Analisis Data Tempatan',
      text: `[DRAF SIMULASI — RUMUSAN DATA SEMASA SMK SALAPING]

Berikut ialah rumusan berdasarkan rekod simulasi semasa di dalam sistem:

1. Prestasi Akademik (Modul 4)
   - Gred Purata Sekolah (GPS) semasa: ${gps.toFixed(2)} (${state.examRecords.length} mata pelajaran direkodkan).
   - Mata pelajaran tumpuan utama: ${focusSubject ? `${focusSubject.mataPelajaran} (GPMP ${calculateGPMP(focusSubject.gred).toFixed(2)})` : 'Tiada data'}.

2. Pengurusan Tugasan & Operasi (Modul 2 & 8)
   - Tugasan aktif belum selesai: ${activeTasks.length} tugasan (${urgentTasks.length} berkeutamaan Tinggi/Segera).
   - Aduan kerosakan aset terbuka: ${openDamages.length} kes (${openDamages.map((d) => d.namaAset).join(', ') || 'Tiada'}).

3. Pemantauan Murid & Kewangan Panitia (Modul 3 & 5)
   - Murid dalam tindakan susulan / intervensi: ${state.students.filter((s) => s.statusSusulan !== 'Memuaskan').length} daripada ${state.students.length} rekod contoh.
   - Baki keseluruhan PCG merentasi ${state.panitiaList.length} panitia: ${formatCurrencyRM(totalPcgRemaining)}.`,
    };
  };

  const handleSendPrompt = (textToSend?: string) => {
    const clean = (textToSend ?? promptInput).trim();
    if (!clean) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: clean,
    };
    const reply = generateDemoResponse(clean);
    const botMsg: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      sender: 'demo-assistant',
      category: reply.category,
      text: reply.text,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    if (!textToSend) setPromptInput('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Pembantu AI Pintar"
        description="Ruang pembantu pintar prototaip untuk penjanaan idea program, draf laporan dan analisis data sekolah."
        onBackToDashboard={onBackToDashboard}
        actions={
          <button
            type="button"
            onClick={() => setMessages((prev) => prev.slice(0, 1))}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg hover:bg-[#2B3139] whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#F6465D]" />
            Kosongkan Perbualan
          </button>
        }
      />

      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#F0B90B]/10 border border-[#F0B90B]/30 text-xs text-[#EAECEF]">
        <Info className="w-4.5 h-4.5 text-[#F0B90B] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#F0B90B]">Status Prototaip (Mod Simulasi Tanpa Sambungan API):</strong> Modul ini memaparkan simulasi aliran kerja pembantu AI menggunakan templat tempatan dan bacaan data simulasi semasa sahaja. Integrasi model AI rasmi sekolah akan disambungkan pada Fasa 2.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-5 space-y-3">
            <h2 className="text-sm font-bold text-[#EAECEF]">Cadangan Arahan Pantas</h2>
            <p className="text-xs text-[#848E9C]">
              Klik mana-mana kad di bawah untuk menguji simulasi respons berdasarkan data SMK Salaping.
            </p>
            <div className="space-y-2.5 pt-1">
              {PROMPT_SUGGESTIONS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => handleSendPrompt(item.prompt)}
                    className="w-full text-left p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B3139] hover:border-[#F0B90B] hover:bg-[#1E2329] transition-colors space-y-1"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-[#F0B90B]">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.title}</span>
                    </div>
                    <p className="text-xs text-[#848E9C] leading-snug">{item.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-[#161A1E] rounded-xl border border-[#2B3139] flex flex-col h-[560px] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#2B3139] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F0B90B] text-[#0B0E11] flex items-center justify-center">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#EAECEF]">
                  Pembantu AI Pintar EDUSCHOOL 360
                </div>
                <div className="text-[11px] text-[#0ECB81]">
                  Mod Simulasi Tempatan · Data Simulasi SMK Salaping
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0B0E11]/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl p-4 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#F0B90B] text-[#0B0E11] font-medium'
                      : 'bg-[#161A1E] border border-[#2B3139] text-[#EAECEF]'
                  }`}
                >
                  {msg.sender === 'demo-assistant' && msg.category && (
                    <div className="flex items-center justify-between gap-4 pb-2 mb-2 border-b border-[#2B3139]">
                      <span className="text-[11px] font-bold text-[#F0B90B]">
                        {msg.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#848E9C] hover:text-[#EAECEF]"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-[#0ECB81]" />
                            Disalin
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Salin Teks
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  <div className="whitespace-pre-line text-xs sm:text-sm">{msg.text}</div>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="p-4 border-t border-[#2B3139] bg-[#161A1E] flex items-center gap-2.5"
          >
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Taip arahan anda (cth: Sediakan draf laporan atau cadangkan idea program)..."
              className="flex-1 px-4 py-2.5 text-sm bg-[#0B0E11] text-[#EAECEF] placeholder:text-[#707A8A] border border-[#2B3139] rounded-lg focus:outline-none focus:border-[#F0B90B]"
            />
            <button
              type="submit"
              disabled={!promptInput.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <Send className="w-4 h-4" />
              Hantar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
