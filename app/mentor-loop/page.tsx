'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Check, CheckCircle2,
  ChevronRight, ClipboardCheck, ClipboardList, Coffee, FileText, FlaskConical,
  GraduationCap, Heart, LockKeyhole, MessageCircle, NotebookPen, RotateCcw,
  Send, ShieldCheck, Sparkles, UsersRound,
} from 'lucide-react';
import {
  ACTIVITY, initialMentorLoop, loadPreviewState, editTrainerDraft,
  setAttendance, publishTrainerSession, submitPractice, reviewPractice,
  getOwnerReport, getPracticeStatus,
  type LoopRole, type MentorLoopState, type PracticeInput, type ReviewVerdict,
  type DraftField,
} from '@/lib/mentorLoop';
import s from './mentor-loop.module.css';

const STORAGE_KEY = 'cherryedu_mentor_loop_v1';
type Notice = { type: 'good' | 'bad'; text: string } | null;
const idlePractice: PracticeInput = { changed: '', noticed: '', reason: '' };
const now = () => new Date().toISOString();

function StepMark({ number, done }: { number: number; done?: boolean }) {
  return <span className={[s.stepMark, done ? s.stepDone : ''].join(' ')} aria-hidden="true">{done ? <Check size={17} strokeWidth={3} /> : number}</span>;
}

function HeaderTag({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return <span className={s.eyebrow}>{icon}{children}</span>;
}

function SectionTitle({ kicker, title, hint }: { kicker: string; title: string; hint?: string }) {
  return <div className={s.sectionTitle}><span className={s.sectionKicker}>{kicker}</span><h2>{title}</h2>{hint && <p>{hint}</p>}</div>;
}

function TimeStamp({ value }: { value: string | null }) {
  if (!value) return null;
  let result = '';
  try { result = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(new Date(value)); }
  catch { result = 'Tercatat'; }
  return <time dateTime={value}>{result} WIB</time>;
}

function ActionStatus({ children, positive }: { children: ReactNode; positive?: boolean }) {
  return <span className={[s.actionStatus, positive ? s.positive : ''].join(' ')}>{children}</span>;
}

export default function MentorLoopPage() {
  const [role, setRole] = useState<LoopRole>('trainer');
  const [state, setState] = useState<MentorLoopState>(initialMentorLoop);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [practice, setPractice] = useState<PracticeInput>(idlePractice);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewVerdict, setReviewVerdict] = useState<ReviewVerdict>('practice_again');
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    try { setState(loadPreviewState(window.localStorage.getItem(STORAGE_KEY))); }
    catch { setState(initialMentorLoop()); }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { /* Local preview still works until page closes. */ }
  }, [state, hydrated]);

  const owner = getOwnerReport(state);
  const status = getPracticeStatus(state);
  const last = state.attempts.at(-1);
  const waitingFeedback = status === 'waiting_feedback';
  const readyToPractice = status === 'ready' || status === 'retry_ready';
  const reviewable = Boolean(last && !last.review);
  const date = state.sessionPublishedAt;
  const reveal = (next: LoopRole) => {
    setRole(next);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const perform = (fn: () => MentorLoopState, feedback: string) => {
    try { setState(fn()); setNotice({ type: 'good', text: feedback }); }
    catch (error) { setNotice({ type: 'bad', text: error instanceof Error ? error.message : 'Tindakan belum berhasil.' }); }
  };
  const changeDraft = (field: DraftField, value: string) => {
    try { setState(editTrainerDraft(state, field, value)); setNotice(null); }
    catch(error) { setNotice({ type: 'bad', text: error instanceof Error ? error.message : 'Catatan belum bisa diubah.' }); }
  };
  const submit = () => {
    try {
      const next = submitPractice(state, practice, now());
      setState(next);
      setPractice(idlePractice);
      setNotice({ type: 'good', text: 'Latihan terkirim! Trainer sekarang dapat membaca dan memberikan feedback.' });
    } catch (error) { setNotice({ type: 'bad', text: error instanceof Error ? error.message : 'Latihan belum terkirim.' }); }
  };
  const publishFeedback = () => {
    try {
      setState(reviewPractice(state, reviewVerdict, reviewMessage, now()));
      setReviewMessage('');
      setNotice({ type: 'good', text: 'Feedback terkirim. Barista dan ringkasan Owner kini ikut diperbarui.' });
    } catch (error) { setNotice({ type: 'bad', text: error instanceof Error ? error.message : 'Feedback belum berhasil dipublikasikan.' }); }
  };
  const reset = () => {
    setState(initialMentorLoop());
    setRole('trainer');
    setPractice(idlePractice);
    setReviewMessage('');
    setShowReset(false);
    setNotice({ type: 'good', text: 'Simulasi kembali ke kondisi awal. Data contoh saja yang direset.' });
  };

  return (
    <div className={s.shell}>
      <a href="#content" className={s.skip}>Lewati navigasi</a>
      <div className={s.banner}><Sparkles size={14}/><span><strong>PRODUCT LAB / V4</strong> — Alur praktik interaktif. Semua nama dan aktivitas hanyalah simulasi di perangkat ini.</span></div>
      <header className={s.topBar}>
        <div className={s.brand}><span className={s.brandIcon}><Coffee size={21}/></span><span><strong>Cherry Edu</strong><small>Teams / Mentorship</small></span></div>
        <div className={s.projectTag}><span className={s.projectDot}/> {ACTIVITY.client} <span className={s.projectDivider}>·</span> Minggu 2</div>
      </header>

      <div className={s.mainWrap}>
        <nav className={s.roleTabs} aria-label="Pilih peran untuk simulasi">
          <button onClick={()=>reveal('trainer')} className={role==='trainer'?s.selected:''} aria-pressed={role==='trainer'}><ClipboardCheck size={18}/> <span>Pelatih</span></button>
          <button onClick={()=>reveal('barista')} className={role==='barista'?s.selected:''} aria-pressed={role==='barista'}><GraduationCap size={18}/> <span>Barista</span></button>
          <button onClick={()=>reveal('owner')} className={role==='owner'?s.selected:''} aria-pressed={role==='owner'}><UsersRound size={18}/> <span>Owner</span></button>
        </nav>

        <main id="content" className={s.content}>
          {notice && <div role={notice.type === 'bad' ? 'alert' : 'status'} className={[s.notice,notice.type==='bad'?s.noticeBad:s.noticeGood].join(' ')}>{notice.type==='bad'?<MessageCircle size={18}/>:<CheckCircle2 size={18}/>}<span>{notice.text}</span><button type="button" aria-label="Tutup pesan" onClick={()=>setNotice(null)}>×</button></div>}

          {role === 'trainer' && (
            <>
              <div className={s.pageIntro}>
                <HeaderTag icon={<ClipboardCheck size={15}/>}>COACHING WORKSPACE</HeaderTag>
                <h1>Catat yang penting.<br/><em>Fokus ke orangnya.</em></h1>
                <p>Mulai dari satu sesi praktik. Catat apa yang diajarkan dan beri Barista satu latihan yang jelas.</p>
              </div>
              <div className={s.contextCard}>
                <div className={s.contextIcon}><Coffee size={24}/></div>
                <div className={s.contextText}><span>SESI PENDAMPINGAN</span><strong>{ACTIVITY.session}</strong><small>{ACTIVITY.stage} · {ACTIVITY.learnerFull}</small></div>
                <ActionStatus positive={Boolean(date)}>{date?'Sesi dipublikasikan':'Belum dipublikasikan'}</ActionStatus>
              </div>

              {!date ? <section className={s.workSection}>
                <SectionTitle kicker="LANGKAH 1 / PELATIH" title="Sesi hari ini" hint="Hanya informasi yang telah dipublikasikan yang boleh muncul di ruang Barista dan laporan Owner."/>
                <label className={s.checkRow}>
                  <input type="checkbox" checked={state.attendance} onChange={e=>perform(()=>setAttendance(state,e.target.checked),e.target.checked?'Kehadiran Naya tercatat sebagai hadir.':'Kehadiran belum ditandai.')} />
                  <span><strong>Naya hadir di sesi ini</strong><small>Konfirmasi setelah sesi tatap muka berlangsung.</small></span>
                </label>
                <div className={s.inputGrid}>
                  <div className={s.field}><label htmlFor="t-topic">Apa yang diajarkan?</label><textarea id="t-topic" value={state.draft.sessionTopic} onChange={e=>changeDraft('sessionTopic',e.target.value)} placeholder="Contoh: Distribusi, tamping, dan membaca hasil ekstraksi." rows={3} maxLength={1200}/></div>
                  <div className={s.field}><label htmlFor="t-internal">Catatan pribadi Pelatih <span>(tidak terlihat Owner)</span></label><textarea id="t-internal" value={state.draft.internalObservation} onChange={e=>changeDraft('internalObservation',e.target.value)} placeholder="Catatan internal untuk tindak lanjut." rows={3} maxLength={1200}/></div>
                  <div className={s.field}><label htmlFor="t-owner">Ringkasan untuk Owner</label><textarea id="t-owner" value={state.draft.ownerSummary} onChange={e=>changeDraft('ownerSummary',e.target.value)} placeholder="Contoh: Tim berlatih teknik puck preparation. Naya perlu membiasakan distribusi yang lebih konsisten." rows={3} maxLength={1200}/></div>
                  <div className={s.field}><label htmlFor="t-task">Latihan untuk Barista</label><textarea id="t-task" value={state.draft.practicePrompt} onChange={e=>changeDraft('practicePrompt',e.target.value)} placeholder="Contoh: Bandingkan dua ekstraksi dengan satu perubahan gilingan. Catat hasil rasanya." rows={3} maxLength={1200}/></div>
                </div>
                <div className={s.submitRow}><span><LockKeyhole size={15}/> Draft otomatis tersimpan di browser preview ini.</span><button className={s.primary} onClick={()=>perform(()=>publishTrainerSession(state,now()),'Sesi dipublikasikan. Latihan sekarang tersedia untuk Barista.')}><Send size={17}/> Publikasikan sesi</button></div>
              </section> : <section className={s.publishedBlock}><div className={s.publishedIcon}><CheckCircle2 size={26}/></div><div><HeaderTag icon={<Check size={15}/>}>SUDAH DIPUBLIKASIKAN</HeaderTag><h2>Sesi tercatat dan tugas sudah diberikan.</h2><p>{state.draft.sessionTopic}</p><small><TimeStamp value={date}/></small></div><button onClick={()=>reveal('barista')} className={s.outlineButton}>Lihat sebagai Barista <ArrowRight size={17}/></button></section>}

              <section className={s.reviewSection}>
                <SectionTitle kicker="LANGKAH 3 / COACHING" title="Balasan dari Barista" hint="Feedback hanya bisa diberikan setelah Barista mengirim latihan. Hasil ini bukan sertifikasi atau sign-off kompetensi."/>
                {!last ? <div className={s.emptyState}><NotebookPen size={28}/><strong>Belum ada latihan yang dikirim.</strong><p>Setelah sesi dipublikasikan, buka tampilan Barista untuk mencoba mengisi latihan.</p>{Boolean(date)&&<button className={s.linkButton} onClick={()=>reveal('barista')}>Buka ruang Barista <ArrowRight size={16}/></button>}</div>
                : <div className={s.submission}>
                  <div className={s.submissionTop}><span>PRAKTIK #{state.attempts.length}</span><ActionStatus positive={Boolean(last.review)}>{last.review?'Sudah diberi feedback':'Perlu feedback'}</ActionStatus></div>
                  <dl className={s.practiceDetails}><div><dt>Yang dicoba</dt><dd>{last.changed}</dd></div><div><dt>Yang diamati</dt><dd>{last.noticed}</dd></div><div><dt>Pemahaman Barista</dt><dd>{last.reason}</dd></div></dl>
                  {reviewable ? <div className={s.feedbackForm}>
                    <span className={s.smallHeading}>PILIH TINDAK LANJUT</span>
                    <div className={s.verdicts}><button className={reviewVerdict==='practice_again'?s.verdictActive:''} aria-pressed={reviewVerdict==='practice_again'} onClick={()=>setReviewVerdict('practice_again')}><RotateCcw size={18}/><strong>Coba lagi</strong><small>Perlu latihan ulang</small></button><button className={reviewVerdict==='progressing'?s.verdictActive:''} aria-pressed={reviewVerdict==='progressing'} onClick={()=>setReviewVerdict('progressing')}><Heart size={18}/><strong>Berkembang</strong><small>Beri langkah selanjutnya</small></button></div>
                    <div className={s.field}><label htmlFor="feedback">Feedback spesifik untuk Naya</label><textarea id="feedback" rows={3} maxLength={1200} value={reviewMessage} onChange={e=>setReviewMessage(e.target.value)} placeholder="Apa yang sudah bagus, apa yang masih perlu dicoba, dan alasannya?"/></div>
                    <button className={s.primary} onClick={publishFeedback}><Send size={17}/> Kirim feedback</button>
                  </div> : <div className={s.feedbackPublished}><MessageCircle size={20}/><div><strong>{last.review?.verdict==='practice_again'?'Perlu mencoba lagi':'Terlihat berkembang'}</strong><p>{last.review?.message}</p><small><TimeStamp value={last.review?.publishedAt ?? null}/></small></div></div>}
                </div>}
              </section>
            </>
          )}

          {role === 'barista' && (
            <>
              <div className={s.pageIntro}>
                <HeaderTag icon={<Sparkles size={15}/>}>RUANG BARISTA</HeaderTag>
                <h1>Hai, Naya.<br/><em>Satu langkah lagi.</em></h1>
                <p>Nggak perlu mengerjakan semuanya hari ini. Fokus ke satu hal yang membantu kamu makin paham.</p>
              </div>
              <section className={s.learningStrip}>
                <span className={s.bookIcon}><BookOpen size={23}/></span><div><small>BELAJAR ONLINE</small><strong>Fundamental &amp; Barista Path</strong><p>Materi dan ujian resmi tetap di Cherry Edu. Progres belum tersinkron di demo ini.</p></div><a href="https://edu.cherrycoffeeroastery.com/paths" rel="noreferrer" target="_blank" aria-label="Buka katalog Cherry Edu di tab baru"><ArrowUpRight size={20}/></a>
              </section>

              <div className={s.todayHeader}><SectionTitle kicker="AKTIVITAS BERIKUTNYA" title={status==='waiting_session'?'Menunggu latihan dari Pelatih':status==='waiting_feedback'?'Sudah dikirim. Bagus!':status==='reviewed'?'Latihanmu sudah direview':'Sekarang giliran kamu.'}/><ActionStatus positive={status==='reviewed'}>{status==='waiting_session'?'Belum ditugaskan':status==='waiting_feedback'?'Menunggu feedback':status==='reviewed'?'Sudah direview':status==='retry_ready'?'Coba lagi':'Siap dicoba'}</ActionStatus></div>

              {status === 'waiting_session' ? <div className={s.actionCard}><span className={s.actionIcon}><CalendarDays size={25}/></span><h3>Pelatih sedang menyiapkan sesi.</h3><p>Setelah sesi offline tercatat, instruksi latihan akan muncul di sini. Sementara itu, kamu bisa belajar Fundamental di Cherry Edu.</p><button className={s.outlineButton} onClick={()=>reveal('trainer')}>Simulasikan dari Pelatih <ArrowRight size={17}/></button></div>
              : <section className={s.actionCard}>
                <div className={s.actionNumber}><span>01 / LATIHAN DI BAR</span><span><FlaskConical size={18}/></span></div>
                <h3>{status==='retry_ready'?'Coba lagi dengan feedback yang baru.':'Coba satu hal. Pahami hasilnya.'}</h3>
                <p className={s.prompt}>{state.draft.practicePrompt}</p>
                {readyToPractice ? <div className={s.practiceForm}>
                  {status==='retry_ready'&&last?.review&&<div className={s.coachMessage}><MessageCircle size={21}/><div><strong>Pesan dari Pelatih</strong><p>{last.review.message}</p></div></div>}
                  <div className={s.field}><label htmlFor="p-changed">Apa yang kamu coba?</label><textarea id="p-changed" rows={2} maxLength={1200} value={practice.changed} onChange={e=>setPractice({...practice,changed:e.target.value})} placeholder="Misalnya, mengubah tingkat kehalusan gilingan." /></div>
                  <div className={s.field}><label htmlFor="p-noticed">Apa yang kamu amati?</label><textarea id="p-noticed" rows={2} maxLength={1200} value={practice.noticed} onChange={e=>setPractice({...practice,noticed:e.target.value})} placeholder="Bagaimana waktu, aliran, dan rasanya berubah?" /></div>
                  <div className={s.field}><label htmlFor="p-reason">Menurutmu kenapa begitu?</label><textarea id="p-reason" rows={2} maxLength={1200} value={practice.reason} onChange={e=>setPractice({...practice,reason:e.target.value})} placeholder="Jelaskan alasanmu. Nggak harus langsung benar." /></div>
                  <div className={s.practiceFooter}><span><ShieldCheck size={16}/> Tidak ada jawaban otomatis. Pelatih akan memberikan feedback.</span><button className={s.primary} onClick={submit}><Send size={16}/> Kirim latihan</button></div>
                </div>
                : waitingFeedback ? <div className={s.waitState}><span><CheckCircle2 size={23}/></span><div><strong>Sudah terkirim ke Pelatih</strong><p>Jawabanmu aman tercatat di preview. Setelah Pelatih meninjau, feedback akan muncul di sini.</p><button className={s.linkButton} onClick={()=>reveal('trainer')}>Simulasikan review Pelatih <ArrowRight size={16}/></button></div></div>
                : <div className={s.feedbackPublished}><Heart size={22}/><div><strong>Feedback sudah datang</strong><p>{last?.review?.message}</p><small>Ini feedback latihan, bukan kelulusan praktik atau kompetensi resmi.</small></div></div>}
              </section>}
              {state.attempts.length>0&&<section className={s.historySection}><SectionTitle kicker="CATATAN PERKEMBANGAN" title="Jejak belajarmu"/><div className={s.historyList}>{[...state.attempts].reverse().map((a,i)=><div className={s.historyItem} key={a.id}><StepMark number={state.attempts.length-i} done={Boolean(a.review)}/><div><strong>Percobaan {state.attempts.length-i}</strong><p>{a.changed}</p><small>{a.review?'Sudah diberi feedback':'Menunggu feedback'} · <TimeStamp value={a.submittedAt}/></small></div></div>)}</div></section>}
            </>
          )}

          {role === 'owner' && (
            <>
              <div className={s.pageIntro}>
                <HeaderTag icon={<FileText size={15}/>}>LAPORAN LAYANAN</HeaderTag>
                <h1>Apa yang sudah<br/><em>benar-benar terjadi?</em></h1>
                <p>Ikuti pekerjaan Cherry Edu dan perkembangan tim tanpa perlu menebak dari persentase yang tidak jelas.</p>
              </div>
              <section className={s.ownerBrief}>
                <div><small>PROGRAM PENDAMPINGAN</small><h2>{ACTIVITY.client}</h2><p>R&D · Mentorship Hybrid · Owner Report</p></div>
                <span className={s.ownerStamp}>MINGGU<br/><strong>02 / 04</strong></span>
              </section>
              <SectionTitle kicker="CATATAN YANG BISA DIPERTANGGUNGJAWABKAN" title="Progres layanan"/>
              <div className={s.serviceTimeline}>
                <div className={s.timelineRow}><StepMark number={1}/><div><div className={s.timelineHead}><strong>R&D & audit awal</strong><ActionStatus>Belum tercatat</ActionStatus></div><p>Belum ada temuan R&D yang dipublikasikan dalam simulasi ini. Tidak dihitung sebagai layanan selesai.</p></div></div>
                <div className={s.timelineRow}><StepMark number={2} done={owner.sessionPublished}/><div><div className={s.timelineHead}><strong>Mentorship — Teknik & Espresso</strong><ActionStatus positive={owner.sessionPublished}>{owner.sessionPublished?'Sudah terlaksana':'Menunggu laporan'}</ActionStatus></div>
                  {owner.sessionPublished ? <div className={s.timelinePublished}><small><TimeStamp value={owner.sessionDate}/> · {owner.attendeeCount} peserta hadir</small><p><strong>Materi:</strong> {owner.topic}</p><p><strong>Hasil sesi:</strong> {owner.summary}</p></div>:<p>Pelatih belum mempublikasikan catatan sesi dan bukti kehadiran.</p>}
                </div></div>
                <div className={s.timelineRow}><StepMark number={3}/><div><div className={s.timelineHead}><strong>Laporan akhir</strong><ActionStatus>Belum diterbitkan</ActionStatus></div><p>Laporan akhir disusun setelah layanan dan data yang relevan diverifikasi.</p></div></div>
              </div>
              <SectionTitle kicker="TIM YANG DIDAMPINGI" title="Perkembangan Naya"/>
              <section className={s.ownerLearner}>
                <div className={s.personRow}><span className={s.avatar}>NP</span><div><strong>{ACTIVITY.learnerFull}</strong><small>Barista · {ACTIVITY.client}</small></div></div>
                <div className={s.ownerMetrics}><div><strong>{owner.practiceSubmissions}</strong><span>Latihan dikirim</span></div><div><strong>{owner.reviewPublished?'1':'0'}</strong><span>Feedback terbaru</span></div></div>
                <div className={s.ownerAction}><span>LANGKAH SELANJUTNYA</span><p>{owner.nextAction}</p></div>
                {owner.latestReview && <div className={s.feedbackPublished}><MessageCircle size={21}/><div><strong>Catatan perkembangan dari Pelatih</strong><p>{owner.latestReview.message}</p><small>{owner.latestReview.verdict==='practice_again'?'Perlu latihan ulang':'Ada perkembangan, belum berarti kompetensi terverifikasi'} · <TimeStamp value={owner.latestReview.at}/></small></div></div>}
              </section>
              <div className={s.integrityNote}><ShieldCheck size={20}/><div><strong>Keakuratan lebih penting dari tampilan angka.</strong><p>Catatan internal Trainer dan jawaban mentah Barista tidak ditampilkan pada Owner. Dampak pelatihan belum bisa dinyatakan meningkat tanpa data pembanding dan asesmen yang valid.</p></div></div>
            </>
          )}

          <section className={s.switchHint}>
            <div><span className={s.sectionKicker}>COBA SELURUH ALURNYA</span><strong>{role==='trainer'?'Sesudah mengajar, buka ruang Barista.':role==='barista'?'Setelah latihan terkirim, kembali ke Pelatih.':'Lihat bagaimana catatan layanan terbentuk.'}</strong></div>
            <button className={s.outlineButton} onClick={()=>reveal(role==='trainer'?'barista':role==='barista'?'trainer':'trainer')}>{role==='trainer'?'Coba sebagai Barista':role==='barista'?'Coba sebagai Pelatih':'Kembali ke Pelatih'} <ArrowRight size={17}/></button>
          </section>
          <footer className={s.footer}>
            <div><strong>CherryEdu Teams</strong><span>Preview saja · Disimpan di browser ini, bukan database Cherry Edu</span></div>
            <button onClick={()=>setShowReset(true)}><RotateCcw size={15}/> Mulai ulang simulasi</button>
          </footer>
        </main>
      </div>
      {showReset && <div className={s.modalLayer} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShowReset(false);}}><div className={s.modal} role="dialog" aria-modal="true" aria-labelledby="reset-title"><h2 id="reset-title">Mulai dari awal?</h2><p>Semua catatan contoh, latihan, dan feedback pada preview ini akan dihapus dari browser perangkat ini. Tidak ada data pelanggan yang terpengaruh.</p><div><button className={s.outlineButton} onClick={()=>setShowReset(false)}>Batal</button><button className={s.dangerButton} onClick={reset}>Reset simulasi</button></div></div></div>}
    </div>
  );
}
