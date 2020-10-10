const puppeteer = require('puppeteer');
const config = require('./config');

(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		timeout: 0,
		args: ['--use-fake-ui-for-media-stream']
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
		await page.click(
			'.node_modules--msteams-bridges-components-calendar-grid-dist-es-src-renderers-calendar-top-bar-renderer-calendar-top-bar-renderer__topBarContent--2xlZu root-55'
		);

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
			page.on('dialog', async dialog => {
				console.log('dialog appeared');
				await dialog.accept();
			});
			await page.waitForNavigation('networkidle0');
			await page.click('toggle-button[data-tid="toggle-video"]');
			await page.click('toggle-button[data-tid="toggle-mute"]');

			setTimeout(() => joinMeeting(page), 5 * 1000);
		} else {
			console.log('ckecking...');
			setTimeout(checkForMeetings, config.refreshInSecs * 1000);
		}
	}

	checkForMeetings();
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

async function joinMeeting(page) {
	console.log('joined!');
	await page.click('.join-btn');
}
