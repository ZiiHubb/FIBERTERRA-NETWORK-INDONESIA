# FIBERTERRA NETWORK ID

Situs web statis FIBERTERRA NETWORK ID, penyedia layanan jaringan dan internet fiber optik di Aceh. Situs berisi halaman pengantar layanan dan halaman informasi bisnis.

## Menjalankan situs

Tidak diperlukan instalasi dependensi, proses build, atau konfigurasi backend. Buka `index.html` langsung di browser, atau jalankan folder ini dengan ekstensi server statis seperti Live Server di Visual Studio Code.

## Halaman

- `home.html` — halaman utama berisi tentang kami, visi, misi, dan informasi kontak.
- `index.html` — halaman pemilih layanan. Pilih salah satu dari empat layanan untuk membuka halaman terkait.
- `broadband.html` — informasi internet broadband untuk rumah dan paket harga.
- `internet-dedicated.html` — informasi layanan dan pricelist internet dedicated untuk bisnis.
- `it-konsultan.html` — informasi layanan konsultasi IT dan jaringan.
- `produk-lainnya.html` — resource brand server, storage dan data backup, networking, CCTV, absensi dan smartlock, komputer, laptop dan UPS, serta sparepart.

## Struktur proyek

```text
.
├── assets/
│   ├── background/
│   │   ├── home.jpeg
│   │   ├── broadband.jpeg
│   │   ├── internet_dedicate.jpeg
│   │   ├── konsultan_it.jpeg
│   │   └── produk_lainnya.jpeg
│   ├── optimized/
│   │   ├── home-480.avif / home-480.webp
│   │   ├── broadband-768.avif / broadband-768.webp
│   │   ├── internet_dedicate-1024.avif / internet_dedicate-1024.webp
│   │   └── Varian responsif lain dengan pola nama yang sama
│   ├── img/
│   │   ├── fni-icon.jpg
│   │   ├── layananbroadband.jpg
│   │   ├── layananitkonsultan.jpg
│   │   ├── layananinternetdedicated.jpg
│   │   ├── dedicated-pricelist.jpg
│   │   ├── pricelist.jpg
│   │   ├── produklainnya.jpg
│   │   └── social-preview.jpg
│   ├── img-no-bg/
│   │   ├── cloud-removebg-preview.png
│   │   ├── corpo-removebg-preview.png
│   │   ├── fni-h1.png
│   │   ├── fni-logo.png
│   │   ├── house-removebg-preview.png
│   │   └── partner-removebg-preview.png
│   └── hardware/
│       └── Gambar brand perangkat server, jaringan, UPS, dan sparepart
├── css/
│   └── style.css
├── js/
│   └── script.js
├── scripts/
│   └── check-site.mjs
├── .github/
│   └── workflows/
│       └── site-check.yml
├── broadband.html
├── home.html
├── internet-dedicated.html
├── it-konsultan.html
├── index.html
├── produk-lainnya.html
└── README.md
```

Label layanan pada `index.html` menggunakan gambar khusus untuk Broadband, Internet Dedicated, IT Konsultan, dan Produk Lainnya. Setiap label mengarah langsung ke halaman layanan yang sesuai. Halaman `produk-lainnya.html` menampilkan resource brand server dan storage data backup, networking, CCTV, absensi dan smartlock, komputer, laptop dan UPS, serta sparepart dari `assets/hardware/`.

Setiap halaman hero menggunakan gambar latar dari `assets/background/`: `home.jpeg` untuk `home.html`, `broadband.jpeg` untuk `broadband.html`, `internet_dedicate.jpeg` untuk `internet-dedicated.html`, `konsultan_it.jpeg` untuk `it-konsultan.html`, dan `produk_lainnya.jpeg` untuk `produk-lainnya.html`.

Background hero, gambar layanan, dan pricelist memakai AVIF/WebP dengan ukuran responsif; JPEG asli tetap menjadi fallback. Metadata Open Graph dan Twitter menggunakan gambar preview 1200×630 di `assets/img/social-preview.jpg`. Sebelum publikasi, ganti nilai gambar preview menjadi URL absolut dan tambahkan `og:url` serta canonical URL setelah domain resmi ditetapkan.

## Fitur

- Tata letak responsif untuk desktop dan perangkat seluler.
- Navigasi seluler dengan tombol Escape untuk menutup menu.
- Gambar AVIF/WebP responsif dengan fallback JPEG.
- Gulir halus untuk tautan bagian dalam halaman.
- Transisi antarhalaman pada browser yang mendukung View Transitions API.
- Animasi konten saat masuk ke viewport dan dukungan untuk preferensi `prefers-reduced-motion`.

Font Inter dan Poppins dimuat dari Google Fonts saat tersedia koneksi internet; font sans-serif sistem digunakan sebagai fallback.

## Pemeriksaan situs

Jalankan `node scripts/check-site.mjs` untuk memeriksa tautan dan anchor lokal, path asset (termasuk `srcset`), URL eksternal yang malformed, ID duplikat, metadata SEO/social, serta pemeriksaan aksesibilitas statis seperti bahasa dokumen, landmark utama, heading H1, skip link, nama tautan/tombol, label navigasi, referensi ARIA, dan alt gambar. Pemeriksaan yang sama berjalan otomatis pada push dan pull request melalui GitHub Actions. URL eksternal diperiksa formatnya, bukan ketersediaan respons server; pemeriksaan aksesibilitas ini adalah pemeriksaan statis dan bukan pengganti audit WCAG dengan teknologi bantu.
