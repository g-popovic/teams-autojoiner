const puppeteer = require('puppeteer');
const config = require('./config');

(async () => {
	const browser = await puppeteer.launch({
		headless: false
	});

	const page = await browser.newPage();
	await page.goto('https://teams.microsoft.com/_#/conversations/a');

	// Login

	await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
	await page.type('input[type="email"]', config.email);
	await page.click('input[type="submit"]');

	await page.waitForNavigation({ waitUntil: 'networkidle2' });
	await page.type('input[type="password"]', config.password);
	await page.click('input[type="submit"]');

	await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
	await page.click('input[type="submit"]');
	await page.waitForNavigation({ waitUntil: 'networkidle2' });
	await page.click('a.use-app-lnk');

	// await browser.close();
})();
