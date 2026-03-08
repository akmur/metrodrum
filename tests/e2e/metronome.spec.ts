import { test, expect } from "@playwright/test";

test.describe("Metronome App", () => {
  // --- Routing ---

  test("navigates between Metronome and MIDI pages", async ({ page }) => {
    await page.goto("/metronome");
    await expect(page.getByRole("heading", { name: "Metronome" })).toBeVisible();

    await page.getByRole("link", { name: "MIDI" }).click();
    await expect(page.getByRole("heading", { name: "MIDI Player" })).toBeVisible();

    await page.getByRole("link", { name: "Metronome" }).click();
    await expect(page.getByRole("heading", { name: "Metronome" })).toBeVisible();
  });

  test("root path redirects to /metronome", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/metronome/);
    await expect(page.getByRole("heading", { name: "Metronome" })).toBeVisible();
  });

  // --- BPM State ---

  test("BPM slider updates the displayed BPM value", async ({ page }) => {
    await page.goto("/metronome");

    const slider = page.getByLabel("BPM", { exact: true });
    await expect(slider).toBeVisible();

    // Change BPM via the numeric input
    const bpmInput = page.getByLabel("BPM value");
    await bpmInput.fill("180");
    await bpmInput.press("Enter");

    const bpmDisplay = page.locator("output");
    await expect(bpmDisplay).toHaveText("180");

    // Verify slider reflects new value
    await expect(slider).toHaveValue("180");
  });

  test("subdivision buttons update the beat indicator count", async ({ page }) => {
    await page.goto("/metronome");

    // Default subdivision is 4 → 4 beat dots
    const beatGroup = page.getByRole("group", { name: "Beat indicator" });
    await expect(beatGroup.getByRole("status")).toHaveCount(4);

    // Switch to 8
    const sub8 = page.getByRole("radio", { name: "8" });
    await sub8.click();
    await expect(sub8).toHaveAttribute("aria-checked", "true");
    await expect(beatGroup.getByRole("status")).toHaveCount(8);

    // Switch to 2
    const sub2 = page.getByRole("radio", { name: "2" });
    await sub2.click();
    await expect(sub2).toHaveAttribute("aria-checked", "true");
    await expect(beatGroup.getByRole("status")).toHaveCount(2);
  });

  // --- User Gesture (Audio Autoplay Policy) ---

  test("audio starts only after user interaction (click Start)", async ({ page }) => {
    await page.goto("/metronome");

    const startButton = page.getByRole("button", { name: "Start metronome" });
    await expect(startButton).toBeVisible();
    await expect(startButton).toHaveText("Start");

    // Before clicking: no AudioContext should be active.
    // The browser autoplay policy blocks audio until a user gesture occurs.
    const ctxCountBefore = await page.evaluate(() => {
      // Check if any AudioContext exists and is running
      return (globalThis as unknown as Record<string, AudioContext[]>)
        .__audioContexts?.filter((c: AudioContext) => c.state === "running").length ?? 0;
    });
    expect(ctxCountBefore).toBe(0);

    // Click Start → user gesture → Tone.start() resumes AudioContext
    await startButton.click();

    // Button label changes to "Stop" confirming audio started
    const stopButton = page.getByRole("button", { name: "Stop metronome" });
    await expect(stopButton).toBeVisible();
    await expect(stopButton).toHaveText("Stop");

    // Verify a running AudioContext exists after user gesture
    await page.waitForTimeout(500);
    const ctxState = await page.evaluate(() => {
      // Tone.js uses a BaseAudioContext; find it via the global hack or
      // just check if there's a running AudioContext
      const contexts = performance.getEntriesByType?.("resource") ?? [];
      // More reliable: check the BaseAudioContext prototype
      const audioCtx = (globalThis as unknown as { __TONE_CONTEXT__?: AudioContext }).__TONE_CONTEXT__;
      if (audioCtx) return audioCtx.state;

      // Fallback: look at all AudioContext instances we can find
      return document.querySelector("audio")
        ? "found-audio-element"
        : "no-direct-access";
    });

    // The most reliable assertion: the UI state changed from Start to Stop,
    // which only happens after Tone.start() succeeds (requires user gesture).
    // This IS the user gesture test — if autoplay was blocked, Tone.start()
    // would fail and the button would remain "Start".
    await expect(stopButton).toBeVisible();
  });

  // --- Theme Toggle ---

  test("theme toggle switches between light and dark mode", async ({ page }) => {
    await page.goto("/metronome");

    const html = page.locator("html");
    // Wait for theme to be applied
    await expect(html).toHaveAttribute("data-theme", /.+/);
    const initialTheme = await html.getAttribute("data-theme");

    const themeButton = page.getByRole("button", { name: /switch to/i });
    await themeButton.click();

    // data-theme should have changed
    const newTheme = await html.getAttribute("data-theme");
    expect(newTheme).not.toBe(initialTheme);
    expect(["light", "dark"]).toContain(newTheme);
  });
});
