import { initShinyText } from "./shiny-text.js";
import { initStrokeText } from "./stroke-text.js";
import { initFoldText } from "./fold-text.js";
import { initTitleTyping } from "./title-typing.js";
import "@fontsource/inter/cyrillic-400.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/cyrillic-600.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/cyrillic-700.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/cyrillic-800.css";
import "@fontsource/inter/latin-800.css";
import "./styles.css";

const menuButton = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector("#mobile-nav");
function closeMenu() {
  mobileNav.hidden = true;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Открыть меню");
}
menuButton.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") === "true";
  mobileNav.hidden = expanded;
  menuButton.setAttribute("aria-expanded", String(!expanded));
  menuButton.setAttribute(
    "aria-label",
    expanded ? "Открыть меню" : "Закрыть меню",
  );
});
mobileNav
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !mobileNav.hidden) {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia("(min-width: 761px)").addEventListener("change", (event) => {
  if (event.matches) closeMenu();
});

const salonSelect = document.querySelector("#salon");
function syncSalonCards() {
  document.querySelectorAll("[data-salon]").forEach((button) => {
    const selected = button.dataset.salon === salonSelect.value;
    button.closest(".salon-card").classList.toggle("is-selected", selected);
    button.innerHTML = `${selected ? 'Салон выбран <span aria-hidden="true">✓</span>' : "Выбрать салон"}`;
  });
}
document.querySelectorAll("[data-salon]").forEach((button) => {
  button.addEventListener("click", () => {
    salonSelect.value = button.dataset.salon;
    salonSelect.dispatchEvent(new Event("change"));
    document.querySelector("#apply").scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    document.querySelector("#name").focus({ preventScroll: true });
  });
});
salonSelect.addEventListener("change", syncSalonCards);

const steps = [
  {
    caption: "ПЕРВЫЙ КОНТАКТ",
    title: "Всё начинается\nс твоего «привет»",
    description:
      "Напиши работодателю в MAX или позвони. Расскажи, какой салон тебе интересен, и договорись о собеседовании",
  },
  {
    caption: "ЗНАКОМСТВО",
    title: "Поговорим\nо самом важном",
    description:
      "Обсудим твои ожидания, задачи, график и условия оплаты. Задай все вопросы, чтобы понять, подходит ли тебе эта работа",
  },
  {
    caption: "ПРОБУЕШЬ НА ПРАКТИКЕ",
    title: "10 рабочих дней\nдля нового старта",
    description:
      "Познакомься с работой салона на оплачиваемой стажировке. Условия оформления и оплаты необходимо согласовать с работодателем до её начала",
  },
  {
    caption: "ТЫ В КОМАНДЕ",
    title: "Включайся\nЗдесь есть место тебе",
    description:
      "После согласования условий присоединяйся к команде. Помогай клиентам, узнавай новое о технологиях и развивай профессиональные навыки",
  },
];
const tabs = [...document.querySelectorAll('[role="tab"]')];
function activateStep(index, focus = false) {
  tabs.forEach((tab, i) => {
    tab.setAttribute("aria-selected", String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
  });
  document
    .querySelector("#step-panel")
    .setAttribute("aria-labelledby", tabs[index].id);
  document.querySelector(".step-big").textContent = `0${index + 1}`;
  document.querySelector("#step-caption").textContent = steps[index].caption;
  document
    .querySelector("#step-title")
    .replaceChildren(
      ...steps[index].title
        .split("\n")
        .flatMap((line, i) =>
          i
            ? [document.createElement("br"), document.createTextNode(line)]
            : [document.createTextNode(line)],
        ),
    );
  document.querySelector("#step-description").textContent =
    steps[index].description;
  if (focus) tabs[index].focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateStep(index));
  tab.addEventListener("keydown", (event) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (index + (event.key === "ArrowDown" ? 1 : -1) + tabs.length) %
            tabs.length;
    activateStep(next, true);
  });
});

const form = document.querySelector("#application-form");
const status = document.querySelector("#form-status");
const fields = [...form.querySelectorAll("input, select")];
function errorFor(field) {
  const value = field.value.trim();
  if (!value)
    return {
      surname: "Укажи фамилию",
      name: "Укажи имя",
      age: "Укажи возраст",
      phone: "Укажи номер телефона",
      salon: "Выбери один из четырёх салонов",
      time: "Выбери удобное время для связи",
    }[field.name];
  if (
    ["name", "surname"].includes(field.name) &&
    (value.length < 2 || !/^[\p{L}\p{M}\s’'−-]+$/u.test(value))
  )
    return field.name === "surname"
      ? "Укажи фамилию буквами, не менее двух символов"
      : "Укажи имя буквами, не менее двух символов";
  if (
    field.name === "age" &&
    (!/^\d{1,3}$/.test(value) || Number(value) < 1 || Number(value) > 120)
  )
    return "Укажи возраст целым числом от 1 до 120";
  if (
    field.name === "phone" &&
    (!/^[+\d\s()−-]+$/.test(value) ||
      !/^[78]\d{10}$/.test(value.replace(/\D/g, "")))
  )
    return "Введи российский номер: +7 или 8 и ещё 10 цифр";
  return "";
}
function validateField(field) {
  const message = errorFor(field);
  document.querySelector(`#${field.id}-error`).textContent = message;
  field.setAttribute("aria-invalid", String(Boolean(message)));
  return !message;
}
fields.forEach((field) => {
  field.addEventListener("blur", () => {
    if (field.value || field.getAttribute("aria-invalid") === "true")
      validateField(field);
  });
  field.addEventListener(
    field.tagName === "SELECT" ? "change" : "input",
    () => {
      if (field.getAttribute("aria-invalid") === "true") validateField(field);
      status.textContent = "";
    },
  );
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const results = fields.map(validateField);
  if (results.includes(false)) {
    status.textContent = "Проверь отмеченные поля. Данные не отправлены";
    fields[results.indexOf(false)].focus();
    return;
  }
  // Deliberately no receiver, network request, local storage, or success state.
  // Do not enable submission before the employer, receiver and privacy terms are configured.
  status.textContent =
    "Заявка не отправлена: автоматическая отправка ещё не подключена. Для записи напиши работодателю в MAX или позвони по номеру +7 (902) 800-88-02 — кнопки находятся над формой";
});
const stickyApply = document.querySelector(".mobile-apply");
new IntersectionObserver(
  (entries) => {
    stickyApply.classList.toggle("is-hidden", entries[0].isIntersecting);
  },
  { threshold: 0.08 },
).observe(document.querySelector("#apply"));
document.querySelector("#year").textContent = String(new Date().getFullYear());

initTitleTyping();

initFoldText();

initStrokeText();

initTitleTyping("#salons-title", ".salons-motion-toggle");
initFoldText("#journey-title");

initShinyText();
