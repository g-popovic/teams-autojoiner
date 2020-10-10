const puppeteer = require('puppeteer');
const config = require('./config');

const joinBtnQuery =
	'.node_modules--msteams-bridges-components-calendar-event-card-dist-es-src-renderers-event-card-renderer-event-card-renderer__joinButton--1AeXc';
const calendarBtnQuery =
	'.node_modules--msteams-bridges-components-calendar-grid-dist-es-src-renderers-calendar-top-bar-renderer-calendar-top-bar-renderer__topBarContent--2xlZu';
let firstTime = true;

(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		timeout: 0,
		args: ['--use-fake-ui-for-media-stream']
	});
	const page = await browser.newPage();
	page.setDefaultTimeout(0);

	await login(page);
	await checkForMeetings(page);
})();

async function login(page) {
	await page.goto('https://teams.microsoft.com/_#/conversations/a', {
		timeout: 0
	});
	const date = new Date();
	await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
	console.log(new Date() - date);
	await page.type('input[type="email"]', config.email);
	await page.click('input[type="submit"]');

	await page.waitForNavigation({ waitUntil: 'networkidle0' });
	await page.type('input[type="password"]', config.password);
	await page.click('input[type="submit"]');

	await page.waitForNavigation({ waitUntil: 'networkidle0' });
	await page.click('input[type="submit"]');

	await page.waitForSelector('a.use-app-lnk');
	await page.click('a.use-app-lnk');
}

async function checkForMeetings(page) {
	await page.goto('https://teams.microsoft.com/_#/calendarv2');

	if (firstTime) {
		await page.waitForSelector(calendarBtnQuery);
		console.log('found it');
		setTimeout(async () => await page.click(calendarBtnQuery), 2000);
	}

	await page.waitForSelector(joinBtnQuery, { timeout: 0 });

	setTimeout(() => joinMeeting(page), 10 * 1000);
}

async function checkParticipants(page) {
	const numOfParticipants = Number(
		(
			await page.evaluate(
				() => document.querySelectorAll('span.toggle-number')[1].textContent
			)
		).slice(1, 2)
	);
	if (numOfParticipants - 1 <= config.minParticipants) {
		leaveMeeting(page);
	} else {
		setTimeout(() => checkParticipants(page), config.refreshInSecs * 1000);
	}
}

async function joinMeeting(page) {
	await page.click(joinBtnQuery);

	await page.waitForSelector('toggle-button[data-tid="toggle-mute"]');
	await page.click('toggle-button[data-tid="toggle-mute"]');
	if (firstTime) await page.click('toggle-button[data-tid="toggle-video"]');
	firstTime = false;

	await page.click('.join-btn');

	await page.waitForSelector('#roster-button');
	await page.click('#roster-button');

	checkParticipants(page);
}

async function leaveMeeting(page) {
	await page.click('#hangup-button');

	checkForMeetings(page);
}
