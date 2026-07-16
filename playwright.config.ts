import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
	testDir: 'e2e',
	timeout: 60_000,
	expect: { timeout: 10_000 },
	fullyParallel: true,
	reporter: [['list']],
	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: 'retain-on-failure'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'bun run dev',
		port: PORT,
		env: { PORT: String(PORT) },
		reuseExistingServer: false,
		timeout: 120_000
	}
});
