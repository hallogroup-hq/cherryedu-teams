'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight, ArrowUpRight, Award, BookOpen, Check, CheckCircle2,
  ChevronLeft, ChevronRight, CircleHelp, ClipboardCheck, Coffee,
  Compass, FlaskConical, Heart, Lightbulb, MoveUpRight, Play,
  RotateCcw, SlidersHorizontal, Sparkles, Target, Users, WandSparkles,
} from 'lucide-react';
import styles from './experience-lab.module.css';

type Role = 'barista' | 'owner' | 'trainer';
type Chapter = { title: string; kicker: string; icon: string; phase: string; progress: number };
type Person = { name: string; job: string; initials: string; color: string; percent: number; priority: string; message: string };

const chapters: Chapter[] = [
  { title: 'Kenali rasa', kicker: 'Fondasi', icon: '01', phase: 'Selesai', progress: 100 },
  { title: 'Pahami ekstraksi', kicker: 'Sedang dipelajari', icon: '02', phase: 'Sekarang', progress: 65 },
  { title: 'Mainkan variabel', kicker: 'Eksperimen', icon: '03', phase: 'Berikutnya', progress: 0 },
  { title: 'Buktikan di bar', kicker: 'Praktik nyata', icon: '04', phase: 'Bersama pelatih', progress: 0 },
];

const choices = [
  { id: 1, label: 'Langsung naikkan suhu air', sub: 'Ubah suhu terlebih dahulu' },
  { id: 2, label: 'Cek waktu ekstraksi dan gilingan', sub: 'Cari penyebab, ubah satu variabel' },
  { id: 3, label: 'Tambah susu supaya lebih seimbang', sub: 'Tutup rasa asamnya' },
];

const people: Person[] = [
  { name: 'Naya Putri', job: 'Barista · Outlet Utama', initials: 'NP', color: 'peach', percent: 84, priority: 'Siap diuji', message: 'Naya sudah menyelesaikan latihan ekstraksi. Selanjutnya, jadwalkan penilaian praktik bersama pelatih.' },
  { name: 'Rafi Pratama', job: 'Barista · Outlet Utama', initials: 'RP', color: 'lilac', percent: 62, priority: 'Butuh arahan', message: 'Rafi masih kesulitan menjaga konsistensi. Diskusi singkat tentang variabel ekstraksi bisa membantu sebelum latihan berikutnya.' },
  { name: 'Sinta Maharani', job: 'Barista · Outlet Selatan', initials: 'SM', color: 'sage', percent: 46, priority: 'Sedang belajar', message: 'Sinta sedang membangun fondasi rasa. Berikan waktu untuk eksplorasi dan latihan cupping sederhana.' },
];

const criteria = [
  { title: 'Persiapan dan kebersihan', detail: 'Area kerja dan alat disiapkan dengan aman serta konsisten.', tip: 'Perhatikan urutan persiapan, bukan hanya hasil akhir.' },
  { title: 'Teknik distribusi dan tamping', detail: 'Gerakan yang terkontrol dan bisa diulang dengan konsisten.', tip: 'Amati tekanan, posisi tangan, dan hasil puck.' },
  { title: 'Membaca hasil ekstraksi', detail: 'Menjelaskan gejala, kemungkinan penyebab, dan tindakan yang dipilih.', tip: 'Tanya alasan perubahan variabel, jangan hanya hasil angkanya.' },
];

function CoffeeArt({ small = false }: { small?: boolean }) {
  return (
    <div className={small ? styles.artSmall : styles.art}>
      <svg viewBox="0 0 310 275" aria-hidden="true" className={styles.coffeeIllustration}>
        <path d="M160 22c-26 23 15 32-9 53m46-47c-21 20 10 31-8 53" fill="none" stroke="#ffba77" strokeWidth="5" strokeLinecap="round" opacity=".65" />
        <ellipse cx="158" cy="223" rx="114" ry="18" fill="#0e0a08" opacity=".3" />
        <path d="M65 91h190l-19 113c-5 25-22 34-56 34h-41c-34 0-52-9-57-34z" fill="#f6d6b0" />
        <path d="M254 108h19c28 0 30 70-23 78" stroke="#f6d6b0" strokeWidth="21" fill="none" strokeLinecap="round" />
        <ellipse cx="160" cy="93" rx="95" ry="23" fill="#fff1d9" />
        <ellipse cx="160" cy="92" rx="83" ry="16" fill="#8d4f30" />
        <path d="M118 89c18-19 35-13 42 0 7-13 28-18 44 0-8 20-34 32-44 32s-35-12-42-32" fill="#edc498" />
        <path d="M139 94c5 9 13 11 21 11 9 0 19-5 23-11" stroke="#8d4f30" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M65 91h190" stroke="#fff5de" strokeWidth="4" />
        <circle cx="61" cy="158" r="7" fill="#fcb56f" />
        <path d="M34 140l8 8m0-8l-8 8M273 57l9 9m0-9l-9 9" stroke="#f6b876" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  return (
    <div className={styles.progressRing} style={{ background: 'conic-gradient(#f47e48 ' + value + '%, #f2e2d5 0)' }}>
      <div><strong>{value}%</strong><span>perjalananmu</span></div>
    </div>
  );
}

function Avatar({ person, size = 'normal' }: { person: Person; size?: 'normal' | 'large' }) {
  return <div className={[styles.avatar, styles[person.color], size === 'large' ? styles.avatarLarge : ''].join(' ')} aria-hidden="true">{person.initials}</div>;
}

export default function ExperienceLabPage() {
  const [role, setRole] = useState<Role>('barista');
  const [choice, setChoice] = useState<number | null>(null);
  const [chapter, setChapter] = useState(1);
  const [grind, setGrind] = useState(2);
  const [filter, setFilter] = useState('Semua');
  const [selectedPerson, setSelectedPerson] = useState(0);
  const [criterionIndex, setCriterionIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [trainerNotes, setTrainerNotes] = useState('');
  const [trainerReview, setTrainerReview] = useState(false);
  const currentPerson = people[selectedPerson];
  const selectedPeople = useMemo(() => people.filter(p => filter === 'Semua' || p.priority === filter), [filter]);
  const currentCriterion = criteria[criterionIndex];
  const trainerDone = criteria.every((_, index) => scores[index] !== undefined);

  const setCurrentRole = (next: Role) => {
    setRole(next);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.canvas}>
      <div className={styles.labNotice}><span className={styles.liveDot} /> <strong>CHERRY EDU / EXPERIENCE LAB</strong><span>Konsep interaktif • Data contoh • Belum terhubung ke akun siswa</span></div>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}><div className={styles.brandMark}><Coffee size={24}/></div><div><strong>CherryEdu</strong><span>TEAMS STUDIO</span></div></div>
          <div className={styles.sidebarCaption}>PILIH PENGALAMAN</div>
          <nav aria-label="Pilih tampilan pengguna" className={styles.roleMenu}>
            <button className={role === 'barista' ? styles.activeRole : ''} onClick={() => setCurrentRole('barista')}><Compass size={19}/> <span>Ruang Barista</span><ArrowUpRight size={15}/></button>
            <button className={role === 'owner' ? styles.activeRole : ''} onClick={() => setCurrentRole('owner')}><Users size={19}/><span>Ruang Owner</span><ArrowUpRight size={15}/></button>
            <button className={role === 'trainer' ? styles.activeRole : ''} onClick={() => setCurrentRole('trainer')}><ClipboardCheck size={19}/><span>Ruang Pelatih</span><ArrowUpRight size={15}/></button>
          </nav>
          <div className={styles.sidebarBottom}><div className={styles.sidebarSpark}><WandSparkles size={18}/><span>Belajar kopi seharusnya<br/>terasa seperti petualangan.</span></div><p>Design exploration v1.0<br/>Tidak mengubah hasil belajar asli.</p></div>
        </aside>

        <div className={styles.workspace}>
          <header className={styles.header}>
            <div className={styles.crumb}><span>CHERRY EDU</span><ChevronRight size={14}/><strong>{role === 'barista' ? 'Skill Journey' : role === 'owner' ? 'Team Growth' : 'Coaching Space'}</strong></div>
            <div className={styles.headerRight}><span className={styles.previewPill}><span className={styles.pulse}/> Design Preview</span><div className={styles.headerAvatar}>{role === 'barista' ? 'B' : role === 'owner' ? 'O' : 'T'}</div></div>
          </header>

          {role === 'barista' && (
            <main className={styles.main}>
              <div className={styles.sectionTop}><span className={styles.eyebrow}><Sparkles size={15}/> PETUALANGAN KOPIMU</span><span className={styles.datePill}>Selamat datang kembali <Heart size={14} fill="currentColor"/></span></div>
              <div className={styles.titleRow}><div><h1 className={styles.mainTitle}>Sedikit demi sedikit,<br/><em>makin jago.</em></h1><p className={styles.lead}>Hari ini kita nggak cuma menghafal resep. Kita belajar memahami kopi.</p></div><div className={styles.ringWrap}><ProgressRing value={42}/></div></div>
              <div className={styles.baristaGrid}>
                <section className={styles.heroBarista}>
                  <div className={styles.heroCopy}><span className={styles.heroTag}><span className={styles.tagSpark}>✳</span> LATIHAN HARI INI</span><h2>Kopi itu<br/>penuh <i>teka-teki.</i></h2><p>Satu seduhan bisa mengajarimu banyak hal. Yuk, mulai dari satu pertanyaan sederhana.</p><a href="#coffee-challenge" className={styles.lightButton}><Play size={15} fill="currentColor"/> Mulai tantangan <ArrowRight size={18}/></a></div>
                  <CoffeeArt/>
                  <span className={styles.heroFootnote}>01 / 04 · MEMAHAMI EKSTRAKSI</span>
                </section>

                <section className={styles.journeyCard}><div className={styles.cardHeader}><div><span className={styles.cardKicker}>JALAN MENUJU MAHIR</span><h2>Peta skill-mu</h2></div><div className={styles.miniGlyph}><Target size={20}/></div></div>
                  <div className={styles.journeySteps}>{chapters.map((item, idx) => <button type="button" key={item.icon} onClick={() => setChapter(idx)} className={[styles.chapter, chapter === idx ? styles.chapterActive : '', idx < 1 ? styles.chapterDone : ''].join(' ')}><span className={styles.chapterIcon}>{idx === 0 ? <Check size={18}/> : item.icon}</span><span className={styles.chapterText}><strong>{item.title}</strong><small>{item.kicker}</small></span><span className={styles.chapterStatus}>{item.phase}</span></button>)}</div>
                  <div className={styles.chapterInfo}><span><BookOpen size={16}/> {chapters[chapter].title}</span><strong>{chapters[chapter].progress === 100 ? 'Sudah dikuasai pada latihan ini' : chapters[chapter].progress > 0 ? 'Terus eksplorasi, kamu sedang berkembang.' : 'Akan terbuka sesuai program belajarmu.'}</strong></div>
                </section>
              </div>

              <div className={styles.secondaryGrid}>
                <section className={styles.challenge} id="coffee-challenge"><div className={styles.cardHeader}><div><span className={styles.cardKicker}><Lightbulb size={15}/> COBA PIKIRKAN</span><h2>Kalau espresso terasa terlalu asam…</h2></div><span className={styles.questionCounter}>01 / 01</span></div><p className={styles.challengeLead}>Seorang pelanggan bilang espressonya terlalu asam. Apa langkah pertama yang paling masuk akal?</p>
                  <div className={styles.answers}>{choices.map(option=><button key={option.id} onClick={()=>setChoice(option.id)} className={[styles.answer,choice===option.id?styles.answerSelected:''].join(' ')}><span className={styles.answerBullet}>{String.fromCharCode(64+option.id)}</span><span><strong>{option.label}</strong><small>{option.sub}</small></span><span className={styles.answerTick}>{choice===option.id?<Check size={16}/>:<ChevronRight size={16}/>}</span></button>)}</div>
                  {choice !== null ? <div className={styles.feedback} role="status"><span className={styles.feedbackIcon}>{choice===2?<CheckCircle2 size={23}/>:<Lightbulb size={23}/>}</span><div><strong>{choice === 2 ? 'Nah, cara berpikirmu tepat!' : 'Menarik! Tapi coba pikirkan lagi.'}</strong><p>{choice===2?'Sebelum mengubah resep, periksa waktu ekstraksi, ukuran gilingan, dosis, dan hasil rasa. Ubah satu variabel agar kamu tahu penyebabnya.':'Bisa saja variabel itu relevan, tapi jangan langsung menebak. Mulai dari data ekstraksi dan rasa, lalu uji satu perubahan dalam satu waktu.'}</p><button onClick={()=>setChoice(null)}>Coba lagi <RotateCcw size={13}/></button></div></div>:<div className={styles.helperLine}><CircleHelp size={16}/> Tidak ada hukuman kalau salah. Yang penting: cari alasannya.</div>}
                </section>

                <section className={styles.experiment}><div className={styles.cardHeader}><div><span className={styles.cardKicker}><FlaskConical size={15}/> POJOK EKSPERIMEN</span><h2>Mainkan variabelnya</h2></div><div className={styles.miniGlyph}><SlidersHorizontal size={21}/></div></div><p className={styles.experimentLead}>Coba geser ukuran gilingan. Lihat bagaimana *hipotesis* ekstraksi bisa berubah.</p><div className={styles.grindIllustration}><div className={styles.grindBeans}>{Array.from({length:grind===1?18:grind===2?10:5},(_,i)=><span key={i}/>)}</div><div><span className={styles.microLabel}>UKURAN GILINGAN</span><strong>{['','Lebih halus','Sedang','Lebih kasar'][grind]}</strong></div></div><div className={styles.sliderLabel}><span>Lebih halus</span><span>Lebih kasar</span></div><input aria-label="Simulasi tingkat kehalusan gilingan" type="range" min="1" max="3" step="1" value={grind} onChange={e=>setGrind(Number(e.target.value))} className={styles.grindRange}/><div className={styles.hypothesis}><span className={styles.hypothesisIcon}><Lightbulb size={19}/></span><p>{grind===1?'Secara umum, partikel lebih halus bisa meningkatkan hambatan aliran dan ekstraksi. Tetapi hasil rasa perlu dibuktikan lewat seduhan.':grind===2?'Ini titik awal ilustratif. Coba amati rasa, waktu, dan hasil seduhan sebelum menentukan perubahan.':'Partikel lebih kasar biasanya mengurangi hambatan aliran. Efek pada rasa bergantung pada banyak faktor lain.'}</p></div><p className={styles.disclaimer}>Simulasi konsep, bukan prediksi hasil espresso sebenarnya.</p></section>
              </div>
            </main>
          )}

          {role === 'owner' && (
            <main className={styles.main}>
              <div className={styles.sectionTop}><span className={styles.eyebrow}><Users size={15}/> RUANG PERTUMBUHAN TIM</span><span className={styles.datePill}>Kopi Senja · Data ilustrasi</span></div>
              <div className={styles.titleRow}><div><h1 className={styles.mainTitle}>Tim yang tumbuh,<br/><em>bisnis ikut maju.</em></h1><p className={styles.lead}>Lihat manusia di balik angka. Siapa yang sudah melangkah jauh, dan siapa yang perlu ditemani?</p></div></div>
              <div className={styles.ownerGrid}><section className={styles.ownerHero}><div className={styles.heroCopy}><span className={styles.heroTag}>✳ PERKEMBANGAN TIM</span><h2>Setiap barista<br/>punya ceritanya.</h2><p>Tiga orang, perjalanan yang berbeda. Peranmu adalah membantu masing-masing menemukan langkah berikutnya.</p><button className={styles.lightButton} onClick={()=>{setFilter('Butuh arahan');setSelectedPerson(1)}}>Lihat siapa yang perlu bantuan <ArrowRight size={17}/></button></div><div className={styles.ownerOrbs}><span className={styles.orbOne}>N</span><span className={styles.orbTwo}>R</span><span className={styles.orbThree}>S</span><span className={styles.orbSpark}>✳</span></div></section><section className={styles.growthStory}><div className={styles.cardHeader}><div><span className={styles.cardKicker}>HAL YANG PERLU DIPERHATIKAN</span><h2>Langkah kecil, dampak besar.</h2></div><div className={styles.miniGlyph}><Heart size={19}/></div></div><div className={styles.storyHighlight}><span className={styles.storyIcon}><Lightbulb size={20}/></span><div><strong>Mulai dari percakapan.</strong><p>Rafi masih berlatih konsistensi ekstraksi. Ajak ngobrol 10 menit tentang satu masalah yang ia temui hari ini.</p></div></div><div className={styles.smallSteps}><span>1 · Dengarkan masalahnya</span><span>2 · Tentukan satu latihan</span><span>3 · Evaluasi bersama</span></div></section></div>
              <div className={styles.teamPanel}><div className={styles.teamTop}><div><span className={styles.cardKicker}>ORANG-ORANG DI BALIK BAR</span><h2>Kenali perkembangan timmu.</h2></div><span className={styles.teamCount}>03 anggota</span></div><div className={styles.filters} aria-label="Filter perkembangan tim">{['Semua','Butuh arahan','Siap diuji'].map(item=><button key={item} onClick={()=>setFilter(item)} className={filter===item?styles.filterActive:''}>{item}</button>)}</div><div className={styles.ownerDetailGrid}><div className={styles.peopleList}>{selectedPeople.map(person=>{const index=people.indexOf(person);return <button key={person.name} onClick={()=>setSelectedPerson(index)} className={[styles.personRow,selectedPerson===index?styles.personSelected:''].join(' ')}><Avatar person={person}/><span className={styles.personInfo}><strong>{person.name}</strong><small>{person.job}</small></span><span className={styles.personPercent}>{person.percent}%</span><ChevronRight size={16}/></button>})}</div><div className={styles.personDetail}><div className={styles.detailHeading}><Avatar person={currentPerson} size="large"/><div><span className={styles.cardKicker}>FOKUS MINGGU INI</span><h3>{currentPerson.name}</h3><p>{currentPerson.priority}</p></div></div><div className={styles.personProgress}><div><span>Progres latihan</span><strong>{currentPerson.percent}%</strong></div><div className={styles.progressTrack}><span style={{width:currentPerson.percent+'%'}}/></div></div><p className={styles.recommendation}>{currentPerson.message}</p><div className={styles.personNote}><Heart size={16}/> Saran latihan, bukan keputusan kompetensi resmi.</div></div></div></div>
            </main>
          )}

          {role === 'trainer' && (
            <main className={styles.main}>
              <div className={styles.sectionTop}><span className={styles.eyebrow}><ClipboardCheck size={15}/> RUANG PELATIH</span><span className={styles.datePill}>Penilaian contoh · Tidak tersimpan</span></div>
              <div className={styles.titleRow}><div><h1 className={styles.mainTitle}>Lebih banyak mengamati.<br/><em>Lebih sedikit mengisi.</em></h1><p className={styles.lead}>Fokus pada barista di depanmu. Catatan dan penilaian seharusnya mengikuti alur praktikmu.</p></div></div>
              <div className={styles.trainerGrid}><section className={styles.trainerHero}><div className={styles.heroCopy}><span className={styles.heroTag}>✳ SESI PRAKTIK</span><h2>Hari ini,<br/>kita bertumbuh.</h2><p>Simulasi penilaian ekstraksi espresso dengan tiga kriteria sederhana.</p><div className={styles.trainee}><span className={styles.traineeAvatar}>N</span><span><strong>Naya Putri</strong><small>Praktik Espresso · Outlet Utama</small></span></div></div><CoffeeArt small/></section><section className={styles.assessment}><div className={styles.cardHeader}><div><span className={styles.cardKicker}>PENILAIAN PRAKTIK</span><h2>Satu hal dalam satu waktu.</h2></div><span className={styles.questionCounter}>{criterionIndex+1} / {criteria.length}</span></div><div className={styles.rubricTrack}>{criteria.map((_,i)=><button key={i} aria-label={'Buka kriteria '+(i+1)} onClick={()=>{setCriterionIndex(i);setTrainerReview(false)}} className={[styles.rubricStep,i===criterionIndex?styles.rubricStepCurrent:'',scores[i]!==undefined?styles.rubricStepDone:''].join(' ')}/>)}</div><p className={styles.rubricKicker}>AMATI HAL INI</p><h3 className={styles.criterionTitle}>{currentCriterion.title}</h3><p className={styles.criterionDetail}>{currentCriterion.detail}</p><div className={styles.ratingGrid}>{[['1','Belum terlihat'],['2','Perlu latihan'],['3','Cukup baik'],['4','Sudah konsisten']].map(([value,label])=><button key={value} onClick={()=>setScores(prev=>({...prev,[criterionIndex]:Number(value)}))} className={[styles.rating,scores[criterionIndex]===Number(value)?styles.ratingActive:''].join(' ')}><strong>{value}</strong><span>{label}</span></button>)}</div><div className={styles.trainerTip}><Lightbulb size={18}/><p>{currentCriterion.tip}</p></div><div className={styles.rubricActions}><button onClick={()=>{setCriterionIndex(Math.max(0,criterionIndex-1));setTrainerReview(false)}} disabled={criterionIndex===0} className={styles.ghostButton}><ChevronLeft size={17}/> Sebelumnya</button>{criterionIndex < criteria.length-1?<button onClick={()=>{setCriterionIndex(Math.min(criteria.length-1,criterionIndex+1));setTrainerReview(false)}} className={styles.darkButton}>Lanjut <ArrowRight size={17}/></button>:<button onClick={()=>setTrainerReview(true)} className={styles.darkButton}>Lihat ringkasan <ArrowRight size={17}/></button>}</div></section></div>
              <div className={styles.trainerBottom}><section className={styles.notesCard}><span className={styles.cardKicker}>CATATAN YANG BERARTI</span><h2>Apa yang ingin kamu sampaikan?</h2><textarea value={trainerNotes} onChange={e=>setTrainerNotes(e.target.value)} placeholder="Contoh: Sudah memahami alasan perubahan gilingan. Perlu mengulang teknik distribusi agar lebih konsisten." rows={4}/><p>Catatan hanya berada dalam sesi preview ini.</p></section><section className={styles.reviewCard}><div className={styles.cardHeader}><div><span className={styles.cardKicker}>RINGKASAN LATIHAN</span><h2>Progres penilaian</h2></div><div className={styles.miniGlyph}><Award size={20}/></div></div><div className={styles.reviewNumber}><strong>{Object.keys(scores).length}</strong><span>/ {criteria.length} kriteria dicatat</span></div><div className={styles.reviewProgress}><span style={{width:(Object.keys(scores).length/criteria.length*100)+'%'}}/></div>{trainerReview?<div className={styles.reviewFeedback} role="status"><strong>{trainerDone?'Catatan latihanmu sudah lengkap.':'Masih ada kriteria yang belum dicatat.'}</strong><p>Ini hanya simulasi tampilan. Belum ada nilai, sertifikat, atau verifikasi kompetensi yang disimpan.</p><button onClick={()=>{setScores({});setTrainerNotes('');setCriterionIndex(0);setTrainerReview(false)}}>Mulai ulang simulasi <RotateCcw size={14}/></button></div>:<p className={styles.reviewPrompt}>Nilai tiap kriteria untuk melihat ringkasan latihan. Hasil final tetap membutuhkan sistem asesmen resmi.</p>}</section></div>
            </main>
          )}
          <footer className={styles.footer}><span><Sparkles size={14}/> Cherry Edu Teams · Experience Exploration</span><span>Ini contoh interaktif, bukan data atau hasil asesmen asli.</span></footer>
        </div>
      </div>
      <div className={styles.mobileSwitch} aria-label="Ganti tampilan pengguna"><button onClick={()=>setCurrentRole('barista')} className={role==='barista'?styles.mobileActive:''}><Compass size={20}/><span>Barista</span></button><button onClick={()=>setCurrentRole('owner')} className={role==='owner'?styles.mobileActive:''}><Users size={20}/><span>Owner</span></button><button onClick={()=>setCurrentRole('trainer')} className={role==='trainer'?styles.mobileActive:''}><ClipboardCheck size={20}/><span>Pelatih</span></button></div>
    </div>
  );
}
