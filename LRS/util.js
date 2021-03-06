/*jslint node: true, white: false, continue: true, passfail: false, nomen: true, plusplus: true, maxerr: 50, indent: 4 */

/*!
ruuid() is an Excerpt from: Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com
Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/

var exports; // placate jsl
var config = require('./config.js');

function ruuid() {
	"use strict";
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		/*jslint bitwise: true*/
		var r = Math.random() * 16 | 0,
			v = c === 'x' ? r : (r & 0x3 | 0x8);
		/*jslint bitwise: false*/
		return v.toString(16);
	});
}

function inList(test, list) {
	"use strict";
	var ii;
	for (ii = 0; ii < list.length; ii++) {
		if (test === list[ii] || (typeof test === 'object' && (JSON.stringify(test) === JSON.stringify(list[ii])))) {
			return true;
		}
	}
	return false;
}

function isStatementObjectActor(statement) {
	"use strict";
	return (statement.verb === 'mentored' || statement.verb === 'mentored by');
}

function toBool(name, value) {
	"use strict";

	if (value.toLowerCase() === 'false') {
		return false;
	} else if (value.toLowerCase() === 'true') {
		return true;
	} else {
		throw new Error('Bad argument: ' + name + '=' + value.toLowerCase() + ' expected true/false.');
	}
}

function checkError(error, request, response, text) {
	"use strict";
	var errString, context;

	context = text === undefined ? "" : (" (" + text + ") ");
	if (error !== null && error !== undefined) {
		errString = 'ERROR: ' + request.method + " : " + request.url + context;
		errString += (error.stack === undefined ? "\n" + error.toString() :  "\n" + error.stack);
		if (error.HTTPStatus !== undefined) {
			response.writeHead(error.HTTPStatus);
			console.log(errString);
		} else {
			response.writeHead(500);
			console.error(errString);
		}
		response.end(errString);
		return false;
	}
	return true;
}

function unexpectedRequest(request, response) {
	"use strict";
	console.log('Unexpected request: ' + request.method + " : " + request.url);
	response.statusCode = 405;
	response.end();
}

function storeRequestBody(request) {
	"use strict";
	request.data = '';
	request.finished = false;

	request.on('data', function (chunk) {
		request.data += chunk.toString('ascii');
	});

	request.on('end', function () {
		request.finished = true;
	});
}

function loadRequestBody(request, callback) {
	"use strict";

	if (request.finished) {
		callback(null, request.data);
	} else {
		request.on('end', function () {
			callback(null, request.data);
		});
	}
}

function parseJSONRequest(request, callback) {
	"use strict";
	var result;

	loadRequestBody(request, function (error, data) {
		if (error !== null && error !== undefined) {
			callback(error);
		} else {
			try {
				result = JSON.parse(data);
				callback(null, result);
			} catch (ex) {
				ex.HTTPStatus = 400;
				callback(ex);
			}
		}
	});

}

function getAuthenticatedUser(request) {
	"use strict";
	var userPass, authorized, auth = request.headers.authorization;
	authorized = false;

	if (!auth) {
		return null;
	}

	if (auth.indexOf('Basic ') === 0) {
		// expect: user: <any>, password: password
		userPass = (new Buffer(auth.split(' ')[1], 'base64')).toString().split(':');
		if (userPass.length === 2 && userPass[1] === 'password') {
			if (userPass[0] === 'test') {
				return { 'mbox' : 'mailto:test.user@example.scorm.com' };
			} else if (userPass[0].indexOf('@') > 0) {
				return { 'mbox' : 'mailto:' + userPass[0] };
			}
		}
	}

	console.error('Unauthorized: ' + auth);
	return null;
}

function hasAllProperties(object, properties, name) {
	"use strict";
	var missing, ii, msg;
	missing = [];

	for (ii = 0; ii < properties.length; ii++) {
		if (object[properties[ii]] === undefined) {
			missing.push(properties[ii]);
		}
	}

	if (missing.length > 0) {
		msg = name + ' missing required properties: ' + missing.join(',');
		console.log(msg);

		return msg;
	} else {
		return '';
	}
}

function areActorsEqual(source, target) {
	"use strict";
	var prop,
		actorUniqueProps = require('./storage.js').actorUniqueProps;

	for (prop in source) {
		if (source.hasOwnProperty(prop) && inList(prop, actorUniqueProps)) {
			if (source[prop] === target[prop] || JSON.stringify(source[prop]) === JSON.stringify(target[prop])) {
				return true;
			}
		}
	}

	return false;
}

function addStatementActivities(statement, activities) {
	"use strict";

	if (statement.context !== undefined && statement.context.activity !== undefined) {
		activities.push(statement.context.activity);
	}

	if (!isStatementObjectActor(statement) && statement.object !== undefined) {
		activities.push(statement.object);
	}
}

function addStatementActors(statement, actors) {
	"use strict";
	var context;

	actors.push(statement.authority, statement.actor);
	if (statement.context !== undefined) {
		context = statement.context;
		if (context.instructor !== undefined) {
			actors.push(context.instructor);
		}
		if (context.team !== undefined) {
			actors.push(context.team);
		}
	}
	if (isStatementObjectActor(statement) && statement.object !== undefined) {
		actors.push(statement.object);
	}
}

function hasElementWithProperty(array, property) {
	"use strict";
	var ii, test;
	for (ii = 0; ii < array.length; ii++) {
		for (test in array[ii]) {
			if (array[ii].hasOwnProperty(test) && test === property) {
				return true;
			}
		}
	}
	return false;
}

// parses any properties of the specified object that contain JSON
function parseProps(obj) {
	"use strict";
	var prop;

	for (prop in obj) {
		if (obj.hasOwnProperty(prop) && (/^\s*\{/).test(obj[prop])) {
			obj[prop] = JSON.parse(obj[prop]);
		}
	}
}

exports.ruuid = ruuid;
exports.inList = inList;
exports.toBool = toBool;
exports.isStatementObjectActor = isStatementObjectActor;
exports.checkError = checkError;
exports.parseJSONRequest = parseJSONRequest;
exports.storeRequestBody = storeRequestBody;
exports.loadRequestBody = loadRequestBody;
exports.getAuthenticatedUser = getAuthenticatedUser;
exports.hasAllProperties = hasAllProperties;
exports.areActorsEqual = areActorsEqual;
exports.addStatementActivities = addStatementActivities;
exports.addStatementActors = addStatementActors;
exports.hasElementWithProperty = hasElementWithProperty;
exports.parseProps = parseProps;
exports.unexpectedRequest = unexpectedRequest;