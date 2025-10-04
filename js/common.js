if (document.getElementsByClassName("menu-btn")[0]) {
  document
    .getElementsByClassName("menu-btn")[0]
    .addEventListener("click", () => {
      document.getElementsByClassName("menu-btn")[0].classList.toggle("active");

      document
        .getElementsByClassName("small-menu")[0]
        .classList.toggle("mobile-menu-active");
    });
}

function loadPage() {
  document.getElementById("preloader-window").style.display = "none";
  const storedTheme = localStorage.getItem("theme") || "light";
  setTheme(storedTheme);
}
function toggleDarkMode(element) {
  const newTheme = document.body.classList.contains("dark-mode")
    ? "light"
    : "dark";
  setTheme(newTheme);
}

function setTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }

  document.querySelectorAll("*").forEach((el) => {
    el.setAttribute("data-theme", theme);
  });

  const toggleBtn = document.getElementById("dark-mode-toggle-button");
  if (toggleBtn) {
    toggleBtn.querySelector("span").textContent =
      theme === "dark" ? "light_mode" : "dark_mode";
  }
  localStorage.setItem("theme", theme);
}

function closeLanguageSelector() {
  document.getElementById("language-selector").style.display = "none";
}
function openLanguageSelector() {
  document.getElementById("language-selector").style.display = "flex";
}
