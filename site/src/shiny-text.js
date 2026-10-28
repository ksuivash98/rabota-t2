// ShinyText: a soft 120-degree highlight sweeps across the existing text.
// Run a single two-second sweep on view; keep all text readable throughout.
export function initShinyText() {
  const title = document.querySelector("#contact-title-shine");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  if (
    motion.matches ||
    !CSS.supports("background-clip", "text") ||
    !Element.prototype.animate
  ) {
    title.dataset.shineState = "complete";
    return;
  }
  const layer = document.createElement("span");
  layer.className = "shine-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = title.innerHTML;
  title.append(layer);
  title.dataset.shineState = "waiting";
  let animation;
  let observer;
  function finish() {
    animation?.cancel();
    layer.remove();
    title.dataset.shineState = "complete";
    observer?.disconnect();
  }
  observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    if (motion.matches) {
      finish();
      return;
    }
    title.dataset.shineState = "playing";
    animation = layer.animate(
      [{ backgroundPosition: "200% 0" }, { backgroundPosition: "-100% 0" }],
      { duration: 2000, easing: "ease-in-out" },
    );
    animation.finished.then(finish).catch(() => {});
  });
  observer.observe(title);
  motion.addEventListener("change", () => {
    if (motion.matches) finish();
  });
}
