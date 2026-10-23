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
- `produk-lainnya.html` — resource brand server, storage dan data backup, networking, UPS, serta sparepart.

## Struktur proyek

```text
.
├── assets/
│   ├── img/
│   │   ├── FNI-ICON.jpg
│   │   ├── layananbroadband.jpg
│   │   ├── layananitkonsultan.jpg
│   │   ├── layananinternetdedicated.jpg
│   │   ├── dedicated-pricelist.jpg
│   │   ├── Pricelist.jpg
│   │   └── produklainnya.jpg
│   ├── img-no-bg/
│   │   ├── Cloud-removebg-preview.png
│   │   ├── Corpo-removebg-preview.png
│   │   ├── FNI-H1.png
│   │   ├── FNI-LOGO.png
│   │   ├── House-removebg-preview.png
│   │   └── Partner-removebg-preview.png
│   └── hardware/
│       └── Gambar brand perangkat server, jaringan, UPS, dan sparepart
├── css/
│   └── style.css
├── js/
│   └── script.js
├── broadband.html
├── home.html
├── internet-dedicated.html
├── it-konsultan.html
├── index.html
├── produk-lainnya.html
└── README.md
```

Label layanan pada `index.html` menggunakan gambar khusus untuk Broadband, Internet Dedicated, IT Konsultan, dan Produk Lainnya. Setiap label mengarah langsung ke halaman layanan yang sesuai. Halaman `produk-lainnya.html` menampilkan resource brand server dan storage data backup, networking, UPS, serta sparepart dari `assets/hardware/`.

## Fitur

- Tata letak responsif untuk desktop dan perangkat seluler.
- Navigasi seluler dengan tombol Escape untuk menutup menu.
- Gulir halus untuk tautan bagian dalam halaman.
- Transisi antarhalaman pada browser yang mendukung View Transitions API.
- Animasi konten saat masuk ke viewport dan dukungan untuk preferensi `prefers-reduced-motion`.

Font Inter dan Poppins dimuat dari Google Fonts saat tersedia koneksi internet; font sans-serif sistem digunakan sebagai fallback.
