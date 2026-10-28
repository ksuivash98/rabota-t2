// StrokeText-style SVG contour drawing and left-to-right fill, without React.
export async function initStrokeText() {
  const title = document.querySelector("#growth-title");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  if (!title) return;
  if (
    motion.matches ||
    !Element.prototype.animate ||
    !window.IntersectionObserver
  ) {
    title.dataset.strokeState = "complete";
    return;
  }
  await document.fonts.ready;
  // Preserve the original wrapping and geometry as the accessible fallback.
  const source = document.createElement("span");
  source.className = "stroke-source";
  source.append(...title.childNodes);
  title.append(source);
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.classList.add("stroke-overlay");
  svg.setAttribute("aria-hidden", "true");
  const box = title.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
  const outline = document.createElementNS(namespace, "g");
  outline.setAttribute("fill", "none");
  outline.setAttribute("stroke", "#FF2D8D");
  outline.setAttribute("stroke-width", "1.4");
  outline.setAttribute("stroke-linejoin", "round");
  const fills = document.createElementNS(namespace, "g");
  const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
  const style = getComputedStyle(title);
  const size = parseFloat(style.fontSize);
  const dash = Math.max(size * 7, 200);
  const strokes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    Array.from(node.textContent).forEach((character, index) => {
      if (!character.trim()) return;
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + character.length);
      const rect = range.getBoundingClientRect();
      const text = document.createElementNS(namespace, "text");
      text.setAttribute("x", rect.left - box.left);
      text.setAttribute("y", rect.top - box.top);
      text.setAttribute("dominant-baseline", "text-before-edge");
      text.textContent = character;
      text.style.fontFamily = style.fontFamily;
      text.style.fontSize = style.fontSize;
      text.style.fontWeight = style.fontWeight;
      const fill = text.cloneNode(true);
      fill.setAttribute("fill", getComputedStyle(node.parentElement).color);
      fills.append(fill);
      text.style.strokeDasharray = String(dash);
      text.style.strokeDashoffset = String(dash);
      outline.append(text);
      strokes.push(text);
    });
  }
  svg.append(outline, fills);
  fills.style.clipPath = "inset(0 100% 0 0)";
  title.append(svg);
  title.classList.add("stroke-active");
  title.dataset.strokeState = "waiting";
  let animations = [];
  let observer;
  let resize;
  let complete = false;
  function finish() {
    if (complete) return;
    complete = true;
    title.classList.remove("stroke-active");
    title.dataset.strokeState = "complete";
    animations.forEach((animation) => animation.cancel());
    svg.remove();
    observer?.disconnect();
    resize?.disconnect();
  }
  function play() {
    if (complete) return;
    if (motion.matches) {
      finish();
      return;
    }
    title.dataset.strokeState = "playing";
    animations = strokes.map((stroke, index) =>
      stroke.animate(
        [{ strokeDashoffset: String(dash) }, { strokeDashoffset: "0" }],
        {
          duration: 1600,
          delay: index * 50,
          easing: "cubic-bezier(0.215, 0.61, 0.355, 1)",
          fill: "both",
        },
      ),
    );
    animations.push(
      fills.animate(
        [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }],
        { duration: 800, delay: 1800, easing: "ease-in-out", fill: "both" },
      ),
    );
    Promise.all(animations.map((animation) => animation.finished))
      .then(finish)
      .catch(() => {});
  }
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        play();
      }
    },
    { rootMargin: `0px 0px -${Math.round(innerHeight * 0.18)}px 0px` },
  );
  resize = new ResizeObserver(() => {
    const next = title.getBoundingClientRect();
    if (
      Math.abs(next.width - box.width) > 0.5 ||
      Math.abs(next.height - box.height) > 0.5
    )
      finish();
  });
  observer.observe(title);
  resize.observe(title);
  motion.addEventListener("change", () => {
    if (motion.matches) finish();
  });
  if (motion.matches) finish();
}
