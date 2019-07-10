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

describe('When logged in', async () => {
	beforeEach(async () => {
		await page.login();
		await page.click('a.btn-floating');
	});

	test('can see blog create form', async () => {
		const label = await page.getContentsOf('form label');

		expect(label).toEqual('Blog Title');
	});

	describe('And using valid inputs', async () => {
		beforeEach(async () => {
			await page.type('.title input', 'Automated test data injection');
			await page.type('.content input', 'My content');
			await page.click('form button');
		});

		test('submitting takes user to review screen', async () => {
			const text = await page.getContentsOf('h5');

			expect(text).toEqual('Please confirm your entries');
		});

		test('submitting then saving adds blog to index page', async () => {
			await page.click('button.green');

			await page.waitFor('.card:last-child span');

			const title = await page.getContentsOf('.card:last-child span');
			const content = await page.getContentsOf('.card:last-child p');

			expect(title).toEqual('Automated test data injection');
			expect(content).toEqual('My content');
		});
	});

	describe('And using invalid inputs', async () => {
		beforeEach(async () => {
			await page.click('form button');
		});

		test('the form shows an error message', async () => {
			const titleError = await page.getContentsOf('.title .red-text');
			const contentError = await page.getContentsOf('.content .red-text');

			expect(titleError).toEqual('You must provide a value');
			expect(contentError).toEqual('You must provide a value');
		});
	});
});

describe('When NOT logged in', async () => {
	const actions = [
		{
			method: 'get',
			path: '/api/blogs'
		},
		{
			method: 'post',
			path: '/api/blogs',
			data: {
				title: 'Test Title',
				content: 'Test Content'
			}
		}
	];

	test('blog related actions are prohibited', async () => {
		const results = await page.execRequests(actions);

		for (let result of results) {
			expect(result).toEqual({ error: 'You must log in!' });
		}
	});
});
