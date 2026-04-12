# Phase 7 — parity backlog: Phase 5 & Phase 6 vs `_reference/`

Catatan ini menampung **gap 1:1** antara SIMPRO dan TRACKLY (`_reference/`) untuk:

- **Phase 5** — Supporting Features (discussion, notifications, notes, members, clients, assets, settings, guide).
- **Phase 6** — Gantt (`/projects/[id]/gantt`).

**Tujuan:** dikerjakan saat **Phase 7: Polish & QA**, bersama checklist global di §Phase 7 `implementation-plan.md` (Lighthouse, mobile nav, error boundaries, dll.).

Referensi kode: `_reference/js/modules/*.js` — file utama disebut per bagian.

---

## Rekomendasi alur

- **Phase 5 & 6** dianggap *usable*; penyamaan detail UX/parity dilakukan di **Phase 7** menggunakan checklist di bawah.
- Tutup item secara bertahap; gabungkan dengan verifikasi role-gate dan responsif mobile.

---

## Discussion (`discussion.js` ↔ `/projects/[id]/discussion`)

- [x] **Tipe post** di UI: `update` | `question` | `decision` | `blocker` | `general` + **badge warna/ikon** seperti referensi.
- [x] **Pagination** daftar thread (referensi: `PAGE_SIZE = 20`, info halaman).
- [x] **Multi-file upload** lampiran sebelum submit (referensi: `_pendingAttachments`, beberapa file sekaligus).
- [x] **Avatar** penulis/balas (gambar atau inisial) selaras referensi.
- [ ] **Edit balasan** di UI (backend sudah ada `PATCH .../replies/:replyId` jika ingin dipakai).
- [ ] **Optimistic update** reply (sesuai teks §7.11 di plan — opsional).

---

## Notifications (`notifications.js` + `topbar.js` ↔ `/notifications` + bell)

- [x] **Dropdown bell:** `GET /notifications?take=5` (atau serupa) + daftar item, bukan hanya link “lihat semua”.
- [x] Halaman penuh: tab **Semua / Belum dibaca** seperti referensi.
- [x] **Relative time** (“baru saja”, “X menit yang lalu”, …) opsional selaras UX referensi.
- [x] **Deep link** dari notifikasi ke entity (`getNotifHref` di referensi: task, sprint, meeting, maintenance, discussion, member, client, asset, project).
- [ ] **Pagination / cursor:** plan §7.12 menyebut *cursor-based* `useInfiniteQuery`; backend saat ini page+offset — selaraskan kontrak API + FE jika ingin strict parity/perf.

---

## Notes (`notes.js` ↔ `/notes`)

- [x] **Warna catatan** (picker seperti `NOTE_COLORS` di referensi) — field `color` sudah ada di schema.
- [x] **Tag** (tambah/hapus) — field `tags` sudah ada di API.
- [x] **Pencarian** judul/konten (client atau endpoint).
- [ ] **Autosave / debounce** seperti referensi (opsional).
- [ ] **Label audit** yang lebih kaya / selaras `AUDIT_ACTION_LABELS` (backend audit action saat ini generik `update`).
- [ ] **Export** catatan jika ada di referensi dan masih dianggap in-scope.

---

## Members (`members.js` ↔ `/members`)

- [x] **Tambah anggota** (modal/form) — referensi: Add Member + hash password; SIMPRO: ikuti pola Better Auth (`CreateUserDto` / service yang ada).
- [x] **Search** nama/email/username.
- [ ] **Filter** role & status (chip/modal seperti referensi).
- [x] Kolom **avatar**, **department/position**.
- [ ] **Last login** di tabel (perlu data dari API + kolom UI jika ingin selaras referensi).
- [ ] **Project roles** jika di referensi sebagai konsep terpisah dari role global (cek schema/plan).

---

## Clients (`clients.js` ↔ `/clients`)

- [x] Status **`prospect`** (selain active/inactive) jika ingin sama dengan referensi.
- [x] **Industry** sebagai pilihan terbatas (dropdown) vs free text (+ opsi ketik manual).
- [x] **Toolbar:** search, filter status/industri.
- [x] Konfirmasi hapus: **AlertDialog** (bukan `window.confirm`).
- [ ] **Tampilan card vs table** (`_viewMode` di referensi).

---

## Assets (`assets.js` ↔ `/assets`)

- [ ] **Toolbar:** search, filter (kategori, status, dll. sesuai referensi).
- [x] Konfirmasi hapus: **AlertDialog** (bukan `window.confirm`) selaras Phase 7.
- [ ] **Tampilan card vs table** jika referensi punya keduanya.
- [ ] Field form lengkap selaras referensi (tanggal pembelian, harga, assign user, project, gambar, …) — cek `assets.js` + schema.

---

## Settings (`settings.js` ↔ `/settings`)

- [ ] **Cache** client: `staleTime: Infinity` + invalidate setelah save (sesuai §7.15 plan) jika belum diterapkan.
- [ ] Pastikan **semua key** di form sama dengan referensi / `DEFAULTS` di `SettingsService`.

---

## Guide (`guide.js`, `project-guide.js`)

- [x] Struktur panduan: daftar isi + bab selaras referensi (SIMPRO / Next); detail teknis stack referensi (Firebase, dll.) tidak disalin.

---

## Gantt (`gantt.js` ↔ `/projects/[id]/gantt`)

SIMPRO saat ini: `gantt-task-react` + `next/dynamic`, drag/resize → `PATCH /tasks/:id` (`startDate`/`dueDate`), `forGantt=1` hingga 2000 tugas, panah dependensi dari `TaskDependency`, mode Hari/Minggu/Bulan, viewer/client read-only.

**Gap vs referensi (canvas + DOM TRACKLY):**

- [ ] **Export PNG** — referensi: tombol “Export PNG” dari canvas; SIMPRO belum punya ekspor gambar/PDF Gantt.
- [x] **Filter sprint** — referensi: *All sprints* / *No sprint* / sprint tertentu; SIMPRO mendukung filter berdasarkan `sprintId`.
- [x] **Tombol / scroll “Today”** — referensi: scroll timeline ke hari ini + garis “TODAY” kentara.
- [x] **Legenda** — referensi: Task / Overdue / Done (+ garis today).
- [ ] **Milestone** — referensi mem-render `gantt-milestone` untuk tipe tertentu; SIMPRO hanya memetakan tugas sebagai bar `type: "task"` (cek apakah model `Task.type` perlu dipetakan ke milestone di library).
- [ ] **Penyaringan tugas tanpa tanggal** — referensi: hanya tugas dengan `start_date` atau `due_date`; SIMPRO memakai fallback `createdAt` sehingga tugas tanpa jadwal tetap muncul — putuskan apakah ingin sama dengan referensi atau tetap seperti sekarang (dokumentasikan keputusan).
- [ ] **Zoom / kalender** — referensi punya shading **weekend** pada zoom *day*; `gantt-task-react` bisa mode *Hour / Quarter / Year* — belum diexpose di UI jika ingin parity lebih dekat.
- [ ] **Header proyek / tab** — referensi memakai `buildProjectBanner` + konteks proyek kaya; halaman Gantt SIMPRO masih judul sederhana (nav tab ada di overview proyek, bukan di setiap sub-route — opsional diseragamkan).
- [ ] **`onProgressChange`** — geser progress di batang → update progress/status (opsional; §7.7 utama adalah tanggal).

**Gap teknis / skala:**

- [ ] Proyek dengan **> 2000 tugas**: pagination atau endpoint Gantt khusus (stream/aggregate), bukan hanya naikkan batas `take`.
- [ ] **Semantik tanggal** (zona waktu / hari terakhir inklusif): uji manual bila ada off-by-one dibanding perilaku referensi.

---

## Cross-cutting (Phase 7 umum, terkait Phase 5 & 6)

- [ ] Toast sukses/error untuk semua mutasi (plan §Phase 7).
- [ ] Konfirmasi untuk semua aksi destruktif (plan §Phase 7).
- [ ] **Mobile / bottom nav** selaras referensi (plan §Phase 7).
- [ ] Verifikasi **role-gate** setiap halaman sama perilaku referensi (viewer/client vs pm/admin vs developer).

---

## Sumber cepat

| SIMPRO | Referensi TRACKLY |
|--------|-------------------|
| `frontend/.../projects/[id]/discussion/` | `_reference/js/modules/discussion.js` |
| `frontend/.../notifications/`, `NotificationBell.tsx` | `_reference/js/modules/notifications.js`, `components/topbar.js` |
| `frontend/.../notes/` | `_reference/js/modules/notes.js` |
| `frontend/.../members/` | `_reference/js/modules/members.js` |
| `frontend/.../clients/`, `assets/` | `_reference/js/modules/clients.js`, `assets.js` |
| `frontend/.../settings/` | `_reference/js/modules/settings.js` |
| `frontend/.../projects/[id]/gantt/`, `components/features/gantt/ProjectGanttChart.tsx` | `_reference/js/modules/gantt.js` |

Gunakan dokumen ini sebagai **satu checklist Phase 7** bersama item “Verify 1:1 feature parity” di `implementation-plan.md`.
