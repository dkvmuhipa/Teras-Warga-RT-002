import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Plus, Star, MessageSquare, Bookmark, FileText, Check, Clock, 
  ArrowLeft, Heart, Filter, Trash2, CheckCircle2, XCircle, ChevronRight, Share2, Award, BookMarked, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, BookExchangeRequest } from '../../types';
import { 
  subscribeToBooks, subscribeToBookRequests, addBook, updateBook, deleteBook, 
  addBookRequest, updateBookRequest 
} from '../../services/databaseService';

export const PublicLibrary: React.FC = () => {
  // State
  const [books, setBooks] = useState<Book[]>([]);
  const [requests, setRequests] = useState<BookExchangeRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedType, setSelectedType] = useState('Semua'); // 'Semua' | 'Fisik' | 'Digital'
  const [activeTab, setActiveTab] = useState<'katalog' | 'permintaan' | 'kontribusi'>('katalog');
  
  // Selected Book for Detail Modal
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReaderModal, setShowReaderModal] = useState(false);
  
  // Form States
  const [borrowNotes, setBorrowNotes] = useState('');
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  
  // Contribution Form State
  const [contribForm, setContribForm] = useState({
    title: '',
    author: '',
    category: 'Novel & Fiksi',
    synopsis: '',
    status: 'Tersedia' as 'Tersedia' | 'Digital Only',
    digitalUrl: '',
    coverColor: 'bg-indigo-600',
  });

  // Current Resident Info from LocalStorage (fallbacks provided)
  const currentResidentName = localStorage.getItem('resident_name') || 'Warga RT 02';
  const currentHouseId = localStorage.getItem('resident_house_id') || 'Blok Utama';
  const currentResidentPhone = localStorage.getItem('resident_phone') || '081234567890';

  // Categories
  const categories = ['Semua', 'Novel & Fiksi', 'Non-Fiksi', 'Anak-Anak', 'Agama & Spiritual', 'Sains & Teknologi', 'Pengembangan Diri'];
  const coverColors = [
    { name: 'Indigo Deep', class: 'bg-indigo-700' },
    { name: 'Emerald Forest', class: 'bg-emerald-700' },
    { name: 'Rose Petal', class: 'bg-rose-700' },
    { name: 'Amber Glow', class: 'bg-amber-700' },
    { name: 'Sky Calm', class: 'bg-sky-700' },
    { name: 'Violet Royal', class: 'bg-violet-700' },
    { name: 'Slate Modern', class: 'bg-slate-700' }
  ];

  // Seed data if empty
  const defaultBooks: Omit<Book, 'id'>[] = [
    {
      title: 'Buka Mata Terbaca: Panduan Kesiapsiagaan Gempa & Bencana Palu',
      author: 'Tim Mitigasi & IT RT 02',
      category: 'Sains & Teknologi',
      synopsis: 'Buku saku digital mitigasi bencana alam gempa bumi & likuefaksi khusus kawasan Palu - Huntap Tondo. Berisi panduan evakuasi 10 detik pertama, jalur evakuasi aman RT 02, tas siaga bencana, dan pertolongan pertama.',
      status: 'Digital Only',
      ownerName: 'Tim Mitigasi RT 02',
      coverUrl: 'bg-rose-700',
      digitalUrl: `# BUKU SAKU DIGITAL MITIGASI BENCANA RT 02 / RW 020\n\nSelamat membaca panduan kesiapsiagaan mandiri warga Huntap Tondo 2.\n\n---\n\n### BAB 1: KODE RESPON 10 DETIK PERTAMA GEMPA BUMI\n\nSaat terjadi guncangan gempa bumi di wilayah Palu dan sekitarnya:\n1. **DROP / MERUNDUK**: Segera merunduk dan lindungi kepala serta leher dengan kedua tangan atau tas.\n2. **COVER / BERLINDUNG**: Berlindung di bawah meja kayu/besi yang kuat. Jangan berlindung dekat kaca atau lemari tinggi.\n3. **HOLD ON / BERPEGANGAN**: Pegang kaki meja erat-erat hingga guncangan gempa selesai.\n\n---\n\n### BAB 2: EVAKUASI MANDIRI KE TITIK KUMPUL (EVACUATION POINT)\n\nSetelah guncangan berhenti:\n* Keluar rumah secara tenang, jangan berlari saling mendorong.\n* Hindari tiang listrik, pohon tinggi, dan tembok pembatas yang retak.\n* Segera berkumpul di **Titik Kumpul Area Terbuka Jalan Utama RT 02**.\n* Tim Satgas Siskamling RT akan melakukan pengecekan jumlah anggota keluarga berdasarkan Data Master Rumah.\n\n---\n\n### BAB 3: DAFTAR ISI TAS SIAGA BENCANA (TSB)\n\nSetiap rumah tangga RT 02 disarankan menyiapkan 1 Tas Siaga Bencana di dekat pintu keluar yang berisi:\n* Dokumen penting (Surat Tanah, Kartu Keluarga, Ijazah) dalam plastik kedap air.\n* Air minum kemasan (3 liter/orang) & Makanan siap saji tahan lama (biskuit/roti).\n* Kotak P3K standar (Kasa, Betadine, Obat Pribadi, Plester).\n* Senter LED, Baterai Cadangan, & Peluit Darurat.\n* Masker N95 & Pakaian ganti untuk 3 hari.\n\n---\n\n### KONTROL DARURAT BENCANA RT 02 PALU:\n* Pos Siskamling RT 02: +62 859-6119-4621\n* BPBD Kota Palu: (0451) 421-113\n* Basarnas Palu: 115 / (0451) 481-111`,
      rating: 5.0,
      createdAt: new Date().toISOString(),
      reviews: [
        { reviewerName: 'Pak RT 02', rating: 5, comment: 'Buku panduan ini wajib dibaca oleh seluruh warga baru & lama RT 02!', date: new Date().toISOString() }
      ]
    },
    {
      title: 'Panduan Siskamling & Keamanan Lingkungan Mandiri',
      author: 'Pengurus Keamanan RT 02',
      category: 'Non-Fiksi',
      synopsis: 'Buku acuan tata cara pelaksanaan siskamling, patroli malam, SOP penanganan pencurian, lapor tamu 24 jam, dan protokol tanggap darurat bahaya kebakaran di kawasan pemukiman RT 02.',
      status: 'Digital Only',
      ownerName: 'Sie Keamanan RT 02',
      coverUrl: 'bg-indigo-700',
      digitalUrl: `# PANDUAN SISKAMLING & KEAMANAN LINGKUNGAN MANDIRI RT 02\n\n### PENDAHULUAN\nSiskamling (Sistem Keamanan Lingkungan) RT 02 diselenggarakan secara bergiliran oleh warga demi menjamin ketenangan huni 24 jam.\n\n---\n\n### BAB 1: JAM OPERASIONAL & PATROLI SISKAMLING\n* **Shift 1**: Pukul 22.00 - 01.00 WITA (Patroli Jalur Blok A & B)\n* **Shift 2**: Pukul 01.00 - 04.30 WITA (Patroli Jalur Blok C, D, & E)\n* Petugas ronda wajib mengisi **Buku Absensi Digital Siskamling** di Pos Garda Utama.\n\n---\n\n### BAB 2: KODE KETUKAN KENTONGAN SISKAMLING\n1. **Ketukan 1-1-1**: Tanda Patroli Aman (Setiap Jam)\n2. **Ketukan 2-2-2**: Tanda Pencurian / Bahaya Kejahatan\n3. **Ketukan 3-3-3**: Tanda Keberadaan Kebakaran\n4. **Ketukan 4-4-4**: Tanda Bencana Alam / Gempa\n5. **Ketukan Continuous (Continuous Roll)**: Tanda Bahaya Darurat / Memanggil Seluruh Warga\n\n---\n\n### BAB 3: SOP PENANGANAN TAMU ASING & TIDAK DIKENAL\n* Bila menjumpai orang asing mencurigakan di atas pukul 23.00 WITA, sapa secara sopan:\n  > *"Selamat malam Pak/Bu, ada yang bisa kami bantu? Mohon maaf sedang mencari rumah siapa?"*\n* Apabila tamu menginap lebih dari 1x24 jam, ingatkan tuan rumah untuk mengisi formulir **Lapor Tamu Online** pada aplikasi TERAS RT 02.`,
      rating: 4.9,
      createdAt: new Date().toISOString()
    },
    {
      title: 'Manajemen Keuangan Rumah Tangga & Bisnis UMKM Warga',
      author: 'Tim Ekonomi & UMKM RT 02',
      category: 'Pengembangan Diri',
      synopsis: 'E-book praktis mengelola pos keuangan keluarga, metode pencatatan kas harian UMKM, pemasaran produk lokal di Pasar Warga Digital RT 02, dan strategi investasi aman.',
      status: 'Digital Only',
      ownerName: 'Pokja UMKM RT 02',
      coverUrl: 'bg-emerald-700',
      digitalUrl: `# MANAJEMEN KEUANGAN RUMAH TANGGA & BISNIS UMKM WARGA\n\n### METODE 50-30-20 KEUANGAN KELUARGA\n1. **50% Kebutuhan Pokok**: Beras, Lauk, Listrik, Air PBB, Iuran RT, & Kesehatan.\n2. **30% Keinginan & Rekreasi**: Belanja kebutuhan tersier & hiburan keluarga.\n3. **20% Tabungan & Dana Darurat**: Disimpan untuk kejadian tidak terduga atau modal usaha.\n\n---\n\n### CARA MENDAFTARKAN PRODUK DI PASAR WARGA RT 02\n1. Buka menu **Pasar Warga / UMKM** pada aplikasi TERAS RT 02.\n2. Klik **Daftarkan Produk UMKM Saya**.\n3. Masukkan foto produk yang bersih, harga, dan nomor WhatsApp pemesanan.\n4. Produk Anda akan otomatis tampil di katalog publik warga RT 02!`,
      rating: 4.8,
      createdAt: new Date().toISOString()
    },
    {
      title: 'Habis Gelap Terbitlah Terang (Letters of a Javanese Princess)',
      author: 'R.A. Kartini',
      category: 'Non-Fiksi',
      synopsis: 'Koleksi surat-surat bersejarah Raden Ajeng Kartini (Public Domain Naskah Resmi Perpustakaan Nasional & Open Access) yang memperjuangkan kesetaraan pendidikan, kemanusiaan, dan pemikiran berdikari perempuan Nusantara.',
      status: 'Digital Only',
      ownerName: 'Arsip Perpustakaan Nasional',
      coverUrl: 'bg-violet-700',
      digitalUrl: `# HABIS GELAP TERBITLAH TERANG\n## Kumpulan Surat-Surat Raden Ajeng Kartini (1899 - 1904)\n\n### SURAT 1: KEPADA ESTELLE H. ZEEHANDELAAR\n*Jepara, 25 Mei 1899*\n\nSaya telah lama mendambakan untuk berkenalan dengan seorang "gadis modern", gadis berdikari yang melangkah gagah berani di jalannya sendiri melalui kehidupan ini; gadis yang bekerja tidak hanya demi kesejahteraan dan kebahagiaannya sendiri, tetapi juga membanting tulang untuk kemanusiaan yang lebih luas.\n\nHati saya selalu menyala-nyala oleh semangat kemajuan. Kami, gadis-gadis Jawa, masih terikat pada adat lama yang kaku. Namun jiwa kami tidak pernah berhenti berbisik tentang indahnya kebebasan berpikir dan pendidikan yang merata untuk seluruh anak bangsa.\n\n---\n\n### SURAT 2: KEPADA NYONYA R.M. ABENDANON-MANDRI\n*Jepara, 27 Oktober 1902*\n\nBanyak orang berkata: "Setelah malam gelap berlalu, fajar terang pasti akan tiba." Saya percaya bahwa kegelapan kebodohan dan keterbelakangan tidak akan selamanya mengurung kita. Melalui buku, ilmu pengetahuan, dan rasa kasih sayang antar sesama warga, kita dapat membangun masyarakat yang berbudi pekerti luhur.\n\nJangan pernah patah semangat hanya karena rintangan kecil di depan mata. Pendidikan adalah kunci utama yang akan membuka pintu kemajuan bagi generasi penerus kita.`,
      rating: 5.0,
      createdAt: new Date().toISOString()
    },
    {
      title: 'Buku Saku Edukasi Sains & Lingkungan Hidup',
      author: 'Kementerian Pendidikan & Kebudayaan RI (BSE Open Access)',
      category: 'Sains & Teknologi',
      synopsis: 'E-Book Sekolah Elektronik (BSE) lisensi terbuka pemerintah untuk pembelajaran mandiri keluarga warga RT 02. Berisi dasar-dasar daur ulang sampah rumah tangga, pemanfaatan energi surya, dan ekologi lingkungan pemukiman.',
      status: 'Digital Only',
      ownerName: 'Kemdikbud RI / Perpusnas',
      coverUrl: 'bg-emerald-700',
      digitalUrl: `# PANDUAN SAINS LINGKUNGAN & DAUR ULANG SAMPAH RT\n\n### BAB 1: PEMISAHAN SAMPAH MANDIRI DARI DAPUR RUMAH\n1. **Sampah Organik (Hijau)**: Sisa sayuran, buah-buahan, & dedaunan. (Bahan baku kompos komposter RT).\n2. **Sampah Anorganik (Kuning)**: Botol plastik, kaleng bekas, & kardus. (Dapat disetorkan ke Bank Sampah RT).\n3. **Sampah B3 / Berbahaya (Merah)**: Baterai bekas, lampu neon, & kemasan obat-obatan.\n\n---\n\n### BAB 2: PEMBUATAN KOMPOS SEDERHANA DI PEKARANGAN\n* Sediakan wadah ember bekas yang dilubangi di bagian bawahnya.\n* Masukkan tanah humus sebagai lapisan pertama (5 cm).\n* Masukkan sisa sampah organik dapur yang sudah dicincang halus.\n* Siram sedikit air gula merah / larutan EM4 untuk mempercepat pembusukan.\n* Tutup rapat dan biarkan selama 3-4 minggu hingga berubah menjadi pupuk organik kaya nutrisi!`,
      rating: 4.9,
      createdAt: new Date().toISOString()
    },
    {
      title: 'Laskar Pelangi',
      author: 'Andrea Hirata',
      category: 'Novel & Fiksi',
      synopsis: 'Kisah inspiratif tentang perjuangan sepuluh anak di Belitung dari keluarga miskin yang bersekolah di sekolah Muhammadiyah yang sangat sederhana. Dengan segala keterbatasan, mereka tidak pernah menyerah untuk meraih mimpi-mimpi mereka.',
      status: 'Tersedia',
      ownerName: 'Taman Bacaan RT 02',
      coverUrl: 'bg-amber-700',
      rating: 4.8,
      createdAt: new Date().toISOString(),
      reviews: [
        { reviewerName: 'Budi Santoso', rating: 5, comment: 'Buku yang sangat menginspirasi anak muda untuk terus berjuang demi cita-cita!', date: new Date().toISOString() }
      ]
    },
    {
      title: 'Filosofi Teras',
      author: 'Henry Manampiring',
      category: 'Pengembangan Diri',
      synopsis: 'Sebuah buku pengantar filsafat Stoisisme atau Stoic yang dikemas secara praktis dan relevan untuk kehidupan modern. Membantu kita mengatasi rasa cemas berlebih, mengendalikan emosi negatif, dan melatih mental yang tangguh.',
      status: 'Tersedia',
      ownerName: 'Admin RT 02',
      coverUrl: 'bg-sky-700',
      rating: 4.9,
      createdAt: new Date().toISOString(),
      reviews: [
        { reviewerName: 'Dewi Sartika', rating: 5, comment: 'Sangat praktis, cocok dibaca di kala pikiran sedang bising.', date: new Date().toISOString() }
      ]
    }
  ];

  // Subscribe to Firestore collections
  useEffect(() => {
    const unsubBooks = subscribeToBooks((fetchedBooks) => {
      if (fetchedBooks.length === 0) {
        // Automatically seed default books if Firestore is completely empty
        defaultBooks.forEach(async (b) => {
          await addBook(b);
        });
        setBooks(defaultBooks.map((b, idx) => ({ ...b, id: `default-${idx}` })));
      } else {
        // Merge fetched books with default original ebooks if not already present
        const merged = [...fetchedBooks];
        defaultBooks.forEach((db, idx) => {
          if (!merged.some(b => b.title.toLowerCase() === db.title.toLowerCase())) {
            merged.unshift({ ...db, id: `default-ebook-${idx}` });
          }
        });
        setBooks(merged);
      }
    });

    const unsubRequests = subscribeToBookRequests((fetchedRequests) => {
      setRequests(fetchedRequests);
    });

    return () => {
      unsubBooks();
      unsubRequests();
    };
  }, []);

  // Handle Book Submission
  const handleContribSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribForm.title || !contribForm.author || !contribForm.synopsis) {
      alert('Mohon lengkapi semua kolom yang wajib diisi.');
      return;
    }

    const isDigital = contribForm.status === 'Digital Only';

    const bookPayload: Omit<Book, 'id'> = {
      title: contribForm.title,
      author: contribForm.author,
      category: contribForm.category,
      synopsis: contribForm.synopsis,
      status: contribForm.status,
      ownerName: currentResidentName,
      ownerHouseId: currentHouseId,
      coverUrl: contribForm.coverColor,
      digitalUrl: isDigital ? contribForm.digitalUrl : undefined,
      rating: 5.0,
      reviews: [],
      createdAt: new Date().toISOString()
    };

    await addBook(bookPayload);
    
    // Reset form & Switch Tab
    setContribForm({
      title: '',
      author: '',
      category: 'Novel & Fiksi',
      synopsis: '',
      status: 'Tersedia',
      digitalUrl: '',
      coverColor: 'bg-indigo-600',
    });
    setActiveTab('katalog');
    alert('Terima kasih atas kontribusi berharga Anda! Buku Anda telah didaftarkan di katalog.');
  };

  // Handle Borrow / Exchange Request Submission
  const handleBorrowSubmit = async () => {
    if (!selectedBook) return;

    const requestPayload: Omit<BookExchangeRequest, 'id'> = {
      bookId: selectedBook.id,
      bookTitle: selectedBook.title,
      requesterName: currentResidentName,
      requesterHouseId: currentHouseId,
      requesterPhone: currentResidentPhone,
      status: 'Pending',
      requestType: 'Pinjam Fisik',
      notes: borrowNotes,
      requestDate: new Date().toISOString()
    };

    await addBookRequest(requestPayload);
    
    // Update book status to Exchange Pending
    await updateBook(selectedBook.id, { status: 'Dipinjam' });

    setShowBorrowModal(false);
    setBorrowNotes('');
    alert('Permintaan pinjam/tukar buku fisik berhasil diajukan! Anda dapat memantau statusnya di tab Aktivitas.');
  };

  // Handle Review Submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !newReview.comment) return;

    const currentReviews = selectedBook.reviews || [];
    const updatedReviews = [
      ...currentReviews,
      {
        reviewerName: currentResidentName,
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date().toISOString()
      }
    ];

    // Recalculate average rating
    const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = parseFloat((totalRating / updatedReviews.length).toFixed(1));

    await updateBook(selectedBook.id, {
      reviews: updatedReviews,
      rating: avgRating
    });

    // Update locally selected book details to reflect the new review
    setSelectedBook({
      ...selectedBook,
      reviews: updatedReviews,
      rating: avgRating
    });

    setNewReview({ rating: 5, comment: '' });
  };

  // Handle request approval/rejection (For Admins or Book Owners)
  const handleRequestAction = async (req: BookExchangeRequest, newStatus: 'Disetujui' | 'Ditolak' | 'Selesai') => {
    await updateBookRequest(req.id, { status: newStatus });
    
    // Handle book status sync based on request updates
    if (newStatus === 'Ditolak' || newStatus === 'Selesai') {
      await updateBook(req.bookId, { status: 'Tersedia' });
    } else if (newStatus === 'Disetujui') {
      await updateBook(req.bookId, { status: 'Dipinjam' });
    }
  };

  // Delete contributed book
  const handleDeleteBook = async (bookId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus buku ini dari katalog?')) {
      await deleteBook(bookId);
      setSelectedBook(null);
    }
  };

  // Filter books
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.synopsis.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === 'Semua' || book.category === selectedCategory;
    
    const matchesType = selectedType === 'Semua' || 
      (selectedType === 'Digital' && book.status === 'Digital Only') ||
      (selectedType === 'Fisik' && book.status !== 'Digital Only');

    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 font-sans" id="library-container">
      {/* Clean Modern Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-[2.5rem] p-8 md:p-12 text-slate-900 border border-slate-200/70 shadow-sm mb-10 overflow-hidden relative"
      >
        {/* Subtle Animated Ambient Glow */}
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/70 rounded-full blur-3xl pointer-events-none" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-amber-50/60 rounded-full blur-3xl pointer-events-none" 
        />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full shadow-xs">
              <Sparkles size={14} className="text-indigo-600 animate-spin-slow" /> Taman Bacaan &amp; Literasi Digital RT 02
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Micro-Library <span className="text-indigo-600 font-serif italic">&amp; Perpustakaan Warga</span>
            </h1>
            <p className="text-slate-500 font-medium text-xs md:text-sm max-w-2xl leading-relaxed">
              Gagas pinjam tukar buku fisik, sumbang karya literasi, serta baca materi edukasi digital eksklusif secara mandiri &amp; gratis.
            </p>
          </div>
          
          {/* Clean Navigation Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto border border-slate-200/80">
            <button
              onClick={() => setActiveTab('katalog')}
              className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'katalog' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <BookOpen size={15} />
              Katalog
            </button>
            <button
              onClick={() => setActiveTab('permintaan')}
              className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'permintaan' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Clock size={15} />
              Aktivitas {requests.length > 0 && <span className="px-1.5 py-0.5 bg-indigo-500 text-white rounded-full text-[9px] font-black">{requests.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab('kontribusi')}
              className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'kontribusi' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Plus size={15} />
              Sumbang Buku
            </button>
          </div>
        </div>
      </motion.div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group">
          <div className="p-3.5 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Koleksi</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{books.length} Buku</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group">
          <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100 group-hover:scale-105 transition-transform">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Format Digital</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{books.filter(b => b.status === 'Digital Only').length} E-Book</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group">
          <div className="p-3.5 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100 group-hover:scale-105 transition-transform">
            <BookMarked size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buku Fisik</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{books.filter(b => b.status !== 'Digital Only').length} Eksemplar</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group">
          <div className="p-3.5 bg-rose-50 rounded-2xl text-rose-600 border border-rose-100 group-hover:scale-105 transition-transform">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Selesai</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{requests.filter(r => r.status === 'Selesai').length} Transaksi</p>
          </div>
        </div>
      </div>

      {/* KATALOG TAB */}
      {activeTab === 'katalog' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                placeholder="Cari judul, penulis, sinopsis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-xs bg-slate-50/80 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 transition-all"
              />
            </div>

            {/* Type and Category Selectors */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/70">
                {['Semua', 'Fisik', 'Digital'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${selectedType === t ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none pr-9 pl-4 py-2.5 text-xs font-black text-slate-800 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={14} />
              </div>
            </div>
          </div>

          {/* Book Catalog Grid */}
          {filteredBooks.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
              <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-black text-slate-800">Koleksi Tidak Ditemukan</h3>
              <p className="text-slate-400 text-xs font-medium mt-1">Gunakan kata kunci pencarian lain atau pilih kategori yang berbeda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredBooks.map((book) => {
                const isDigital = book.status === 'Digital Only';
                const hasCoverColor = book.coverUrl && book.coverUrl.startsWith('bg-');
                
                return (
                  <motion.div
                    key={book.id}
                    layoutId={`book-card-${book.id}`}
                    onClick={() => setSelectedBook(book)}
                    whileHover={{ y: -6, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer flex flex-col group h-full relative"
                  >
                    {/* Cover Art Box with Realistic 3D Book Shadow */}
                    <div className="relative aspect-[3/4] w-full flex items-center justify-center p-5 overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100/60 border-b border-slate-100">
                      <div className={`w-4/5 h-5/6 rounded-xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)] flex flex-col justify-between p-4.5 text-white relative transition-all group-hover:scale-105 group-hover:rotate-1 ${hasCoverColor ? book.coverUrl : 'bg-gradient-to-br from-indigo-700 to-indigo-900'}`}>
                        {/* 3D Book Spine Accent */}
                        <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/25 rounded-l-xl border-r border-white/10" />
                        
                        <div className="pl-3">
                          <span className="text-[7.5px] font-black tracking-[0.2em] uppercase text-white/75 block">{book.category}</span>
                          <h4 className="text-xs md:text-sm font-black mt-1 leading-snug line-clamp-3 font-sans tracking-tight">{book.title}</h4>
                        </div>
                        
                        <div className="pl-3 flex items-center justify-between border-t border-white/20 pt-2.5">
                          <span className="text-[9px] font-bold text-white/90 truncate pr-2">{book.author}</span>
                          {isDigital ? (
                            <span className="bg-white/25 backdrop-blur-xs text-[8px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase">E-Book</span>
                          ) : (
                            <span className="bg-slate-900/60 text-[8px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase">Fisik</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Book Metadata */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{book.category}</span>
                          <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                            <Star size={12} className="fill-current" />
                            <span>{book.rating || '5.0'}</span>
                          </div>
                        </div>
                        
                        <h3 className="text-sm font-black text-slate-900 mt-2 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 font-bold">Karya {book.author}</p>
                        <p className="text-slate-500 text-xs mt-2 line-clamp-2 font-medium leading-relaxed">
                          {book.synopsis}
                        </p>
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold truncate max-w-[120px]">
                          Oleh {book.ownerName}
                        </span>
                        
                        <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-lg ${
                          book.status === 'Tersedia' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' :
                          book.status === 'Digital Only' ? 'bg-sky-50 text-sky-700 border border-sky-200/80' :
                          'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {book.status}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* AKTIVITAS / BORROW REQUEST TAB */}
      {activeTab === 'permintaan' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-1">Daftar Peminjaman & Tukar Buku</h3>
            <p className="text-slate-500 text-xs font-medium">Kelola status serah terima buku fisik, donasi, dan lacak peminjaman aktif Anda di RT 02.</p>

            {requests.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Clock size={40} className="mx-auto text-slate-300 mb-2" />
                <p className="font-bold">Belum ada aktivitas pinjam buku.</p>
                <p className="text-xs mt-1">Silakan cari buku fisik di katalog untuk mulai mengajukan pertukaran.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {requests.map((req) => {
                  const isRequester = req.requesterName === currentResidentName;
                  const isIncomingForMe = books.find(b => b.id === req.bookId)?.ownerName === currentResidentName;
                  
                  return (
                    <div 
                      key={req.id} 
                      className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                        req.status === 'Pending' ? 'bg-amber-50/50 border-amber-200' :
                        req.status === 'Disetujui' ? 'bg-emerald-50/50 border-emerald-200' :
                        req.status === 'Ditolak' ? 'bg-rose-50/30 border-rose-150' :
                        'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`p-3 rounded-xl ${
                          req.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                          req.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-600' :
                          req.status === 'Ditolak' ? 'bg-rose-100 text-rose-600' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-black text-slate-800">{req.bookTitle}</h4>
                            <span className="text-[10px] bg-white font-black text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-150">
                              {req.requestType}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium mt-1">
                            <span className="flex items-center gap-1">
                              Pemohon: <b className="text-slate-700">{req.requesterName}</b> (Blok {req.requesterHouseId})
                            </span>
                            <span>•</span>
                            <span>Tgl: {new Date(req.requestDate).toLocaleDateString('id-ID')}</span>
                          </div>

                          {req.notes && (
                            <p className="text-xs text-slate-500 bg-white/60 rounded-lg p-2 border border-slate-100 mt-2 italic">
                              "{req.notes}"
                            </p>
                          )}

                          {/* Action details if approved */}
                          {req.status === 'Disetujui' && (
                            <div className="mt-3 p-3 bg-white border border-emerald-150 rounded-lg text-xs text-slate-600">
                              <p className="font-bold text-emerald-700">✓ Permintaan Disetujui!</p>
                              <p className="mt-1 font-medium">Silakan lakukan penukaran buku fisik di Blok {req.requesterHouseId} atau hubungi nomor <b>{req.requesterPhone}</b> untuk serah terima.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-md ${
                          req.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                          req.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' :
                          req.status === 'Ditolak' ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {req.status}
                        </span>

                        {/* If I am the book owner or admin, I can approve/reject/finish */}
                        {(isIncomingForMe || currentResidentName === 'Admin RT 02') && req.status === 'Pending' && (
                          <div className="flex items-center gap-1.5 ml-2">
                            <button
                              onClick={() => handleRequestAction(req, 'Disetujui')}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg cursor-pointer transition-all"
                              title="Setujui Pinjaman"
                            >
                              <Check size={14} strokeWidth={3} />
                            </button>
                            <button
                              onClick={() => handleRequestAction(req, 'Ditolak')}
                              className="p-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg cursor-pointer transition-all"
                              title="Tolak Pinjaman"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        )}

                        {/* Mark as complete */}
                        {(isIncomingForMe || currentResidentName === 'Admin RT 02') && req.status === 'Disetujui' && (
                          <button
                            onClick={() => handleRequestAction(req, 'Selesai')}
                            className="ml-2 px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all"
                          >
                            Tandai Selesai
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUMBANG / KONTRIBUSI BUKU TAB */}
      {activeTab === 'kontribusi' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                <Plus size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Sumbang Buku Baru</h3>
                <p className="text-slate-500 text-xs font-medium">Bantu perkaya khazanah literasi digital & fisik warga RT 02.</p>
              </div>
            </div>

            <form onSubmit={handleContribSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Judul Buku <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={contribForm.title}
                    onChange={(e) => setContribForm({ ...contribForm, title: e.target.value })}
                    placeholder="Contoh: Laskar Pelangi"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Penulis / Pengarang <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={contribForm.author}
                    onChange={(e) => setContribForm({ ...contribForm, author: e.target.value })}
                    placeholder="Contoh: Andrea Hirata"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Kategori Buku <span className="text-rose-500">*</span></label>
                  <select
                    value={contribForm.category}
                    onChange={(e) => setContribForm({ ...contribForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                  >
                    {categories.slice(1).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tipe / Ketersediaan <span className="text-rose-500">*</span></label>
                  <select
                    value={contribForm.status}
                    onChange={(e) => setContribForm({ ...contribForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                  >
                    <option value="Tersedia">Buku Fisik (Bisa Dipinjam / Ditukar)</option>
                    <option value="Digital Only">E-Book Digital (Baca Langsung di Web)</option>
                  </select>
                </div>
              </div>

              {/* Digital Text content if selected E-Book */}
              {contribForm.status === 'Digital Only' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Konten / Teks Digital <span className="text-rose-500">*</span></label>
                  <textarea
                    required
                    rows={6}
                    value={contribForm.digitalUrl}
                    onChange={(e) => setContribForm({ ...contribForm, digitalUrl: e.target.value })}
                    placeholder="Tulis draf naskah, dongeng, atau materi edukasi yang ingin dibagikan secara digital di sini..."
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Sinopsis / Ringkasan Buku <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  rows={4}
                  value={contribForm.synopsis}
                  onChange={(e) => setContribForm({ ...contribForm, synopsis: e.target.value })}
                  placeholder="Ceritakan ringkasan isi buku ini agar menarik minat baca tetangga..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                />
              </div>

              {/* Color selector for Cover Art */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Pilih Warna Sampul Buku</label>
                <div className="flex flex-wrap gap-3">
                  {coverColors.map((col) => (
                    <button
                      key={col.class}
                      type="button"
                      onClick={() => setContribForm({ ...contribForm, coverColor: col.class })}
                      className={`h-8 px-3 rounded-xl border text-[10px] font-black text-white flex items-center justify-center cursor-pointer transition-all ${col.class} ${contribForm.coverColor === col.class ? 'ring-2 ring-indigo-500 scale-105 shadow-sm' : 'opacity-80 hover:opacity-100'}`}
                    >
                      {contribForm.coverColor === col.class && <Check size={12} className="mr-1" />}
                      {col.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contributor Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                Kontribusi ini akan didaftarkan atas nama Anda: <b>{currentResidentName} (Blok {currentHouseId})</b>. Pastikan data profil Anda sudah terverifikasi di TERAS RT 02.
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('katalog')}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer transition-all"
                >
                  Sumbangkan Buku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL BOOK MODAL */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBook(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Content Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header Cover */}
              <div className={`p-6 text-white relative ${selectedBook.coverUrl?.startsWith('bg-') ? selectedBook.coverUrl : 'bg-indigo-700'}`}>
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedBook(null)}
                  className="absolute right-4 top-4 p-2 bg-white/10 hover:bg-white/20 active:scale-90 text-white rounded-full transition-all cursor-pointer"
                >
                  <ArrowLeft size={18} />
                </button>

                <div className="flex gap-5 items-start pr-8 mt-2">
                  {/* Miniature Cover */}
                  <div className="w-24 h-32 bg-white/10 border border-white/20 rounded-lg shadow-md flex-shrink-0 flex flex-col justify-between p-2">
                    <span className="text-[7px] font-black tracking-widest uppercase text-white/85">{selectedBook.category}</span>
                    <h4 className="text-[10px] font-bold line-clamp-3">{selectedBook.title}</h4>
                    <span className="text-[8px] truncate">{selectedBook.author}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block">{selectedBook.category}</span>
                    <h2 className="text-xl sm:text-2xl font-black mt-1 leading-tight">{selectedBook.title}</h2>
                    <p className="text-xs text-white/80 mt-1 font-medium">Oleh {selectedBook.author}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
                      <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md">
                        <Star size={13} className="fill-current text-amber-300" />
                        <span className="font-bold">{selectedBook.rating || '5.0'}</span>
                      </div>
                      
                      <span className="bg-white/25 px-2 py-1 rounded-md font-bold text-[10px] tracking-wider uppercase">
                        {selectedBook.status === 'Digital Only' ? 'E-Book Digital' : 'Buku Fisik'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Sinopsis Buku</h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                    {selectedBook.synopsis}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pemilik / Kontributor</p>
                    <p className="text-sm font-black text-slate-800 mt-0.5">{selectedBook.ownerName}</p>
                    {selectedBook.ownerHouseId && (
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Rumah Blok {selectedBook.ownerHouseId}</p>
                    )}
                  </div>

                  {selectedBook.ownerName === currentResidentName && (
                    <button
                      onClick={() => handleDeleteBook(selectedBook.id)}
                      className="flex items-center gap-1 text-xs text-rose-600 font-bold hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 transition-colors"
                    >
                      <Trash2 size={13} />
                      Hapus Buku
                    </button>
                  )}
                </div>

                {/* Primary Interaction Buttons */}
                <div className="flex gap-3">
                  {/* Digital Reading */}
                  {selectedBook.status === 'Digital Only' && (
                    <button
                      onClick={() => setShowReaderModal(true)}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                    >
                      <BookOpen size={16} />
                      Baca E-Book Sekarang
                    </button>
                  )}

                  {/* Physical Exchange Borrow */}
                  {selectedBook.status === 'Tersedia' && (
                    <button
                      onClick={() => setShowBorrowModal(true)}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                    >
                      <Bookmark size={16} />
                      Ajukan Pinjam Buku Fisik
                    </button>
                  )}

                  {selectedBook.status === 'Dipinjam' && (
                    <button
                      disabled
                      className="flex-1 py-3 bg-slate-100 border border-slate-200 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Clock size={16} />
                      Sedang Dipinjam
                    </button>
                  )}
                </div>

                {/* Reviews Section */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Ulasan Pembaca</h3>
                  
                  {/* Leave Review Form */}
                  <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-4 border border-slate-150 rounded-2xl mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-600">Berikan Penilaian & Ulasan</p>
                      {/* Star Rating select */}
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star size={16} className={newReview.rating >= star ? 'fill-current' : ''} />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Tulis pendapat Anda tentang buku ini..."
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        className="flex-1 px-3.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                      >
                        Kirim
                      </button>
                    </div>
                  </form>

                  {/* Reviews List */}
                  {(!selectedBook.reviews || selectedBook.reviews.length === 0) ? (
                    <p className="text-xs text-slate-400 font-medium text-center py-4">Belum ada ulasan warga. Jadilah yang pertama memberikan review!</p>
                  ) : (
                    <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                      {selectedBook.reviews.map((rev, idx) => (
                        <div key={idx} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-700">{rev.reviewerName}</span>
                            <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                              <Star size={11} className="fill-current" />
                              <span>{rev.rating}</span>
                            </div>
                          </div>
                          <p className="text-slate-600 font-medium leading-relaxed italic">"{rev.comment}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FORM BORROW FISIK MODAL */}
      <AnimatePresence>
        {showBorrowModal && selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowBorrowModal(false)} />
            
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10"
            >
              <h3 className="text-lg font-black text-slate-800">Ajukan Pinjam Buku Fisik</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Anda mengajukan peminjaman buku: <b>{selectedBook.title}</b></p>

              <div className="space-y-4 mt-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Pesan / Catatan Tambahan (Opsional)</label>
                  <textarea
                    rows={3}
                    value={borrowNotes}
                    onChange={(e) => setBorrowNotes(e.target.value)}
                    placeholder="Contoh: Saya ingin meminjam selama 1 minggu, nanti saya kembalikan langsung ke teras rumah Anda..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-250 rounded-xl text-[11px] text-slate-500 space-y-1">
                  <p>• Data Anda (<b>{currentResidentName}</b> dari <b>Blok {currentHouseId}</b>) akan dikirimkan ke pemilik buku.</p>
                  <p>• Pemilik buku berhak menyetujui atau menolak permohonan Anda.</p>
                </div>

                <div className="flex gap-3 pt-4 justify-end">
                  <button
                    onClick={() => setShowBorrowModal(false)}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleBorrowSubmit}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all"
                  >
                    Ajukan Permintaan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* E-READER MODAL FOR DIGITAL BOOKS */}
      <AnimatePresence>
        {showReaderModal && selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowReaderModal(false)} />

            {/* Immersive Reader Body */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl z-10 h-[90vh] flex flex-col border border-slate-200"
            >
              {/* Reader Header Toolbar */}
              <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between shadow-2xs z-20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block">{selectedBook.category}</span>
                    <h2 className="text-sm md:text-base font-black text-slate-900 leading-tight">{selectedBook.title}</h2>
                    <p className="text-[11px] text-slate-500 font-medium">Karya {selectedBook.author} &bull; Kontributor {selectedBook.ownerName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/80 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                    <CheckCircle2 size={12} /> E-Book Resmi TERAS RT 02
                  </span>
                  <button
                    onClick={() => setShowReaderModal(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <ArrowLeft size={14} />
                    Selesai Membaca
                  </button>
                </div>
              </div>

              {/* Reading Stage (Parchment Styled Layout) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 max-w-4xl mx-auto space-y-6 bg-slate-50/50 w-full">
                {selectedBook.digitalUrl && selectedBook.digitalUrl.startsWith('http') ? (
                  <div className="w-full h-[70vh] rounded-[2rem] overflow-hidden border border-slate-200 shadow-md bg-white">
                    <iframe 
                      src={selectedBook.digitalUrl} 
                      className="w-full h-full border-none"
                      title={`E-Book ${selectedBook.title}`}
                    />
                  </div>
                ) : (
                  <div className="bg-white p-8 sm:p-12 md:p-14 rounded-[2.5rem] border border-slate-200/80 shadow-md">
                    <div className="text-slate-800 font-serif leading-loose text-sm sm:text-base md:text-lg antialiased space-y-4">
                      {selectedBook.digitalUrl ? (
                        selectedBook.digitalUrl.split('\n\n').map((paragraph, pIdx) => {
                          if (paragraph.startsWith('# ')) {
                            return <h1 key={pIdx} className="text-2xl md:text-3xl font-black font-sans text-slate-900 border-b border-slate-200 pb-3 mb-4">{paragraph.replace('# ', '')}</h1>;
                          }
                          if (paragraph.startsWith('## ')) {
                            return <h2 key={pIdx} className="text-xl md:text-2xl font-bold font-sans text-slate-800 border-b border-slate-100 pb-2 mt-6 mb-3">{paragraph.replace('## ', '')}</h2>;
                          }
                          if (paragraph.startsWith('### ')) {
                            return <h3 key={pIdx} className="text-base md:text-lg font-black font-sans text-indigo-700 mt-6 mb-2">{paragraph.replace('### ', '')}</h3>;
                          }
                          if (paragraph.startsWith('* ') || paragraph.startsWith('- ')) {
                            return (
                              <ul key={pIdx} className="list-disc list-inside space-y-1 my-3 text-slate-700 font-sans text-xs sm:text-sm">
                                {paragraph.split('\n').map((item, iIdx) => (
                                  <li key={iIdx}>{item.replace(/^[*|-]\s*/, '')}</li>
                                ))}
                              </ul>
                            );
                          }
                          return <p key={pIdx} className="text-justify leading-relaxed text-slate-700">{paragraph}</p>;
                        })
                      ) : (
                        <p className="text-slate-400 text-center py-10 font-sans">Naskah digital belum tersedia.</p>
                      )}
                    </div>

                    {/* End of content accent */}
                    <div className="pt-10 mt-10 border-t border-slate-100 text-center text-slate-400 text-xs font-sans font-black uppercase tracking-widest">
                      ~ Akhir dari Naskah Resmi E-Book TERAS RT 02 ~
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
