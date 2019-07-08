const Buffer = require('safe-buffer').Buffer;

// Generating the session signature
const Keygrip = require('keygrip');
const keys = require('../../config/keys');
const keygrip = new Keygrip([keys.cookieKey]);

module.exports = id => {
	const sessionObject = {
		passport: {
			user: id // Converting the js object into the actual string
		}
	};

	// Turning the false copy of the passport session into a base64 string
	const session = Buffer.from(JSON.stringify(sessionObject)).toString('base64');

	const sig = keygrip.sign('session=' + session);

	return {
		session,
		sig
	};
};
