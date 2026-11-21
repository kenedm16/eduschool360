import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Clock,
  Trash2,
  Edit3,
} from 'lucide-react';
import {
  CalendarEvent,
  CalendarEventCategory,
  TeacherItem,
  UserRole,
} from '../../types/eduschool';
import { getRoleCapabilities } from '../../utils/rolePermissions';
import { formatShortDate, getMonthNameMalay } from '../../utils/formatters';
import { ModuleHeader } from '../common/ModuleHeader';
import { ConfirmDeleteModal, Modal } from '../common/Modal';

interface CalendarModuleProps {
  events: CalendarEvent[];
  teachers: TeacherItem[];
  activeRole: UserRole;
  onBackToDashboard: () => void;
  onAddEvent: (evt: Omit<CalendarEvent, 'id'>) => void;
  onUpdateEvent: (evt: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
}

const EVENT_CATEGORIES: CalendarEventCategory[] = [
  'Aktiviti Sekolah',
  'Mesyuarat',
  'Peperiksaan',
  'Program & Bengkel',
];

const HARI_MINGGU = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];

export const CalendarModule: React.FC<CalendarModuleProps> = ({
  events,
  teachers,
  activeRole,
  onBackToDashboard,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}) => {
  const capabilities = getRoleCapabilities(activeRole);
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | CalendarEventCategory>('Semua');
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-20');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);

  const [tajuk, setTajuk] = useState('');
  const [tarikh, setTarikh] = useState('2026-11-20');
  const [masa, setMasa] = useState('08:30 Pagi');
  const [lokasi, setLokasi] = useState('Dewan Salaping');
  const [kategori, setKategori] = useState<CalendarEventCategory>('Aktiviti Sekolah');
  const [penyelaras, setPenyelaras] = useState(teachers[0]?.nama ?? '');
  const [catatan, setCatatan] = useState('');

  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => categoryFilter === 'Semua' || e.kategori === categoryFilter)
      .sort((a, b) => a.tarikh.localeCompare(b.tarikh));
  }, [events, categoryFilter]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; isoDate: string | null }> = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, isoDate: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(viewMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ day: d, isoDate: `${viewYear}-${mm}-${dd}` });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const openCreateModal = (presetDate?: string) => {
    setEditingEvent(null);
    setTajuk('');
    setTarikh(presetDate || selectedDate || '2026-11-20');
    setMasa('08:30 Pagi');
    setLokasi('Dewan Salaping');
    setKategori('Aktiviti Sekolah');
    setPenyelaras(teachers[0]?.nama ?? '');
    setCatatan('');
    setIsModalOpen(true);
  };

  const openEditModal = (evt: CalendarEvent) => {
    setEditingEvent(evt);
    setTajuk(evt.tajuk);
    setTarikh(evt.tarikh);
    setMasa(evt.masa);
    setLokasi(evt.lokasi);
    setKategori(evt.kategori);
    setPenyelaras(evt.penyelaras);
    setCatatan(evt.catatan);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tajuk.trim()) return;
    const payload = {
      tajuk: tajuk.trim(),
      tarikh,
      masa: masa.trim(),
      lokasi: lokasi.trim(),
      kategori,
      penyelaras,
      catatan: catatan.trim(),
    };
    if (editingEvent) {
      onUpdateEvent({ ...editingEvent, ...payload });
    } else {
      onAddEvent(payload);
    }
    setIsModalOpen(false);
  };

  const selectedDayEvents = filteredEvents.filter((e) => e.tarikh === selectedDate);

  const categoryColorClass = (cat: CalendarEventCategory) => {
    switch (cat) {
      case 'Mesyuarat':
        return 'bg-[#F0B90B] text-[#0B0E11]';
      case 'Peperiksaan':
        return 'bg-[#F6465D] text-white';
      case 'Program & Bengkel':
        return 'bg-[#0ECB81] text-[#0B0E11]';
      default:
        return 'bg-[#2B3139] text-[#EAECEF]';
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Takwim Sekolah"
        description="Kalendar bulanan rasmi SMK Salaping bagi aktiviti sekolah, mesyuarat, peperiksaan dan bengkel."
        onBackToDashboard={onBackToDashboard}
        actions={
          capabilities.canManageCalendar && (
            <button
              type="button"
              onClick={() => openCreateModal()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F] transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Tambah Acara Takwim
            </button>
          )
        }
      />

      <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0B0E11] border border-[#2B3139] rounded-lg">
          {(['Semua', ...EVENT_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-[#F0B90B] text-[#0B0E11] font-bold'
                  : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-lg bg-[#1E2329] border border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B]"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-[160px] text-center text-sm font-bold text-[#EAECEF]">
            {getMonthNameMalay(viewMonth)} {viewYear}
          </div>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-lg bg-[#1E2329] border border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B]"
            aria-label="Bulan seterusnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#2B3139] bg-[#1E2329] text-center">
            {HARI_MINGGU.map((h) => (
              <div key={h} className="py-2.5 text-xs font-bold text-[#848E9C]">
                {h}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-[#2B3139]">
            {calendarDays.map((cell, idx) => {
              if (!cell.day || !cell.isoDate) {
                return <div key={`empty-${idx}`} className="min-h-[88px] bg-[#0B0E11]/40" />;
              }
              const dayEvents = filteredEvents.filter((e) => e.tarikh === cell.isoDate);
              const isSelected = selectedDate === cell.isoDate;

              return (
                <button
                  key={cell.isoDate}
                  type="button"
                  onClick={() => setSelectedDate(cell.isoDate!)}
                  className={`min-h-[88px] p-2 text-left align-top flex flex-col justify-between transition-colors ${
                    isSelected ? 'bg-[#F0B90B]/10' : 'hover:bg-[#1E2329]/70'
                  }`}
                >
                  <span
                    className={`text-xs font-bold tabular-nums inline-flex w-6 h-6 items-center justify-center rounded-md ${
                      isSelected ? 'bg-[#F0B90B] text-[#0B0E11]' : 'text-[#EAECEF]'
                    }`}
                  >
                    {cell.day}
                  </span>
                  <div className="space-y-1 w-full mt-1">
                    {dayEvents.slice(0, 2).map((evt) => (
                      <div
                        key={evt.id}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate ${categoryColorClass(
                          evt.kategori
                        )}`}
                      >
                        {evt.tajuk}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] font-semibold text-[#F0B90B]">
                        +{dayEvents.length - 2} lagi
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="xl:col-span-4 space-y-5">
          <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2B3139] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#EAECEF]">
                  Acara pada {formatShortDate(selectedDate)}
                </h2>
                <p className="text-xs text-[#848E9C] tabular-nums">
                  {selectedDayEvents.length} acara dijadualkan
                </p>
              </div>
              {capabilities.canManageCalendar && (
                <button
                  type="button"
                  onClick={() => openCreateModal(selectedDate)}
                  className="p-2 rounded-lg bg-[#F0B90B] text-[#0B0E11] hover:bg-[#F8D12F]"
                  aria-label="Tambah acara pada tarikh ini"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="divide-y divide-[#2B3139]">
              {selectedDayEvents.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#848E9C]">
                  Tiada acara takwim pada tarikh yang dipilih.
                </div>
              ) : (
                selectedDayEvents.map((evt) => (
                  <div key={evt.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-[#F0B90B]">
                          {evt.kategori}
                        </span>
                        <h3 className="text-sm font-bold text-[#EAECEF] mt-0.5">{evt.tajuk}</h3>
                      </div>
                      {capabilities.canManageCalendar && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditModal(evt)}
                            className="p-1 text-[#848E9C] hover:text-[#F0B90B]"
                            aria-label={`Kemaskini ${evt.tajuk}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(evt)}
                            className="p-1 text-[#848E9C] hover:text-[#F6465D]"
                            aria-label={`Padam ${evt.tajuk}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-[#848E9C]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#0ECB81]" />
                        {evt.masa}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#F0B90B]" />
                        {evt.lokasi}
                      </span>
                    </div>
                    {evt.catatan && (
                      <p className="text-xs text-[#848E9C] leading-relaxed">{evt.catatan}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#161A1E] rounded-xl border border-[#2B3139] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2B3139] flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#F0B90B]" />
              <h2 className="text-sm font-bold text-[#EAECEF]">Semua Acara Terjadual</h2>
            </div>
            <div className="divide-y divide-[#2B3139] max-h-72 overflow-y-auto">
              {filteredEvents.map((evt) => (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => setSelectedDate(evt.tarikh)}
                  className="w-full text-left px-5 py-3 hover:bg-[#1E2329] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#EAECEF] truncate">{evt.tajuk}</div>
                    <div className="text-[11px] text-[#848E9C]">
                      {evt.kategori} · {evt.lokasi}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#0ECB81] tabular-nums shrink-0">
                    {formatShortDate(evt.tarikh)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? 'Kemaskini Acara Takwim' : 'Tambah Acara Takwim'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Nama Aktiviti / Acara
            </label>
            <input
              type="text"
              required
              value={tajuk}
              onChange={(e) => setTajuk(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Tarikh</label>
              <input
                type="date"
                required
                value={tarikh}
                onChange={(e) => setTarikh(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Masa</label>
              <input
                type="text"
                required
                value={masa}
                onChange={(e) => setMasa(e.target.value)}
                placeholder="Contoh: 08:00 Pagi"
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Kategori</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as CalendarEventCategory)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              >
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Lokasi</label>
              <input
                type="text"
                required
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Penyelaras
            </label>
            <select
              value={penyelaras}
              onChange={(e) => setPenyelaras(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.nama}>
                  {t.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">Catatan</label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E11] text-[#EAECEF] border border-[#2B3139] rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#EAECEF] bg-[#1E2329] border border-[#2B3139] rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-[#0B0E11] bg-[#F0B90B] rounded-lg hover:bg-[#F8D12F]"
            >
              {editingEvent ? 'Simpan Kemaskini' : 'Simpan Acara'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) onDeleteEvent(deleteTarget.id);
        }}
        itemName={deleteTarget?.tajuk ?? ''}
      />
    </div>
  );
};
