import { test, expect, type Page, type Locator } from '@playwright/test';
import { allLessons, stepExercises, type Exercise } from '../src/lib/data/course';
import { chartSections } from '../src/lib/data/script';

const STORAGE_KEY = 'myanlingo-progress-v1';

const lesson1 = allLessons[0].lesson;
// Step 1 only: steps 2 and 3 are optional depth the player doesn't show here,
// and the suite answers questions by reading the course data.
const lesson1Step1 = stepExercises(lesson1, 1);
const lesson2 = allLessons[1]?.lesson;

test.beforeEach(async ({ page }) => {
	// Mute app audio (Web Audio SFX + pronunciation playback) so headless runs
	// never depend on autoplay policies, and answer the home hero's "where are
	// you starting from?" as a beginner so tests exercise the settled layout.
	// Only seed when the key is absent — reloads must keep earned progress.
	await page.addInitScript(([key]) => {
		if (!localStorage.getItem(key)) {
			localStorage.setItem(key, JSON.stringify({ sound: false, profile: 'beginner' }));
		}
	}, [STORAGE_KEY]);
});

/** Navigates and waits until the app is hydrated (clicks work). */
async function gotoApp(page: Page, path: string) {
	await page.goto(path);
	await page.locator('body[data-hydrated="true"]').waitFor();
}

/** A card/tile in `scope` whose visible text is exactly `text`. */
function byExactText(page: Page, scope: Locator, text: string): Locator {
	return scope.filter({ has: page.getByText(text, { exact: true }) });
}

/**
 * Answers the exercise currently on screen, correctly, driven by course data.
 * Handles every exercise kind lesson content may contain.
 */
async function solveExercise(page: Page, ex: Exercise) {
	const continueBtn = page.getByRole('button', { name: 'Continue' });

	switch (ex.kind) {
		case 'learn':
			await continueBtn.click();
			break;

		case 'choice': {
			// One-tap answering: the tap checks immediately, no Check step.
			const correct = ex.options[ex.correct];
			await byExactText(page, page.locator('.options .answer-card'), correct.text).click();
			await continueBtn.click(); // correct-answer feedback footer
			break;
		}

		case 'listen': {
			// Same one-tap flow as choice; the correct option shows the played text.
			const correct = ex.options[ex.correct];
			await byExactText(page, page.locator('.options .answer-card'), correct.text).click();
			await continueBtn.click();
			break;
		}

		case 'match': {
			const left = page.locator('.cols .col').first();
			const right = page.locator('.cols .col').nth(1);
			for (const pair of ex.pairs) {
				await byExactText(page, left.locator('.answer-card'), pair.l).click();
				await byExactText(page, right.locator('.answer-card'), pair.r).click();
			}
			// The footer button turns into an enabled "Continue" once all pairs match.
			await continueBtn.click();
			break;
		}

		case 'assemble': {
			for (const tile of ex.answer) {
				await byExactText(page, page.locator('.bank .tile:not([disabled])'), tile.t)
					.first()
					.click();
			}
			await page.getByRole('button', { name: 'Check' }).click();
			await continueBtn.click();
			break;
		}
	}
}

test('home loads with brand, mascot and lesson 1 ready to start', async ({ page }) => {
	await gotoApp(page, '/');

	await expect(page.locator('.brand-name')).toHaveText('MyanLingo');
	await expect(page.getByRole('img', { name: /Shwe the cat mascot/ })).toBeVisible();

	// Lesson 1 node is unlocked (aria-label has no "(locked)" suffix) and marked START.
	const node1 = page.getByRole('button', { name: lesson1.title, exact: true });
	await expect(node1).toBeEnabled();
	await expect(node1.locator('.start-bubble')).toHaveText('START');
});

test('start chooser asks once and personalizes the home screen', async ({ page }) => {
	await gotoApp(page, '/');
	// Wipe the seeded profile so the hero asks, like a real first visit.
	await page.evaluate((key) => {
		localStorage.setItem(key, JSON.stringify({ sound: false }));
	}, STORAGE_KEY);
	await page.reload();
	await page.locator('body[data-hydrated="true"]').waitFor();

	const chooser = page.locator('.chooser');
	await expect(chooser).toBeVisible();

	// A heritage speaker picks "I speak it, but can't read it" → home leads
	// with the Script Studio, but the course path stays visible below.
	await chooser.getByRole('button', { name: /I speak it/ }).click();
	await expect(chooser).toBeHidden();
	await expect(page.locator('.primary-card')).toContainText('Continue the script');
	await expect(page.getByRole('button', { name: lesson1.title, exact: true })).toBeVisible();

	// The choice persists — no re-asking on the next visit.
	await page.reload();
	await page.locator('body[data-hydrated="true"]').waitFor();
	await expect(page.locator('.chooser')).toBeHidden();
	await expect(page.locator('.primary-card')).toContainText('Continue the script');
});

test('completes lesson 1, persists progress and unlocks lesson 2', async ({ page }) => {
	await gotoApp(page, `/lesson/${lesson1.id}`);

	// Answer every exercise correctly, straight from the course data. Since no
	// answer is ever wrong, nothing gets re-queued and the lesson ends after
	// the authored exercise list.
	for (const ex of lesson1Step1) {
		await solveExercise(page, ex);
	}

	// Completion screen: 3/3 stars (zero mistakes) and some XP.
	const complete = page.locator('.complete');
	await expect(complete).toBeVisible();
	await expect(complete.locator('.stars .star.lit')).toHaveCount(3);
	await expect(complete.locator('.stat-value').first()).toContainText('⚡');

	// Continue returns home.
	await complete.getByRole('button', { name: 'Continue' }).click();
	await expect(page).toHaveURL('/');

	// Progress persisted to localStorage.
	const saved = await page.evaluate(
		(key) => JSON.parse(localStorage.getItem(key) ?? 'null'),
		STORAGE_KEY
	);
	expect(saved?.stars?.[lesson1.id]).toBeGreaterThanOrEqual(1);
	expect(saved?.xp).toBeGreaterThan(0);

	// After a full reload, lesson 1 shows as completed and lesson 2 is unlocked.
	await page.reload();
	const node1 = page.getByRole('button', { name: lesson1.title, exact: true });
	await expect(node1).toHaveClass(/completed/);
	await expect(node1.locator('.node-stars')).toBeVisible();
	if (lesson2) {
		const node2 = page.getByRole('button', { name: lesson2.title, exact: true });
		await expect(node2).toBeEnabled();
		await expect(node2.locator('.start-bubble')).toHaveText('START');
	}
});

test('earns a crown with a perfect hard-mode run', async ({ page }) => {
	// Seed lesson 1 as already completed so hard mode is meaningful. The
	// profile matters too: without one the home screen shows the start
	// chooser instead of the path.
	await page.addInitScript(
		([key, lessonId]) => {
			localStorage.setItem(
				key,
				JSON.stringify({ sound: false, profile: 'beginner', stars: { [lessonId]: 3 } })
			);
		},
		[STORAGE_KEY, lesson1.id] as const
	);
	await gotoApp(page, '/');

	// The completed node carries a crown chip linking to hard mode.
	const chip = page.getByRole('link', { name: `Hard mode for ${lesson1.title}` });
	await expect(chip).toBeVisible();
	await chip.click();
	await page.locator('body[data-hydrated="true"]').waitFor();

	// Hard mode is drills only — solve exactly the non-learn exercises.
	await expect(page.locator('.hard-badge')).toBeVisible();
	for (const ex of lesson1Step1.filter((e) => e.kind !== 'learn')) {
		await solveExercise(page, ex);
	}

	// Perfect run: the crown is announced and persisted.
	await expect(page.locator('.crown-result')).toHaveClass(/won/);
	const saved = await page.evaluate(
		(key) => JSON.parse(localStorage.getItem(key) ?? 'null'),
		STORAGE_KEY
	);
	expect(saved?.crowns?.[lesson1.id]).toBeDefined();

	// Home now shows the chip in its crowned state.
	await page.locator('.complete').getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByRole('link', { name: `Hard mode for ${lesson1.title}` })).toHaveClass(
		/crowned/
	);
});

test('script studio hub renders the alphabet chart', async ({ page }) => {
	await gotoApp(page, '/script');

	await expect(page.getByRole('heading', { name: 'Script Studio' })).toBeVisible();

	// Every glyph of every chart section gets a cell.
	const totalCells = chartSections.reduce((n, s) => n + s.ids.length, 0);
	expect(totalCells).toBeGreaterThan(0);
	await expect(page.locator('.chart .cell')).toHaveCount(totalCells);
});
