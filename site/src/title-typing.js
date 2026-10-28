// TextType-style typing, pause and backspace, adapted to the static site.
// No layout changes or repeated screen-reader announcements while animating.
export function initTitleTyping(
  titleSelector = "#hero-title",
  toggleSelector = ".title-motion-toggle",
) {
  const title = document.querySelector(titleSelector);
  const toggle = document.querySelector(toggleSelector);
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const characters = [];
  title.querySelectorAll(".title-line").forEach((line) => {
    line.setAttribute("aria-hidden", "true");
    const text = line.textContent;
    line.replaceChildren(
      ...Array.from(text, (character) => {
        const span = document.createElement("span");
        span.className = "typing-char";
        span.textContent = character;
        characters.push(span);
        return span;
      }),
    );
  });
  const cursor = document.createElement("span");
  cursor.className = "title-cursor";
  cursor.setAttribute("aria-hidden", "true");
  title.append(cursor);
  let count = 0;
  let deleting = false;
  let paused = false;
  let visible = false;
  let timer;

  function positionCursor() {
    const anchor = characters[Math.max(0, count - 1)];
    const box = anchor.getBoundingClientRect();
    const parent = title.getBoundingClientRect();
    const size = parseFloat(getComputedStyle(title).fontSize);
    cursor.style.left = `${(count ? box.right : box.left) - parent.left}px`;
    cursor.style.top = `${box.top - parent.top + size * 0.08}px`;
    cursor.style.color = getComputedStyle(anchor).color;
  }
  function render() {
    characters.forEach((character, index) => {
      character.style.visibility = index < count ? "visible" : "hidden";
    });
    positionCursor();
  }
  function schedule(delay) {
    clearTimeout(timer);
    if (!motion.matches && !paused && visible && !document.hidden) {
      timer = setTimeout(tick, delay);
    }
  }
  function tick() {
    count += deleting ? -1 : 1;
    render();
    if (count === characters.length) {
      deleting = true;
      schedule(2000);
    } else if (count === 0) {
      deleting = false;
      schedule(300);
    } else schedule(deleting ? 30 : 50);
  }
  function updateMotion() {
    clearTimeout(timer);
    count = motion.matches || paused ? characters.length : 0;
    deleting = false;
    cursor.hidden = motion.matches || paused;
    toggle.hidden = motion.matches;
    render();
    schedule(200);
  }
  toggle.addEventListener("click", () => {
    paused = !paused;
    toggle.textContent = paused
      ? "Продолжить анимацию"
      : "Приостановить анимацию";
    updateMotion();
  });
  motion.addEventListener("change", updateMotion);
  document.addEventListener("visibilitychange", () => schedule(100));
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule(100);
  }).observe(title);
  new ResizeObserver(positionCursor).observe(title);
  document.fonts.ready.then(positionCursor);
  updateMotion();
}
