const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
	// Adding a flag that we can use inside the exec function
	this.useCache = true;
	this.hashKey = JSON.stringify(options.key || '');

	// Making it chainable
	return this;
};

// Overwriting the default exec function
mongoose.Query.prototype.exec = async function() {
	// Here we will overwrite the exec function to add caching configuration

	if (!this.useCache) {
		return exec.apply(this, arguments);
	}

	const key = JSON.stringify(
		Object.assign({}, this.getQuery(), {
			collection: this.mongooseCollection.name
		})
	);

	// See if we have a value for 'key' in redis
	const cacheValue = await client.hget(this.hashKey, key);

	// If we do, return that
	if (cacheValue) {
		const doc = JSON.parse(cacheValue);

		return Array.isArray(doc)
			? doc.map(d => new this.model(d))
			: new this.model(doc);
	}

	// Otherwise, issue the query and store the result in redis (default function)
	const result = await exec.apply(this, arguments); // This is the query result

	client.hset(this.hashKey, key, JSON.stringify(result));

	return result;
};

module.exports = {
	clearHash(hashKey) {
		client.del(JSON.stringify(hashKey));
	}
};
