// Paper/top FoldText effect adapted to a static heading using Web Animations.
export function initFoldText(selector = "#possibilities-title") {
  const title = document.querySelector(selector);
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const pieces = [];
  // Keep words together, the explicit line break, and the accent's inherited color.
  function splitText(node) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            fragment.append(document.createTextNode(part));
            return;
          }
          const word = document.createElement("span");
          word.className = "fold-word";
          Array.from(part).forEach((character) => {
            const segment = document.createElement("span");
            segment.className = "fold-segment";
            const piece = document.createElement("span");
            piece.className = "fold-piece";
            piece.textContent = character;
            pieces.push(piece);
            segment.append(piece);
            word.append(segment);
          });
          fragment.append(word);
        });
        child.replaceWith(fragment);
      } else if (child.nodeType === Node.ELEMENT_NODE) splitText(child);
    });
  }
  const visual = document.createElement("span");
  visual.setAttribute("aria-hidden", "true");
  visual.append(...title.childNodes);
  title.append(visual);
  splitText(visual);
  let animations = [];
  let observer;
  let completed = false;
  function complete() {
    completed = true;
    title.classList.remove("fold-pending");
    title.dataset.foldState = "complete";
    animations.forEach((animation) => animation.cancel());
    animations = [];
    observer?.disconnect();
  }
  function unfold() {
    if (completed || title.dataset.foldState === "playing") return;
    if (motion.matches) {
      complete();
      return;
    }
    title.dataset.foldState = "playing";
    animations = pieces.map((piece, index) =>
      piece.animate(
        [
          {
            transform: "rotateX(-92deg)",
            opacity: 0,
            filter: "brightness(0.45)",
          },
          { transform: "rotateX(0deg)", opacity: 1, filter: "brightness(1)" },
        ],
        {
          duration: 650,
          delay: index * 45,
          easing: "cubic-bezier(0.215, 0.61, 0.355, 1)",
          fill: "both",
        },
      ),
    );
    Promise.all(animations.map((animation) => animation.finished))
      .then(complete)
      .catch(() => {
        // Reduced-motion changes can cancel animations before their completion.
      });
  }
  if (
    motion.matches ||
    !Element.prototype.animate ||
    !window.IntersectionObserver
  ) {
    complete();
    return;
  }
  title.classList.add("fold-pending");
  title.dataset.foldState = "waiting";
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        unfold();
      }
    },
    { rootMargin: `0px 0px -${Math.round(innerHeight * 0.18)}px 0px` },
  );
  observer.observe(title);
  motion.addEventListener("change", () => {
    if (motion.matches) complete();
  });
}
