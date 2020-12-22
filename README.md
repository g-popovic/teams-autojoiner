# teams-autojoiner

Web scraper program that automatically joins any available Microsoft Teams meetings, and dynamically leaves them if there arent enough people left in the meeting.

## How to use:
* Download repo
* Run `npm install`
* Edit the `config.js` file and include your Microsoft email and password, so the web scraper can log in
* Run `node index.js`

This will open the web scraper in a new window and begin searching for meetings.
