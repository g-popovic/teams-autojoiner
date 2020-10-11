const puppeteer = require('puppeteer');
const config = require('./config');

let firstTime = true;
const refreshSpeed = 5; // Rate at which remaining participants are checked.
const maxMinsLate = 1;

(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		timeout: 0,
		args: ['--use-fake-ui-for-media-stream']
	});

	const page = await browser.newPage();
	page.setDefaultTimeout(0);

	await page.goto('https://teams.microsoft.com/_#/conversations/a', {
		timeout: 0
	});
	await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

	await login(page);

	await checkForMeetings(page);
})();

async function login(page) {
	await page.waitForSelector('#i0116');

	await page.type('#i0116', config.email);
	await page.click('input[type="submit"]');

	await page.waitForTimeout(2000);
	await page.type('#i0118', config.password);
	await page.click('input[type="submit"]');

	await page.waitForSelector("input[id='idBtn_Back']");
	await page.click("input[id='idBtn_Back']");

	await page.waitForSelector('a.use-app-lnk');
	await page.click('a.use-app-lnk');

	await page.goto('https://teams.microsoft.com/_#/calendarv2');

	if (firstTime) {
		await page.waitForSelector('#id__16');
		await page.waitForTimeout(1000);
		await page.click('#id__16');

		await page.waitForSelector('#id__16-menu ul li:first-child');
		await page.click('#id__16-menu ul li:first-child');
		await page.reload();
	}
}

// TODO: Join meeting when found
async function checkForMeetings(page) {
	const meetings = await page.evaluate(() =>
		Array.from(document.querySelectorAll('div[class*=__eventCard--h5y4X]')).map(
			el => {
				const startTimeString = el.getAttribute('title').split(' ')[
					el.getAttribute('title').split(' ').length - 3
				];
				const now = new Date();
				const startTime = new Date(
					now.getFullYear(),
					now.getMonth(),
					now.getDate(),
					startTimeString.split(':')[0],
					startTimeString.split(':')[1],
					0
				);
				console.log(startTime);
				return {
					id: el.getAttribute('id'),
					startTime
				};
			}
		)
	);
	console.log(meetings);

	if (
		meetings.find(
			meeting =>
				meeting.startTime < new Date() &&
				meeting.startTime > new Date() + maxMinsLate * 60 * 1000
		)
	) {
		console.log('found meeting!');
	}

	setTimeout(() => checkForMeetings(page), refreshSpeed * 1000);
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
		setTimeout(() => checkParticipants(page), refreshSpeed * 1000);
	}
}

async function joinMeeting(page) {
	// await page.click(joinBtnQuery);
	console.log('missing instructions on how to click the join button');

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
