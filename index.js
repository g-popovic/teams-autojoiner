const puppeteer = require('puppeteer');
const config = require('./config');

let firstTime = true;
const refreshSpeed = 2; // Rate at which remaining participants are checked.

(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		timeout: 0,
		args: ['--use-fake-ui-for-media-stream']
	});

	const page = await browser.newPage();
	page.setDefaultTimeout(0);

	await page.goto('https://teams.microsoft.com/_#/conversations/a');
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
		firstTime = false;

		await page.waitForSelector('#id__16');
		await page.waitForTimeout(1000);
		await page.click('#id__16');

		await page.waitForSelector('#id__16-menu ul li:first-child');
		await page.click('#id__16-menu ul li:first-child');
		await page.reload();
	}
}

async function checkForMeetings(page) {
	const meetings =
		(await page.evaluate(() =>
			Array.from(document.querySelectorAll('div[class*=__eventCard--3NBeS]'))
				.map(el => {
					// Get starting time by dividing the value for 'top: '
					// by 0.135 to get the total minutes since midnight

					const styles = el.getAttribute('style');
					const topOffset = styles.slice(
						styles.indexOf('top: ') + 5,
						styles.indexOf('top: ') +
							5 +
							styles.slice(styles.indexOf('top: ') + 5).indexOf('rem;')
					);
					const minutes = Math.round(topOffset / 0.135);
					const startTime = new Date(
						new Date().getFullYear(),
						new Date().getMonth(),
						new Date().getDate(),
						Math.floor(minutes / 60),
						minutes % 60,
						0
					).getTime();

					const id = el
						.querySelector('div[class*=__eventCard--h5y4X]')
						.getAttribute('id');

					return {
						id,
						startTime
					};
				})
				.reverse()
		)) || [];

	const newestAvailableMeeting = meetings.find(
		meeting =>
			meeting.startTime < new Date().getTime() &&
			meeting.startTime + config.maxMinsLate * 60 * 1000 > new Date().getTime()
	);

	if (newestAvailableMeeting) {
		joinMeeting(
			page,
			newestAvailableMeeting.id,
			newestAvailableMeeting.startTime
		);
	} else setTimeout(() => checkForMeetings(page), refreshSpeed * 1000);
}

async function joinMeeting(page, id, startTime) {
	await page.evaluate(id => document.getElementById(id).click(), id);

	await page.click('button[class*=__joinButton--3G-er]');

	await page.waitForSelector('toggle-button[data-tid="toggle-mute"]');
	await page.waitForTimeout(1000);

	// Disable mic and cam

	const micOn =
		(await page.evaluate(() =>
			document
				.querySelector('toggle-button[data-tid="toggle-mute"]>div>button')
				.getAttribute('aria-pressed')
		)) !== 'false';
	const vidOn =
		(await page.evaluate(() =>
			document
				.querySelector('toggle-button[data-tid="toggle-video"]>div>button')
				.getAttribute('aria-pressed')
		)) !== 'false';

	if (micOn) await page.click('toggle-button[data-tid="toggle-mute"]');
	if (vidOn) await page.click('toggle-button[data-tid="toggle-video"]');

	// Join meeting

	await page.click('.join-btn');

	await page.waitForSelector('#roster-button');
	await page.click('#roster-button');

	setTimeout(
		() => checkParticipants(page),
		startTime + config.maxMinsLate * 60 * 1000 - new Date().getTime() || 0
	);
}

async function checkParticipants(page) {
	const numOfParticipants = Number(
		(
			await page.evaluate(
				() => document.querySelectorAll('span.toggle-number')[1].textContent
			)
		).slice(1, -1)
	);
	console.log(numOfParticipants);
	if (numOfParticipants - 1 <= config.minParticipants) {
		console.log('leaving meeting');
		leaveMeeting(page);
	} else {
		setTimeout(() => checkParticipants(page), refreshSpeed * 1000);
	}
}

async function leaveMeeting(page) {
	await page.evaluate(() => document.getElementById('hangup-button').click());
	await page.waitForTimeout(1000);
	await page.goto('https://teams.microsoft.com/_#/calendarv2');

	checkForMeetings(page);
}
