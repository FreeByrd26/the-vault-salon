// Progressive enhancement: scroll-reveal for key blocks.
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var targets = document.querySelectorAll(
    ".step, .tcard, .menu-cat, .spot > *, .visit-grid > *, .quote-band > *, .close-cta > *"
  );
  targets.forEach(function (el) { el.classList.add("reveal"); });
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  targets.forEach(function (el) { io.observe(el); });
  // fail-safe: never leave content hidden (anchor jumps, throttled tabs)
  setTimeout(function () {
    targets.forEach(function (el) { el.classList.add("in"); });
  }, 1500);
})();
