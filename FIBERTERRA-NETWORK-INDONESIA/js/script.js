const siteHeader = document.querySelector("#site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navPanel = document.querySelector("#primary-navigation");
let currentLanguage = localStorage.getItem("fiberterra-language") || "id";
const menuToggleLabels = {
  id: { open: "Buka menu navigasi", close: "Tutup menu navigasi" },
  en: { open: "Open navigation menu", close: "Close navigation menu" },
  zh: { open: "打开导航菜单", close: "关闭导航菜单" },
  ar: { open: "افتح قائمة التنقل", close: "أغلق قائمة التنقل" }
};

function updateHeader() {
  if (siteHeader) siteHeader.classList.toggle("is-scrolled", window.scrollY > 24);
}

if (siteHeader) {
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

function closeMenu() {
  if (!menuToggle || !navPanel) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", menuToggleLabels[currentLanguage].open);
  navPanel.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

if (menuToggle && navPanel) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", menuToggleLabels[currentLanguage][isExpanded ? "open" : "close"]);
    navPanel.classList.toggle("is-open", !isExpanded);
    document.body.classList.toggle("menu-open", !isExpanded);
  });

  navPanel.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle?.getAttribute("aria-expanded") === "true") {
    closeMenu();
    menuToggle.focus();
  }
});

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const resourceLists = document.querySelectorAll(".product-resource-list");

function initResourceCarousels() {
  if (!resourceLists.length) return;

  const carousels = [];
  const markUserActivity = () => {
    carousels.forEach((carousel) => {
      carousel.lastActivity = performance.now();
      carousel.isUserActive = true;
    });
  };

  ["mousemove", "click", "keydown", "touchstart", "touchmove", "pointerdown", "pointermove", "wheel"].forEach((eventName) => {
    document.addEventListener(eventName, markUserActivity, { passive: true });
  });

  const bindStaticListInteractions = (list) => {
    let pointerDown = false;
    let dragged = false;
    let startX = 0;
    let startY = 0;
    let startScrollLeft = 0;
    let pressedCard = null;

    list.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      pointerDown = true;
      dragged = false;
      startX = event.clientX;
      startY = event.clientY;
      startScrollLeft = list.scrollLeft;
      pressedCard = event.target.closest(".product-resource-card");
      list.classList.add("is-dragging");
    });

    window.addEventListener("pointermove", (event) => {
      if (!pointerDown) return;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;

      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 6) return;
      dragged = true;

      if (Math.abs(deltaX) >= Math.abs(deltaY)) {
        event.preventDefault();
        list.scrollLeft = startScrollLeft - deltaX;
      }
    });

    const stopDrag = (event) => {
      if (!pointerDown) return;
      if (event.type !== "pointercancel" && !dragged && pressedCard) {
        pressedCard.classList.toggle("is-zoomed");
      }
      pointerDown = false;
      pressedCard = null;
      list.classList.remove("is-dragging");
    };

    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
  };

  resourceLists.forEach((list) => {
    if (list.children.length <= 5) {
      bindStaticListInteractions(list);
      return;
    }

    const viewport = document.createElement("div");
    viewport.className = "resource-carousel__viewport";

    const track = document.createElement("div");
    track.className = "resource-carousel__track";

    const parent = list.parentNode;
    parent.insertBefore(viewport, list);
    viewport.appendChild(track);

    const clonedList = list.cloneNode(true);
    clonedList.classList.add("resource-carousel__clone");
    clonedList.setAttribute("aria-hidden", "true");

    const original = list;
    original.parentNode.removeChild(original);
    track.appendChild(original);
    track.appendChild(clonedList);

    const wrapper = viewport.parentNode;
    wrapper.classList.add("resource-carousel");

    const state = {
      wrapper,
      viewport,
      track,
      original,
      clonedList,
      offset: 0,
      lastActivity: performance.now(),
      isUserActive: true,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      dragStartOffset: 0,
      pressedCard: null,
      hasDragged: false,
      resumeAfter: 0,
      visible: true,
      lastFrame: performance.now(),
      speed: 38,
    };

    const updatePerspective = () => {
      const centerX = state.viewport.getBoundingClientRect().left + state.viewport.clientWidth / 2;
      [state.original, state.clonedList].forEach((group) => {
        group.querySelectorAll(".product-resource-card").forEach((card) => {
          const cardRect = card.getBoundingClientRect();
          const cardCenterX = cardRect.left + cardRect.width / 2;
          const distance = Math.abs(cardCenterX - centerX);
          const maxDistance = Math.max(state.viewport.clientWidth * 0.72, 210);
          const closeness = Math.max(0, 1 - distance / maxDistance);
          const scale = 0.8 + (closeness * 0.25);
          const lift = (1 - Math.min(distance / maxDistance, 1)) * 14;

          card.style.setProperty("--card-scale", scale.toFixed(3));
          card.style.setProperty("--card-offset", `${(lift * 0.5).toFixed(2)}px`);
          card.classList.toggle("is-active", closeness > 0.48);
        });
      });
    };

    const updatePosition = () => {
      const segmentWidth = state.original.scrollWidth + parseFloat(getComputedStyle(state.track).gap);
      const normalized = ((state.offset % segmentWidth) + segmentWidth) % segmentWidth;
      state.offset = normalized;
      state.track.style.transform = `translate3d(${-state.offset}px, 0, 0)`;
      updatePerspective();
    };

    state.updatePosition = updatePosition;
    state.updatePerspective = updatePerspective;

    const beginDrag = (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      state.isDragging = true;
      state.dragStartX = event.clientX;
      state.dragStartY = event.clientY;
      state.dragStartOffset = state.offset;
      state.pressedCard = event.target.closest(".product-resource-card");
      state.hasDragged = false;
      state.wrapper.classList.add("is-dragging");
      state.lastActivity = performance.now();
      state.isUserActive = true;
      state.resumeAfter = performance.now() + 2000;
    };

    const moveDrag = (event) => {
      if (!state.isDragging) return;
      const deltaX = event.clientX - state.dragStartX;
      const deltaY = event.clientY - state.dragStartY;
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 6) return;
      state.hasDragged = true;
      if (Math.abs(deltaX) < Math.abs(deltaY)) return;
      event.preventDefault();
      state.offset = state.dragStartOffset - deltaX;
      state.lastActivity = performance.now();
      state.isUserActive = true;
      updatePosition();
    };

    const stopDrag = (event) => {
      if (!state.isDragging) return;
      if (event.type !== "pointercancel" && !state.hasDragged && state.pressedCard) {
        state.pressedCard.classList.toggle("is-zoomed");
      }
      state.isDragging = false;
      state.pressedCard = null;
      state.wrapper.classList.remove("is-dragging");
      state.resumeAfter = performance.now() + 2000;
    };

    state.viewport.addEventListener("pointerdown", beginDrag);
    window.addEventListener("pointermove", moveDrag);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);

    state.viewport.addEventListener("wheel", (event) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        event.preventDefault();
        state.offset += event.deltaX * 0.8;
        state.lastActivity = performance.now();
        state.isUserActive = true;
        state.resumeAfter = performance.now() + 2000;
        updatePosition();
      }
    }, { passive: false });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        state.visible = entry.isIntersecting;
      });
    }, { threshold: 0.2 });

    observer.observe(state.viewport);
    carousels.push(state);
    updatePosition();
  });

  const animate = () => {
    const now = performance.now();
    carousels.forEach((state) => {
      const delta = (now - state.lastFrame) / 1000;
      state.lastFrame = now;

      const idle = now - state.lastActivity >= 10000;
      if (idle) state.isUserActive = false;

      const isVisible = !document.hidden && document.visibilityState === "visible" && state.visible;
      const isCooldown = now < state.resumeAfter;
      const shouldScroll = isVisible && !state.isDragging && !isCooldown && !idle && state.isUserActive;

      if (shouldScroll) {
        state.offset += state.speed * delta;
        state.updatePosition();
      }
    });

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

initResourceCarousels();

window.matchMedia("(min-width: 761px)").addEventListener("change", (event) => {
  if (event.matches) closeMenu();
});

const languageSwitcher = document.querySelector(".language-switcher");

if (languageSwitcher) {
  const languageToggle = languageSwitcher.querySelector(".language-toggle");
  const languageMenu = languageSwitcher.querySelector(".language-menu");
  const languageOptions = languageSwitcher.querySelectorAll(".language-option");
  const languageFlag = languageSwitcher.querySelector(".language-flag");
  const translations = {
    en: {
      "Kembali ke atas halaman": "Back to the top of the page",
      "Buka menu navigasi": "Open navigation menu",
      "Tutup menu navigasi": "Close navigation menu",
      "Pilih Layanan | FIBERTERRA NETWORK ID": "Choose a Service | FIBERTERRA NETWORK ID",
      "Layanan FIBERTERRA NETWORK ID: internet dedicated, home broadband, IT konsultan, dan produk lainnya.": "FIBERTERRA NETWORK ID services: dedicated internet, home broadband, IT consulting, and other products.",
      "Lewati ke pilihan layanan": "Skip to service selection",
      "Pilih Layanan FIBERTERRA NETWORK ID": "Choose a FIBERTERRA NETWORK ID service",
      "Layanan FIBERTERRA NETWORK ID": "FIBERTERRA NETWORK ID Services",
      "Buka beranda perusahaan": "Open the company homepage",
      "Ikon FIBERTERRA NETWORK ID": "FIBERTERRA NETWORK ID icon",
      "Home Broadband": "Home Broadband",
      "Layanan IT Konsultan": "IT Consulting Services",
      "Beranda | FIBERTERRA NETWORK ID": "Home | FIBERTERRA NETWORK ID",
      "Internet Broadband | FIBERTERRA NETWORK ID": "Broadband Internet | FIBERTERRA NETWORK ID",
      "Internet Dedicated | FIBERTERRA NETWORK ID": "Dedicated Internet | FIBERTERRA NETWORK ID",
      "IT Konsultan | FIBERTERRA NETWORK ID": "IT Consulting | FIBERTERRA NETWORK ID",
      "Produk Lainnya | FIBERTERRA NETWORK ID": "Other Products | FIBERTERRA NETWORK ID",
      "Kenali FIBERTERRA NETWORK ID, visi, misi, dan komitmen kami dalam membantu kebutuhan konektivitas serta teknologi informasi.": "Learn about FIBERTERRA NETWORK ID, our vision, mission, and commitment to connectivity and information technology.",
      "Layanan internet broadband fiber optik FIBERTERRA NETWORK ID untuk kebutuhan rumah di Aceh.": "FIBERTERRA NETWORK ID fiber-optic broadband services for homes in Aceh.",
      "Informasi layanan internet dedicated FIBERTERRA NETWORK ID untuk kebutuhan konektivitas bisnis di Aceh.": "Dedicated internet services from FIBERTERRA NETWORK ID for business connectivity in Aceh.",
      "Layanan konsultasi IT dan jaringan dari FIBERTERRA NETWORK ID untuk membantu merencanakan kebutuhan teknologi bisnis Anda.": "IT and networking consultations from FIBERTERRA NETWORK ID to help plan your business technology needs.",
      "Server, storage & backup, networking, CCTV, smartlock, komputer, laptop, UPS, dan sparepart untuk kebutuhan infrastruktur IT Anda.": "Servers, storage and backup, networking, CCTV, smart locks, computers, laptops, UPS, and spare parts for your IT infrastructure.",
      "Lewati ke konten utama": "Skip to main content",
      "Navigasi utama": "Main navigation",
      "Beranda": "Home",
      "Tentang Kami": "About Us",
      "Visi & Misi": "Vision & Mission",
      "Layanan": "Services",
      "Kontak": "Contact",
      "Hubungi Kami": "Contact Us",
      "Indonesia": "Indonesian",
      "中文": "Chinese",
      "العربية": "Arabic",
      "Internet Broadband": "Broadband Internet",
      "Internet Dedicated": "Dedicated Internet",
      "Jaringan": "Network",
      "Pricelist": "Pricing",
      "IT Konsultan": "IT Consulting",
      "Produk Lainnya": "Other Products",
      "Pilih layanan untuk melihat informasi lengkap pada halaman terkait.": "Choose a service to view more information on its dedicated page.",
      "INTERNET BROADBAND RUMAH": "HOME BROADBAND INTERNET",
      "Internet Broadband untuk": "Broadband Internet for",
      "Rumah Anda": "Your Home",
      "Nikmati koneksi fiber optik untuk mendukung aktivitas harian di rumah, mulai dari bekerja dan belajar hingga hiburan. Hubungi tim kami untuk informasi ketersediaan dan pilihan paket.": "Enjoy fiber-optic connectivity for everyday activities at home, from work and study to entertainment. Contact our team for availability and package information.",
      "Lihat Layanan": "Explore Services",
      "Fiber Optik": "Fiber Optic",
      "Teknologi Koneksi": "Connection Technology",
      "Pilihan Paket": "Package Options",
      "Untuk Kebutuhan Rumah": "For Your Home",
      "Cek Jangkauan": "Check Availability",
      "Konfirmasi Alamat": "Confirm Your Address",
      "Koneksi Rumah untuk": "Home Internet for",
      "Aktivitas Sehari-hari": "Everyday Activities",
      "Pilih koneksi internet rumah sesuai kebutuhan penggunaan dan perangkat Anda.": "Choose a home internet connection that suits your usage and devices.",
      "Internet Fiber Optik": "Fiber Optic Internet",
      "Koneksi internet rumah melalui jaringan fiber optik untuk mendukung aktivitas online sehari-hari.": "Home internet through a fiber-optic network to support your everyday online activities.",
      "Belajar, Bekerja, dan Hiburan": "Study, Work, and Entertainment",
      "Gunakan koneksi untuk kebutuhan belajar, bekerja, komunikasi, dan menikmati hiburan di rumah.": "Use your connection for studying, working, communicating, and enjoying entertainment at home.",
      "Pilihan Paket": "Package Options",
      "Cakupan Jaringan": "Network Coverage",
      "Lihat paket": "View packages",
      "Lihat daftar harga": "View pricing",
      "Cek jangkauan": "Check availability",
      "Lihat Pricelist": "View Pricing",
      "Konsultasi": "Consultation",
      "SOLUSI KONEKTIVITAS BISNIS": "BUSINESS CONNECTIVITY SOLUTIONS",
      "Internet Dedicated untuk": "Dedicated Internet for",
      "Operasional Bisnis": "Business Operations",
      "Koneksi internet khusus untuk mendukung kebutuhan jaringan perusahaan dan organisasi. Diskusikan kebutuhan lokasi, kapasitas, dan dukungan layanan bersama tim FIBERTERRA NETWORK ID.": "A dedicated internet connection for the networking needs of businesses and organizations. Discuss your location, capacity, and support requirements with the FIBERTERRA NETWORK ID team.",
      "Koneksi yang Dirancang untuk": "Connectivity Designed for",
      "Kebutuhan Bisnis": "Business Needs",
      "Mulai dengan memahami kebutuhan operasional dan lokasi Anda agar tim kami dapat membantu membahas pilihan layanan yang sesuai.": "We start by understanding your operational needs and location so our team can discuss suitable service options.",
      "Akses Internet Dedicated": "Dedicated Internet Access",
      "Pilih paket dengan kapasitas 10, 20, 50, atau 100 Mbps sesuai daftar harga.": "Choose a 10, 20, 50, or 100 Mbps package from the price list.",
      "IP Publik dan Jaringan Lokal": "Public IP and Local Network",
      "Pricelist mencantumkan IP publik statis dan jaringan LAN pelanggan yang sudah tersedia.": "The price list includes a static public IP and the customer's existing LAN.",
      "Support dan Monitoring": "Support and Monitoring",
      "Dukungan onsite 24 jam sehari, 7 hari seminggu, monitoring MRTG, dan waktu respons maksimal 2 jam selama masa kontrak.": "On-site support is available 24/7, with MRTG monitoring and a maximum two-hour response time during the contract.",
      "SLA dan Ketentuan": "SLA and Terms",
      "Pricelist mencantumkan SLA 98% per bulan, instalasi gratis, dan masa kontrak minimum satu tahun.": "The price list includes a 98% monthly SLA, free installation, and a one-year minimum contract.",
      "PAKET INTERNET DEDICATED": "DEDICATED INTERNET PACKAGES",
      "Perencanaan IT yang Mendukung": "IT Planning That Supports",
      "Bisnis Anda": "Your Business",
      "KONSULTASI TEKNOLOGI INFORMASI": "INFORMATION TECHNOLOGY CONSULTING",
      "Dapatkan bantuan untuk memahami kebutuhan IT dan jaringan, menyusun rencana yang sesuai, serta menentukan langkah implementasi bersama tim FIBERTERRA NETWORK ID.": "Get help understanding your IT and networking needs, developing a suitable plan, and defining implementation steps with the FIBERTERRA NETWORK ID team.",
      "Pilih bidang konsultasi dan solusi IT yang sesuai dengan kebutuhan bisnis Anda.": "Choose IT consulting and solutions that fit your business needs.",
      "IT Consulting & Advisory": "IT Consulting & Advisory",
      "Konsultasi, analisis kebutuhan, audit, dan rekomendasi strategi IT untuk meningkatkan efisiensi operasional bisnis.": "IT consulting, needs analysis, audits, and strategy recommendations to improve business operations.",
      "Network & Infrastructure Solutions": "Network & Infrastructure Solutions",
      "Perancangan, instalasi, konfigurasi, dan pemeliharaan LAN, WAN, Wi-Fi, router, switch, dan fiber optik.": "Design, installation, configuration, and maintenance of LAN, WAN, Wi-Fi, routers, switches, and fiber optics.",
      "Software & Application Development": "Software & Application Development",
      "Pengembangan website, aplikasi mobile, dan sistem informasi sesuai kebutuhan untuk mendukung otomatisasi dan digitalisasi proses kerja.": "Custom websites, mobile apps, and information systems to support workflow automation and digital transformation.",
      "Cloud Computing & Server Management": "Cloud Computing & Server Management",
      "Implementasi dan pengelolaan cloud, server, hosting, virtualisasi, migrasi sistem, serta backup data.": "Cloud, server, and hosting implementation and management, including virtualization, system migration, and data backup.",
      "Cybersecurity Solutions": "Cybersecurity Solutions",
      "Perlindungan sistem dan jaringan melalui audit keamanan, firewall, kontrol akses, pemantauan ancaman, dan kebijakan keamanan informasi.": "Protect systems and networks with security audits, firewalls, access controls, threat monitoring, and information security policies.",
      "IT Support & Maintenance": "IT Support & Maintenance",
      "Dukungan teknis, pemecahan masalah hardware dan software, pemeliharaan perangkat, serta monitoring sistem.": "Technical support, hardware and software troubleshooting, device maintenance, and system monitoring.",
      "System Integration & Automation": "System Integration & Automation",
      "IT Managed Services": "IT Managed Services",
      "Lihat Cakupan": "View Services",
      "Mulai Diskusi": "Start a Discussion",
      "SERVER, NETWORKING, CCTV, KOMPUTER, LAPTOP, UPS & SPAREPART": "SERVERS, NETWORKING, CCTV, COMPUTERS, LAPTOPS, UPS & SPARE PARTS",
      "Perangkat untuk": "Devices for",
      "Infrastruktur IT": "IT Infrastructure",
      "Jelajahi pilihan server, storage dan data backup, perangkat networking, CCTV, absensi dan smartlock, komputer, laptop, UPS, sparepart, serta produk lainnya dari FIBERTERRA NETWORK ID. Hubungi tim kami untuk membahas ketersediaan dan kecocokannya dengan kebutuhan Anda.": "Explore servers, storage and data backup, networking equipment, CCTV, attendance and smart locks, computers, laptops, UPS, spare parts, and other products from FIBERTERRA NETWORK ID. Contact our team to discuss availability and what suits your needs.",
      "Lihat Brand": "View Brands",
      "Tanya Tim Kami": "Ask Our Team",
      "RESOURCE PRODUK": "PRODUCT RESOURCES",
      "Pilih kategori untuk melihat brand perangkat server, jaringan, CCTV, akses kontrol, komputer, laptop, UPS, dan sparepart yang tersedia untuk dikonsultasikan.": "Choose a category to explore brands for servers, networking, CCTV, access control, computers, laptops, UPS, and spare parts.",
      "Jelajahi brand untuk kebutuhan server, penyimpanan, dan backup data.": "Explore brands for servers, storage, and data backup.",
      "Temukan pilihan brand perangkat untuk kebutuhan infrastruktur jaringan.": "Find equipment brands for your network infrastructure needs.",
      "Jelajahi brand untuk kebutuhan pengawasan, absensi, dan kontrol akses.": "Explore brands for surveillance, attendance, and access control.",
      "Lihat pilihan brand komputer, laptop, dan UPS untuk kebutuhan perangkat Anda.": "Explore computer, laptop, and UPS brands for your device needs.",
      "Jelajahi brand sparepart untuk kebutuhan perangkat Dell, IBM, dan Hewlett Packard Enterprise.": "Explore spare-part brands for Dell, IBM, and Hewlett Packard Enterprise devices.",
      "Networking": "Networking",
      "CCTV, Absensi & Smartlock": "CCTV, Attendance & Smart Locks",
      "Komputer, Laptop & UPS": "Computers, Laptops & UPS",
      "Sparepart": "Spare Parts",
      "Hubungi Tim Kami": "Contact Our Team",
      "Tanya via WhatsApp": "Ask via WhatsApp",
      "Kontak Fiberterra": "Fiberterra Contact",
      "Kontak Kami": "Contact Us",
      "Menu": "Menu",
      "Menu Cepat": "Quick Links",
      "Email": "Email",
      "Informasi Layanan": "Service Information",
      "01 / KONEKSI RUMAH": "01 / HOME CONNECTION",
      "01 / KONSULTASI": "01 / CONSULTING",
      "01 / PILIHAN PAKET": "01 / PACKAGE OPTIONS",
      "01 / SERVER": "01 / SERVERS",
      "02 / AKTIVITAS": "02 / ACTIVITIES",
      "02 / JARINGAN": "02 / NETWORKING",
      "02 / PERSYARATAN": "02 / REQUIREMENTS",
      "03 / DUKUNGAN": "03 / SUPPORT",
      "03 / KEAMANAN": "03 / SECURITY",
      "03 / PAKET INTERNET": "03 / INTERNET PACKAGES",
      "03 / PENGEMBANGAN": "03 / DEVELOPMENT",
      "04 / CLOUD & SERVER": "04 / CLOUD & SERVERS",
      "04 / KETERSEDIAAN": "04 / AVAILABILITY",
      "04 / KOMITMEN LAYANAN": "04 / SERVICE COMMITMENT",
      "04 / PERANGKAT": "04 / DEVICES",
      "05 / KEAMANAN": "05 / SECURITY",
      "05 / KOMPONEN": "05 / COMPONENTS",
      "06 / DUKUNGAN": "06 / SUPPORT",
      "07 / INTEGRASI": "07 / INTEGRATION",
      "08 / PENGELOLAAN": "08 / MANAGEMENT",
      "ARAH DAN KOMITMEN": "DIRECTION AND COMMITMENT",
      "Alamat": "Address",
      "Anda Ketahui": "You Should Know",
      "Bandingkan pilihan paket broadband yang tercantum.": "Compare the available broadband packages.",
      "Bandingkan pilihan paket yang tercantum pada daftar harga sebelum menghubungi tim kami.": "Compare the packages on the price list before contacting our team.",
      "Bicarakan Kebutuhan": "Discuss Your Needs",
      "Brand untuk Berbagai": "Brands for Every",
      "Butuh rekomendasi paket? Tim kami siap membantu.": "Need a package recommendation? Our team is ready to help.",
      "CARA KAMI BEKERJA": "HOW WE WORK",
      "Cakupan Area": "Coverage Area",
      "Cakupan IT": "IT Services",
      "Cakupan Layanan": "Service Coverage",
      "Cara Kami Bekerja": "How We Work",
      "Cek Ketersediaan Jaringan": "Check Network Availability",
      "Ceritakan Kebutuhan": "Tell Us What You Need",
      "Ceritakan kebutuhan dan rencana Anda. Tim kami akan membantu memberikan informasi tentang produk, ketersediaan, dan langkah konsultasi berikutnya.": "Tell us about your needs and plans. Our team can provide information about products, availability, and the next steps for a consultation.",
      "Ceritakan kebutuhan koneksi rumah Anda. Tim FIBERTERRA NETWORK ID siap membantu memberikan informasi paket dan ketersediaan jaringan.": "Tell us about your home internet needs. The FIBERTERRA NETWORK ID team can help with package and network availability information.",
      "Digital Tertentu?": "Digital Needs?",
      "Dukung": "Support",
      "Dukungan": "Support",
      "FIBERTERRA NETWORK ID hadir untuk membantu memenuhi kebutuhan konektivitas internet dan teknologi informasi. Kami melayani kebutuhan internet fiber optik rumah dan bisnis, serta menyediakan ruang konsultasi untuk kebutuhan IT dan perangkat infrastruktur.": "FIBERTERRA NETWORK ID helps meet internet connectivity and information technology needs. We provide home and business fiber internet, IT consultations, and infrastructure equipment.",
      "FIBERTERRA NETWORK ID menyediakan layanan internet fiber optik untuk mendukung kebutuhan digital rumah di Aceh. Hubungi tim kami untuk memperoleh informasi paket, jangkauan jaringan, dan dukungan layanan.": "FIBERTERRA NETWORK ID provides fiber-optic internet for homes in Aceh. Contact our team for information about packages, network coverage, and support.",
      "FNI / INTERNET DEDICATED": "FNI / DEDICATED INTERNET",
      "FNI / PILIHAN PAKET": "FNI / PACKAGE OPTIONS",
      "Gunakan informasi kontak untuk bertanya mengenai layanan.": "Use the contact details to ask about our services.",
      "HUBUNGI KAMI": "CONTACT US",
      "Hal yang Perlu": "What You Should",
      "Harga Kompetitif dan Transparan": "Competitive, Transparent Pricing",
      "Harga belum termasuk PPN 11%; masa kontrak minimum satu tahun.": "Prices exclude 11% VAT. A one-year minimum contract applies.",
      "Hubungi Kami Sekarang": "Contact Us Now",
      "Hubungi Kami untuk Berlangganan": "Contact Us to Subscribe",
      "Hubungi kami untuk membahas kebutuhan konsultasi IT dan jaringan bagi bisnis atau organisasi Anda.": "Contact us to discuss IT consulting and networking needs for your business or organization.",
      "Hubungi tim FIBERTERRA NETWORK ID untuk bertanya tentang layanan, cakupan jaringan, atau kebutuhan teknologi Anda.": "Contact FIBERTERRA NETWORK ID with questions about our services, network coverage, or technology needs.",
      "Hubungi tim kami untuk memperoleh informasi lebih lanjut tentang ketersediaan brand dan perangkat yang ditampilkan.": "Contact our team for more information about the availability of the brands and devices shown.",
      "Hubungi tim kami untuk menanyakan layanan internet dedicated dan informasi ketersediaan di lokasi Anda.": "Contact our team about dedicated internet service and availability at your location.",
      "INFORMASI LAYANAN": "SERVICE INFORMATION",
      "INTERNET BROADBAND": "BROADBAND INTERNET",
      "INTERNET DEDICATED": "DEDICATED INTERNET",
      "IT KONSULTAN": "IT CONSULTING",
      "Informasi Paket": "Package Information",
      "Informasi mengenai jaringan yang digunakan untuk layanan broadband.": "Information about the network used for broadband service.",
      "Informasikan lokasi dan kebutuhan konektivitas bisnis Anda. Tim FIBERTERRA NETWORK ID dapat membantu menjelaskan ketersediaan layanan dan pilihan yang relevan.": "Tell us your location and business connectivity needs. The FIBERTERRA NETWORK ID team can explain service availability and relevant options.",
      "Integrasi aplikasi, database, perangkat, dan sistem bisnis, beserta otomatisasi proses untuk meningkatkan produktivitas.": "Integrate applications, databases, devices, and business systems, and automate processes to improve productivity.",
      "JARINGAN KAMI": "OUR NETWORK",
      "Jaringan Bisnis Anda": "Your Business Network",
      "Jaringan di Area Anda": "Network in Your Area",
      "Jelajahi Layanan": "Explore Our Services",
      "Jelaskan": "Explain",
      "Jelaskan kebutuhan atau kendala IT yang sedang dihadapi. Tim kami akan membantu membahas kemungkinan solusi dan informasi layanan yang relevan.": "Describe your IT needs or challenges. Our team can discuss possible solutions and relevant services.",
      "KONSULTASI AWAL": "INITIAL CONSULTATION",
      "Kami membantu memperjelas kebutuhan dan pilihan, tanpa mengabaikan kesesuaian layanan dengan kondisi pengguna.": "We help clarify your needs and options, while making sure the service suits your situation.",
      "Kami membantu rumah, bisnis, dan organisasi di Aceh menjelajahi kebutuhan konektivitas dan teknologi informasi dengan informasi yang jelas serta dukungan yang tepat.": "We help households, businesses, and organizations in Aceh find connectivity and IT solutions through clear information and helpful support.",
      "Kami mengutamakan pemahaman terhadap kebutuhan dan kondisi pengguna sebelum membahas layanan yang sesuai. Ketersediaan layanan, cakupan jaringan, serta pilihan produk dapat dikonsultasikan langsung dengan tim kami.": "We take time to understand your needs and circumstances before discussing suitable services. Contact our team to ask about availability, network coverage, or products.",
      "Kategori Produk": "Product Categories",
      "Kebutuhan": "Needs",
      "Kebutuhan Anda": "Your Needs",
      "Kebutuhan Infrastruktur": "Infrastructure Needs",
      "Kenali Kami Lebih Lanjut": "Learn More About Us",
      "Ketersediaan internet broadband dapat berbeda menurut alamat. Hubungi tim kami untuk menanyakan cakupan layanan di lokasi Anda.": "Broadband availability varies by address. Contact our team to check coverage at your location.",
      "Komunikasi": "Communication",
      "Koneksi Anda": "Your Connection",
      "Konsultasi dan Solusi IT": "IT Consulting and Solutions",
      "Konsultasikan Kebutuhan": "Discuss Your Needs",
      "Konsultasikan Paket": "Discuss Your Package",
      "Kontak Layanan": "Service Support",
      "LANGKAH SELANJUTNYA": "NEXT STEPS",
      "LAYANAN KAMI": "OUR SERVICES",
      "Langkah Berikutnya": "Next Steps",
      "Lanjut ke Solusi": "Moving Toward a Solution",
      "Layanan yang Berangkat dari": "Services That Start with",
      "Lihat Pilihan Layanan": "Explore Service Options",
      "Lihat brand": "View brands",
      "Lihat halaman pilihan layanan untuk informasi internet broadband, internet dedicated, konsultasi IT, dan produk infrastruktur.": "Visit our service selection page for broadband, dedicated internet, IT consulting, and infrastructure products.",
      "Lihat pilihan paket internet broadband untuk kebutuhan koneksi rumah.": "Explore broadband packages for your home internet needs.",
      "MISI": "MISSION",
      "Mari Bahas": "Let's Discuss",
      "Memahami kebutuhan sebelum merekomendasikan layanan atau perangkat.": "Understand your needs before recommending services or devices.",
      "Membahas layanan, cakupan, atau perangkat yang relevan.": "Discuss relevant services, coverage, or equipment.",
      "Membangun Koneksi,": "Building Connections,",
      "Membantu menyusun tindak lanjut berdasarkan kebutuhan yang telah dibahas.": "Plan next steps based on the needs discussed.",
      "Memberikan Solusi yang Sesuai Kebutuhan": "Providing Solutions That Fit Your Needs",
      "Mendengarkan tujuan, lokasi, serta kebutuhan penggunaan Anda.": "Understand your goals, location, and how you plan to use the service.",
      "Mendukung Potensi": "Supporting Potential",
      "Mendukung kebutuhan konektivitas dan IT melalui komunikasi yang responsif.": "Support your connectivity and IT needs with responsive communication.",
      "Mengenal": "Meet",
      "Menghubungkan Kebutuhan,": "Connecting Needs,",
      "Menghubungkan Potensi": "Connecting Potential",
      "Menghubungkan kebutuhan bisnis dengan solusi konektivitas yang tepat.": "Connecting business needs with the right connectivity solutions.",
      "Menghubungkan kebutuhan dengan pilihan konektivitas dan teknologi yang sesuai.": "Connecting your needs with suitable connectivity and technology options.",
      "Menghubungkan kebutuhan digital dengan pilihan solusi yang tepat.": "Connecting digital needs with the right solutions.",
      "Menghubungkan kebutuhan teknologi dengan rencana solusi yang tepat.": "Connecting technology needs with the right solution plan.",
      "Menghubungkan masyarakat dan bisnis melalui layanan internet fiber optik yang andal dan siap berkembang.": "Connecting communities and businesses with reliable, scalable fiber-optic internet.",
      "Menjadi Mitra Teknologi yang Andal": "A Reliable Technology Partner",
      "Menjadi mitra yang dapat diandalkan dalam mendukung konektivitas dan kebutuhan teknologi informasi masyarakat, bisnis, dan organisasi, khususnya di Aceh.": "Be a trusted partner for the connectivity and IT needs of communities, businesses, and organizations, especially in Aceh.",
      "Menyampaikan informasi layanan dan cakupan secara jelas.": "Provide clear information about services and coverage.",
      "Menyediakan jalur konsultasi untuk pertanyaan tentang layanan kami.": "Offer consultation for questions about our services.",
      "Misi": "Mission",
      "Mulai dari Kebutuhan,": "Start with Your Needs,",
      "PAKET HARGA": "PRICING",
      "PRODUK DAN SOLUSI DIGITAL": "DIGITAL PRODUCTS AND SOLUTIONS",
      "Pahami": "Understand",
      "Pengecekan Alamat": "Address Check",
      "Pengelolaan dan pemantauan infrastruktur IT berkelanjutan melalui kontrak bulanan atau tahunan, termasuk jaringan, server, dan dukungan teknis.": "Ongoing management and monitoring of IT infrastructure through monthly or annual contracts, including networking, servers, and technical support.",
      "Periksa Ketersediaan": "Check Availability",
      "Periksa detail koneksi dan layanan sebelum menentukan paket internet untuk rumah Anda.": "Review connection and service details before choosing a home internet package.",
      "Pilih Layanan": "Choose a Service",
      "Pilih Paket Sesuai": "Choose a Package for",
      "Pilihan": "Options",
      "Pilihan perangkat dan brand yang dapat dikonsultasikan sesuai kebutuhan bisnis Anda.": "Explore device and brand options to discuss for your business.",
      "Pricelist FIBERTERRA NETWORK ID": "FIBERTERRA NETWORK ID price list",
      "Pricelist Internet Dedicated FIBERTERRA NETWORK ID": "FIBERTERRA NETWORK ID dedicated internet price list",
      "Prinsip yang menjadi arah kami dalam membantu kebutuhan konektivitas dan teknologi.": "The principles that guide how we support connectivity and technology needs.",
      "Punya Kebutuhan": "Have a Need?",
      "Rencanakan": "Plan",
      "Rencanakan Solusi IT": "Plan Your IT Solution",
      "Resource Brand": "Brand Resources",
      "Resource Produk": "Product Resources",
      "Rincian kapasitas, biaya bulanan, biaya instalasi, dan ketentuan layanan internet dedicated.": "Details about dedicated internet capacity, monthly fees, installation costs, and service terms.",
      "SIAP MEMBANTU ANDA TERHUBUNG": "HERE TO HELP YOU CONNECT",
      "Sampaikan Tantangan": "Tell Us About Your Challenges",
      "Server & Storage": "Servers & Storage",
      "Server & Storage Data Backup": "Servers, Storage & Data Backup",
      "Siap Memilih Internet": "Ready to Choose Internet",
      "TEMUKAN SOLUSI YANG SESUAI": "FIND THE RIGHT SOLUTION",
      "TENTANG KAMI": "ABOUT US",
      "Tanyakan kepada tim kami apakah layanan tersedia di alamat Anda.": "Ask our team whether service is available at your address.",
      "Tanyakan ketersediaan jaringan untuk lokasi pemasangan.": "Ask about network availability at your installation address.",
      "Teknologi Anda": "Your Technology",
      "Teknologi Fiber Optik Terkini": "Modern Fiber-Optic Technology",
      "Telepon / WhatsApp": "Phone / WhatsApp",
      "Temukan Layanan": "Explore Services",
      "Tim Teknisi Berpengalaman": "Experienced Technicians",
      "VISI": "VISION",
      "Visi &": "Vision &",
      "untuk Rumah Anda?": "for Your Home?",
      "yang Anda Butuhkan": "That You Need",
      "yang Tepat": "That Fits",
      "© 2026 FIBERTERRA NETWORK ID. All Rights Reserved.": "© 2026 FIBERTERRA NETWORK ID. All rights reserved.",
      "Paket dan Ketentuan": "Packages and Terms"
    },
    zh: {
      "Kembali ke atas halaman": "返回页面顶部",
      "Buka menu navigasi": "打开导航菜单",
      "Tutup menu navigasi": "关闭导航菜单",
      "Pilih Layanan | FIBERTERRA NETWORK ID": "选择服务 | FIBERTERRA NETWORK ID",
      "Layanan FIBERTERRA NETWORK ID: internet dedicated, home broadband, IT konsultan, dan produk lainnya.": "FIBERTERRA NETWORK ID 服务：专线互联网、家庭宽带、IT 咨询及其他产品。",
      "Lewati ke pilihan layanan": "跳转至服务选择",
      "Pilih Layanan FIBERTERRA NETWORK ID": "选择 FIBERTERRA NETWORK ID 服务",
      "Layanan FIBERTERRA NETWORK ID": "FIBERTERRA NETWORK ID 服务",
      "Buka beranda perusahaan": "打开公司主页",
      "Ikon FIBERTERRA NETWORK ID": "FIBERTERRA NETWORK ID 图标",
      "Home Broadband": "家庭宽带",
      "Layanan IT Konsultan": "IT咨询服务",
      "Beranda | FIBERTERRA NETWORK ID": "首页 | FIBERTERRA NETWORK ID",
      "Internet Broadband | FIBERTERRA NETWORK ID": "宽带互联网 | FIBERTERRA NETWORK ID",
      "Internet Dedicated | FIBERTERRA NETWORK ID": "专线互联网 | FIBERTERRA NETWORK ID",
      "IT Konsultan | FIBERTERRA NETWORK ID": "IT咨询 | FIBERTERRA NETWORK ID",
      "Produk Lainnya | FIBERTERRA NETWORK ID": "其他产品 | FIBERTERRA NETWORK ID",
      "Kenali FIBERTERRA NETWORK ID, visi, misi, dan komitmen kami dalam membantu kebutuhan konektivitas serta teknologi informasi.": "了解 FIBERTERRA NETWORK ID，以及我们在满足网络连接和信息技术需求方面的愿景、使命与承诺。",
      "Layanan internet broadband fiber optik FIBERTERRA NETWORK ID untuk kebutuhan rumah di Aceh.": "FIBERTERRA NETWORK ID 为亚齐家庭提供的光纤宽带服务。",
      "Informasi layanan internet dedicated FIBERTERRA NETWORK ID untuk kebutuhan konektivitas bisnis di Aceh.": "FIBERTERRA NETWORK ID 为亚齐企业网络连接提供的专线互联网服务。",
      "Layanan konsultasi IT dan jaringan dari FIBERTERRA NETWORK ID untuk membantu merencanakan kebutuhan teknologi bisnis Anda.": "FIBERTERRA NETWORK ID 提供 IT 和网络咨询，助您规划企业技术需求。",
      "Server, storage & backup, networking, CCTV, smartlock, komputer, laptop, UPS, dan sparepart untuk kebutuhan infrastruktur IT Anda.": "满足 IT 基础设施需求的服务器、存储与备份、网络设备、监控、智能门锁、电脑、笔记本、UPS 和配件。",
      "Lewati ke konten utama": "跳转至主要内容",
      "Navigasi utama": "主导航",
      "Beranda": "首页",
      "Tentang Kami": "关于我们",
      "Visi & Misi": "愿景与使命",
      "Layanan": "服务",
      "Kontak": "联系",
      "Hubungi Kami": "联系我们",
      "Indonesia": "印度尼西亚",
      "English": "英语",
      "中文": "中文",
      "العربية": "阿拉伯语",
      "Internet Broadband": "宽带互联网",
      "Internet Dedicated": "专线互联网",
      "Jaringan": "网络",
      "Pricelist": "价格表",
      "IT Konsultan": "IT咨询",
      "Produk Lainnya": "其他产品",
      "Pilih layanan untuk melihat informasi lengkap pada halaman terkait.": "选择一项服务，查看对应页面上的详细信息。",
      "INTERNET BROADBAND RUMAH": "家庭宽带互联网",
      "Internet Broadband untuk": "为",
      "Rumah Anda": "您的家庭提供宽带互联网",
      "Nikmati koneksi fiber optik untuk mendukung aktivitas harian di rumah, mulai dari bekerja dan belajar hingga hiburan. Hubungi tim kami untuk informasi ketersediaan dan pilihan paket.": "畅享光纤连接，满足您在家工作的学习和娱乐等日常需求。请联系我们了解服务覆盖范围和套餐信息。",
      "Lihat Layanan": "查看服务",
      "Fiber Optik": "光纤",
      "Teknologi Koneksi": "连接技术",
      "Pilihan Paket": "套餐选择",
      "Untuk Kebutuhan Rumah": "满足家庭需求",
      "Cek Jangkauan": "查询覆盖范围",
      "Konfirmasi Alamat": "确认地址",
      "Koneksi Rumah untuk": "家庭网络连接，满足",
      "Aktivitas Sehari-hari": "日常活动需求",
      "Pilih koneksi internet rumah sesuai kebutuhan penggunaan dan perangkat Anda.": "根据您的使用需求和设备选择合适的家庭互联网连接。",
      "Internet Fiber Optik": "光纤互联网",
      "Koneksi internet rumah melalui jaringan fiber optik untuk mendukung aktivitas online sehari-hari.": "通过光纤网络提供家庭互联网，满足日常在线需求。",
      "Belajar, Bekerja, dan Hiburan": "学习、工作与娱乐",
      "Gunakan koneksi untuk kebutuhan belajar, bekerja, komunikasi, dan menikmati hiburan di rumah.": "满足您在家学习、工作、沟通和娱乐的连接需求。",
      "Pilihan Paket": "套餐选择",
      "Cakupan Jaringan": "网络覆盖",
      "Lihat paket": "查看套餐",
      "Lihat daftar harga": "查看价格表",
      "Cek jangkauan": "查询覆盖范围",
      "Lihat Pricelist": "查看价格表",
      "Konsultasi": "咨询",
      "SOLUSI KONEKTIVITAS BISNIS": "企业连接解决方案",
      "Internet Dedicated untuk": "专线互联网，满足",
      "Operasional Bisnis": "企业运营需求",
      "Koneksi internet khusus untuk mendukung kebutuhan jaringan perusahaan dan organisasi. Diskusikan kebutuhan lokasi, kapasitas, dan dukungan layanan bersama tim FIBERTERRA NETWORK ID.": "专用互联网连接，满足企业和组织的网络需求。欢迎与 FIBERTERRA NETWORK ID 团队讨论地点、带宽和支持服务需求。",
      "Koneksi yang Dirancang untuk": "专为以下需求设计的连接",
      "Kebutuhan Bisnis": "企业需求",
      "Mulai dengan memahami kebutuhan operasional dan lokasi Anda agar tim kami dapat membantu membahas pilihan layanan yang sesuai.": "我们会先了解您的运营需求和地点，以便团队为您介绍合适的服务方案。",
      "Akses Internet Dedicated": "专线互联网接入",
      "Pilih paket dengan kapasitas 10, 20, 50, atau 100 Mbps sesuai daftar harga.": "根据价格表选择 10、20、50 或 100 Mbps 套餐。",
      "IP Publik dan Jaringan Lokal": "公网IP和本地网络",
      "Pricelist mencantumkan IP publik statis dan jaringan LAN pelanggan yang sudah tersedia.": "价格表包含静态公网 IP 和客户现有的局域网。",
      "Support dan Monitoring": "支持与监控",
      "Dukungan onsite 24 jam sehari, 7 hari seminggu, monitoring MRTG, dan waktu respons maksimal 2 jam selama masa kontrak.": "合同期内提供全天候现场支持、MRTG 监控和最长两小时响应时间。",
      "SLA dan Ketentuan": "SLA与服务条款",
      "Pricelist mencantumkan SLA 98% per bulan, instalasi gratis, dan masa kontrak minimum satu tahun.": "价格表列明每月 98% 的 SLA、免费安装和至少一年的合同期限。",
      "PAKET INTERNET DEDICATED": "专线互联网套餐",
      "Perencanaan IT yang Mendukung": "助力业务发展的IT规划",
      "Bisnis Anda": "您的企业",
      "KONSULTASI TEKNOLOGI INFORMASI": "信息技术咨询",
      "Dapatkan bantuan untuk memahami kebutuhan IT dan jaringan, menyusun rencana yang sesuai, serta menentukan langkah implementasi bersama tim FIBERTERRA NETWORK ID.": "与 FIBERTERRA NETWORK ID 团队一起了解 IT 和网络需求、制定合适的计划并确定实施步骤。",
      "Pilih bidang konsultasi dan solusi IT yang sesuai dengan kebutuhan bisnis Anda.": "选择符合您业务需求的 IT 咨询和解决方案。",
      "IT Consulting & Advisory": "IT咨询与顾问服务",
      "Konsultasi, analisis kebutuhan, audit, dan rekomendasi strategi IT untuk meningkatkan efisiensi operasional bisnis.": "通过 IT 咨询、需求分析、审计和策略建议提升业务运营效率。",
      "Network & Infrastructure Solutions": "网络与基础设施解决方案",
      "Perancangan, instalasi, konfigurasi, dan pemeliharaan LAN, WAN, Wi-Fi, router, switch, dan fiber optik.": "提供 LAN、WAN、Wi-Fi、路由器、交换机和光纤的设计、安装、配置与维护。",
      "Software & Application Development": "软件与应用开发",
      "Pengembangan website, aplikasi mobile, dan sistem informasi sesuai kebutuhan untuk mendukung otomatisasi dan digitalisasi proses kerja.": "根据需求开发网站、移动应用和信息系统，助力工作流程自动化和数字化。",
      "Cloud Computing & Server Management": "云计算与服务器管理",
      "Implementasi dan pengelolaan cloud, server, hosting, virtualisasi, migrasi sistem, serta backup data.": "提供云、服务器和主机实施与管理，以及虚拟化、系统迁移和数据备份。",
      "Cybersecurity Solutions": "网络安全解决方案",
      "Perlindungan sistem dan jaringan melalui audit keamanan, firewall, kontrol akses, pemantauan ancaman, dan kebijakan keamanan informasi.": "通过安全审计、防火墙、访问控制、威胁监控和信息安全策略保护系统与网络。",
      "IT Support & Maintenance": "IT支持与维护",
      "Dukungan teknis, pemecahan masalah hardware dan software, pemeliharaan perangkat, serta monitoring sistem.": "提供技术支持、软硬件故障排除、设备维护和系统监控。",
      "System Integration & Automation": "系统集成与自动化",
      "IT Managed Services": "IT托管服务",
      "Lihat Cakupan": "查看服务范围",
      "Mulai Diskusi": "开始沟通",
      "SERVER, NETWORKING, CCTV, KOMPUTER, LAPTOP, UPS & SPAREPART": "服务器、网络、监控、电脑、笔记本、UPS及配件",
      "Perangkat untuk": "适用于",
      "Infrastruktur IT": "IT基础设施",
      "Jelajahi pilihan server, storage dan data backup, perangkat networking, CCTV, absensi dan smartlock, komputer, laptop, UPS, sparepart, serta produk lainnya dari FIBERTERRA NETWORK ID. Hubungi tim kami untuk membahas ketersediaan dan kecocokannya dengan kebutuhan Anda.": "探索 FIBERTERRA NETWORK ID 提供的服务器、存储与数据备份、网络设备、监控、考勤与智能门锁、电脑、笔记本、UPS、配件等产品。请联系我们讨论库存及适用方案。",
      "Lihat Brand": "查看品牌",
      "Tanya Tim Kami": "咨询我们的团队",
      "RESOURCE PRODUK": "产品资源",
      "Pilih kategori untuk melihat brand perangkat server, jaringan, CCTV, akses kontrol, komputer, laptop, UPS, dan sparepart yang tersedia untuk dikonsultasikan.": "选择类别，查看可供咨询的服务器、网络、监控、门禁、电脑、笔记本、UPS及配件品牌。",
      "Jelajahi brand untuk kebutuhan server, penyimpanan, dan backup data.": "探索服务器、存储和数据备份品牌。",
      "Temukan pilihan brand perangkat untuk kebutuhan infrastruktur jaringan.": "查找满足网络基础设施需求的设备品牌。",
      "Jelajahi brand untuk kebutuhan pengawasan, absensi, dan kontrol akses.": "探索监控、考勤和门禁品牌。",
      "Lihat pilihan brand komputer, laptop, dan UPS untuk kebutuhan perangkat Anda.": "查看适合您设备需求的电脑、笔记本和 UPS 品牌。",
      "Jelajahi brand sparepart untuk kebutuhan perangkat Dell, IBM, dan Hewlett Packard Enterprise.": "探索适用于 Dell、IBM 和 Hewlett Packard Enterprise 设备的配件品牌。",
      "Networking": "网络设备",
      "CCTV, Absensi & Smartlock": "监控、考勤与智能门锁",
      "Komputer, Laptop & UPS": "电脑、笔记本与UPS",
      "Sparepart": "配件",
      "Hubungi Tim Kami": "联系我们的团队",
      "Tanya via WhatsApp": "通过WhatsApp咨询",
      "Kontak Fiberterra": "Fiberterra联系方式",
      "Kontak Kami": "联系我们",
      "Menu": "菜单",
      "Menu Cepat": "快速链接",
      "Email": "电子邮件",
      "Informasi Layanan": "服务信息",
      "01 / KONEKSI RUMAH": "01 / 家庭连接",
      "01 / KONSULTASI": "01 / 咨询",
      "01 / PILIHAN PAKET": "01 / 套餐选择",
      "01 / SERVER": "01 / 服务器",
      "02 / AKTIVITAS": "02 / 活动场景",
      "02 / JARINGAN": "02 / 网络",
      "02 / PERSYARATAN": "02 / 服务要求",
      "03 / DUKUNGAN": "03 / 支持",
      "03 / KEAMANAN": "03 / 安全",
      "03 / PAKET INTERNET": "03 / 互联网套餐",
      "03 / PENGEMBANGAN": "03 / 开发",
      "04 / CLOUD & SERVER": "04 / 云与服务器",
      "04 / KETERSEDIAAN": "04 / 服务覆盖",
      "04 / KOMITMEN LAYANAN": "04 / 服务承诺",
      "04 / PERANGKAT": "04 / 设备",
      "05 / KEAMANAN": "05 / 安全",
      "05 / KOMPONEN": "05 / 配件",
      "06 / DUKUNGAN": "06 / 支持",
      "07 / INTEGRASI": "07 / 集成",
      "08 / PENGELOLAAN": "08 / 管理",
      "ARAH DAN KOMITMEN": "方向与承诺",
      "Alamat": "地址",
      "Anda Ketahui": "了解更多",
      "Bandingkan pilihan paket broadband yang tercantum.": "比较可选的宽带套餐。",
      "Bandingkan pilihan paket yang tercantum pada daftar harga sebelum menghubungi tim kami.": "联系我们之前，请先比较价格表中的套餐。",
      "Bicarakan Kebutuhan": "讨论您的需求",
      "Brand untuk Berbagai": "满足多种需求的品牌",
      "Butuh rekomendasi paket? Tim kami siap membantu.": "需要套餐建议？我们的团队随时为您提供帮助。",
      "CARA KAMI BEKERJA": "我们的工作方式",
      "Cakupan Area": "覆盖区域",
      "Cakupan IT": "IT服务范围",
      "Cakupan Layanan": "服务范围",
      "Cara Kami Bekerja": "我们的工作方式",
      "Cek Ketersediaan Jaringan": "查询网络覆盖",
      "Ceritakan Kebutuhan": "告诉我们您的需求",
      "Ceritakan kebutuhan dan rencana Anda. Tim kami akan membantu memberikan informasi tentang produk, ketersediaan, dan langkah konsultasi berikutnya.": "请告诉我们您的需求和计划。我们的团队将为您介绍产品、供货情况以及后续咨询步骤。",
      "Ceritakan kebutuhan koneksi rumah Anda. Tim FIBERTERRA NETWORK ID siap membantu memberikan informasi paket dan ketersediaan jaringan.": "请告诉我们您的家庭网络需求。FIBERTERRA NETWORK ID 团队将为您介绍套餐和网络覆盖情况。",
      "Digital Tertentu?": "数字需求？",
      "Dukung": "支持",
      "Dukungan": "支持服务",
      "FIBERTERRA NETWORK ID hadir untuk membantu memenuhi kebutuhan konektivitas internet dan teknologi informasi. Kami melayani kebutuhan internet fiber optik rumah dan bisnis, serta menyediakan ruang konsultasi untuk kebutuhan IT dan perangkat infrastruktur.": "FIBERTERRA NETWORK ID 助您满足互联网连接和信息技术需求。我们提供家庭与企业光纤互联网、IT咨询及基础设施设备。",
      "FIBERTERRA NETWORK ID menyediakan layanan internet fiber optik untuk mendukung kebutuhan digital rumah di Aceh. Hubungi tim kami untuk memperoleh informasi paket, jangkauan jaringan, dan dukungan layanan.": "FIBERTERRA NETWORK ID 提供光纤互联网，满足亚齐家庭的数字需求。请联系我们了解套餐、网络覆盖和服务支持。",
      "FNI / INTERNET DEDICATED": "FNI / 专线互联网",
      "FNI / PILIHAN PAKET": "FNI / 套餐选择",
      "Gunakan informasi kontak untuk bertanya mengenai layanan.": "请通过联系方式咨询服务。",
      "HUBUNGI KAMI": "联系我们",
      "Hal yang Perlu": "您需要了解的",
      "Harga Kompetitif dan Transparan": "价格实惠且透明",
      "Harga belum termasuk PPN 11%; masa kontrak minimum satu tahun.": "价格不含11%的增值税；最低合同期限为一年。",
      "Hubungi Kami Sekarang": "立即联系我们",
      "Hubungi Kami untuk Berlangganan": "联系我们开通服务",
      "Hubungi kami untuk membahas kebutuhan konsultasi IT dan jaringan bagi bisnis atau organisasi Anda.": "欢迎联系我们，讨论您的企业或组织的IT咨询与网络需求。",
      "Hubungi tim FIBERTERRA NETWORK ID untuk bertanya tentang layanan, cakupan jaringan, atau kebutuhan teknologi Anda.": "如需了解服务、网络覆盖或技术方案，请联系 FIBERTERRA NETWORK ID 团队。",
      "Hubungi tim kami untuk memperoleh informasi lebih lanjut tentang ketersediaan brand dan perangkat yang ditampilkan.": "如需了解所展示品牌和设备的供货情况，请联系我们。",
      "Hubungi tim kami untuk menanyakan layanan internet dedicated dan informasi ketersediaan di lokasi Anda.": "欢迎联系我们，了解专线互联网服务及您所在地区的覆盖情况。",
      "INFORMASI LAYANAN": "服务信息",
      "INTERNET BROADBAND": "宽带互联网",
      "INTERNET DEDICATED": "专线互联网",
      "IT KONSULTAN": "IT咨询",
      "Informasi Paket": "套餐信息",
      "Informasi mengenai jaringan yang digunakan untuk layanan broadband.": "了解宽带服务所使用的网络。",
      "Informasikan lokasi dan kebutuhan konektivitas bisnis Anda. Tim FIBERTERRA NETWORK ID dapat membantu menjelaskan ketersediaan layanan dan pilihan yang relevan.": "请告知您的位置和企业网络需求。FIBERTERRA NETWORK ID 团队可为您介绍服务覆盖和相关方案。",
      "Integrasi aplikasi, database, perangkat, dan sistem bisnis, beserta otomatisasi proses untuk meningkatkan produktivitas.": "集成应用、数据库、设备和业务系统，并通过流程自动化提升生产力。",
      "JARINGAN KAMI": "我们的网络",
      "Jaringan Bisnis Anda": "您的企业网络",
      "Jaringan di Area Anda": "您所在区域的网络",
      "Jelajahi Layanan": "探索服务",
      "Jelaskan": "说明",
      "Jelaskan kebutuhan atau kendala IT yang sedang dihadapi. Tim kami akan membantu membahas kemungkinan solusi dan informasi layanan yang relevan.": "请说明您目前的IT需求或问题。我们的团队将与您探讨可能的解决方案和相关服务。",
      "KONSULTASI AWAL": "初步咨询",
      "Kami membantu memperjelas kebutuhan dan pilihan, tanpa mengabaikan kesesuaian layanan dengan kondisi pengguna.": "我们帮助您厘清需求与选择，并确保服务适合您的实际情况。",
      "Kami membantu rumah, bisnis, dan organisasi di Aceh menjelajahi kebutuhan konektivitas dan teknologi informasi dengan informasi yang jelas serta dukungan yang tepat.": "我们通过清晰的信息和贴心支持，帮助亚齐的家庭、企业和组织找到合适的网络与IT方案。",
      "Kami mengutamakan pemahaman terhadap kebutuhan dan kondisi pengguna sebelum membahas layanan yang sesuai. Ketersediaan layanan, cakupan jaringan, serta pilihan produk dapat dikonsultasikan langsung dengan tim kami.": "我们会先了解您的需求和实际情况，再讨论合适的服务。欢迎直接咨询服务可用性、网络覆盖和产品选择。",
      "Kategori Produk": "产品类别",
      "Kebutuhan": "需求",
      "Kebutuhan Anda": "您的需求",
      "Kebutuhan Infrastruktur": "基础设施需求",
      "Kenali Kami Lebih Lanjut": "进一步了解我们",
      "Ketersediaan internet broadband dapat berbeda menurut alamat. Hubungi tim kami untuk menanyakan cakupan layanan di lokasi Anda.": "宽带服务覆盖因地址而异。请联系我们查询您所在位置的服务范围。",
      "Komunikasi": "沟通",
      "Koneksi Anda": "您的连接",
      "Konsultasi dan Solusi IT": "IT咨询与解决方案",
      "Konsultasikan Kebutuhan": "咨询您的需求",
      "Konsultasikan Paket": "咨询套餐",
      "Kontak Layanan": "服务支持",
      "LANGKAH SELANJUTNYA": "后续步骤",
      "LAYANAN KAMI": "我们的服务",
      "Langkah Berikutnya": "下一步",
      "Lanjut ke Solusi": "迈向解决方案",
      "Layanan yang Berangkat dari": "从需求出发的服务",
      "Lihat Pilihan Layanan": "查看服务选项",
      "Lihat brand": "查看品牌",
      "Lihat halaman pilihan layanan untuk informasi internet broadband, internet dedicated, konsultasi IT, dan produk infrastruktur.": "请查看服务页面，了解宽带、专线互联网、IT咨询和基础设施产品。",
      "Lihat pilihan paket internet broadband untuk kebutuhan koneksi rumah.": "查看适合家庭网络需求的宽带套餐。",
      "MISI": "使命",
      "Mari Bahas": "一起讨论",
      "Memahami kebutuhan sebelum merekomendasikan layanan atau perangkat.": "先了解需求，再推荐服务或设备。",
      "Membahas layanan, cakupan, atau perangkat yang relevan.": "讨论相关服务、覆盖范围或设备。",
      "Membangun Koneksi,": "构建连接，",
      "Membantu menyusun tindak lanjut berdasarkan kebutuhan yang telah dibahas.": "根据已讨论的需求制定后续计划。",
      "Memberikan Solusi yang Sesuai Kebutuhan": "提供符合需求的解决方案",
      "Mendengarkan tujuan, lokasi, serta kebutuhan penggunaan Anda.": "了解您的目标、位置和使用需求。",
      "Mendukung Potensi": "助力发展",
      "Mendukung kebutuhan konektivitas dan IT melalui komunikasi yang responsif.": "通过及时沟通满足您的网络和IT需求。",
      "Mengenal": "认识",
      "Menghubungkan Kebutuhan,": "连接需求，",
      "Menghubungkan Potensi": "连接潜力",
      "Menghubungkan kebutuhan bisnis dengan solusi konektivitas yang tepat.": "以合适的网络解决方案满足企业需求。",
      "Menghubungkan kebutuhan dengan pilihan konektivitas dan teknologi yang sesuai.": "以合适的网络和技术方案满足您的需求。",
      "Menghubungkan kebutuhan digital dengan pilihan solusi yang tepat.": "为数字化需求连接合适的解决方案。",
      "Menghubungkan kebutuhan teknologi dengan rencana solusi yang tepat.": "为技术需求制定合适的解决方案。",
      "Menghubungkan masyarakat dan bisnis melalui layanan internet fiber optik yang andal dan siap berkembang.": "通过可靠且可扩展的光纤互联网连接社区与企业。",
      "Menjadi Mitra Teknologi yang Andal": "成为可靠的技术伙伴",
      "Menjadi mitra yang dapat diandalkan dalam mendukung konektivitas dan kebutuhan teknologi informasi masyarakat, bisnis, dan organisasi, khususnya di Aceh.": "成为值得信赖的伙伴，支持亚齐社区、企业和组织的网络与信息技术需求。",
      "Menyampaikan informasi layanan dan cakupan secara jelas.": "清楚说明服务和覆盖范围。",
      "Menyediakan jalur konsultasi untuk pertanyaan tentang layanan kami.": "为您提供服务咨询渠道。",
      "Misi": "使命",
      "Mulai dari Kebutuhan,": "从需求出发，",
      "PAKET HARGA": "价格套餐",
      "PRODUK DAN SOLUSI DIGITAL": "数字产品与解决方案",
      "Pahami": "了解",
      "Pengecekan Alamat": "地址查询",
      "Pengelolaan dan pemantauan infrastruktur IT berkelanjutan melalui kontrak bulanan atau tahunan, termasuk jaringan, server, dan dukungan teknis.": "通过月度或年度合同持续管理和监控IT基础设施，包括网络、服务器和技术支持。",
      "Periksa Ketersediaan": "查询服务覆盖",
      "Periksa detail koneksi dan layanan sebelum menentukan paket internet untuk rumah Anda.": "选择家庭互联网套餐前，请先了解连接和服务详情。",
      "Pilih Layanan": "选择服务",
      "Pilih Paket Sesuai": "选择适合您的套餐",
      "Pilihan": "选择",
      "Pilihan perangkat dan brand yang dapat dikonsultasikan sesuai kebutuhan bisnis Anda.": "探索可根据业务需求咨询的设备和品牌。",
      "Pricelist FIBERTERRA NETWORK ID": "FIBERTERRA NETWORK ID 价格表",
      "Pricelist Internet Dedicated FIBERTERRA NETWORK ID": "FIBERTERRA NETWORK ID 专线互联网价格表",
      "Prinsip yang menjadi arah kami dalam membantu kebutuhan konektivitas dan teknologi.": "这些原则指引我们满足您的网络和技术需求。",
      "Punya Kebutuhan": "有需求吗？",
      "Rencanakan": "规划",
      "Rencanakan Solusi IT": "规划IT解决方案",
      "Resource Brand": "品牌资源",
      "Resource Produk": "产品资源",
      "Rincian kapasitas, biaya bulanan, biaya instalasi, dan ketentuan layanan internet dedicated.": "查看专线互联网的带宽、月费、安装费和服务条款。",
      "SIAP MEMBANTU ANDA TERHUBUNG": "随时为您提供连接支持",
      "Sampaikan Tantangan": "告诉我们您的挑战",
      "Server & Storage": "服务器与存储",
      "Server & Storage Data Backup": "服务器、存储与数据备份",
      "Siap Memilih Internet": "准备好选择互联网了吗？",
      "TEMUKAN SOLUSI YANG SESUAI": "寻找合适的解决方案",
      "TENTANG KAMI": "关于我们",
      "Tanyakan kepada tim kami apakah layanan tersedia di alamat Anda.": "请联系我们的团队查询您的地址是否可提供服务。",
      "Tanyakan ketersediaan jaringan untuk lokasi pemasangan.": "请查询安装地点的网络覆盖情况。",
      "Teknologi Anda": "您的技术需求",
      "Teknologi Fiber Optik Terkini": "现代光纤技术",
      "Telepon / WhatsApp": "电话 / WhatsApp",
      "Temukan Layanan": "查找服务",
      "Tim Teknisi Berpengalaman": "经验丰富的技术团队",
      "VISI": "愿景",
      "Visi &": "愿景与",
      "untuk Rumah Anda?": "适合您的家庭？",
      "yang Anda Butuhkan": "满足您的需求",
      "yang Tepat": "合适的方案",
      "© 2026 FIBERTERRA NETWORK ID. All Rights Reserved.": "© 2026 FIBERTERRA NETWORK ID。保留所有权利。",
      "Paket dan Ketentuan": "套餐与条款"
    },
    ar: {
      "Kembali ke atas halaman": "العودة إلى أعلى الصفحة",
      "Buka menu navigasi": "افتح قائمة التنقل",
      "Tutup menu navigasi": "أغلق قائمة التنقل",
      "Pilih Layanan | FIBERTERRA NETWORK ID": "اختر خدمة | FIBERTERRA NETWORK ID",
      "Layanan FIBERTERRA NETWORK ID: internet dedicated, home broadband, IT konsultan, dan produk lainnya.": "خدمات FIBERTERRA NETWORK ID: إنترنت مخصص، وإنترنت منزلي، واستشارات تقنية المعلومات، ومنتجات أخرى.",
      "Lewati ke pilihan layanan": "انتقل إلى اختيار الخدمات",
      "Pilih Layanan FIBERTERRA NETWORK ID": "اختر خدمة من FIBERTERRA NETWORK ID",
      "Layanan FIBERTERRA NETWORK ID": "خدمات FIBERTERRA NETWORK ID",
      "Buka beranda perusahaan": "افتح الصفحة الرئيسية للشركة",
      "Ikon FIBERTERRA NETWORK ID": "أيقونة FIBERTERRA NETWORK ID",
      "Home Broadband": "إنترنت منزلي واسع النطاق",
      "Layanan IT Konsultan": "خدمات استشارات تقنية المعلومات",
      "Beranda | FIBERTERRA NETWORK ID": "الرئيسية | FIBERTERRA NETWORK ID",
      "Internet Broadband | FIBERTERRA NETWORK ID": "إنترنت النطاق العريض | FIBERTERRA NETWORK ID",
      "Internet Dedicated | FIBERTERRA NETWORK ID": "الإنترنت المخصص | FIBERTERRA NETWORK ID",
      "IT Konsultan | FIBERTERRA NETWORK ID": "استشارات تقنية المعلومات | FIBERTERRA NETWORK ID",
      "Produk Lainnya | FIBERTERRA NETWORK ID": "منتجات أخرى | FIBERTERRA NETWORK ID",
      "Kenali FIBERTERRA NETWORK ID, visi, misi, dan komitmen kami dalam membantu kebutuhan konektivitas serta teknologi informasi.": "تعرف على FIBERTERRA NETWORK ID ورؤيتنا ورسالتنا والتزامنا بتلبية احتياجات الاتصال وتقنية المعلومات.",
      "Layanan internet broadband fiber optik FIBERTERRA NETWORK ID untuk kebutuhan rumah di Aceh.": "خدمات النطاق العريض عبر الألياف الضوئية من FIBERTERRA NETWORK ID للمنازل في آتشيه.",
      "Informasi layanan internet dedicated FIBERTERRA NETWORK ID untuk kebutuhan konektivitas bisnis di Aceh.": "معلومات عن خدمة الإنترنت المخصص من FIBERTERRA NETWORK ID لاحتياجات الاتصال التجاري في آتشيه.",
      "Layanan konsultasi IT dan jaringan dari FIBERTERRA NETWORK ID untuk membantu merencanakan kebutuhan teknologi bisnis Anda.": "استشارات تقنية المعلومات والشبكات من FIBERTERRA NETWORK ID للمساعدة في تخطيط احتياجات أعمالك التقنية.",
      "Server, storage & backup, networking, CCTV, smartlock, komputer, laptop, UPS, dan sparepart untuk kebutuhan infrastruktur IT Anda.": "خوادم وتخزين ونسخ احتياطي وشبكات ومراقبة وأقفال ذكية وحواسيب وأجهزة محمولة وUPS وقطع غيار لبنية تقنية المعلومات.",
      "Lewati ke konten utama": "انتقل إلى المحتوى الرئيسي",
      "Navigasi utama": "التنقل الرئيسي",
      "Beranda": "الرئيسية",
      "Tentang Kami": "من نحن",
      "Visi & Misi": "الرؤية والرسالة",
      "Layanan": "الخدمات",
      "Kontak": "اتصل بنا",
      "Hubungi Kami": "تواصل معنا",
      "Indonesia": "الإندونيسية",
      "English": "الإنجليزية",
      "中文": "الصينية",
      "العربية": "العربية",
      "Internet Broadband": "إنترنت النطاق العريض",
      "Internet Dedicated": "إنترنت مخصص",
      "Jaringan": "الشبكة",
      "Pricelist": "قائمة الأسعار",
      "IT Konsultan": "استشارات تقنية المعلومات",
      "Produk Lainnya": "منتجات أخرى",
      "Pilih layanan untuk melihat informasi lengkap pada halaman terkait.": "اختر الخدمة للاطلاع على المعلومات الكاملة في صفحتها.",
      "INTERNET BROADBAND RUMAH": "إنترنت النطاق العريض المنزلي",
      "Internet Broadband untuk": "إنترنت النطاق العريض من أجل",
      "Rumah Anda": "منزلك",
      "Nikmati koneksi fiber optik untuk mendukung aktivitas harian di rumah, mulai dari bekerja dan belajar hingga hiburan. Hubungi tim kami untuk informasi ketersediaan dan pilihan paket.": "استمتع باتصال الألياف الضوئية لدعم أنشطتك اليومية في المنزل، من العمل والتعلم إلى الترفيه. تواصل مع فريقنا لمعرفة التغطية والباقات المتاحة.",
      "Lihat Layanan": "استكشف الخدمات",
      "Fiber Optik": "الألياف الضوئية",
      "Teknologi Koneksi": "تقنية الاتصال",
      "Pilihan Paket": "خيارات الباقات",
      "Untuk Kebutuhan Rumah": "لاحتياجات المنزل",
      "Cek Jangkauan": "تحقق من التغطية",
      "Konfirmasi Alamat": "تأكيد العنوان",
      "Koneksi Rumah untuk": "اتصال منزلي من أجل",
      "Aktivitas Sehari-hari": "الأنشطة اليومية",
      "Pilih koneksi internet rumah sesuai kebutuhan penggunaan dan perangkat Anda.": "اختر اتصال الإنترنت المنزلي المناسب لاستخدامك وأجهزتك.",
      "Internet Fiber Optik": "إنترنت الألياف الضوئية",
      "Koneksi internet rumah melalui jaringan fiber optik untuk mendukung aktivitas online sehari-hari.": "إنترنت منزلي عبر شبكة الألياف الضوئية لدعم أنشطتك اليومية عبر الإنترنت.",
      "Belajar, Bekerja, dan Hiburan": "التعلم والعمل والترفيه",
      "Gunakan koneksi untuk kebutuhan belajar, bekerja, komunikasi, dan menikmati hiburan di rumah.": "استخدم الاتصال للتعلم والعمل والتواصل والاستمتاع بالترفيه في المنزل.",
      "Pilihan Paket": "خيارات الباقات",
      "Cakupan Jaringan": "تغطية الشبكة",
      "Lihat paket": "عرض الباقات",
      "Lihat daftar harga": "عرض قائمة الأسعار",
      "Cek jangkauan": "تحقق من التغطية",
      "Lihat Pricelist": "عرض قائمة الأسعار",
      "Konsultasi": "استشارة",
      "SOLUSI KONEKTIVITAS BISNIS": "حلول الاتصال للأعمال",
      "Internet Dedicated untuk": "إنترنت مخصص من أجل",
      "Operasional Bisnis": "عمليات الأعمال",
      "Koneksi internet khusus untuk mendukung kebutuhan jaringan perusahaan dan organisasi. Diskusikan kebutuhan lokasi, kapasitas, dan dukungan layanan bersama tim FIBERTERRA NETWORK ID.": "اتصال إنترنت مخصص لاحتياجات شبكات الشركات والمؤسسات. ناقش الموقع والسعة والدعم مع فريق FIBERTERRA NETWORK ID.",
      "Koneksi yang Dirancang untuk": "اتصال مصمم لتلبية",
      "Kebutuhan Bisnis": "احتياجات الأعمال",
      "Mulai dengan memahami kebutuhan operasional dan lokasi Anda agar tim kami dapat membantu membahas pilihan layanan yang sesuai.": "نبدأ بفهم احتياجات التشغيل والموقع لمساعدتك في مناقشة خيارات الخدمة المناسبة.",
      "Akses Internet Dedicated": "الوصول إلى الإنترنت المخصص",
      "Pilih paket dengan kapasitas 10, 20, 50, atau 100 Mbps sesuai daftar harga.": "اختر باقة بسعة 10 أو 20 أو 50 أو 100 ميغابت في الثانية وفق قائمة الأسعار.",
      "IP Publik dan Jaringan Lokal": "عنوان IP عام وشبكة محلية",
      "Pricelist mencantumkan IP publik statis dan jaringan LAN pelanggan yang sudah tersedia.": "تتضمن قائمة الأسعار عنوان IP عامًا ثابتًا وشبكة LAN المتوفرة لدى العميل.",
      "Support dan Monitoring": "الدعم والمراقبة",
      "Dukungan onsite 24 jam sehari, 7 hari seminggu, monitoring MRTG, dan waktu respons maksimal 2 jam selama masa kontrak.": "دعم ميداني على مدار الساعة طوال أيام الأسبوع، ومراقبة MRTG، ووقت استجابة لا يتجاوز ساعتين خلال مدة العقد.",
      "SLA dan Ketentuan": "اتفاقية مستوى الخدمة والشروط",
      "Pricelist mencantumkan SLA 98% per bulan, instalasi gratis, dan masa kontrak minimum satu tahun.": "تتضمن قائمة الأسعار اتفاقية مستوى خدمة بنسبة 98% شهريًا وتركيبًا مجانيًا وعقدًا لمدة سنة على الأقل.",
      "PAKET INTERNET DEDICATED": "باقات الإنترنت المخصص",
      "Perencanaan IT yang Mendukung": "تخطيط تقنية المعلومات لدعم",
      "Bisnis Anda": "أعمالك",
      "KONSULTASI TEKNOLOGI INFORMASI": "استشارات تقنية المعلومات",
      "Dapatkan bantuan untuk memahami kebutuhan IT dan jaringan, menyusun rencana yang sesuai, serta menentukan langkah implementasi bersama tim FIBERTERRA NETWORK ID.": "ساعد فريق FIBERTERRA NETWORK ID في فهم احتياجات تقنية المعلومات والشبكات ووضع خطة مناسبة وتحديد خطوات التنفيذ.",
      "Pilih bidang konsultasi dan solusi IT yang sesuai dengan kebutuhan bisnis Anda.": "اختر استشارات وحلول تقنية المعلومات المناسبة لاحتياجات أعمالك.",
      "IT Consulting & Advisory": "استشارات تقنية المعلومات والتوجيه",
      "Konsultasi, analisis kebutuhan, audit, dan rekomendasi strategi IT untuk meningkatkan efisiensi operasional bisnis.": "استشارات تقنية المعلومات وتحليل الاحتياجات والتدقيق وتوصيات الاستراتيجية لتحسين كفاءة الأعمال.",
      "Network & Infrastructure Solutions": "حلول الشبكات والبنية التحتية",
      "Perancangan, instalasi, konfigurasi, dan pemeliharaan LAN, WAN, Wi-Fi, router, switch, dan fiber optik.": "تصميم وتركيب وتهيئة وصيانة شبكات LAN وWAN وWi-Fi وأجهزة التوجيه والتبديل والألياف الضوئية.",
      "Software & Application Development": "تطوير البرمجيات والتطبيقات",
      "Pengembangan website, aplikasi mobile, dan sistem informasi sesuai kebutuhan untuk mendukung otomatisasi dan digitalisasi proses kerja.": "تطوير مواقع الويب وتطبيقات الهاتف وأنظمة المعلومات لدعم أتمتة العمل وتحويله رقميًا.",
      "Cloud Computing & Server Management": "الحوسبة السحابية وإدارة الخوادم",
      "Implementasi dan pengelolaan cloud, server, hosting, virtualisasi, migrasi sistem, serta backup data.": "تنفيذ وإدارة السحابة والخوادم والاستضافة والافتراضية وترحيل الأنظمة ونسخ البيانات احتياطيًا.",
      "Cybersecurity Solutions": "حلول الأمن السيبراني",
      "Perlindungan sistem dan jaringan melalui audit keamanan, firewall, kontrol akses, pemantauan ancaman, dan kebijakan keamanan informasi.": "حماية الأنظمة والشبكات عبر تدقيق الأمان وجدران الحماية والتحكم في الوصول ومراقبة التهديدات وسياسات أمن المعلومات.",
      "IT Support & Maintenance": "دعم وصيانة تقنية المعلومات",
      "Dukungan teknis, pemecahan masalah hardware dan software, pemeliharaan perangkat, serta monitoring sistem.": "الدعم الفني واستكشاف أعطال الأجهزة والبرامج وصيانة المعدات ومراقبة الأنظمة.",
      "System Integration & Automation": "تكامل الأنظمة والأتمتة",
      "IT Managed Services": "خدمات تقنية المعلومات المُدارة",
      "Lihat Cakupan": "عرض الخدمات",
      "Mulai Diskusi": "ابدأ النقاش",
      "SERVER, NETWORKING, CCTV, KOMPUTER, LAPTOP, UPS & SPAREPART": "الخوادم والشبكات والمراقبة والحواسيب والملحقات",
      "Perangkat untuk": "أجهزة من أجل",
      "Infrastruktur IT": "بنية تقنية المعلومات",
      "Jelajahi pilihan server, storage dan data backup, perangkat networking, CCTV, absensi dan smartlock, komputer, laptop, UPS, sparepart, serta produk lainnya dari FIBERTERRA NETWORK ID. Hubungi tim kami untuk membahas ketersediaan dan kecocokannya dengan kebutuhan Anda.": "استكشف الخوادم والتخزين والنسخ الاحتياطي والشبكات والمراقبة والحضور والأقفال الذكية والحواسيب وأجهزة UPS وقطع الغيار من FIBERTERRA NETWORK ID. تواصل معنا لمناقشة التوفر وما يناسب احتياجاتك.",
      "Lihat Brand": "عرض العلامات التجارية",
      "Tanya Tim Kami": "اسأل فريقنا",
      "RESOURCE PRODUK": "موارد المنتجات",
      "Pilih kategori untuk melihat brand perangkat server, jaringan, CCTV, akses kontrol, komputer, laptop, UPS, dan sparepart yang tersedia untuk dikonsultasikan.": "اختر فئة لاستكشاف علامات الخوادم والشبكات والمراقبة والتحكم في الوصول والحواسيب وأجهزة UPS وقطع الغيار المتاحة للاستشارة.",
      "Jelajahi brand untuk kebutuhan server, penyimpanan, dan backup data.": "استكشف العلامات التجارية للخوادم والتخزين والنسخ الاحتياطي.",
      "Temukan pilihan brand perangkat untuk kebutuhan infrastruktur jaringan.": "اكتشف علامات الأجهزة المناسبة لاحتياجات البنية التحتية للشبكة.",
      "Jelajahi brand untuk kebutuhan pengawasan, absensi, dan kontrol akses.": "استكشف علامات المراقبة والحضور والتحكم في الوصول.",
      "Lihat pilihan brand komputer, laptop, dan UPS untuk kebutuhan perangkat Anda.": "اطلع على علامات الحواسيب وأجهزة الكمبيوتر المحمولة وUPS المناسبة لاحتياجاتك.",
      "Jelajahi brand sparepart untuk kebutuhan perangkat Dell, IBM, dan Hewlett Packard Enterprise.": "استكشف علامات قطع الغيار لأجهزة Dell وIBM وHewlett Packard Enterprise.",
      "Networking": "الشبكات",
      "CCTV, Absensi & Smartlock": "المراقبة والحضور والأقفال الذكية",
      "Komputer, Laptop & UPS": "الحواسيب وأجهزة الكمبيوتر المحمولة وUPS",
      "Sparepart": "قطع الغيار",
      "Hubungi Tim Kami": "تواصل مع فريقنا",
      "Tanya via WhatsApp": "استفسر عبر واتساب",
      "Kontak Fiberterra": "جهات اتصال فيبرتيرا",
      "Kontak Kami": "اتصل بنا",
      "Menu": "القائمة",
      "Menu Cepat": "روابط سريعة",
      "Email": "البريد الإلكتروني",
      "Informasi Layanan": "معلومات الخدمة",
      "01 / KONEKSI RUMAH": "01 / اتصال منزلي",
      "01 / KONSULTASI": "01 / استشارات",
      "01 / PILIHAN PAKET": "01 / خيارات الباقات",
      "01 / SERVER": "01 / الخوادم",
      "02 / AKTIVITAS": "02 / الأنشطة",
      "02 / JARINGAN": "02 / الشبكات",
      "02 / PERSYARATAN": "02 / المتطلبات",
      "03 / DUKUNGAN": "03 / الدعم",
      "03 / KEAMANAN": "03 / الأمان",
      "03 / PAKET INTERNET": "03 / باقات الإنترنت",
      "03 / PENGEMBANGAN": "03 / التطوير",
      "04 / CLOUD & SERVER": "04 / السحابة والخوادم",
      "04 / KETERSEDIAAN": "04 / التوفر",
      "04 / KOMITMEN LAYANAN": "04 / التزام الخدمة",
      "04 / PERANGKAT": "04 / الأجهزة",
      "05 / KEAMANAN": "05 / الأمان",
      "05 / KOMPONEN": "05 / المكونات",
      "06 / DUKUNGAN": "06 / الدعم",
      "07 / INTEGRASI": "07 / التكامل",
      "08 / PENGELOLAAN": "08 / الإدارة",
      "ARAH DAN KOMITMEN": "التوجه والالتزام",
      "Alamat": "العنوان",
      "Anda Ketahui": "ما تحتاج إلى معرفته",
      "Bandingkan pilihan paket broadband yang tercantum.": "قارن باقات النطاق العريض المتاحة.",
      "Bandingkan pilihan paket yang tercantum pada daftar harga sebelum menghubungi tim kami.": "قارن الباقات في قائمة الأسعار قبل التواصل مع فريقنا.",
      "Bicarakan Kebutuhan": "ناقش احتياجاتك",
      "Brand untuk Berbagai": "علامات تجارية لمختلف",
      "Butuh rekomendasi paket? Tim kami siap membantu.": "هل تحتاج إلى توصية باقة؟ فريقنا مستعد للمساعدة.",
      "CARA KAMI BEKERJA": "كيف نعمل",
      "Cakupan Area": "نطاق التغطية",
      "Cakupan IT": "خدمات تقنية المعلومات",
      "Cakupan Layanan": "نطاق الخدمة",
      "Cara Kami Bekerja": "كيف نعمل",
      "Cek Ketersediaan Jaringan": "تحقق من توفر الشبكة",
      "Ceritakan Kebutuhan": "أخبرنا باحتياجاتك",
      "Ceritakan kebutuhan dan rencana Anda. Tim kami akan membantu memberikan informasi tentang produk, ketersediaan, dan langkah konsultasi berikutnya.": "أخبرنا باحتياجاتك وخططك. سيوفر فريقنا معلومات عن المنتجات والتوفر والخطوات التالية للاستشارة.",
      "Ceritakan kebutuhan koneksi rumah Anda. Tim FIBERTERRA NETWORK ID siap membantu memberikan informasi paket dan ketersediaan jaringan.": "أخبرنا باحتياجات اتصال الإنترنت المنزلي. يساعدك فريق FIBERTERRA NETWORK ID في معرفة الباقات وتوفر الشبكة.",
      "Digital Tertentu?": "رقمية؟",
      "Dukung": "ادعم",
      "Dukungan": "الدعم",
      "FIBERTERRA NETWORK ID hadir untuk membantu memenuhi kebutuhan konektivitas internet dan teknologi informasi. Kami melayani kebutuhan internet fiber optik rumah dan bisnis, serta menyediakan ruang konsultasi untuk kebutuhan IT dan perangkat infrastruktur.": "تساعد FIBERTERRA NETWORK ID في تلبية احتياجات الاتصال بالإنترنت وتقنية المعلومات. نقدم إنترنت الألياف الضوئية للمنازل والأعمال، واستشارات تقنية المعلومات، ومعدات البنية التحتية.",
      "FIBERTERRA NETWORK ID menyediakan layanan internet fiber optik untuk mendukung kebutuhan digital rumah di Aceh. Hubungi tim kami untuk memperoleh informasi paket, jangkauan jaringan, dan dukungan layanan.": "توفر FIBERTERRA NETWORK ID إنترنت الألياف الضوئية للمنازل في آتشيه. تواصل معنا لمعرفة الباقات وتغطية الشبكة ودعم الخدمة.",
      "FNI / INTERNET DEDICATED": "FNI / إنترنت مخصص",
      "FNI / PILIHAN PAKET": "FNI / خيارات الباقات",
      "Gunakan informasi kontak untuk bertanya mengenai layanan.": "استخدم معلومات الاتصال للاستفسار عن خدماتنا.",
      "HUBUNGI KAMI": "تواصل معنا",
      "Hal yang Perlu": "ما ينبغي",
      "Harga Kompetitif dan Transparan": "أسعار تنافسية وواضحة",
      "Harga belum termasuk PPN 11%; masa kontrak minimum satu tahun.": "الأسعار لا تشمل ضريبة القيمة المضافة 11٪؛ الحد الأدنى لمدة العقد سنة واحدة.",
      "Hubungi Kami Sekarang": "تواصل معنا الآن",
      "Hubungi Kami untuk Berlangganan": "تواصل معنا للاشتراك",
      "Hubungi kami untuk membahas kebutuhan konsultasi IT dan jaringan bagi bisnis atau organisasi Anda.": "تواصل معنا لمناقشة احتياجات استشارات تقنية المعلومات والشبكات لأعمالك أو مؤسستك.",
      "Hubungi tim FIBERTERRA NETWORK ID untuk bertanya tentang layanan, cakupan jaringan, atau kebutuhan teknologi Anda.": "تواصل مع فريق FIBERTERRA NETWORK ID للاستفسار عن الخدمات وتغطية الشبكة واحتياجاتك التقنية.",
      "Hubungi tim kami untuk memperoleh informasi lebih lanjut tentang ketersediaan brand dan perangkat yang ditampilkan.": "تواصل مع فريقنا لمعرفة المزيد عن توفر العلامات التجارية والأجهزة المعروضة.",
      "Hubungi tim kami untuk menanyakan layanan internet dedicated dan informasi ketersediaan di lokasi Anda.": "تواصل مع فريقنا للاستفسار عن خدمة الإنترنت المخصص وتوفرها في موقعك.",
      "INFORMASI LAYANAN": "معلومات الخدمة",
      "INTERNET BROADBAND": "إنترنت النطاق العريض",
      "INTERNET DEDICATED": "إنترنت مخصص",
      "IT KONSULTAN": "استشارات تقنية المعلومات",
      "Informasi Paket": "معلومات الباقات",
      "Informasi mengenai jaringan yang digunakan untuk layanan broadband.": "معلومات عن الشبكة المستخدمة لخدمة النطاق العريض.",
      "Informasikan lokasi dan kebutuhan konektivitas bisnis Anda. Tim FIBERTERRA NETWORK ID dapat membantu menjelaskan ketersediaan layanan dan pilihan yang relevan.": "أخبرنا بموقعك واحتياجات اتصال عملك. يوضح فريق FIBERTERRA NETWORK ID توفر الخدمة والخيارات المناسبة.",
      "Integrasi aplikasi, database, perangkat, dan sistem bisnis, beserta otomatisasi proses untuk meningkatkan produktivitas.": "دمج التطبيقات وقواعد البيانات والأجهزة وأنظمة الأعمال، مع أتمتة العمليات لتعزيز الإنتاجية.",
      "JARINGAN KAMI": "شبكتنا",
      "Jaringan Bisnis Anda": "شبكة أعمالك",
      "Jaringan di Area Anda": "الشبكة في منطقتك",
      "Jelajahi Layanan": "استكشف خدماتنا",
      "Jelaskan": "اشرح",
      "Jelaskan kebutuhan atau kendala IT yang sedang dihadapi. Tim kami akan membantu membahas kemungkinan solusi dan informasi layanan yang relevan.": "اشرح احتياجات تقنية المعلومات أو التحديات التي تواجهها. يناقش فريقنا الحلول الممكنة والخدمات المناسبة.",
      "KONSULTASI AWAL": "استشارة أولية",
      "Kami membantu memperjelas kebutuhan dan pilihan, tanpa mengabaikan kesesuaian layanan dengan kondisi pengguna.": "نساعدك على توضيح احتياجاتك وخياراتك، مع مراعاة ملاءمة الخدمة لظروفك.",
      "Kami membantu rumah, bisnis, dan organisasi di Aceh menjelajahi kebutuhan konektivitas dan teknologi informasi dengan informasi yang jelas serta dukungan yang tepat.": "نساعد المنازل والشركات والمؤسسات في آتشيه على تحديد احتياجات الاتصال وتقنية المعلومات من خلال معلومات واضحة ودعم مناسب.",
      "Kami mengutamakan pemahaman terhadap kebutuhan dan kondisi pengguna sebelum membahas layanan yang sesuai. Ketersediaan layanan, cakupan jaringan, serta pilihan produk dapat dikonsultasikan langsung dengan tim kami.": "نبدأ بفهم احتياجاتك وظروفك قبل مناقشة الخدمة المناسبة. تواصل مباشرة مع فريقنا للاستفسار عن توفر الخدمات وتغطية الشبكة والمنتجات.",
      "Kategori Produk": "فئات المنتجات",
      "Kebutuhan": "الاحتياجات",
      "Kebutuhan Anda": "احتياجاتك",
      "Kebutuhan Infrastruktur": "احتياجات البنية التحتية",
      "Kenali Kami Lebih Lanjut": "تعرف علينا أكثر",
      "Ketersediaan internet broadband dapat berbeda menurut alamat. Hubungi tim kami untuk menanyakan cakupan layanan di lokasi Anda.": "قد يختلف توفر الإنترنت حسب العنوان. تواصل معنا للاستفسار عن التغطية في موقعك.",
      "Komunikasi": "التواصل",
      "Koneksi Anda": "اتصالك",
      "Konsultasi dan Solusi IT": "استشارات وحلول تقنية المعلومات",
      "Konsultasikan Kebutuhan": "ناقش احتياجاتك",
      "Konsultasikan Paket": "ناقش الباقة",
      "Kontak Layanan": "دعم الخدمة",
      "LANGKAH SELANJUTNYA": "الخطوات التالية",
      "LAYANAN KAMI": "خدماتنا",
      "Langkah Berikutnya": "الخطوة التالية",
      "Lanjut ke Solusi": "نحو الحل",
      "Layanan yang Berangkat dari": "خدمات تبدأ من",
      "Lihat Pilihan Layanan": "استكشف خيارات الخدمة",
      "Lihat brand": "عرض العلامات التجارية",
      "Lihat halaman pilihan layanan untuk informasi internet broadband, internet dedicated, konsultasi IT, dan produk infrastruktur.": "تفضل بزيارة صفحة الخدمات لمعرفة المزيد عن الإنترنت واسع النطاق والمخصص واستشارات تقنية المعلومات ومنتجات البنية التحتية.",
      "Lihat pilihan paket internet broadband untuk kebutuhan koneksi rumah.": "استكشف باقات الإنترنت المنزلي واسع النطاق.",
      "MISI": "الرسالة",
      "Mari Bahas": "لنناقش",
      "Memahami kebutuhan sebelum merekomendasikan layanan atau perangkat.": "فهم احتياجاتك قبل التوصية بالخدمات أو الأجهزة.",
      "Membahas layanan, cakupan, atau perangkat yang relevan.": "مناقشة الخدمات أو التغطية أو الأجهزة المناسبة.",
      "Membangun Koneksi,": "نبني اتصالات،",
      "Membantu menyusun tindak lanjut berdasarkan kebutuhan yang telah dibahas.": "المساعدة في تحديد الخطوات التالية بناءً على احتياجاتك.",
      "Memberikan Solusi yang Sesuai Kebutuhan": "تقديم حلول تلائم احتياجاتك",
      "Mendengarkan tujuan, lokasi, serta kebutuhan penggunaan Anda.": "الاستماع إلى أهدافك وموقعك واحتياجاتك.",
      "Mendukung Potensi": "ندعم إمكاناتك",
      "Mendukung kebutuhan konektivitas dan IT melalui komunikasi yang responsif.": "تلبية احتياجات الاتصال وتقنية المعلومات من خلال تواصل سريع الاستجابة.",
      "Mengenal": "تعرف على",
      "Menghubungkan Kebutuhan,": "نربط الاحتياجات،",
      "Menghubungkan Potensi": "نربط الإمكانات",
      "Menghubungkan kebutuhan bisnis dengan solusi konektivitas yang tepat.": "نربط احتياجات الأعمال بحلول الاتصال المناسبة.",
      "Menghubungkan kebutuhan dengan pilihan konektivitas dan teknologi yang sesuai.": "نربط احتياجاتك بخيارات الاتصال والتقنية المناسبة.",
      "Menghubungkan kebutuhan digital dengan pilihan solusi yang tepat.": "نربط احتياجاتك الرقمية بالحلول المناسبة.",
      "Menghubungkan kebutuhan teknologi dengan rencana solusi yang tepat.": "نربط احتياجات التقنية بخطة الحل المناسبة.",
      "Menghubungkan masyarakat dan bisnis melalui layanan internet fiber optik yang andal dan siap berkembang.": "نربط المجتمعات والأعمال عبر إنترنت ألياف ضوئية موثوق وقابل للتوسع.",
      "Menjadi Mitra Teknologi yang Andal": "شريك موثوق للتقنية",
      "Menjadi mitra yang dapat diandalkan dalam mendukung konektivitas dan kebutuhan teknologi informasi masyarakat, bisnis, dan organisasi, khususnya di Aceh.": "أن نكون شريكًا موثوقًا لدعم الاتصال واحتياجات تقنية المعلومات للمجتمعات والشركات والمؤسسات، خاصة في آتشيه.",
      "Menyampaikan informasi layanan dan cakupan secara jelas.": "تقديم معلومات واضحة عن الخدمات والتغطية.",
      "Menyediakan jalur konsultasi untuk pertanyaan tentang layanan kami.": "توفير قناة للاستفسار عن خدماتنا.",
      "Misi": "الرسالة",
      "Mulai dari Kebutuhan,": "نبدأ من احتياجاتك،",
      "PAKET HARGA": "الباقات والأسعار",
      "PRODUK DAN SOLUSI DIGITAL": "المنتجات والحلول الرقمية",
      "Pahami": "افهم",
      "Pengecekan Alamat": "التحقق من العنوان",
      "Pengelolaan dan pemantauan infrastruktur IT berkelanjutan melalui kontrak bulanan atau tahunan, termasuk jaringan, server, dan dukungan teknis.": "إدارة ومراقبة مستمرة للبنية التحتية لتقنية المعلومات بعقود شهرية أو سنوية، تشمل الشبكات والخوادم والدعم الفني.",
      "Periksa Ketersediaan": "تحقق من التوفر",
      "Periksa detail koneksi dan layanan sebelum menentukan paket internet untuk rumah Anda.": "راجع تفاصيل الاتصال والخدمة قبل اختيار باقة الإنترنت المنزلي.",
      "Pilih Layanan": "اختر خدمة",
      "Pilih Paket Sesuai": "اختر الباقة المناسبة",
      "Pilihan": "الخيارات",
      "Pilihan perangkat dan brand yang dapat dikonsultasikan sesuai kebutuhan bisnis Anda.": "اكتشف الأجهزة والعلامات التجارية التي يمكنك استشارتنا بشأنها لتلبية احتياجات عملك.",
      "Pricelist FIBERTERRA NETWORK ID": "قائمة أسعار FIBERTERRA NETWORK ID",
      "Pricelist Internet Dedicated FIBERTERRA NETWORK ID": "قائمة أسعار الإنترنت المخصص من FIBERTERRA NETWORK ID",
      "Prinsip yang menjadi arah kami dalam membantu kebutuhan konektivitas dan teknologi.": "المبادئ التي توجهنا في تلبية احتياجات الاتصال والتقنية.",
      "Punya Kebutuhan": "هل لديك احتياج؟",
      "Rencanakan": "خطط",
      "Rencanakan Solusi IT": "خطط لحل تقنية المعلومات",
      "Resource Brand": "موارد العلامات التجارية",
      "Resource Produk": "موارد المنتجات",
      "Rincian kapasitas, biaya bulanan, biaya instalasi, dan ketentuan layanan internet dedicated.": "تفاصيل السعة والرسوم الشهرية وتكاليف التركيب وشروط خدمة الإنترنت المخصص.",
      "SIAP MEMBANTU ANDA TERHUBUNG": "مستعدون لمساعدتك على الاتصال",
      "Sampaikan Tantangan": "أخبرنا بالتحديات",
      "Server & Storage": "الخوادم والتخزين",
      "Server & Storage Data Backup": "الخوادم والتخزين والنسخ الاحتياطي",
      "Siap Memilih Internet": "مستعد لاختيار الإنترنت",
      "TEMUKAN SOLUSI YANG SESUAI": "اعثر على الحل المناسب",
      "TENTANG KAMI": "من نحن",
      "Tanyakan kepada tim kami apakah layanan tersedia di alamat Anda.": "اسأل فريقنا عن توفر الخدمة في عنوانك.",
      "Tanyakan ketersediaan jaringan untuk lokasi pemasangan.": "استفسر عن توفر الشبكة في موقع التركيب.",
      "Teknologi Anda": "تقنيتك",
      "Teknologi Fiber Optik Terkini": "تقنية الألياف الضوئية الحديثة",
      "Telepon / WhatsApp": "الهاتف / واتساب",
      "Temukan Layanan": "اكتشف الخدمات",
      "Tim Teknisi Berpengalaman": "فريق فني ذو خبرة",
      "VISI": "الرؤية",
      "Visi &": "الرؤية و",
      "untuk Rumah Anda?": "لمنزلك؟",
      "yang Anda Butuhkan": "التي تحتاجها",
      "yang Tepat": "المناسب",
      "© 2026 FIBERTERRA NETWORK ID. All Rights Reserved.": "© 2026 FIBERTERRA NETWORK ID. جميع الحقوق محفوظة.",
      "Paket dan Ketentuan": "الباقات والشروط"
    }
  };
  const sourceText = new WeakMap();
  const sourceAttributes = new WeakMap();
  const languageStorageKey = "fiberterra-language";
  const sourceTitle = document.title;
  const descriptionMeta = document.querySelector('meta[name="description"]');
  const sourceDescription = descriptionMeta?.content;
  const languagePickerLabels = {
    id: "Pilih bahasa",
    en: "Select language",
    zh: "选择语言",
    ar: "اختر اللغة"
  };

  function applyLanguage(language) {
    const dictionary = translations[language] || {};
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;

    while ((node = walker.nextNode())) {
      if (languageSwitcher.contains(node.parentElement)) continue;
      if (!sourceText.has(node)) sourceText.set(node, node.nodeValue);
      const source = sourceText.get(node);
      const trimmed = source.trim();
      const translation = dictionary[trimmed];

      if (translation) {
        node.nodeValue = source.replace(trimmed, translation);
      } else {
        node.nodeValue = source;
      }
    }

    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  currentLanguage = language;
  document.title = dictionary[sourceTitle] || sourceTitle;
  if (descriptionMeta && sourceDescription) {
    descriptionMeta.content = dictionary[sourceDescription] || sourceDescription;
  }

  document.querySelectorAll("[aria-label], [title], [alt]").forEach((element) => {
    if (languageSwitcher.contains(element)) return;
    if (!sourceAttributes.has(element)) {
      sourceAttributes.set(element, {
        "aria-label": element.getAttribute("aria-label"),
        title: element.getAttribute("title"),
        alt: element.getAttribute("alt")
      });
    }

    const originalAttributes = sourceAttributes.get(element);
    Object.entries(originalAttributes).forEach(([name, value]) => {
      if (value) element.setAttribute(name, dictionary[value] || value);
    });
  });

  languageMenu.setAttribute("aria-label", languagePickerLabels[language]);
  languageOptions.forEach((option) => {
    option.classList.toggle("is-selected", option.dataset.language === language);
    option.setAttribute("aria-pressed", String(option.dataset.language === language));
  });
  }

  const savedLanguage = localStorage.getItem(languageStorageKey);
  const initialLanguage = translations[savedLanguage] ? savedLanguage : "id";
  const initialOption = languageSwitcher.querySelector(`[data-language="${initialLanguage}"]`);
  languageFlag.src = initialOption.querySelector("img").getAttribute("src");
  applyLanguage(initialLanguage);

  function updateLanguageToggleLabel(language) {
  const selectedOption = languageSwitcher.querySelector(`[data-language="${language}"]`);
  languageToggle.setAttribute(
    "aria-label",
    `${languagePickerLabels[language]}: ${selectedOption.querySelector("span").textContent}`
  );
  }

  updateLanguageToggleLabel(initialLanguage);

  languageToggle.addEventListener("click", () => {
  const isExpanded = languageToggle.getAttribute("aria-expanded") === "true";
  languageToggle.setAttribute("aria-expanded", String(!isExpanded));
  languageMenu.hidden = isExpanded;
  });

  languageOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const language = option.dataset.language;
    languageFlag.src = option.querySelector("img").getAttribute("src");
    languageToggle.setAttribute("aria-expanded", "false");
    languageMenu.hidden = true;
    localStorage.setItem(languageStorageKey, language);
    applyLanguage(language);
    updateLanguageToggleLabel(language);
  });
  });

  document.addEventListener("click", (event) => {
  if (!languageSwitcher.contains(event.target)) {
    languageMenu.hidden = true;
    languageToggle.setAttribute("aria-expanded", "false");
  }
  });

  languageMenu.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    languageMenu.hidden = true;
    languageToggle.setAttribute("aria-expanded", "false");
    languageToggle.focus();
  }
  });
}
