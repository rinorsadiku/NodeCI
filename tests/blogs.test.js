const Page = require('./helpers/page');

let page;

beforeEach(async () => {
	page = await Page.build();

	await page.goto('http://localhost:3000');
});

afterEach(async () => {
	await page.close();
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