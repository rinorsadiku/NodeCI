const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');

class Page {
	static async build() {
		const browser = await puppeteer.launch({
			args: ['--no-sandbox', '--disable-setuid-sandbox'] // Decreases the time to run tests
		});

		const page = await browser.newPage();
		const customPage = new Page(page);

		return new Proxy(customPage, {
			get: function(target, property) {
				return target[property] || browser[property] || page[property];
			}
		});
	}

	constructor(page) {
		this.page = page;
	}

	async login() {
		const userId = '5d1b43c61c9d440000fff9f3';
		const { session, sig } = sessionFactory(userId); // Intializing the session and session signature

		await this.page.setCookie({ name: 'session', value: session });
		await this.page.setCookie({ name: 'session.sig', value: sig });
		await this.page.goto('http://localhost:3000/blogs');
		await this.page.waitFor('a[href="/auth/logout"]');
	}

	async getContentsOf(selector) {
		return this.page.$eval(selector, el => el.innerHTML);
	}

	get(path) {
		return this.page.evaluate(_path => {
			return fetch(_path, {
				method: 'GET',
				credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json'
				}
			}).then(res => res.json());
		}, path);
	}

	post(path, data) {
		return this.page.evaluate(
			(_path, _data) => {
				return fetch(_path, {
					method: 'POST',
					credentials: 'same-origin',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(_data)
				}).then(res => res.json());
			},
			path,
			data
		);
	}

	execRequests(actions) {
		return Promise.all(
			actions.map(({ method, path, data }) => {
				return this[method](path, data);
			})
		);
	}
}

module.exports = Page;
