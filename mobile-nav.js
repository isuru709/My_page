(function () {
  const toggle = document.querySelector("[data-nav-toggle]");
  const root = document.documentElement; // or a header container element
  const nav = document.getElementById("site-nav");

  if (!toggle || !nav) return;

  function setExpanded(expanded) {
    toggle.setAttribute("aria-expanded", String(expanded));
    if (expanded) {
      root.classList.add("nav-open");
    } else {
      root.classList.remove("nav-open");
    }
  }

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    setExpanded(!expanded);
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!root.classList.contains("nav-open")) return;
    const clickedInside = toggle.contains(e.target) || nav.contains(e.target);
    if (!clickedInside) setExpanded(false);
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setExpanded(false);
  });
})();