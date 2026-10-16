'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowRight, ArrowUpRight, BookOpen, Check, CheckCircle2, ChevronRight,
  ClipboardCheck, Coffee, ExternalLink, FileText, FlaskConical, GraduationCap,
  Heart, Lightbulb, PenLine, RotateCcw, Sparkles, Target, Users, Wrench, NotebookPen, Save, SquareCheckBig, RefreshCw, CircleCheck, LockKeyhole,
} from 'lucide-react';
import s from './experience-lab.module.css';

type Role = 'barista' | 'owner' | 'trainer';
type SessionType = 'R&D' | 'Teknik' | 'Espresso Base';
type View = 'activity' | 'people';
type Log = { step: SessionType; note: string; author: string };
const COURSES_URL = 'https://edu.cherrycoffeeroastery.com/paths';

const fundamentals = [
  { id: 'hulu', title: 'Kopi dari Hulu ke Hilir', kicker: 'Fundamental 01', detail: 'Belajar perjalanan kopi, dari kebun sampai ke cangkir.', status: 'Sedang belajar', progress: 42 },
  { id: 'barista', title: 'Fundamental Barista', kicker: 'Fundamental 02', detail: 'Bangun pemahaman kerja di balik bar dan prinsip ekstraksi.', status: 'Ujian akhir belum selesai', progress: 64 },
];
const classes = [
  { id: 'sensory', title: 'Sensory & Cupping', detail: 'Latih bahasa rasa dan kepekaan sensori.' },
  { id: 'brewing', title: 'Home Brewing', detail: 'Memahami pengaruh variabel seduh.' },
  { id: 'espresso', title: 'Espresso Exploration', detail: 'Memahami ekstraksi dan troubleshooting.' },
  { id: 'green', title: 'Green Coffee', detail: 'Mengenal karakter dan mutu bahan baku.' },
  { id: 'service', title: 'Coffee Service', detail: 'Mengelola pengalaman pelanggan di bar.' },
];
type PreviewLog = { id: string; note: string; date: string };
type BaristaPreview = { checks: Record<string, boolean>; selectedPaths: string[]; journal: PreviewLog[] };
const PREVIEW_KEY = 'cherryedu_teams_experience_lab_barista_v3';
const INITIAL_BARISTA: BaristaPreview = { checks: {}, selectedPaths: [], journal: [] };
const personalTasks = [
  { id: 'hulu', title: 'Belajar materi Hulu ke Hilir', desc: 'Centang setelah kamu belajar hari ini.', type: 'Online' },
  { id: 'barista', title: 'Belajar Fundamental Barista', desc: 'Baca atau lanjutkan materi di Cherry Edu.', type: 'Online' },
  { id: 'teknik', title: 'Latihan teknik di bar', desc: 'Coba teknik yang dibahas bersama Trainer.', type: 'Praktik mandiri' },
  { id: 'catatan', title: 'Catat hasil satu eksperimen', desc: 'Simpan pengamatan rasa atau teknik.', type: 'Eksperimen' },
  { id: 'kelas', title: 'Pilih minimal tiga path', desc: 'Tandai kelas yang paling ingin kamu pelajari.', type: 'Eksplorasi' },
];

const activities = [
  { title: 'Audit bar & observasi workflow', type: 'R&D', week: 'Minggu 1', status: 'Sudah dilakukan', detail: 'Alur pelayanan, kondisi peralatan, dan konsistensi resep diamati.' },
  { title: 'Praktik teknik dasar bar', type: 'Teknik', week: 'Minggu 2', status: 'Sesi terlaksana', detail: 'Distribusi, tamping, kebersihan, dan alur kerja saat ramai.' },
  { title: 'Kalibrasi espresso & sensori', type: 'Espresso Base', week: 'Minggu 3', status: 'Terjadwal', detail: 'Latihan membaca rasa dan memilih penyesuaian ekstraksi.' },
  { title: 'Evaluasi & laporan pemilik', type: 'Report', week: 'Minggu 4', status: 'Direncanakan', detail: 'Rangkuman sesi, perkembangan barista, dan tindak lanjut.' },
];
const baristas = [
  { name: 'Naya Putri', role: 'Barista · Outlet Utama', initials: 'NP', color: 'apricot', online: 'Dua fundamental sedang berjalan', practice: 'Sudah mengikuti Teknik', next: 'Latihan ekstraksi lanjutan', tag: 'Berkembang' },
  { name: 'Rafi Pratama', role: 'Barista · Outlet Utama', initials: 'RP', color: 'lavender', online: 'Fundamental Barista belum ujian akhir', practice: 'Perlu pengulangan tamping', next: 'Latihan bersama Trainer', tag: 'Butuh latihan' },
  { name: 'Sinta Maharani', role: 'Barista · Outlet Selatan', initials: 'SM', color: 'sage', online: 'Baru memulai materi Hulu ke Hilir', practice: 'Belum ikut Espresso Base', next: 'Selesaikan pengenalan kopi', tag: 'Baru mulai' },
];

function RoleButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return <button className={active ? s.roleActive : s.roleButton} type="button" onClick={onClick}>{icon}<span>{label}</span></button>;
}
function Status({ children, tone='neutral' }: { children: ReactNode; tone?: 'neutral'|'warm'|'positive' }) {
  return <span className={[s.status, tone==='warm'?s.statusWarm:tone==='positive'?s.statusPositive:''].join(' ')}>{children}</span>;
}
function SectionHeading({ eyebrow, title, extra }: { eyebrow: string; title: string; extra?: ReactNode }) {
  return <div className={s.sectionHeading}><div><span className={s.eyebrow}>{eyebrow}</span><h2>{title}</h2></div>{extra}</div>;
}
function Avatar({ initials, color }: { initials: string; color: string }) {
  return <span className={[s.avatar,s[color]].join(' ')}>{initials}</span>;
}
function CoffeeIllustration() {
  return <svg className={s.coffeeArt} viewBox="0 0 242 236" aria-hidden="true" fill="none">
    <ellipse cx="119" cy="208" rx="102" ry="14" fill="#46251D" opacity=".19"/>
    <path d="M47 88h143l-15 95c-3 16-18 25-37 25H98c-18 0-33-9-36-25L47 88Z" fill="#FFC88C"/>
    <path d="M186 99h21c34 0 29 68-20 69" stroke="#FFC88C" strokeWidth="16" strokeLinecap="round"/>
    <ellipse cx="118" cy="89" rx="73" ry="20" fill="#FFECCB"/><ellipse cx="118" cy="87" rx="65" ry="14" fill="#8A5237"/>
    <path d="M79 85c16-13 31-8 38 4 7-12 24-17 40-4-8 17-23 27-40 27S86 102 79 85Z" fill="#FFE0B0"/>
    <path d="M99 90c6 7 12 9 18 9s14-2 18-9" stroke="#A26747" strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M94 25c-17 17 9 25-2 39m41-39c-17 17 9 25-2 39" stroke="#FFD2A0" strokeWidth="4" strokeLinecap="round"/>
    <path d="M206 39v20m-10-10h20M27 128v14m-7-7h14" stroke="#FFC88C" strokeWidth="4" strokeLinecap="round"/>
  </svg>;
}
function LearningCards({ checks, onToggle }: { checks: Record<string,boolean>; onToggle: (key:string)=>void }) {
  return <div className={s.twoColumn}>{fundamentals.map((item,i) => <div key={item.id} className={s.courseCard}>
    <div className={s.courseHead}><span className={s.smallIndex}>0{i+1} / FUNDAMENTAL</span><Status>Hasil ujian belum tersinkron</Status></div>
    <h3>{item.title}</h3><p>{item.detail}</p>
    <a href={COURSES_URL} target="_blank" rel="noopener noreferrer" className={s.textAction}>Buka materi di Cherry Edu <ExternalLink size={15}/></a>
    <button type="button" aria-pressed={Boolean(checks[item.id])} className={[s.courseStudyButton,checks[item.id]?s.studyMarked:''].join(' ')} onClick={()=>onToggle(item.id)}>
      {checks[item.id]?<CheckCircle2 size={19}/>:<SquareCheckBig size={19}/>}
      <span>{checks[item.id]?'Sudah belajar hari ini · Batalkan':'Tandai sudah belajar hari ini'}</span>
    </button>
    <p className={s.personalHint}><LockKeyhole size={13}/> Checklist pribadi, bukan bukti lulus ujian.</p>
  </div>)}</div>;
}

export default function ExperienceLabPage() {
  const [role,setRole]=useState<Role>('barista');
  const [answer,setAnswer]=useState<number|null>(null);
  const [ownerView,setOwnerView]=useState<View>('activity');
  const [person,setPerson]=useState(0);
  const [session,setSession]=useState<SessionType>('Teknik');
  const [note,setNote]=useState('');
  const [logs,setLogs]=useState<Log[]>([]);
  const [manualQuestion,setManualQuestion]=useState('');
  const [questions,setQuestions]=useState<string[]>([]);
  const [showExamPlan,setShowExamPlan]=useState(false);
  const [baristaPreview,setBaristaPreview]=useState<BaristaPreview>(INITIAL_BARISTA);
  const [readyForSave,setReadyForSave]=useState(false);
  const [experimentNote,setExperimentNote]=useState('');
  const [saveMessage,setSaveMessage]=useState('');

  useEffect(()=>{
    try {
      const raw=window.localStorage.getItem(PREVIEW_KEY);
      if(raw){
        const value=JSON.parse(raw) as Partial<BaristaPreview>;
        setBaristaPreview({
          checks: value.checks&&typeof value.checks==='object'?value.checks:{},
          selectedPaths:Array.isArray(value.selectedPaths)?value.selectedPaths.filter(x=>classes.some(c=>c.id===x)):[],
          journal:Array.isArray(value.journal)?value.journal.filter(x=>x&&typeof x.note==='string').slice(-20):[]
        });
      }
    }catch { /* Storage may be disabled; preview still works in this session. */ }
    setReadyForSave(true);
  },[]);
  useEffect(()=>{
    if(!readyForSave)return;
    try{window.localStorage.setItem(PREVIEW_KEY,JSON.stringify(baristaPreview));}
    catch{ /* Restrictive browsing storage: keep interactive session state. */ }
  },[baristaPreview,readyForSave]);

  function toggleTask(key:string){
    setBaristaPreview(prev=>({...prev,checks:{...prev.checks,[key]:!prev.checks[key]}}));
    setSaveMessage('');
  }
  function togglePath(id:string){
    setBaristaPreview(prev=>({...prev,selectedPaths:prev.selectedPaths.includes(id)?prev.selectedPaths.filter(p=>p!==id):[...prev.selectedPaths,id]}));
    setSaveMessage('');
  }
  function saveExperiment(){
    const trimmed=experimentNote.trim();
    if(trimmed.length<8)return;
    const log:PreviewLog={id:Date.now().toString(36),note:trimmed,date:new Date().toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})};
    setBaristaPreview(prev=>({...prev,journal:[log,...prev.journal].slice(0,20),checks:{...prev.checks,catatan:true}}));
    setExperimentNote('');
    setSaveMessage('Catatan eksperimen tersimpan di perangkat ini.');
  }
  function resetPreview(){
    setBaristaPreview(INITIAL_BARISTA);
    setExperimentNote('');
    setSaveMessage('Checklist dan catatan contoh sudah direset.');
  }
  const checklistCompletion={
    ...baristaPreview.checks,
    catatan:baristaPreview.journal.length>0,
    kelas:baristaPreview.selectedPaths.length>=3
  };
  const tasksCompleted=personalTasks.filter(task=>Boolean(checklistCompletion[task.id])).length;
  const nextTask=personalTasks.find(task=>!checklistCompletion[task.id]);

  const ownerActivities=useMemo(()=>[...activities,...logs.map((l,i)=>({title:'Catatan sesi '+l.step,type:l.step,week:'Simulasi',status:'Dicatat di preview',detail:l.note}))], [logs]);
  function addLog() {const value=note.trim();if(!value)return;setLogs(prev=>[...prev,{step:session,note:value,author:'Pelatih (preview)'}]);setNote('');}
  function addQuestion(){const value=manualQuestion.trim();if(!value)return;setQuestions(q=>[...q,value]);setManualQuestion('');}
  const currentBarista=baristas[person];

  return <div className={s.app}>
    <div className={s.labRibbon}><Sparkles size={15}/><strong>EXPERIENCE LAB · V3</strong><span>Simulasi interaktif, bukan akun, nilai, atau data pelanggan asli.</span></div>
    <div className={s.shell}>
      <header className={s.header}>
        <div className={s.brand}><span className={s.brandEmblem}><Coffee size={24}/></span><span><strong>CherryEdu</strong><small>TEAMS · COFFEE PEOPLE CLUB</small></span></div>
        <nav className={s.roles} aria-label="Lihat pengalaman berdasarkan pengguna">
          <RoleButton active={role==='barista'} onClick={()=>setRole('barista')} icon={<GraduationCap size={18}/>} label="Barista"/>
          <RoleButton active={role==='owner'} onClick={()=>setRole('owner')} icon={<Users size={18}/>} label="Owner"/>
          <RoleButton active={role==='trainer'} onClick={()=>setRole('trainer')} icon={<ClipboardCheck size={18}/>} label="Pelatih"/>
        </nav>
        <span className={s.previewBadge}><span/> DESIGN PREVIEW</span>
      </header>
      <div className={s.content}>
        <div className={s.overline}><span><span className={s.starlight}>✳</span> KOPI SENJA / PROGRAM PENDAMPINGAN</span><span>Contoh bulan layanan • Minggu 2 dari 4</span></div>
        {role==='barista' && <main>
          <section className={s.baristaHero}>
            <div className={s.heroWords}><span className={s.heroChip}>RUANG BELAJARMU</span><h1>Belajar, coba,<br/><em>lalu makin jago.</em></h1><p>Belajar teorinya di Cherry Edu. Praktik langsung bersama pelatih. Semuanya bisa kamu ikuti dari HP.</p><a href="#barista-next" className={s.heroButton}>Lihat langkahmu hari ini <ArrowRight size={17}/></a></div>
            <div className={s.heroIllustration}><CoffeeIllustration/><span className={s.heroSticker}>belajar sampai<br/><b>paham!</b></span></div>
          </section>
          <div className={s.baristaToday} id="barista-next"><div className={s.todayIcon}><Target size={23}/></div><div><span className={s.eyebrow}>LANGKAH BERIKUTNYA</span><h2>{nextTask?nextTask.title:'Hebat, aktivitas pribadimu sudah tercatat!'}</h2><p>{nextTask?nextTask.desc:'Terus belajar dan praktik. Hasil ujian dan kompetensi tetap menunggu verifikasi resmi.'}</p></div><Status tone="warm">{tasksCompleted}/{personalTasks.length} aktivitas</Status></div>
          <section className={s.checklistPanel} aria-labelledby="barista-checklist-title">
            <div className={s.checklistHeader}>
              <div><span className={s.eyebrow}>AKTIVITAS YANG BISA KAMU KERJAKAN</span><h2 id="barista-checklist-title">Checklist belajar hari ini <span>✳</span></h2><p>Ini catatan aktivitas pribadi. Centang yang sudah kamu coba; tidak mengubah nilai ataupun kelulusan resmi.</p></div>
              <div className={s.checklistCounter}><strong>{tasksCompleted}<small>/{personalTasks.length}</small></strong><span>aktivitas</span></div>
            </div>
            <div className={s.checklistTrack} role="progressbar" aria-label="Aktivitas pribadi selesai" aria-valuenow={tasksCompleted} aria-valuemin={0} aria-valuemax={personalTasks.length}><span style={{width:tasksCompleted/personalTasks.length*100+'%'}}/></div>
            <div className={s.taskList}>
              {personalTasks.map(task=><label key={task.id} className={[s.taskItem,checklistCompletion[task.id]?s.taskFinished:''].join(' ')}>
                {task.id==='catatan'||task.id==='kelas'
                  ? <span className={s.taskIndicator} aria-hidden="true">{checklistCompletion[task.id]?<Check size={19}/>:<span/>}</span>
                  : <input type="checkbox" className={s.realCheckbox} checked={Boolean(checklistCompletion[task.id])} onChange={()=>toggleTask(task.id)} aria-label={task.title}/>}
                <span className={s.taskText}><strong>{task.title}</strong><small>{task.desc}</small></span>{task.id==='kelas'||task.id==='catatan'?<a className={s.taskTypeLink} href={task.id==='kelas'?'#barista-classes':'#barista-journal'}>{task.id==='kelas'?'Pilih path →':'Buat catatan →'}</a>:<span className={s.taskType}>{task.type}</span>}
              </label>)}
            </div>
            {tasksCompleted===personalTasks.length?<div className={s.checklistCongrats} role="status"><Sparkles size={19}/> Semua aktivitas pribadi tercatat. Belajar dan bertumbuh tetap lanjut!</div>:null}
            <div className={s.checklistBottom}><span><Save size={15}/> {readyForSave?'Tersimpan otomatis di perangkat ini':'Memuat catatan perangkat…'}</span><button type="button" onClick={resetPreview}><RotateCcw size={14}/> Reset simulasi</button></div>
          </section>
          <SectionHeading eyebrow="PETUALANGAN BELAJAR" title="Dua tempat, satu perjalanan." extra={<span className={s.subtle}>Materi online tidak perlu disalin ke Teams.</span>}/>
          <div className={s.journey}>
            <div className={s.step}><span className={[s.stepNumber,s.stepDone].join(' ')}><Check size={20}/></span><div className={s.stepBody}><div className={s.stepHeader}><span className={s.stepKicker}>01 / MULAI DARI DASAR</span><Status tone="positive">Online · Berjalan</Status></div><h3>Bangun pondasi kopi</h3><p>Pelajari Fundamental Hulu ke Hilir dan Fundamental Barista di Cherry Edu utama. Teams hanya menampilkan perkembangan sampai hasil ujian akhirnya.</p><LearningCards checks={baristaPreview.checks} onToggle={toggleTask}/></div></div>
            <div className={s.step}><span className={s.stepNumber}>02</span><div className={s.stepBody}><div className={s.stepHeader}><span className={s.stepKicker}>02 / BELAJAR DI BAR</span><Status tone="warm">Offline · Bersama pelatih</Status></div><h3>Belajar lewat tanganmu sendiri</h3><p>Dua sesi praktik langsung. Pelatih akan mencatat kegiatan dan hal-hal yang masih perlu dilatih.</p><div className={s.offlineGrid}><div className={s.offlineCard}><div className={s.offlineIcon}><Wrench size={23}/></div><div><h4>Teknik</h4><p>Persiapan, workflow, distribusi, tamping, dan teknik kerja.</p><small>Contoh status: sesi sudah dilakukan</small></div></div><div className={s.offlineCard}><div className={s.offlineIcon}><Coffee size={23}/></div><div><h4>Espresso Base</h4><p>Dial-in, rasa, penyesuaian variabel, dan sensori dasar.</p><small>Contoh status: sesi berikutnya</small></div></div></div></div></div>
            <div className={s.step}><span className={s.stepNumber}>03</span><div className={s.stepBody}><div className={s.stepHeader}><span className={s.stepKicker}>03 / KEMBANGKAN RASA PENASARAN</span><Status>Online · Minimal 3 path</Status></div><h3>Pilih tiga jalur belajar tambahan</h3><p>Minimal tiga path akan ditugaskan sesuai kebutuhan tim. Belajar dan ujian akhirnya tetap dilakukan di Cherry Edu.</p><div className={s.classSelection} id="barista-classes"><span className={s.classSummary}><strong>{baristaPreview.selectedPaths.length} path dipilih</strong> · minimal tiga pilihan pribadi, belum menjadi penugasan resmi</span>
                <div className={s.classList}>{classes.map((x,i)=><label key={x.id} className={baristaPreview.selectedPaths.includes(x.id)?s.classSelected:s.classOption}>
                  <input type="checkbox" checked={baristaPreview.selectedPaths.includes(x.id)} onChange={()=>togglePath(x.id)} aria-label={'Pilih '+x.title}/>
                  <span><strong>{x.title}</strong><small>{x.detail}</small></span>
                </label>)}</div>
                {baristaPreview.selectedPaths.length>=3?<div className={s.pathHint} role="status"><CheckCircle2 size={16}/> Pilihanmu sudah tiga atau lebih. Trainer/Admin tetap menentukan penugasan resmi.</div>:<div className={s.pathHint}><Target size={16}/> Pilih {3-baristaPreview.selectedPaths.length} path lagi untuk melengkapi rencana pribadimu.</div>}
              </div><a className={s.textAction} href={COURSES_URL} target="_blank" rel="noreferrer">Jelajahi materi Cherry Edu <ArrowUpRight size={15}/></a></div></div>
            <div className={s.step}><span className={s.stepNumber}>04</span><div className={s.stepBody}><div className={s.stepHeader}><span className={s.stepKicker}>04 / TUNJUKKAN PEMAHAMANMU</span><Status tone="warm">Ujian gabungan</Status></div><h3>Ujian yang nyambung dengan pekerjaanmu</h3><p>Soal dari materi online digabung dengan pertanyaan yang disiapkan pelatih berdasarkan apa yang diajarkan saat praktik offline.</p><div className={s.examStrip}><FileText size={23}/><div><b>Teori Cherry Edu + kasus dari pelatih</b><span>Ujian resmi hanya muncul ketika sudah dijadwalkan dan memenuhi persyaratan program.</span></div><ChevronRight size={17}/></div></div></div>
          </div>
          <section id="barista-journal" className={s.experimentJournal} aria-labelledby="journal-title">
            <div className={s.journalTop}><div><span className={s.eyebrow}><NotebookPen size={15}/> CATATAN DARI BAR</span><h2 id="journal-title">Coba satu hal. Catat yang berubah.</h2><p>Nggak perlu selalu berhasil. Yang penting kamu tahu apa yang dicoba, kenapa, dan hasil pengamatannya.</p></div><span className={s.journalCount}>{baristaPreview.journal.length} catatan</span></div>
            <label htmlFor="barista-experiment-note" className={s.journalLabel}>Apa yang kamu coba hari ini?</label>
            <textarea id="barista-experiment-note" value={experimentNote} onChange={e=>setExperimentNote(e.target.value)} rows={4} maxLength={1200} placeholder="Contoh: Aku mencoba gilingan sedikit lebih halus, sambil mempertahankan dosis. Waktu seduh jadi lebih lama. Rasanya terasa berbeda…" />
            <div className={s.journalControls}><span>{experimentNote.trim().length<8?'Tulis sedikitnya 8 karakter untuk menyimpan.':'Bagus! Catatan siap disimpan.'}</span><button type="button" onClick={saveExperiment} disabled={experimentNote.trim().length<8}><Save size={17}/> Simpan pengamatan</button></div>
            {saveMessage&&<p className={s.journalMessage} role="status">{saveMessage}</p>}
            {baristaPreview.journal.length>0&&<div className={s.savedEntries}><span className={s.eyebrow}>YANG SUDAH KAMU COBA</span>{baristaPreview.journal.slice(0,4).map(log=><article key={log.id}><span>{log.date}</span><p>{log.note}</p></article>)}</div>}
            <p className={s.journalDisclaimer}><LockKeyhole size={15}/> Catatan hanya tersimpan di browser ini. Tidak dikirim ke Trainer atau Owner dan bukan bukti penilaian.</p>
          </section>
          <div className={s.beyondMonth}><Heart size={22}/><div><h3>Belajarnya tidak harus selesai dalam sebulan.</h3><p>Program layanan punya periode tersendiri. Kalau materi dan ujian online belum selesai, progres tetap dapat berlanjut sesuai kebijakan akses dan program yang ditetapkan.</p></div></div>
          <SectionHeading eyebrow="COBA DULU" title="Kalau espresso terlalu asam…"/>
          <section className={s.challenge}><div><span className={s.challengeEyebrow}><Lightbulb size={16}/> LATIH LOGIKA BARISTAMU</span><h3>Mana yang kamu cek duluan?</h3><p>Seorang pelanggan merasa espresso terlalu asam. Kamu ingin mencari penyebabnya, bukan langsung menebak resep.</p></div><div className={s.answers}>{['Langsung naikkan suhu air','Cek waktu ekstraksi, gilingan, dan rasanya','Tambah susu agar asamnya tertutup'].map((text,i)=><button key={text} className={answer===i?s.answerActive:s.answer} onClick={()=>setAnswer(i)}><span>{String.fromCharCode(65+i)}</span><strong>{text}</strong><ChevronRight size={15}/></button>)}{answer!==null&&<div className={s.feedback} role="status"><Lightbulb size={20}/><p><b>{answer===1?'Cara berpikir yang bagus.':'Coba periksa penyebabnya dulu.'}</b> Periksa data dan rasa, buat hipotesis, lalu ubah satu variabel. Ini latihan berpikir, bukan hasil ujian resmi.</p><button onClick={()=>setAnswer(null)}><RotateCcw size={15}/> Ulangi</button></div>}</div></section>
        </main>}

        {role==='owner' && <main>
          <section className={s.ownerHero}><div><span className={s.heroChip}>RUANG OWNER</span><h1>Bukan cuma janji.<br/><em>Lihat hasil kerjanya.</em></h1><p>Lihat apa yang tim Cherry Edu lakukan, apa yang sudah dipelajari baristamu, dan bagaimana perkembangan mereka.</p><button className={s.heroButton} onClick={()=>{setOwnerView('activity');document.getElementById('owner-report')?.scrollIntoView({behavior:'smooth'})}}>Lihat laporan layanan <ArrowRight size={17}/></button></div><div className={s.ownerVisual}><span className={s.ownerStamp}>R&D</span><span className={s.ownerStamp}>PRAKTIK</span><span className={s.ownerStamp}>REPORT</span><span className={s.ownerScribble}>our people,<br/>our progress.</span></div></section>
          <SectionHeading eyebrow="YANG KAMI KERJAKAN" title="Satu bulan, tiga bagian layanan." extra={<span className={s.subtle}>Contoh susunan, jadwal dapat disesuaikan.</span>}/>
          <div className={s.servicePillars}><article><span className={s.pillarIcon}><FlaskConical size={22}/></span><small>01 · MEMAHAMI KONDISI</small><h3>R&D</h3><p>Audit bar, alat, alur kerja, resep, dan rekomendasi berdasarkan kondisi coffee shop.</p><Status tone="positive">Contoh: selesai</Status></article><article><span className={s.pillarIcon}><GraduationCap size={23}/></span><small>02 · MENGEMBANGKAN TIM</small><h3>Mentorship Hybrid</h3><p>Belajar online di Cherry Edu, praktik Teknik dan Espresso Base, 3 path pilihan, dan ujian gabungan.</p><Status tone="warm">Contoh: berjalan</Status></article><article><span className={s.pillarIcon}><FileText size={23}/></span><small>03 · MEMBUKTIKAN HASIL</small><h3>Owner Report</h3><p>Catatan kegiatan dan bukti pembelajaran, perkembangan setiap barista, serta tindak lanjut.</p><Status>Disusun bertahap</Status></article></div>
          <div id="owner-report" className={s.reportPanel}><div className={s.reportHeader}><div><span className={s.eyebrow}>BUKU PERKEMBANGAN KOPI SENJA</span><h2>Jadi, sudah sampai mana?</h2><p>Semua yang penting, tanpa harus bertanya berkali-kali kepada pelatih.</p></div><div className={s.reportToggle} aria-label="Pilih isi laporan"><button className={ownerView==='activity'?s.toggleActive:''} onClick={()=>setOwnerView('activity')}><Activity size={16}/> Kegiatan</button><button className={ownerView==='people'?s.toggleActive:''} onClick={()=>setOwnerView('people')}><Users size={16}/> Barista</button></div></div>
          {ownerView==='activity'?<div className={s.reportEvents}>{ownerActivities.map((a,i)=><div className={s.reportEvent} key={i}><span className={s.eventBullet}>{i+1}</span><div><div className={s.eventMeta}><span>{a.week} · {a.type}</span><Status tone={a.status==='Sudah dilakukan'||a.status==='Sesi terlaksana'?'positive':'neutral'}>{a.status}</Status></div><h3>{a.title}</h3><p>{a.detail}</p>{i<2&&<small>Catatan dalam prototipe bukan bukti kegiatan sungguhan.</small>}</div></div>)}</div>:<div className={s.ownerPeople}><div className={s.peopleList}>{baristas.map((b,i)=><button key={b.name} className={person===i?s.personActive:s.person} onClick={()=>setPerson(i)}><Avatar initials={b.initials} color={b.color}/><span><strong>{b.name}</strong><small>{b.role}</small></span><ChevronRight size={16}/></button>)}</div><div className={s.personDetails}><span className={s.eyebrow}>CERITA PERKEMBANGAN</span><h3>{currentBarista.name}</h3><Status tone="warm">{currentBarista.tag}</Status><dl><dt>Belajar online</dt><dd>{currentBarista.online}</dd><dt>Praktik offline</dt><dd>{currentBarista.practice}</dd><dt>Langkah berikutnya</dt><dd>{currentBarista.next}</dd></dl><p>Penilaian kemampuan terverifikasi harus memakai bukti dan rubrik pelatih, bukan sekadar progres belajar.</p></div></div>}</div>
          <div className={s.beyondMonth}><FileText size={23}/><div><h3>Laporan yang menjawab pertanyaan Owner.</h3><p>Catatan pelaksanaan R&D, sesi offline, materi online yang benar-benar dikerjakan, progres ujian, catatan Trainer, serta apa yang perlu ditindaklanjuti setelah satu bulan.</p></div></div>
        </main>}

        {role==='trainer' && <main>
          <section className={s.trainerHero}><div><span className={s.heroChip}>RUANG PELATIH</span><h1>Fokus mengajar.<br/><em>Catat seperlunya.</em></h1><p>R&D, praktik Teknik, Espresso Base, dan catatan perkembangan—cukup dalam alur sederhana yang nyaman dipakai sambil berdiri di bar.</p><a href="#trainer-work" className={s.heroButton}>Buka sesi praktik <ArrowRight size={17}/></a></div><span className={s.trainerVisual}><CoffeeIllustration/></span></section>
          <SectionHeading eyebrow="BAGIAN DARI LAYANAN" title="Apa yang kamu kerjakan hari ini?"/>
          <div className={s.sessionTabs}>{(['R&D','Teknik','Espresso Base'] as SessionType[]).map((x,i)=><button key={x} className={session===x?s.sessionActive:s.sessionTab} onClick={()=>setSession(x)}><span>0{i+1}</span><strong>{x}</strong><ChevronRight size={17}/></button>)}</div>
          <div className={s.trainerWorkspace} id="trainer-work"><section className={s.sessionForm}><span className={s.eyebrow}>CATATAN SESI · {session.toUpperCase()}</span><h2>{session==='R&D'?'Apa yang kamu temukan di bar?':session==='Teknik'?'Apa yang sudah dipraktikkan?':'Apa yang berubah pada ekstraksi?'}</h2><p>{session==='R&D'?'Catat kondisi awal, masalah utama, dan tindakan yang disarankan.':session==='Teknik'?'Rekam kegiatan inti, kesulitan yang ditemukan, dan latihan berikutnya.':'Catat eksperimen, hasil sensori, dan keputusan yang perlu dipahami peserta.'}</p><label htmlFor="session-note">Catatan untuk tim dan Owner</label><textarea id="session-note" rows={5} value={note} onChange={e=>setNote(e.target.value)} placeholder={session==='R&D'?'Contoh: Workflow kasir dan bar perlu dipisahkan saat jam ramai...':session==='Teknik'?'Contoh: Tim berlatih teknik distribusi. Masih perlu konsistensi tamping...':'Contoh: Barista membandingkan rasa dari dua pengaturan gilingan...'} /><button onClick={addLog} disabled={!note.trim()} className={s.primaryAction}><PenLine size={17}/> Catat kegiatan (preview)</button><small>Catatan disimpan sementara di halaman preview ini; tidak masuk database atau laporan resmi.</small></section><section className={s.fieldNotes}><div className={s.fieldTop}><span className={s.eyebrow}>BUKU LAPANGAN</span><span className={s.fieldCount}>{logs.length} catatan baru</span></div><h2>Yang dikerjakan,<br/><em>terlihat jelas.</em></h2>{logs.length?logs.map((l,i)=><div className={s.fieldItem} key={i}><small>{l.step} · {l.author}</small><p>{l.note}</p></div>):<div className={s.emptyNotes}><ClipboardCheck size={28}/><strong>Belum ada catatan baru.</strong><p>Coba tulis satu kegiatan, lalu lihat hasilnya di tab Owner → Kegiatan.</p></div>}<div className={s.fieldFooter}><CheckCircle2 size={18}/> Hanya aktivitas yang tercatat yang layak dilaporkan sebagai kegiatan.</div></section></div>
          <SectionHeading eyebrow="UJIAN HYBRID" title="Soal online bertemu pengalaman di bar."/>
          <div className={s.examBuilder}><div className={s.examStory}><div className={s.examSource}><BookOpen size={23}/><div><strong>Dari kurikulum Cherry Edu</strong><span>Pilih soal dari bank soal yang telah dipublikasikan dan sesuai path yang ditugaskan.</span></div></div><div className={s.examJoin}>+</div><div className={s.examSource}><PenLine size={23}/><div><strong>Dari materi praktik Trainer</strong><span>Tambahkan soal kasus berdasarkan Teknik, Espresso Base, dan pembelajaran offline.</span></div></div><p>Jumlah, bobot, aturan kelulusan, dan penilaian perlu dikonfigurasi serta disahkan sebelum ujian resmi tersedia.</p></div><div className={s.examEditor}><span className={s.eyebrow}>COBA SUSUN SOAL TAMBAHAN</span><label htmlFor="manual-q">Pertanyaan studi kasus</label><textarea id="manual-q" rows={3} value={manualQuestion} onChange={e=>setManualQuestion(e.target.value)} placeholder="Contoh: Jika espresso terlalu pahit dan waktu ekstraksi lebih lama dari biasanya, variabel apa yang perlu kamu periksa?"/><button onClick={addQuestion} disabled={!manualQuestion.trim()} className={s.primaryAction}>Tambahkan contoh soal <ArrowRight size={17}/></button>{questions.length>0&&<div className={s.questions}>{questions.map((q,i)=><div key={i}><small>SOAL CONTOH {i+1}</small><p>{q}</p></div>)}</div>}<button className={s.textAction} onClick={()=>setShowExamPlan(!showExamPlan)}>{showExamPlan?'Tutup':'Lihat'} alur ujian hybrid <ChevronRight size={15}/></button>{showExamPlan&&<p className={s.examPlan}>Soal resmi online dipilih dari versi kurikulum yang valid. Soal manual diperiksa pelatih. Setelah ujian, hasil tersimpan dengan sumber soal dan upaya pengerjaan yang jelas. Ini baru konsep, belum menjalankan ujian sungguhan.</p>}</div></div>
        </main>}
        <footer className={s.footer}><div><Sparkles size={16}/> Cherry Edu Teams · One Month Mentorship Experience</div><span>Semua identitas, aktivitas, dan progres pada halaman ini adalah ilustrasi.</span></footer>
      </div>
    </div>
  </div>;
}
