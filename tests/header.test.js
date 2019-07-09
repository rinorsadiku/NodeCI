const Page = require('./helpers/page');

// Intializing the browser and page variables outside so we can use them in our tests
let page;

beforeEach(async () => {
	page = await Page.build();

	await page.goto('http://localhost:3000');
});

afterEach(async () => {
	await page.close();
});

test('the header logo has the correct text', async () => {
	const text = await page.getContentsOf('a.brand-logo');

	expect(text).toEqual('Blogster');
});

test('clicking login button starts oAuth flow', async () => {
	await page.click('.right a');

	const url = await page.url();

	await page.waitFor('h1#headingText');
	expect(url).toMatch(/accounts\.google\.com/);
});

test('when signed in, shows logout button', async () => {
	// Navigating to localhost:3000 and setting session cookies
	await page.login();

	const text = await page.getContentsOf('a[href="/auth/logout"]');

	expect(text).toEqual('Logout');
});

test('travis ci test works', () => {
	expect('rinor').toEqual('rinor');
});
