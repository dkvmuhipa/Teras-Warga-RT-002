import logging
import re
from datetime import datetime, timedelta
from app.config import settings

logger = logging.getLogger("gemini")

_ai_client = None

def get_ai_client():
    global _ai_client
    if not _ai_client and settings.GEMINI_API_KEY:
        try:
            from google import genai
            _ai_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        except Exception as e:
            logger.warning(f"Could not initialize Google GenAI Client: {e}")
    return _ai_client

def extract_block(text: str, header: str, next_header: str) -> str:
    lower_text = text.lower()
    start_idx = lower_text.find(header.lower())
    if start_idx == -1:
        return ""
    content_start = start_idx + len(header)
    end_idx = lower_text.find(next_header.lower(), content_start)
    if end_idx == -1:
        return text[content_start:].strip()
    return text[content_start:end_idx].strip()

# --- Fallback Generators ---

def get_fallback_announcement_draft(topic: str, tone: str = "Formal") -> str:
    is_formal = tone.lower() == "formal"
    if is_formal:
        return f"""PENGUMUMAN WARGA RT 02/020

Kepada Yth. Seluruh Warga RT 02/020
Di tempat

Salam sejahtera,

Sehubungan dengan hal/kegiatan "{topic}", kami selaku pengurus RT 02 mengundang Bapak/Ibu sekalian untuk berpartisipasi aktif dalam menyukseskan hal tersebut.

Detail Pelaksanaan:
Waktu: Menyesuaikan pengumuman resmi berikutnya
Tempat: Lingkungan RT 02 Huntap Tondo

Demikian pengumuman ini kami sampaikan. Atas perhatian, dukungan, dan kerja sama Bapak/Ibu sekalian, kami luhurkan ucapan terima kasih banyak.

Salam hormat,
Pengurus RT 02/020"""
    else:
        return f"""Halo warga RT 02 yang rukun dan ramah!

Ada info penting nih mengenai "{topic}". Yuk kita sama-sama bicarakan, sukseskan, dan laksanakan kegiatan ini demi kenyamanan lingkungan kita tercinta bersama.

Untuk informasi operasional lebih rinci atau saran praktis silakan langsung hubungi jajaran pengurus RT ya. Tetap jaga kebersihan, kerukunan, dan kekompakan kita bersama!

Terima kasih banyak atas perhatiannya, warga!

Salam hangat,
Pengurus RT 02"""

def get_fallback_reports_analysis(reports: list[str]) -> str:
    if not reports:
        return "Status Lingkungan: Sangat kondusif. Tidak ada laporan permasalahan aktif warga pada minggu ini."
    parsed = [r.lower() for r in reports]
    issues = []
    
    waste_count = sum(1 for p in parsed if any(k in p for k in ['sampah', 'kotor', 'limbah', 'bau']))
    water_count = sum(1 for p in parsed if any(k in p for k in ['air', 'ledeng', 'bocor', 'pdam']))
    sec_count = sum(1 for p in parsed if any(k in p for k in ['aman', 'maling', 'hilang', 'ronda', 'curi']))
    light_count = sum(1 for p in parsed if any(k in p for k in ['lampu', 'gelap', 'listrik', 'padam']))
    
    if waste_count > 0:
        issues.append(f"Sektor kebersihan ({waste_count} laporan terkait sampah/limbah): Jadwal pengangkutan sampah perlu dikoordinasikan ulang dengan petugas draf.")
    if water_count > 0:
        issues.append(f"Sektor utilitas air ({water_count} keluhan air bersih atau kebocoran): Dibutuhkan koordinasi cepat teknisi air untuk penelusuran pipa tersumbat.")
    if sec_count > 0:
        issues.append(f"Sektor kamtibmas ({sec_count} masukan keamanan): Patroli pos ronda dimalam hari perlu diaktifkan kembali sesuai jadwal regu.")
    if light_count > 0:
        issues.append(f"Sektor sarana umum ({light_count} laporan lampu fasilitas padam): Perlu pengadaan lampu jalan baru secara swadaya warga.")
    if not issues:
        issues.append(f"Sektor administrasi & umum ({len(reports)} keluhan terdaftar): Warga mengadukan beberapa isu lingkungan minor yang membutuhkan respon pengurus RT.")
        
    issues.append("Rekomendasi Utama: Diperlukan rembuk warga atau koordinasi terbatas pengurus pada akhir pekan untuk menentukan skala prioritas tindakan lapangan.")
    return "\n".join([f"{idx+1}. {it}" for idx, it in enumerate(issues[:3])])

def get_fallback_dashboard_summary(data: dict) -> str:
    cash_val = data.get("cashBalance", 0) or 0
    health_fin = "Aman & Baik" if cash_val >= 500000 else "Waspada Rencana Anggaran (Kas menipis)"
    rep_count = data.get("reportsCount", 0) or 0
    keresahan = "Tinggi (Membutuhkan respon tanggap cepat)" if rep_count > 3 else ("Sedang (Warga tertib mengadu)" if rep_count > 0 else "Rendah (Sangat damai)")
    
    return f"""Berikut adalah analisis data realtime dashboard RT 02:

1. Status Kesehatan Keuangan: {health_fin}. Saldo kas tercatat sebesar Rp {cash_val:,.0f}. Sangat dianjurkan mempercepat penagihan iuran warga terdaftar demi operasional berkala tanpa hambatan.

2. Tingkat Keresahan Warga: {keresahan}. Terdata ada sebanyak {rep_count} laporan warga baru yang menantikan penanganan proaktif oleh jajaran pengurus RT.

3. Analisis Kelompok Rentan: Terdata sebanyak {data.get('babyCount', 0)} Bayi, {data.get('toddlerCount', 0)} Balita, {data.get('pregnantCount', 0)} Ibu Hamil, {data.get('elderlyCount', 0)} Lansia, dan {data.get('widowCount', 0)} Janda yang terdaftar aktif. Lingkungan aman, namun disarankan pengurus memantau kesehatan preventif berkala.

4. Rekomendasi Aksi Prioritas: Pengurus RT disarankan melakukan komunikasi silaturahmi kekeluargaan langsung ke warga yang terdata memiliki tagihan iuran outstanding ({data.get('unpaidCount', 0)} Kepala Keluarga) sekaligus mengumpulkan keluhan pos rondanya secara persuasif."""

def get_fallback_rit_answer(question: str, system_instruction: str) -> str:
    q = question.lower()
    days_map = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
    
    has_greeting = any(k in q for k in ['halo', 'hallo', 'hai', 'pa kabar', 'apa kabar', 'gimana kabar', 'assalamualaikum', 'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam'])
    has_ai_check = any(k in q for k in ['berfungsi', 'aktif', 'berbincang', 'ngobrol', 'bisa jawab', 'bisa apa', 'kamu siapa', 'siapa kamu', 'asisten', 'rit'])
    
    if has_greeting or (has_ai_check and not any(k in q for k in ['ronda', 'iuran', 'kas', 'sensus', 'penduduk', 'warga'])):
        return """🤖 *Ya, saya aktif dan berfungsi penuh mendampingi warga RT 02!*

Halo! Saya **Rit**, Asisten Cerdas virtual untuk aplikasi **TERAS RT 02**. Saya siap menyapa, mengobrol, serta memandu Bapak/Ibu sekalian mengenai informasi lingkungan hunian kita.

*Bagaimana Cara Kerja Saya?*
1. **Mode AI Cerdas (Default):** Selama kunci API aktif, saya akan menggunakan kemampuan kecerdasan buatan Gemini untuk mengobrol luwes mengenai berbagai topik umum secara kontekstual.
2. **Mesin Sensus Lokal (Resilien):** Jika AI sedang berada dalam mode cadangan/hemat daya, saya tidak akan kaku! Saya dibekali kecerdasan membaca data database real-time RT 02 sehingga Bapak/Ibu bisa menanyakan informasi persis seperti:
   - 📊 **Sensus Penduduk:** *"Berapa jumlah warga?"*, *"Berapa data balita?"*, *"Kas RT"* atau *"Statistik lansia"*.
   - 👮 **Jadwal Ronda:** *"Siapa petugas ronda hari ini?"* atau *"Apakah Budi ronda minggu ini?"*.
   - 📞 **Kontak Pengurus:** *"Nomor telepon Ketua RT"* atau *"Siapa bendahara kita?"*.
   - 📋 **Administrasi:** *"Surat pengantar RT"* atau *"Jadwal angkutan sampah"*.

Silakan sapa saya kembali atau ajukan pertanyaan spesifik kependudukan di atas. Saya siap melayani dengan rukun dan harmonis! 😊✨"""

    if any(k in q for k in ['jumlah warga', 'jumlah penduduk', 'jumlah jiwa', 'berapa jiwa', 'berapa warga', 'data janda', 'data balita', 'data bayi', 'data lansia', 'data ibu hamil', 'jumlah kk', 'berapa kk', 'berapa kepala keluarga', 'jumlah kepala keluarga', 'data sensus', 'statistik', 'demografi', 'jumlah rumah', 'berapa rumah', 'kas rt', 'saldo', 'keuangan rt', 'balita', 'bayi', 'lansia', 'ibu hamil', 'janda', 'duda']):
        census_block = extract_block(system_instruction, "DATA SENSUS & KEUANGAN RT 02 (DARI DATA LIVE):", "DATA PENGUMUMAN TERBARU")
        if census_block:
            return f"""📊 *Data Sensus & Statistik RT 02/020 Real-Time:*

Berikut adalah rangkuman sensus penduduk dan informasi keuangan resmi lingkungan kita berdasarkan data aktif aplikasi TERAS RT 02:

{census_block}

*Informasi ini diperbarui secara otomatis setiap kali ada pergeseran/pemutakhiran data kependudukan dan kas RT oleh Pengurus.*"""

    if any(k in q for k in ['ketua rt', 'pimpinan', 'nama ketua', 'kepala rt']):
        m = re.search(r'Ketua RT:\s*(.+?)\s*\(', system_instruction, re.IGNORECASE)
        rt_name = m.group(1).strip() if m else "Pak RT"
        return f"""👑 *Ketua RT 02 RW 020:*

Ketua RT saat ini adalah Bapak **{rt_name}**. Anda dapat berkunjung langsung ke kediaman beliau atau Kantor Sekretariat RT untuk keperluan konsultasi warga atau tanda tangan pengesahan dokumen penting lainnya."""

    clean_officials = extract_block(system_instruction, "STRUKTUR PENGURUS RT SAAT INI:", "INFORMASI UMUM")
    words_list = re.findall(r'[a-zA-Z0-9]+', q)
    has_contact = any(k in q for k in ['kontak', 'pengurus', 'nomor', 'no hp', 'telepon', 'sekretaris', 'bendahara', 'keamanan', 'whatsapp']) or 'wa' in words_list or 'hp' in words_list
    
    if clean_officials and has_contact:
        lines = clean_officials.split('\n')
        uq = q.strip()
        matched = None
        for line in lines:
            ll = line.lower()
            if ('sekretaris' in uq and 'sekretaris' in ll) or ('bendahara' in uq and 'bendahara' in ll) or ('keamanan' in uq and 'keamanan' in ll) or ('ketua rt' in uq and 'ketua rt' in ll):
                matched = line
                break
            np = re.search(r':\s*(.+?)\s*\(', line)
            if np:
                cname = re.sub(r'bapak|ibu|pak|bu', '', np.group(1), flags=re.IGNORECASE).strip().lower()
                if cname and len(cname) > 2 and cname in uq:
                    matched = line
                    break
        if matched:
            return f"""📞 *Informasi Pengurus RT 02:*

Berikut adalah informasi pengurus yang cocok dengan pertanyaan Anda:
{matched.strip()}

*Silakan hubungi kontak di atas pada waktu yang wajar demi kenyamanan bersama.*"""
        return f"""📞 *Daftar Kontak Pengurus RT 02/020:*

Berikut adalah daftar nama pengurus RT aktif yang dapat Anda hubungi untuk koordinasi berbagai kegiatan lingkungan:
{clean_officials}

*Silakan hubungi kontak di atas pada waktu yang wajar demi kenyamanan bersama.*"""

    if any(k in q for k in ['ronda', 'poskamling', 'kamling', 'jaga', 'jadwal ronda']):
        sched = extract_block(system_instruction, "JADWAL RONDA MINGGUAN:", "STRUKTUR PENGURUS")
        lines = sched.split('\n')
        
        words = q.split()
        matched_res_line = None
        searched_name = ""
        for line in lines:
            ll = line.lower()
            for w in words:
                cw = re.sub(r'[^a-zA-Z0-9]', '', w).lower()
                if len(cw) > 2 and cw not in ['ronda', 'jadwal', 'malam', 'siapa', 'hari', 'ini', 'besok', 'kapan', 'untuk', 'yang', 'pada', 'buat', 'siapakah']:
                    if cw in ll:
                        matched_res_line = line
                        searched_name = w
                        break
            if matched_res_line:
                break
                
        if matched_res_line:
            parts = matched_res_line.split(':')
            dpart = re.sub(r'[-*\s]', '', parts[0]).capitalize()
            mpart = parts[1].strip() if len(parts) > 1 else ""
            return f"""👮 *Hasil Pencarian Jadwal Ronda:*

Warga dengan nama **{searched_name.capitalize()}** dijadwalkan bertugas ronda pada hari **{dpart}** bersama rekan satu regu:
👉 **{mpart}**

*Terima kasih atas kepedulian bersama dalam mengawal keamanan warga!*"""

        spec_day = next((d for d in days_map if d in q), None)
        if not spec_day:
            now_dt = datetime.now()
            if 'hari ini' in q or 'sekarang' in q:
                spec_day = days_map[now_dt.weekday() + 1 if now_dt.weekday() < 6 else 0]
            elif 'besok' in q:
                td_dt = now_dt + timedelta(days=1)
                spec_day = days_map[td_dt.weekday() + 1 if td_dt.weekday() < 6 else 0]
        if spec_day:
            dline = next((l for l in lines if spec_day in l.lower()), None)
            if dline:
                return f"""👮 *Jadwal Ronda Malam - Hari {spec_day.capitalize()}:*

Petugas ronda malam yang dijadwalkan bertugas pada hari **{spec_day.capitalize()}** adalah:
👉 **{re.sub(r'-\s*\w+:\s*', '', dline, flags=re.IGNORECASE).strip()}**

*Terima kasih atas kepedulian dan partisipasi aktif Bapak/Ibu dalam menjaga kedisiplinan ronda demi kebaikan lingkungan kita!*"""

        return f"""👮 *Susunan Jadwal Ronda Malam Mingguan RT 02:*

{sched or "- Giliran ronda bergantian di pos ronda keamanan"}

*Bagi warga yang berhalangan hadir pada jadwal ronda yang ditentukan, harap segera berkoordinasi kepada koordinator keamanan RT.*"""

    if any(k in q for k in ['iuran', 'bayar', 'biaya', 'tunggakan', 'tarif', 'jumlah iuran', 'kas']):
        return """💰 *Informasi Iuran Lingkungan RT 02:*

- **Retribusi Sampah TPS3R:** Berjenjang sesuai kategori hunian (Umum: Rp 20.000, PKH: Rp 10.000, PNS/ASN: Rp 35.000).
- **Fasilitas Air Bersih:** Dikelola langsung secara mandiri melalui PDAM Kota Palu dengan sistem pencatatan meter.
- **Metode Pembayaran Kas RT:** Dibayarkan secara tunai langsung kepada **Bendahara RT 02** di Sekretariat / Pos Ronda RT 002."""

    if any(k in q for k in ['sampah', 'bersih', 'kotor', 'angkut']):
        return """🗑️ *Jadwal Pengangkutan Sampah Warga:*

- **Hari Pengangkut:** Setiap hari **Senin** dan **Kamis pagi** hari.
- **Instruksi Kebersihan:** Mohon mengumpulkan kantong/bak sampah secara tertutup rapi di depan pagar rumah masing-masing sebelum jadwal mobil angkutan lewat agar mempercepat proses pengangkutan petugas kebersihan."""

    if any(k in q for k in ['surat', 'pengantar', 'pengurusan', 'syarat']):
        return """📋 *Syarat Pengurusan Surat Pengantar RT:*

Bagi warga yang membutuhkan berkas pengantar dari RT, mohon melengkapi berkas syarat berikut:
1. Membawa **KTP Asli** warga bersangkutan.
2. Membawa **Kartu Keluarga (KK) Asli**.
3. **Melunasi iuran warga** wajib bulan berjalan.

📍 **Prosedur Pengurusan:**
Silakan berkunjung langsung ke **Kantor Sekretariat RT 02** setiap hari **Senin s/d Jumat** dari pukul **19.00 - 21.00 WITA**."""

    if any(k in q for k in ['sekretariat', 'lokasi', 'alamat', 'kantor', 'jam buka']):
        return """🏢 *Layanan Sekretariat RT 02:*

- **Lokasi Kantor:** Terletak di kawasan **Huntap Tondo 2**, Kelurahan Tondo, Kecamatan Mantikulore, Kota Palu (berdampingan langsung dengan kediaman Ketua RT 02).
- **Layanan Administrasi:** Setiap hari kerja **Senin s/d Jumat** pukul **19.00 - 21.00 WITA**."""

    if any(k in q for k in ['pengumuman', 'agenda', 'info terpilih', 'berita']):
        clean_ann = extract_block(system_instruction, "DATA PENGUMUMAN TERBARU:", "JADWAL RONDA")
        return f"""📢 *Pengumuman & Agenda Warga Terbaru:*

{clean_ann or "Belum ada pengumuman kegiatan baru minggu ini."}"""

    return """🤖 *Halo! Saya Rit, Asisten Virtual Cerdas RT 02.*

Ada yang bisa saya bantu carikan informasinya? Cobalah tanyakan hal penting berikut ini:
- **Jadwal ronda malam** hari ini atau esok hari (misal: "siapa ronda hari ini?" atau "budi ronda hari apa?")
- **Syarat berkas** pengurusan Surat Pengantar RT
- **Nominal iuran bulanan** & pemanfaatan kas
- **Nomor kontak Pengurus RT** aktif (misal: "nomor bendahara" atau "nomor ketua rt")
- **Jadwal pengangkutan sampah** lingkungan"""

def get_fallback_broadcast_draft(topic: str, broadcast_type: str, tone: str = "Formal", data_context: dict = None) -> str:
    data_context = data_context or {}
    if broadcast_type == "billing":
        total_amount = float(data_context.get("totalAmount", 0) or 0)
        return f"""📢 *PENGINGAT KEKELUARGAAN: IURAN BULANAN RT 02*

Yth. Bapak/Ibu *{data_context.get('headOfFamily', 'Warga RT 02')}*
Pondok/Rumah Blok *{data_context.get('block', '')}/{data_context.get('number', '')}*

Semoga Bapak/Ibu sekeluarga senantiasa sehat walafiat.

Kami pengurus RT 02 ingin menyampaikan pemberitahuan iuran bulanan untuk kelancaran pelayanan keamanan dan kebersihan lingkungan kita bersama.

Rincian Kewajiban:
- *Tunggakan Periode:* {data_context.get('unpaidMonths', 'Bulan berjalan')}
- *Rincian:* {data_context.get('itemsDetail', 'Iuran rutin bulanan')}
- *Total Tunggakan:* *Rp {total_amount:,.0f}*

💵 Pembayaran dapat diserahkan langsung secara tunai ke Bendahara RT 002 (Pos Ronda/Rumah Bendahara). Bukti kwitansi resmi berformat PDF akan langsung diterbitkan.

Mari bersama kita kuatkan silaturahmi dan ketertiban lingkungan demi kedaulatan RT 02 yang harmonis. Atas partisipasi nyata Bapak/Ibu, kami ucapkan terima kasih banyak.

Salam rukun warga,
*Pengurus RT 02/020 Huntap Tondo*"""
    else:
        return f"""📢 *SIARAN INFORMASI WARGA RT 02*

Warga RT 02 yang senantiasa rukun dan damai.

Sehubungan dengan agenda lingkungan kita mengenai *"{topic}"*, kami mengharap kehadiran serta partisipasi proaktif Bapak/Ibu sekalian untuk mendukung kelancaran program tersebut.

🗓️ Detail koordinasi teknis, waktu pelaksanaan, serta tanya jawab dapat dilakukan langsung melalui Sekretariat RT atau menghubungi nomor layanan Pengurus RT.

Terima kasih atas kepedulian, silaturahmi, dan guyub rukun yang senantiasa mekar di lingkungan kita!

Salam hangat rukun warga,
*Pengurus RT 02/020 Huntap Tondo*"""

# --- Main Gemini Service Functions ---

async def generate_announcement_draft(topic: str, tone: str = "Formal") -> str:
    client = get_ai_client()
    if client:
        try:
            prompt = f"""Buatkan draf pengumuman untuk warga RT (Rukun Tetangga) dengan topik: "{topic}".
Gaya bahasa: {tone or 'Formal'}.
Struktur: Judul menarik, Salam pembuka, Isi pengumuman (singkat & jelas), Detail (Waktu/Tempat jika perlu), Salam penutup.
Format: Plain text. DILARANG menggunakan karakter asterik (*) atau format bold/italic. Bahasa Indonesia yang baik dan benar."""
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            if response and response.text:
                return response.text
        except Exception as e:
            logger.warning(f"[Announcement Draft] Gemini API failed: {e}. Serving fallback.")
    return get_fallback_announcement_draft(topic, tone)

async def analyze_reports(reports: list[str]) -> str:
    client = get_ai_client()
    if client:
        try:
            prompt = f"""Berikut adalah daftar laporan warga minggu ini:
{chr(10).join([f'- {r}' for r in reports])}

Berikan ringkasan eksekutif singkat (maksimal 3 poin) mengenai isu utama yang perlu ditangani oleh Ketua RT. DILARANG menggunakan karakter asterik (*) atau format bold/italic."""
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            if response and response.text:
                return response.text
        except Exception as e:
            logger.warning(f"[Analyze Reports] Gemini API failed: {e}. Serving fallback.")
    return get_fallback_reports_analysis(reports)

async def generate_dashboard_summary(data: dict) -> str:
    client = get_ai_client()
    if client:
        try:
            prompt = f"""Bertindaklah sebagai Konsultan Manajemen Lingkungan profesional untuk Ketua RT.
Analisis data realtime dashboard RT 02 berikut:
- Jumlah Penduduk: {data.get('totalResidents', 0)} jiwa
- Kas Keuangan: Rp {float(data.get('cashBalance', 0) or 0):,.0f}
- Laporan Masalah Baru (Aktif): {data.get('reportsCount', 0)}
- Warga Menunggak Iuran: {data.get('unpaidCount', 0)} KK
- Kelompok Rentan: {data.get('babyCount', 0)} Bayi, {data.get('toddlerCount', 0)} Balita, {data.get('pregnantCount', 0)} Ibu Hamil, {data.get('elderlyCount', 0)} Lansia, {data.get('widowCount', 0)} Janda

Berikan laporan singkat dan padat (maksimal 150 kata) yang mencakup:
1. 💰 Status Kesehatan Keuangan (Aman/Waspada)
2. 🛡️ Tingkat Keresahan Warga (berdasarkan jumlah laporan)
3. 👶 Analisis Kelompok Rentan (apakah perlu perhatian khusus minggu ini)
4. 💡 Satu rekomendasi aksi prioritas untuk pengurus RT minggu ini.

Format output menggunakan daftar poin (list) agar mudah dibaca. DILARANG menggunakan karakter asterik (*) atau format bold/italic. Gunakan bahasa Indonesia yang formal, solutif, dan menyemangati."""
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            if response and response.text:
                return response.text
        except Exception as e:
            logger.warning(f"[Dashboard Summary] Gemini API failed: {e}. Serving fallback.")
    return get_fallback_dashboard_summary(data)

async def ask_rit(question: str, system_instruction: str = "") -> str:
    client = get_ai_client()
    if client:
        try:
            from google.genai import types
            config = types.GenerateContentConfig(system_instruction=system_instruction) if system_instruction else None
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=question,
                config=config,
            )
            if response and response.text:
                return response.text
        except Exception as e:
            logger.warning(f"[Ask Rit] Gemini API failed: {e}. Serving fallback.")
    return get_fallback_rit_answer(question, system_instruction)

async def generate_broadcast(topic: str, broadcast_type: str, tone: str = "Formal", data_context: dict = None) -> str:
    client = get_ai_client()
    if client:
        try:
            data_context = data_context or {}
            if broadcast_type == 'billing':
                total_amount = float(data_context.get('totalAmount', 0) or 0)
                prompt = f"""Buatkan draf pengingat tagihan iuran Rukun Tetangga (RT 02) terpersonalisasi untuk warga dengan data berikut:
Nama Warga: {data_context.get('headOfFamily', '')}
Blok/No: {data_context.get('block', '')}/{data_context.get('number', '')}
Tunggakan Periode: {data_context.get('unpaidMonths', '')}
Total Tunggakan: Rp {total_amount:,.0f}
Rincian tunggakan: {data_context.get('itemsDetail', 'Iuran rutin')}
Metode Pembayaran: Tunai langsung ke Bendahara RT 002 (Kwitansi Resmi PDF terbit)

Gaya bahasa/Suasana: {tone or 'Formal'}
Format: Teks siap kirim di WhatsApp. DILARANG menggunakan karakter double asterik (**) atau format Markdown berat. Gunakan bullet points, baris baru, dan susunan emoji yang sopan, ramah, tertata rapi, dan meyakinkan agar warga segera melunasi iurannya secara proaktif."""
            else:
                prompt = f"""Buatkan draf pengumuman/siaran WhatsApp untuk warga RT (Rukun Tetangga) dengan topik: "{topic}".
Gaya bahasa/Suasana: {tone or 'Formal'}
Struktur: Judul menarik dilengkapi emoji, Salam pembuka hangat, Isi pengumuman (jelas, singkat, & padat), Rincian detail info pelaksanaan (Waktu/Tempat jika relevan), Salam penutup, dan ajakan kerja sama yang harmonis.
Format: Teks siap dikirim di WhatsApp dengan susunan emoji yang rukun, rapi, dan terstruktur. DILARANG menggunakan karakter asterisk (*) secara ganda (**) atau format Markdown berat yang merusak keterbacaan pesan di HP."""
            
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            if response and response.text:
                return response.text
        except Exception as e:
            logger.warning(f"[Generate Broadcast] Gemini API failed: {e}. Serving fallback.")
    return get_fallback_broadcast_draft(topic, broadcast_type, tone, data_context)

def get_fallback_fleet_summary(data: dict) -> str:
    total_tenants = data.get("totalTenants", 0)
    total_doors = data.get("totalDoors", 0)
    total_pop = data.get("totalPopulation", 0)
    total_balance = float(data.get("totalFleetBalance", 0) or 0)
    avg_compliance = data.get("averageCompliance", 0)
    active_issues = data.get("activeReportsCount", 0)
    
    health_status = "Kuat & Sehat" if avg_compliance >= 80 and total_balance >= 1000000 else "Waspada / Perlu Pembinaan"

    return f"""📊 LAPORAN EKSEKUTIF CIVIC COMMAND CENTER (MULTI-RT)

1. 🏛️ Cakupan Wilayah & Demografi:
   - Total RT Terkelola: {total_tenants} RT
   - Jumlah Pintu Terdaftar: {total_doors} unit rumah
   - Estimasi Populasi Terlindungi: {total_pop} jiwa

2. 💰 Kesehatan Fiskal Kas Armada:
   - Total Akumulasi Kas Gabungan: Rp {total_balance:,.0f}
   - Rata-rata Kepatuhan Iuran: {avg_compliance}% ({health_status})

3. 🛡️ Ketenteraman & Pelayanan Lingkungan:
   - Laporan Masalah Aktif: {active_issues} keluhan
   - Siskamling Digital: Berjalan optimal dengan monitoring pos ronda real-time.

4. 💡 Rekomendasi Kebijakan untuk Pimpinan (Lurah/Camat):
   - Lakukan supervisi persuasif pada RT dengan tingkat tunggakan iuran di atas 25%.
   - Berikan apresiasi piagam ketaatan lingkungan bagi RT dengan kepatuhan di atas 90%."""

async def generate_fleet_summary(data: dict) -> str:
    client = get_ai_client()
    if client:
        try:
            prompt = f"""Bertindaklah sebagai Konsultan Tata Kelola Pemerintahan Daerah & Civic Intelligence untuk Lurah dan Camat.
Analisis data agregat armada RT (Multi-Tenant Teras Warga) berikut:
- Total RT Terdaftar: {data.get('totalTenants', 0)} RT
- Total Rumah/Pintu: {data.get('totalDoors', 0)} unit
- Populasi Terlindungi: {data.get('totalPopulation', 0)} jiwa
- Total Saldo Kas Seluruh RT: Rp {float(data.get('totalFleetBalance', 0) or 0):,.0f}
- Rata-rata Kepatuhan Iuran: {data.get('averageCompliance', 0)}%
- Laporan Warga Aktif: {data.get('activeReportsCount', 0)}
- Rincian RT: {data.get('tenantSummaries', 'Tidak ada data')}

Buatkan ringkasan eksekutif kepemimpinan wilayah (maksimal 200 kata) mencakup:
1. 🏛️ Status Kesiapsiagaan & Kepatuhan Armada RT
2. 💰 Analisis Ketahanan Fiskal Kas Lingkungan
3. ⚠️ Peringatan Dini / Deteksi Anomali Lingkungan
4. 🚀 2 Rekomendasi Tindakan Nyata Prioritas Minggu Ini.

Format output rapi dengan bullet points dan emoji yang representatif. DILARANG menggunakan karakter asterisk ganda (**) berlebih."""
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            if response and response.text:
                return response.text
        except Exception as e:
            logger.warning(f"[Fleet Summary] Gemini API failed: {e}. Serving fallback.")
    return get_fallback_fleet_summary(data)

