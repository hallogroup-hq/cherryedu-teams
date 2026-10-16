import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialMentorLoop, setAttendance, editTrainerDraft, publishTrainerSession,
  submitPractice, reviewPractice, getOwnerReport, getPracticeStatus,
  loadPreviewState, type MentorLoopState
} from '../lib/mentorLoop';

const t1='2026-10-16T09:00:00.000Z';
const t2='2026-10-16T10:00:00.000Z';
const t3='2026-10-16T11:00:00.000Z';
const t4='2026-10-16T12:00:00.000Z';
const sample={
  changed:'Gilingan dibuat sedikit lebih halus, dosis tetap sama.',
  noticed:'Waktu ekstraksi bertambah, rasa masih terasa asam.',
  reason:'Saya mau bandingkan rasa sebelum mengubah variabel lain.'
};

function delivered():MentorLoopState {
  let s=initialMentorLoop();
  s=setAttendance(s,true);
  s=editTrainerDraft(s,'sessionTopic','Distribusi, tamping dan membaca ekstraksi.');
  s=editTrainerDraft(s,'internalObservation','Rahasia tim internal, tidak boleh dibuka ke Owner.');
  s=editTrainerDraft(s,'ownerSummary','Naya berlatih teknik distribusi dan mengamati perubahan ekstraksi.');
  s=editTrainerDraft(s,'practicePrompt','Bandingkan dua espresso; catat satu variabel dan hasilnya.');
  return publishTrainerSession(s,t1);
}

test('new account starts with no fabricated service progress',()=>{
  const s=initialMentorLoop();
  assert.equal(getPracticeStatus(s),'waiting_session');
  assert.equal(getOwnerReport(s).sessionPublished,false);
  assert.equal(getOwnerReport(s).practiceSubmissions,0);
});

test('trainer cannot publish before attendance and meaningful fields',()=>{
  assert.throws(()=>publishTrainerSession(initialMentorLoop(),t1),/kehadiran/i);
  let s=setAttendance(initialMentorLoop(),true);
  assert.throws(()=>publishTrainerSession(s,t1),/materi sesi/i);
  s=editTrainerDraft(s,'sessionTopic','Teknik tamping');
  assert.throws(()=>publishTrainerSession(s,t1),/ringkasan untuk Owner/i);
});

test('barista cannot submit when trainer has not assigned practice',()=>{
  assert.throws(()=>submitPractice(initialMentorLoop(),sample,t2),/instruksi latihan/i);
});

test('publishing trainer session unlocks exactly one learner assignment',()=>{
  const s=delivered();
  assert.equal(getPracticeStatus(s),'ready');
  assert.equal(getOwnerReport(s).sessionPublished,true);
  assert.equal(getOwnerReport(s).attendeeCount,1);
  assert.equal(s.events.length,1);
  assert.throws(()=>publishTrainerSession(s,t2),/dipublikasikan/i);
  assert.throws(()=>editTrainerDraft(s,'ownerSummary','Secret revision'),/dipublikasikan/i);
});

test('barista submission becomes reviewable and cannot be duplicated before review',()=>{
  const s=submitPractice(delivered(),sample,t2);
  assert.equal(s.attempts.length,1);
  assert.equal(getPracticeStatus(s),'waiting_feedback');
  assert.throws(()=>submitPractice(s,sample,t3),/tunggu feedback/i);
});

test('trainer can publish feedback and learner can retry while retaining history',()=>{
  let s=submitPractice(delivered(),sample,t2);
  s=reviewPractice(s,'practice_again','Kamu sudah mengamati rasa. Coba evaluasi waktu ekstraksi berikutnya.',t3);
  assert.equal(getPracticeStatus(s),'retry_ready');
  assert.throws(()=>reviewPractice(s,'progressing','Revisi diam-diam tidak boleh terjadi.',t4),/sudah dinilai/i);
  s=submitPractice(s,{changed:'Mencoba gilingan lebih kasar dengan dosis tetap.',noticed:'Waktu lebih singkat dan rasa lebih nyaman.',reason:'Saya ingin melihat efek dari perubahan ukuran partikel.'},t4);
  assert.equal(s.attempts.length,2);
  assert.equal(s.attempts[0].review?.verdict,'practice_again');
});

test('positive review is not a competency certificate or a new task',()=>{
  let s=submitPractice(delivered(),sample,t2);
  s=reviewPractice(s,'progressing','Observasi sudah jelas. Pertahankan konsistensi dan diskusikan saat sesi berikutnya.',t3);
  assert.equal(getPracticeStatus(s),'reviewed');
  assert.throws(()=>submitPractice(s,sample,t4),/belum ada instruksi/i);
  assert.equal('competencyVerified' in s,false);
});

test('owner sees only published summary and approved feedback, never private raw notes',()=>{
  let s=delivered();
  let report=JSON.stringify(getOwnerReport(s));
  assert.ok(!report.includes('Rahasia tim internal'));
  assert.ok(!report.includes(sample.changed));
  s=submitPractice(s,sample,t2);
  report=JSON.stringify(getOwnerReport(s));
  assert.equal(JSON.parse(report).practiceSubmissions,1);
  assert.ok(!report.includes(sample.changed));
  assert.ok(!report.includes(sample.reason));
  s=reviewPractice(s,'progressing','Terdapat perubahan kemampuan dalam membaca hasil; lanjutkan latihan.',t3);
  assert.match(JSON.stringify(getOwnerReport(s)),/lanjutkan latihan/i);
});

test('corrupt browser snapshots reset safely',()=>{
  assert.deepEqual(loadPreviewState(null),initialMentorLoop());
  assert.deepEqual(loadPreviewState('bad json'),initialMentorLoop());
  assert.deepEqual(loadPreviewState('{"version":1,"attendance":true}'),initialMentorLoop());
  assert.equal(loadPreviewState(JSON.stringify(delivered())).sessionPublishedAt,t1);
});

test('extra-long practice inputs fail safely',()=>{
  const s=delivered();
  assert.throws(()=>submitPractice(s,{...sample,changed:'x'.repeat(1201)},t2),/terlalu panjang/i);
});

test('owner report does not expose trainer drafts before publication',()=>{
  let s=initialMentorLoop();
  s=editTrainerDraft(s,'ownerSummary','This is a private unfinished draft for the Owner.');
  assert.equal(getOwnerReport(s).summary,null);
  assert.equal(getOwnerReport(s).topic,null);
});

test('Owner keeps previously published feedback visible while a new attempt waits for review',()=>{
  let state=submitPractice(delivered(),sample,t2);
  state=reviewPractice(state,'practice_again','Latih konsistensi pada satu variabel sebelum mengganti variabel berikutnya.',t3);
  state=submitPractice(state,{changed:'Mengganti tingkat gilingan tanpa mengubah dosis.',noticed:'Waktu seduh bergerak lebih pendek pada percobaan kedua.',reason:'Saya perlu menjaga perubahan hanya pada satu variabel.'},t4);
  const owner=getOwnerReport(state);
  assert.equal(owner.practiceSubmissions,2);
  assert.equal(owner.feedbackCount,1);
  assert.equal(owner.latestReview?.verdict,'practice_again');
  assert.match(owner.nextAction,/meninjau latihan/i);
});
