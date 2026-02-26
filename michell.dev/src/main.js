import { initNetworkAnimation } from "./components/networkAnimation.js";
// hero.js, experience.js, etc. can be used later if you want dynamic behavior.
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/animations.css";

document.addEventListener("DOMContentLoaded", () => {
  setupSmoothScroll();
  setYear();
  initNetworkAnimation();
});

function setupSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function setYear() {
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}