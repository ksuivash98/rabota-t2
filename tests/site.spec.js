import { test, expect } from "@playwright/test";

test("renders four salons, complete form and no horizontal overflow", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "ТВОЯ КАРЬЕРА",
  );
  await expect(page.locator(".salon-card")).toHaveCount(4);
  await expect(page.locator("#salon option")).toHaveCount(5);
  await expect(page.locator(".benefit")).toHaveCount(6);
  await expect(page.locator(".hero-art")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(page.locator(".hero-buttons .button-pink")).toHaveCSS(
    "background-color",
    "rgb(255, 45, 141)",
  );
  expect(await page.evaluate(() => document.fonts.check("16px Inter"))).toBe(
    true,
  );
  await expect(page.locator('script[type="module"]')).toHaveAttribute(
    "src",
    /^\/rabota-t2\/assets\/.*\.js$/,
  );
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("all salons transfer selection to the form", async ({ page }) => {
  await page.goto("./");
  for (const salon of ["tsum", "semya", "molodezhny", "millennium"]) {
    await page.locator(`[data-salon="${salon}"]`).click();
    await expect(page.locator("#salon")).toHaveValue(salon);
    await expect(page.locator("#name")).toBeFocused();
    await expect(page.locator(".salon-card.is-selected")).toHaveCount(1);
  }
});

test("validates fields and never sends personal data without a receiver", async ({
  page,
}) => {
  await page.goto("./");
  const outgoing = [];
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH"].includes(request.method()))
      outgoing.push(request.url());
  });
  await page.locator(".submit-button").click();
  await expect(page.locator("#surname")).toBeFocused();
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(6);
  await page.locator("#surname").fill("Иванова");
  await page.locator("#age").fill("двадцать");
  await page.locator(".submit-button").click();
  await expect(page.locator("#age-error")).toContainText("целым числом");
  await page.locator("#age").fill("23");
  await page.locator("#name").fill("Анна");
  await page.locator("#phone").fill("123");
  await page.locator("#salon").selectOption("semya");
  await page.locator("#time").selectOption("evening");
  await page.locator(".submit-button").click();
  await expect(page.locator("#phone-error")).toContainText("российский номер");
  await page.locator("#phone").fill("+7 (912) 123-45-67");
  await page.locator(".submit-button").click();
  await expect(page.locator("#form-status")).toContainText(
    "Заявка не отправлена",
  );
  expect(outgoing).toEqual([]);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("benefits expand and journey supports keyboard navigation", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator(".benefit summary").first().click();
  await expect(page.locator(".benefit").first()).toHaveAttribute("open", "");
  await page.locator("#step-1").focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#step-2")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.locator("#step-title")).toContainText("Поговорим");
  await page.keyboard.press("End");
  await expect(page.locator("#step-4")).toBeFocused();
  await expect(page.locator("#step-panel")).toHaveAttribute(
    "aria-labelledby",
    "step-4",
  );
});

test("mobile navigation closes on selection and Escape", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile navigation only");
  await page.goto("./");
  const menu = page.getByRole("button", { name: "Открыть меню" });
  await menu.click();
  await expect(page.locator("#mobile-nav")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#mobile-nav")).toBeHidden();
  await menu.click();
  await page.locator('#mobile-nav a[href="#salons"]').click();
  await expect(page.locator("#mobile-nav")).toBeHidden();
  await expect(page).toHaveURL(/#salons$/);
});

test("captures design for review", async ({ page }, testInfo) => {
  await page.goto("./");
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test("employer contacts use exact destinations without candidate data", async ({
  page,
}) => {
  await page.goto("./");
  const max = page.locator("#max-contact");
  await expect(max).toHaveAttribute(
    "href",
    "https://max.ru/u/f9LHodD0cOJ7i9WLYDcq3H03eejukS2hY-I39ItXkDIikkQHQ-qmElDdpio",
  );
  await expect(max).toHaveAttribute("target", "_blank");
  await expect(max).toHaveAttribute("rel", "noopener noreferrer");
  await expect(
    page.getByRole("link", { name: "+7 (902) 800-88-02", exact: true }),
  ).toHaveAttribute("href", "tel:+79028008802");
  await page.locator("#name").fill("Анна");
  await page.locator("#phone").fill("+7 (912) 123-45-67");
  expect(new URL(await max.getAttribute("href")).search).toBe("");
  await page.setViewportSize({ width: 320, height: 850 });
  await max.scrollIntoViewIfNeeded();
  await expect(max).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("heading types and erases without a final period or layout shift", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./");
  const title = page.getByRole("heading", { level: 1 });
  await expect(title).toHaveAccessibleName("ТВОЯ КАРЬЕРА НАЧИНАЕТСЯ ЗДЕСЬ");
  await expect(title.locator(".title-line").last()).toHaveText("ЗДЕСЬ");
  await page.evaluate(() => document.fonts.ready);
  const initial = await title.boundingBox();
  const visibleCount = () =>
    title
      .locator(".typing-char")
      .evaluateAll(
        (chars) =>
          chars.filter(
            (char) => getComputedStyle(char).visibility === "visible",
          ).length,
      );
  const total = await title.locator(".typing-char").count();
  await expect.poll(visibleCount).toBe(total);
  await expect.poll(visibleCount, { timeout: 6000 }).toBeLessThan(total);
  const during = await title.boundingBox();
  expect(during.height).toBeCloseTo(initial.height);
  expect(during.width).toBeCloseTo(initial.width);
  await page
    .locator('[aria-controls="hero-title"]')
    .filter({ hasText: "Приостановить анимацию" })
    .click();
  await expect.poll(visibleCount).toBe(total);
  await expect(title.locator(".title-cursor")).toBeHidden();
  await page
    .locator('[aria-controls="hero-title"]')
    .filter({ hasText: "Продолжить анимацию" })
    .click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(visibleCount).toBe(total);
  await expect(
    page.locator('.title-motion-toggle[aria-controls="hero-title"]'),
  ).toBeHidden();
});

test("heading is readable when JavaScript is disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4180/rabota-t2/");
  await expect(
    page.getByRole("heading", {
      name: "ТВОЯ КАРЬЕРА НАЧИНАЕТСЯ ЗДЕСЬ",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("#hero-title")).toContainText("ЗДЕСЬ");
  await context.close();
});

test("possibilities heading unfolds on scroll and remains accessible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./");
  const heading = page.getByRole("heading", {
    name: "Есть контакт Есть перспективы",
    exact: true,
  });
  await expect(heading).toHaveAttribute("data-fold-state", "waiting");
  await page.evaluate(() => document.fonts.ready);
  const before = await heading.boundingBox();
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toHaveAttribute("data-fold-state", "complete", {
    timeout: 6000,
  });
  const after = await heading.boundingBox();
  expect(after.height).toBeCloseTo(before.height);
  expect(after.width).toBeCloseTo(before.width);
  await expect(heading.locator(".pink-text")).toHaveCSS(
    "color",
    "rgb(255, 45, 141)",
  );
  await expect(heading.locator(".fold-piece").last()).toHaveCSS("opacity", "1");
});

test("fold heading respects reduced motion including preference changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const heading = page.locator("#possibilities-title");
  await expect(heading).toHaveAttribute("data-fold-state", "complete");
  await expect(heading.locator(".fold-piece").first()).toHaveCSS(
    "opacity",
    "1",
  );
  await page.reload();
  await expect(heading).toHaveAttribute("data-fold-state", "complete");
});

test("growth heading draws contours then fills on scroll", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./");
  const heading = page.getByRole("heading", {
    name: "Первый шаг — сегодня Дальше — больше",
    exact: true,
  });
  await expect(heading).toHaveAttribute("data-stroke-state", "waiting");
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toHaveAttribute("data-stroke-state", "playing");
  await expect(heading.locator(".stroke-overlay text").first()).toHaveAttribute(
    "x",
    /.+/,
  );
  const during = await heading.boundingBox();
  await expect(heading).toHaveAttribute("data-stroke-state", "complete", {
    timeout: 6000,
  });
  await expect(heading.locator(".stroke-source")).toHaveCSS("opacity", "1");
  const after = await heading.boundingBox();
  expect(after.width).toBeCloseTo(during.width);
  expect(after.height).toBeCloseTo(during.height);
});

test("growth heading stays readable with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await expect(page.locator("#growth-title")).toHaveAttribute(
    "data-stroke-state",
    "complete",
  );
  await expect(page.locator("#growth-title .stroke-overlay")).toHaveCount(0);
});

test("salon typing, journey folding and contact shine activate on view", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./");
  const salon = page.getByRole("heading", {
    name: "Твой город Твоё место",
    exact: true,
  });
  await salon.scrollIntoViewIfNeeded();
  await expect(salon.locator(".title-cursor")).toBeVisible();
  await page.locator(".salons-motion-toggle").click();
  await expect(salon.locator(".title-cursor")).toBeHidden();
  const journey = page.locator("#journey-title");
  await journey.scrollIntoViewIfNeeded();
  await expect(journey).toHaveAttribute("data-fold-state", "complete", {
    timeout: 6000,
  });
  const contact = page.locator("#contact-title-shine");
  await contact.scrollIntoViewIfNeeded();
  await expect(contact).toHaveAttribute("data-shine-state", "complete", {
    timeout: 5000,
  });
  await expect(contact).toHaveText(/Давай\s*будем\s*на связи/);
  await expect(contact.locator(".shine-layer")).toHaveCount(0);
});
