const puppeteer = require('puppeteer');
const config = require('./config');

(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		timeout: 0
	});

	const page = await browser.newPage();

	try {
		await login(page);
	} catch (err) {
		browser.close();
		console.error(err);
		return;
	}

	async function checkForMeetings() {
		const buttonClass =
			'.node_modules--msteams-bridges-components-calendar-event-card-dist-es-src-renderers-event-card-renderer-event-card-renderer__joinButton--1AeXc';

		const button = await page.evaluate(() =>
			Boolean(
				document.querySelector(
					'.node_modules--msteams-bridges-components-calendar-event-card-dist-es-src-renderers-event-card-renderer-event-card-renderer__joinButton--1AeXc'
				)
			)
		);

		if (button) {
			await page.click(buttonClass);
			console.log('joining...');
		} else {
			console.log('ckecking...');
			setTimeout(checkForMeetings, 2000);
		}
	}

	checkForMeetings();

	console.log('joined!');
})();

async function login(page) {
	await page.goto('https://teams.microsoft.com/_#/conversations/a', {
		timeout: 0
	});

	await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 0 });
	await page.type('input[type="email"]', config.email);
	await page.click('input[type="submit"]');

	await page.waitForNavigation({ waitUntil: 'networkidle0' });
	await page.type('input[type="password"]', config.password);
	await page.click('input[type="submit"]');

	await page.waitForNavigation({ waitUntil: 'networkidle0' });
	await page.click('input[type="submit"]');
	await page.waitForNavigation({ waitUntil: 'networkidle2' });
	console.log(await page.click('a.use-app-lnk'));

	await page.goto('https://teams.microsoft.com/_#/calendarv2');
}
