const siteHeader = document.querySelector("#site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navPanel = document.querySelector("#primary-navigation");

function updateHeader() {
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 24);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Buka menu navigasi");
  navPanel.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Buka menu navigasi" : "Tutup menu navigasi");
  navPanel.classList.toggle("is-open", !isExpanded);
  document.body.classList.toggle("menu-open", !isExpanded);
});

navPanel.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
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

window.matchMedia("(min-width: 761px)").addEventListener("change", (event) => {
  if (event.matches) closeMenu();
});
