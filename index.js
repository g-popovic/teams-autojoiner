const puppeteer = require('puppeteer');

(async () => {
	let movieUrl = 'https://youtube.com';

	let browser = await puppeteer.launch();
	let page = await browser.newPage();

	await page.goto(movieUrl);

	debugger;

	await browser.close();
})();
