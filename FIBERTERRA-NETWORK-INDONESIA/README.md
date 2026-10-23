# FIBERTERRA NETWORK ID

Situs web statis FIBERTERRA NETWORK ID, penyedia layanan jaringan dan internet fiber optik di Aceh. Situs berisi halaman pengantar layanan dan halaman informasi bisnis.

## Menjalankan situs

Tidak diperlukan instalasi dependensi, proses build, atau konfigurasi backend. Buka `index.html` langsung di browser, atau jalankan folder ini dengan ekstensi server statis seperti Live Server di Visual Studio Code.

## Halaman

- `index.html` — halaman pengantar dengan diagram layanan. Pilih layanan untuk membuka halaman utama.
- `fni-home.html` — halaman layanan, tentang kami, jaringan, daftar harga, dan kontak.

## Struktur proyek

```text
.
├── assets/
│   ├── Img/
│   │   ├── FNI-ICON.jpg
│   │   ├── layananbroadband.jpg
│   │   ├── layananitkonsultan.jpg
│   │   ├── layananinternetdedicated.jpg
│   │   ├── Pricelist.jpg
│   │   └── produklainnya.jpg
│   └── Img-No-Bg/
│       ├── Cloud-removebg-preview.png
│       ├── Corpo-removebg-preview.png
│       ├── FNI-H1.png
│       ├── FNI-LOGO.png
│       ├── House-removebg-preview.png
│       └── Partner-removebg-preview.png
├── css/
│   └── style.css
├── js/
│   └── script.js
├── fni-home.html
├── index.html
└── README.md
```

Label layanan pada `index.html` menggunakan gambar khusus untuk Broadband, Internet Dedicated, IT Konsultan, dan Produk Lainnya. Seluruh aset gambar yang tercantum digunakan oleh salah satu halaman.

## Fitur

- Tata letak responsif untuk desktop dan perangkat seluler.
- Navigasi seluler dengan tombol Escape untuk menutup menu.
- Gulir halus untuk tautan bagian dalam halaman.
- Transisi antarhalaman pada browser yang mendukung View Transitions API.
- Animasi konten saat masuk ke viewport dan dukungan untuk preferensi `prefers-reduced-motion`.

Font Inter dan Poppins dimuat dari Google Fonts saat tersedia koneksi internet; font sans-serif sistem digunakan sebagai fallback.
