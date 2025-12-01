import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Calendar, Wallet, FileText, LogIn, LogOut, 
  Menu, X, Plus, MapPin, Clock, AlertCircle, 
  Printer, Download, MessageCircle, Trash2, Save, 
  ArrowUpCircle, ArrowDownCircle, ChevronRight, Search,
  Sparkles, Copy, XCircle, Loader2, BarChart3, TrendingUp, Trophy, Share2
} from 'lucide-react';

// --- KONFIGURASI API GEMINI (AI) ---
// Biarkan string ini kosong, environment akan mengisinya otomatis saat runtime jika tersedia
const apiKey = ""; 

const callGeminiAI = async (prompt) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI sedang sibuk.";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "Gagal terhubung ke AI.";
  }
};

// --- DATA REAL PEMILU 2024 (Sesuai File CSV Anda) ---
const VOTE_DATA = {
  // Sumber: REKAP DA KABUPATEN.csv (Total 136.673 Suara)
  dprd_kab: [
    { dapil: 'Dapil 1', wilayah: 'Kendal, Patebon, Pegandon, Ngampel', suara_pkb: 30996, kursi: 3, status: 'Juara 1' },
    { dapil: 'Dapil 2', wilayah: 'Brangsong, Kaliwungu, Kalsel', suara_pkb: 16597, kursi: 1, status: 'Aman' },
    { dapil: 'Dapil 3', wilayah: 'Boja, Limbangan, Singorojo', suara_pkb: 12636, kursi: 1, status: 'Aman' },
    { dapil: 'Dapil 4', wilayah: 'Sukorejo, Patean, Pageruyung', suara_pkb: 19988, kursi: 2, status: 'Kursi Ganda' },
    { dapil: 'Dapil 5', wilayah: 'Weleri, Ringinarum, Gemuh', suara_pkb: 26880, kursi: 2, status: 'Juara 1' },
    { dapil: 'Dapil 6', wilayah: 'Cepiring, Kangkung, Rowosari', suara_pkb: 29576, kursi: 2, status: 'Juara 1' }
  ],
  // Sumber: REKAP PROP (Data H. Kholid Abdillah)
  dprd_prop: [ 
    { dapil_kab: 'Dapil 1', wilayah: 'Kendal Kota cs', suara_partai: 4625, suara_kholid: 12226 },
    { dapil_kab: 'Dapil 2', wilayah: 'Kaliwungu cs', suara_partai: 2972, suara_kholid: 6159 },
    { dapil_kab: 'Dapil 3', wilayah: 'Boja cs', suara_partai: 3066, suara_kholid: 3548 },
    { dapil_kab: 'Dapil 4', wilayah: 'Sukorejo cs', suara_partai: 3713, suara_kholid: 5698 },
    { dapil_kab: 'Dapil 5', wilayah: 'Weleri cs', suara_partai: 3051, suara_kholid: 7850 },
    { dapil_kab: 'Dapil 6', wilayah: 'Cepiring cs', suara_partai: 4171, suara_kholid: 9076 }
  ],
  // Sumber: REKAP DPR RI (Alamudin Dimyati Rois)
  dpr_ri: [ 
    { dapil_kab: 'Dapil 1', suara_partai: 4063, suara_caleg: 11446 },
    { dapil_kab: 'Dapil 2', suara_partai: 2614, suara_caleg: 15666 },
    { dapil_kab: 'Dapil 3', suara_partai: 2714, suara_caleg: 4005 },
    { dapil_kab: 'Dapil 4', suara_partai: 3577, suara_caleg: 5422 }, 
    { dapil_kab: 'Dapil 5', suara_partai: 2592, suara_caleg: 6780 }, 
    { dapil_kab: 'Dapil 6', suara_partai: 3632, suara_caleg: 7100 }  
  ]
};

const LIST_OPD = [
  { id: 'biro_kesra', name: 'Biro Kesra' },
  { id: 'disdikbud', name: 'Dinas Pendidikan' },
  { id: 'dinpermades', name: 'Dinpermades' },
  { id: 'binamarga', name: 'PU Bina Marga' },
  { id: 'pertanian', name: 'Dinas Pertanian' },
  { id: 'dinsos', name: 'Dinas Sosial' },
  { id: 'perkim', name: 'Disperakim' },
  { id: 'dinkes', name: 'Dinas Kesehatan' }
];

// --- HOOKS: AUTO-SAVE KE LOCAL STORAGE ---
// Ini rahasia agar data tidak hilang saat refresh
const useStickyState = (defaultValue, key) => {
  const [value, setValue] = useState(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
};

// --- HELPER FORMAT ---
const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
const formatAngka = (num) => new Intl.NumberFormat('id-ID').format(num);

// --- KOMPONEN UI ---
const PrintButton = () => (
  <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-100 text-slate-800 px-3 py-2 rounded-lg text-sm hover:bg-slate-200 transition font-medium">
    <Printer size={16} /> Print
  </button>
);

const ExportButton = ({ data, filename }) => {
  const handleExport = () => {
    if (!data || !data.length) return alert("Data kosong");
    const cleanData = data.map(({ internal_id, ...rest }) => rest);
    const headers = Object.keys(cleanData[0]).join(",");
    const rows = cleanData.map(obj => Object.values(obj).map(val => `"${val}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI("data:text/csv;charset=utf-8," + headers + "\n" + rows);
    link.download = `${filename}.csv`;
    link.click();
  };
  return (
    <button onClick={handleExport} className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm hover:bg-green-200 transition font-medium">
      <Download size={16} /> Export
    </button>
  );
};

const AIResultModal = ({ isOpen, onClose, title, content, isLoading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white rounded-t-2xl">
          <h3 className="font-bold text-purple-900 flex items-center gap-2"><Sparkles size={18}/> {title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle size={24}/></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
               <Loader2 size={48} className="animate-spin text-purple-500 mb-4"/><p>Sedang menganalisis...</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">{content}</div>
          )}
        </div>
        <div className="p-4 border-t bg-slate-50 rounded-b-2xl flex justify-end">
             <button onClick={() => {navigator.clipboard.writeText(content); alert('Teks tersalin!')}} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold flex gap-2 items-center"><Copy size={16}/> Salin</button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MODUL 1: DATA SUARA (VOTE REAL COUNT)
// ============================================
const VoteModule = () => {
  const [activeCategory, setActiveCategory] = useState('dprd_prop'); 
  const [aiModal, setAiModal] = useState({ isOpen: false, title: '', content: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  const dataToShow = VOTE_DATA[activeCategory];
  const totalSuara = dataToShow.reduce((a,b) => a + (b.suara_kholid || b.suara_pkb || b.suara_caleg || 0), 0);

  const handleAiAnalysis = async () => {
    setAiModal({ isOpen: true, title: 'Analisis Politik AI', content: '' });
    setIsGenerating(true);
    const contextMap = {
      'dprd_kab': 'DPRD Kabupaten Kendal (Partai PKB - Total 11 Kursi)',
      'dprd_prop': 'DPRD Provinsi Jawa Tengah (H. Kholid Abdillah)',
      'dpr_ri': 'DPR RI (Alamudin Dimyati Rois)'
    };
    const prompt = `Analisis data perolehan suara berikut untuk ${contextMap[activeCategory]}. Data: ${JSON.stringify(dataToShow)}. Identifikasi lumbung suara utama, daerah lemah, dan berikan strategi politis singkat.`;
    const result = await callGeminiAI(prompt);
    setAiModal(prev => ({ ...prev, content: result }));
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
         <div>
            <h2 className="text-2xl font-bold text-green-900">Real Count Suara 2024</h2>
            <p className="text-sm text-slate-500">Data Resmi Rekapitulasi</p>
         </div>
         <button onClick={handleAiAnalysis} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-200 transition">
            <Sparkles size={18}/> Analisis Tren AI
         </button>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-xl overflow-hidden print:hidden">
        {[ { id: 'dprd_kab', label: 'DPRD Kab (PKB)' }, { id: 'dprd_prop', label: 'DPRD Prov (Pak Kholid)' }, { id: 'dpr_ri', label: 'DPR RI (Alamudin)' } ].map(tab => (
          <button key={tab.id} onClick={() => setActiveCategory(tab.id)} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeCategory === tab.id ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{tab.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-600 text-white p-6 rounded-xl shadow-lg">
              <p className="text-green-100 text-sm font-medium mb-1">Total Perolehan Suara</p>
              <h3 className="text-3xl font-bold">{formatAngka(totalSuara)}</h3>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <p className="text-slate-500 text-sm font-medium mb-1">Dapil Tertinggi (Basis)</p>
             <h3 className="text-xl font-bold text-slate-800">
                {dataToShow.reduce((prev, current) => ((prev.suara_kholid || prev.suara_pkb || prev.suara_caleg) > (current.suara_kholid || current.suara_pkb || current.suara_caleg)) ? prev : current).dapil || 'Dapil 1'}
             </h3>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <p className="text-slate-500 text-sm font-medium mb-1">Dapil Terendah (Potensi)</p>
             <h3 className="text-xl font-bold text-slate-800">
                {dataToShow.reduce((prev, current) => ((prev.suara_kholid || prev.suara_pkb || prev.suara_caleg) < (current.suara_kholid || current.suara_pkb || current.suara_caleg)) ? prev : current).dapil || 'Dapil ?'}
             </h3>
          </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
         <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><BarChart3 size={20}/> Grafik Sebaran Suara</h3>
         <div className="flex items-end gap-2 h-48 border-b border-slate-200 pb-2 px-2">
            {dataToShow.map((item, idx) => {
               const val = item.suara_kholid || item.suara_pkb || item.suara_caleg;
               const maxVal = Math.max(...dataToShow.map(d => d.suara_kholid || d.suara_pkb || d.suara_caleg));
               return (
                  <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative">
                     <div className="mb-2 text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 absolute -top-8 bg-white shadow px-2 py-1 rounded transition-all">{formatAngka(val)}</div>
                     <div className={`w-full rounded-t-lg transition-all hover:opacity-80 relative ${activeCategory === 'dprd_prop' ? 'bg-green-700' : 'bg-green-500'}`} style={{ height: `${(val / maxVal) * 100}%` }}>
                        {val === maxVal && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500"><Trophy size={16} fill="currentColor"/></div>}
                     </div>
                     <span className="text-[10px] md:text-xs font-bold text-slate-600 mt-2 truncate w-full text-center">{item.dapil || item.dapil_kab}</span>
                  </div>
               )
            })}
         </div>
      </div>
      <AIResultModal isOpen={aiModal.isOpen} onClose={() => setAiModal({ ...aiModal, isOpen: false })} title={aiModal.title} content={aiModal.content} isLoading={isGenerating}/>
    </div>
  );
};

// ============================================
// MODUL 2: MANAJEMEN POKIR (PERSISTENT)
// ============================================
const PokirModule = () => {
  const [view, setView] = useState('data'); 
  // Gunakan useStickyState agar data tersimpan di browser
  const [pokirData, setPokirData] = useStickyState([
    { internal_id: 1, manual_id: 'PU-001', opd: 'binamarga', uraian: 'Peningkatan Jalan Ruas A Kec. Kaliwungu', apbd: 200000000, apbd_penetapan: 195000000, ket: 'Prioritas' }
  ], 'simas_pokir_data');

  const [formData, setFormData] = useState({ manual_id: '', opd: 'biro_kesra', uraian: '', apbd: '', apbd_penetapan: '', ket: '' });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [search, setSearch] = useState('');

  const handleAiRefine = async () => {
    if (!formData.uraian || formData.uraian.length < 5) return alert("Isi uraian dulu minimal 5 huruf.");
    setIsAiLoading(true);
    const result = await callGeminiAI(`Ubah kalimat ini jadi bahasa birokrasi formal proposal pemerintah (singkat): "${formData.uraian}"`);
    setFormData(prev => ({ ...prev, uraian: result.replace(/^"|"$/g, '') }));
    setIsAiLoading(false);
  };

  const handleSubmit = () => {
    if(!formData.manual_id) return alert("ID Wajib Diisi!");
    setPokirData([...pokirData, { internal_id: Date.now(), ...formData, apbd: parseInt(formData.apbd)||0, apbd_penetapan: parseInt(formData.apbd_penetapan)||0 }]);
    setView('data');
    setFormData({ manual_id: '', opd: 'biro_kesra', uraian: '', apbd: '', apbd_penetapan: '', ket: '' });
  };

  const handleDelete = (id) => {
      if(window.confirm('Hapus data ini?')) setPokirData(pokirData.filter(d => d.internal_id !== id));
  };

  const filteredData = pokirData.filter(d => d.manual_id.toLowerCase().includes(search.toLowerCase()) || d.uraian.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center print:hidden">
        <div><h2 className="text-2xl font-bold text-green-900">Manajemen Pokir</h2><p className="text-sm text-slate-500">Database Aspirasi (Tersimpan Otomatis)</p></div>
        <div className="flex gap-2">
           <button onClick={()=>setView('data')} className={`px-4 py-2 rounded-lg text-sm font-bold ${view==='data'?'bg-green-600 text-white':'bg-white border text-slate-600'}`}>Data</button>
           <button onClick={()=>setView('input')} className="px-4 py-2 rounded-lg text-sm bg-yellow-500 text-white flex gap-2 font-bold shadow hover:bg-yellow-600"><Plus size={16}/> Input</button>
        </div>
      </div>

      {view === 'input' && (
         <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-3xl mx-auto shadow-sm">
            <h3 className="font-bold mb-6 text-lg border-b pb-2">Input Aspirasi Baru</h3>
            <div className="grid md:grid-cols-2 gap-4">
               <div><label className="text-sm font-bold text-slate-700">OPD Tujuan</label><select className="w-full border p-2 rounded" value={formData.opd} onChange={e=>setFormData({...formData, opd: e.target.value})}>{LIST_OPD.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
               <div><label className="text-sm font-bold text-green-800">No Proposal / ID</label><input className="w-full border p-2 rounded font-bold bg-green-50" value={formData.manual_id} onChange={e=>setFormData({...formData, manual_id: e.target.value})} placeholder="Kode Unik..."/></div>
               <div className="md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Uraian Kegiatan</label>
                  <div className="relative">
                     <textarea className="w-full border p-2 rounded pr-10" rows={3} value={formData.uraian} onChange={e=>setFormData({...formData, uraian: e.target.value})} placeholder="Contoh: Perbaikan jalan desa X..."/>
                     <button onClick={handleAiRefine} disabled={isAiLoading} title="AI Perbaiki Kalimat" className="absolute right-2 bottom-2 text-purple-600 hover:bg-purple-50 p-1 rounded">{isAiLoading?<Loader2 size={16} className="animate-spin"/>:<Sparkles size={18}/>}</button>
                  </div>
               </div>
               <div><label className="text-sm font-bold text-slate-500">Pagu Pengajuan</label><input type="number" className="w-full border p-2 rounded" value={formData.apbd} onChange={e=>setFormData({...formData, apbd: e.target.value})}/></div>
               <div><label className="text-sm font-bold text-green-700">Pagu Penetapan</label><input type="number" className="w-full border-2 border-green-200 p-2 rounded" value={formData.apbd_penetapan} onChange={e=>setFormData({...formData, apbd_penetapan: e.target.value})}/></div>
               <div className="md:col-span-2"><label className="text-sm font-bold text-slate-500">Keterangan</label><input className="w-full border p-2 rounded" value={formData.ket} onChange={e=>setFormData({...formData, ket: e.target.value})}/></div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
               <button onClick={()=>setView('data')} className="px-4 py-2 rounded border hover:bg-slate-50">Batal</button>
               <button onClick={handleSubmit} className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow">Simpan Data</button>
            </div>
         </div>
      )}

      {view === 'data' && (
         <div className="bg-white p-6 rounded-xl border shadow-sm overflow-x-auto">
            <div className="flex justify-between mb-4 gap-2 print:hidden">
                <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-2.5 text-slate-400" size={18}/><input className="pl-10 pr-4 py-2 border rounded-lg w-full" placeholder="Cari Uraian..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
                <div className="flex gap-2"><ExportButton data={pokirData} filename="data_pokir"/><PrintButton/></div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 border-b"><tr><th className="p-3">ID</th><th className="p-3">OPD</th><th className="p-3">Uraian</th><th className="p-3 text-right">Penetapan</th><th className="p-3 print:hidden">Aksi</th></tr></thead>
                <tbody>
                    {filteredData.map(d=>(
                        <tr key={d.internal_id} className="border-b hover:bg-slate-50"><td className="p-3 font-bold text-green-700">{d.manual_id}</td><td className="p-3">{LIST_OPD.find(o=>o.id===d.opd)?.name}</td><td className="p-3 max-w-md">{d.uraian}</td><td className="p-3 text-right font-bold">{formatRupiah(d.apbd_penetapan)}</td><td className="p-3 print:hidden"><button onClick={()=>handleDelete(d.internal_id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button></td></tr>
                    ))}
                    {filteredData.length === 0 && <tr><td colSpan="5" className="p-4 text-center text-slate-400">Data kosong</td></tr>}
                </tbody>
                </table>
            </div>
         </div>
      )}
    </div>
  );
};

// ============================================
// MODUL 3: KEUANGAN (PERSISTENT)
// ============================================
const FinanceModule = () => {
  const [view, setView] = useState('list');
  // Auto-Save Data Keuangan
  const [transactions, setTransactions] = useStickyState([{ id: 1, date: '2023-11-01', desc: 'Dana Operasional', type: 'in', amount: 25000000, cat: 'Gaji' }], 'simas_finance_data');
  const [form, setForm] = useState({ date: '', desc: '', type: 'out', amount: '', cat: '' });

  const handleSave = () => {
      if(!form.desc || !form.amount) return alert('Lengkapi data');
      setTransactions([{ id: Date.now(), ...form, amount: parseInt(form.amount) }, ...transactions]);
      setView('list'); setForm({ date: '', desc: '', type: 'out', amount: '', cat: '' });
  };
  const saldo = transactions.reduce((a,c) => c.type === 'in' ? a + c.amount : a - c.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in">
       <div className="flex justify-between items-center print:hidden">
          <div><h2 className="text-2xl font-bold text-green-900">Keuangan Fraksi</h2><p className="text-sm text-slate-500">Saldo: <span className="font-bold text-green-700">{formatRupiah(saldo)}</span></p></div>
          <div className="flex gap-2">
            {view === 'list' ? <button onClick={()=>setView('input')} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex gap-2"><Plus size={18}/> Transaksi</button> : <button onClick={()=>setView('list')} className="border px-4 py-2 rounded">Kembali</button>}
          </div>
       </div>

       {view === 'input' && (
          <div className="bg-white p-6 rounded-xl border max-w-xl mx-auto shadow-lg">
             <h3 className="font-bold text-lg mb-4">Catat Transaksi</h3>
             <div className="space-y-4">
                <div className="flex gap-4">
                   <label className={`flex-1 border p-3 rounded flex items-center justify-center gap-2 cursor-pointer ${form.type==='in'?'bg-green-50 border-green-500 text-green-800':''}`}><input type="radio" className="hidden" name="type" onClick={()=>setForm({...form, type:'in'})}/><ArrowUpCircle/> Pemasukan</label>
                   <label className={`flex-1 border p-3 rounded flex items-center justify-center gap-2 cursor-pointer ${form.type==='out'?'bg-red-50 border-red-500 text-red-800':''}`}><input type="radio" className="hidden" name="type" onClick={()=>setForm({...form, type:'out'})}/><ArrowDownCircle/> Pengeluaran</label>
                </div>
                <div><label className="text-sm font-bold">Tanggal</label><input type="date" className="w-full border p-2 rounded" value={form.date} onChange={e=>setForm({...form, date: e.target.value})}/></div>
                <div><label className="text-sm font-bold">Uraian</label><input className="w-full border p-2 rounded" value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})}/></div>
                <div><label className="text-sm font-bold">Nominal (Rp)</label><input type="number" className="w-full border p-2 rounded" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})}/></div>
                <div><label className="text-sm font-bold">Kategori</label><select className="w-full border p-2 rounded" value={form.cat} onChange={e=>setForm({...form, cat: e.target.value})}><option value="">-Pilih-</option><option value="Gaji">Gaji</option><option value="Operasional">Operasional</option><option value="Sosial">Sosial</option><option value="Lainnya">Lainnya</option></select></div>
                <button onClick={handleSave} className="w-full bg-green-600 text-white py-3 rounded font-bold mt-2">Simpan</button>
             </div>
          </div>
       )}

       {view === 'list' && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b"><tr><th className="p-4">Tanggal</th><th className="p-4">Uraian</th><th className="p-4">Kategori</th><th className="p-4 text-right">Nominal</th><th className="p-4 print:hidden">Aksi</th></tr></thead>
                <tbody>
                   {transactions.map(t=>(
                      <tr key={t.id} className="border-b hover:bg-slate-50"><td className="p-4 text-slate-500">{t.date}</td><td className="p-4 font-bold text-slate-700">{t.desc}</td><td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${t.type==='in'?'bg-green-100 text-green-700':'bg-red-50 text-red-600'}`}>{t.cat}</span></td><td className={`p-4 text-right font-bold ${t.type==='in'?'text-green-600':'text-red-600'}`}>{t.type==='in'?'+':'-'} {formatRupiah(t.amount)}</td><td className="p-4 print:hidden"><button onClick={()=>setTransactions(transactions.filter(x=>x.id!==t.id))} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button></td></tr>
                   ))}
                </tbody>
             </table>
          </div>
       )}
    </div>
  );
};

// ============================================
// MODUL 4: JADWAL (PERSISTENT + BROADCAST)
// ============================================
const ScheduleModule = () => {
    // Auto-Save Data Jadwal
    const [schedules, setSchedules] = useStickyState([{ id: 1, date: '2025-12-10', time: '09:00', title: 'Rapat Paripurna', loc: 'Gedung Berlian', status: 'Terlaksana' }], 'simas_schedule_data');
    const [form, setForm] = useState({ date: '', time: '', title: '', loc: '', status: 'Terjadwal' });
    const [showInput, setShowInput] = useState(false);

    const handleSave = () => {
        if(!form.title) return alert("Isi judul agenda");
        setSchedules([...schedules, { id: Date.now(), ...form }]);
        setShowInput(false); setForm({ date: '', time: '', title: '', loc: '', status: 'Terjadwal' });
    };

    // FITUR BROADCAST OTOMATIS (One Click)
    const handleBroadcast = () => {
        if(schedules.length === 0) return alert("Tidak ada agenda untuk dilaporkan.");
        
        // Header Pesan
        let message = `*LAPORAN AGENDA HARIAN*%0A`;
        message += `Yth. Bapak H. Kholid Abdillah%0ABerikut rangkuman agenda terkini:%0A%0A`;
        
        // Loop semua agenda
        schedules.forEach((item, index) => {
            message += `${index+1}. *${item.title}*%0A`;
            message += `   📅 ${item.date} | ⏰ ${item.time}%0A`;
            message += `   📍 ${item.loc}%0A`;
            message += `   ℹ️ Status: ${item.status}%0A%0A`;
        });
        
        message += `Mohon arahan selanjutnya. Terima kasih.`;
        
        // Buka WA
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
                <div><h2 className="text-2xl font-bold text-green-900">Jadwal Agenda</h2><p className="text-sm text-slate-500">Manajemen Waktu Dewan</p></div>
                <div className="flex gap-2">
                    <button onClick={handleBroadcast} className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-600 shadow"><MessageCircle size={18}/> Kirim Laporan WA</button>
                    <button onClick={()=>setShowInput(!showInput)} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={18}/> Agenda Baru</button>
                </div>
            </div>

            {showInput && (
                <div className="bg-white p-6 rounded-xl border shadow-lg mb-6 max-w-2xl">
                    <h3 className="font-bold mb-4">Tambah Agenda</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div><label className="text-sm font-bold">Tanggal</label><input type="date" className="w-full border p-2 rounded" value={form.date} onChange={e=>setForm({...form, date: e.target.value})}/></div>
                        <div><label className="text-sm font-bold">Jam</label><input type="time" className="w-full border p-2 rounded" value={form.time} onChange={e=>setForm({...form, time: e.target.value})}/></div>
                        <div className="md:col-span-2"><label className="text-sm font-bold">Nama Acara</label><input className="w-full border p-2 rounded" value={form.title} onChange={e=>setForm({...form, title: e.target.value})}/></div>
                        <div className="md:col-span-2"><label className="text-sm font-bold">Lokasi</label><input className="w-full border p-2 rounded" value={form.loc} onChange={e=>setForm({...form, loc: e.target.value})}/></div>
                        <div className="md:col-span-2"><label className="text-sm font-bold">Status</label><select className="w-full border p-2 rounded" value={form.status} onChange={e=>setForm({...form, status: e.target.value})}><option>Terjadwal</option><option>Tentative</option><option>Selesai</option></select></div>
                    </div>
                    <button onClick={handleSave} className="w-full bg-green-600 text-white py-2 rounded font-bold mt-4">Simpan Agenda</button>
                </div>
            )}

            <div className="grid gap-4">
                {schedules.map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 hover:shadow-md transition">
                        <div className="bg-green-50 p-4 rounded-xl text-center min-w-[80px]"><span className="block font-bold text-green-700 text-xl">{s.date.split('-')[2]||'TGL'}</span><span className="text-xs font-bold text-green-600 uppercase">TGL</span></div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-800">{s.title}</h3>
                            <div className="flex gap-4 text-sm text-slate-500 mt-1">
                                <span className="flex items-center gap-1"><Clock size={14}/> {s.time} WIB</span>
                                <span className="flex items-center gap-1"><MapPin size={14}/> {s.loc}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <span className={`px-3 py-1 rounded-full text-xs font-bold border ${s.status==='Selesai'?'bg-green-100 text-green-800 border-green-200':'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>{s.status}</span>
                             <button onClick={() => {if(window.confirm('Hapus agenda?')) setSchedules(schedules.filter(x => x.id !== s.id))}} className="text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                        </div>
                    </div>
                ))}
                {schedules.length === 0 && <div className="text-center p-8 text-slate-400">Belum ada agenda.</div>}
            </div>
        </div>
    );
};

// ============================================
// MAIN APP LAYOUT
// ============================================
export default function App() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavItem = ({ id, label, icon: Icon, requiredLogin }) => {
    if (requiredLogin && !isLoggedIn) return null;
    return (
        <button onClick={()=>{setActiveTab(id);setIsMobileMenuOpen(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${activeTab===id?'bg-green-600 text-white shadow-lg shadow-green-200':'text-slate-500 hover:bg-green-50 hover:text-green-700'}`}>
            <Icon size={20}/><span>{label}</span>{activeTab===id && <ChevronRight size={16} className="ml-auto opacity-50"/>}
        </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col md:flex-row print:bg-white">
      {/* SIDEBAR */}
      <aside className={`fixed md:sticky top-0 h-screen w-72 bg-white border-r border-slate-200 z-50 transition-transform duration-300 print:hidden ${isMobileMenuOpen?'translate-x-0':'-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-green-200">KA</div>
            <div><h1 className="font-bold text-slate-900 leading-tight">SIMAS DPRD</h1><p className="text-xs text-green-600 font-bold">Admin Panel</p></div>
        </div>
        <nav className="p-4 space-y-1 mt-2">
            <div className="px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Utama</div>
            <NavItem id="profile" label="Profil & Dashboard" icon={User}/>
            {isLoggedIn && (
                <>
                <div className="px-4 mb-2 mt-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Aplikasi</div>
                <NavItem id="vote" label="Data Suara (Real Count)" icon={TrendingUp} requiredLogin/>
                <NavItem id="pokir" label="Manajemen Pokir" icon={FileText} requiredLogin/>
                <NavItem id="finance" label="Keuangan Fraksi" icon={Wallet} requiredLogin/>
                <NavItem id="schedule" label="Jadwal Kegiatan" icon={Calendar} requiredLogin/>
                </>
            )}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100">
            {isLoggedIn ? 
                <button onClick={()=>setIsLoggedIn(false)} className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 py-2.5 rounded-lg font-medium transition"><LogOut size={18}/> Logout</button> : 
                <button onClick={()=>{setIsLoggedIn(true);setActiveTab('vote')}} className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-2.5 rounded-lg hover:bg-slate-700 shadow-lg font-medium transition"><LogIn size={18}/> Login Admin</button>
            }
        </div>
      </aside>
      
      <div className="md:hidden fixed top-4 right-4 z-50 print:hidden"><button onClick={()=>setIsMobileMenuOpen(!isMobileMenuOpen)} className="bg-green-600 p-2.5 rounded-full text-white shadow-lg"><Menu/></button></div>
      
      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto print:p-0 print:overflow-visible">
          <div className="max-w-6xl mx-auto mt-12 md:mt-0">
            {activeTab==='profile' && (
                <div className="space-y-8 animate-in fade-in">
                    <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center p-1"><div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center overflow-hidden"><User size={64} className="text-slate-400"/></div></div>
                            <div>
                                <span className="bg-yellow-400 text-green-900 font-bold px-3 py-1 rounded-full text-xs uppercase mb-3 inline-block shadow">Fraksi PKB</span>
                                <h1 className="text-4xl font-bold mb-2">H. Kholid Abdillah</h1>
                                <p className="text-xl text-green-100 font-light">Anggota DPRD Provinsi Jawa Tengah</p>
                            </div>
                         </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border shadow-sm md:col-span-2">
                            <h3 className="font-bold text-green-800 text-lg mb-4 flex items-center gap-2"><User size={20}/> Biografi Singkat</h3>
                            <p className="text-slate-600 leading-relaxed">H. Kholid Abdillah adalah wakil rakyat yang berkomitmen untuk memperjuangkan aspirasi masyarakat Kendal, Kabupaten Semarang, dan Salatiga. Fokus utama beliau meliputi pemberdayaan pesantren, peningkatan infrastruktur desa, dan kesejahteraan petani.</p>
                        </div>
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm">
                             <h3 className="font-bold text-green-800 text-lg mb-4">Statistik Kinerja</h3>
                             <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-green-200 pb-2"><span className="text-slate-600 text-sm">Aspirasi Terealisasi</span><span className="font-bold text-green-700 text-lg">128</span></div>
                                <div className="flex justify-between items-center border-b border-green-200 pb-2"><span className="text-slate-600 text-sm">Titik Kunjungan</span><span className="font-bold text-green-700 text-lg">45</span></div>
                             </div>
                        </div>
                    </div>
                </div>
            )}
            {activeTab==='vote' && isLoggedIn && <VoteModule/>}
            {activeTab==='finance' && isLoggedIn && <FinanceModule/>}
            {activeTab==='pokir' && isLoggedIn && <PokirModule/>}
            {activeTab==='schedule' && isLoggedIn && <ScheduleModule/>}
            {!isLoggedIn && activeTab!=='profile' && <div className="h-[60vh] flex flex-col items-center justify-center text-center"><div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4"><LogIn size={32} className="text-slate-400"/></div><h2 className="text-xl font-bold text-slate-700">Akses Terbatas</h2><p className="text-slate-500 mt-2">Silakan login sebagai Admin.</p></div>}
          </div>
      </main>
    </div>
  );
}