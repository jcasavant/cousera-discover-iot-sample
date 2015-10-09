'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');
var cfenv = require('cfenv');
var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // for parsing application/json
var appEnv = cfenv.getAppEnv();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var credentials = null;
if (process.env.VCAP_SERVICES) {
	config = JSON.parse(process.env.VCAP_SERVICES);

	var iotService = config['iotf-service'];
	for (var index in iotService) {
		if (iotService[index].name === serviceName) {
			//console.log(iotService[index].credentials);
			credentials = iotService[index].credentials;
		}
	}
} else {
	console.log("ERROR: IoT Service was not bound!");
	//return;
}

/*
var basicConfig = {
	org: credentials.org,
	apiKey: credentials.apiKey,
	apiToken: credentials.apiToken
};
*/

var basicConfig = {
	org: "utx8fq",
	apiKey: "a-utx8fq-au4ny6djl3",
	apiToken: "Xf?GaiZU&ncv2K9&NK"
};

var options = {
	host: 'internetofthings.ibmcloud.com',
	port: 443,
	headers: {
	  'Content-Type': 'application/json'
	},
	auth: basicConfig.apiKey + ':' + basicConfig.apiToken
};

app.get('/credentials', function(req, res) {
	res.json(basicConfig);
});

app.post('/registerDevice', function(req, res) {
	console.log(req.body);
	var deviceId = null, typeId = "iot-phone", password = null;
	if (req.body.deviceId) { deviceId = req.body.deviceId; }
	if (req.body.typeId) { typeId = req.body.typeId; }
	if (req.body.password) { password = req.body.password; }

	var options = {
		host: basicConfig.org + '.internetofthings.ibmcloud.com',
		port: 443,
		headers: {
		  'Content-Type': 'application/json'
		},
		auth: basicConfig.apiKey + ':' + basicConfig.apiToken,
		method: 'POST',
		path: 'api/v0002/device/types'
	}

	var deviceTypeDetails = {
		id: typeId
	}
	console.log(deviceTypeDetails);
	var type_req = https.request(options, function(type_res) {
		var str = '';
		type_res.on('data', function(chunk) {
			str += chunk;
		});
		type_res.on('end', function() {
			console.log("createDeviceType end: ", str.toString());

			var dev_options = {
				host: basicConfig.org + '.internetofthings.ibmcloud.com',
				port: 443,
				headers: {
				  'Content-Type': 'application/json'
				},
				auth: basicConfig.apiKey + ':' + basicConfig.apiToken,
				method: 'POST',
				path: 'api/v0002/device/types/'+typeId+'/devices'
			}

			var deviceDetails = {
				deviceId: deviceId,
				authToken: password
			};
			console.log(deviceDetails);

			var dev_req = https.request(dev_options, function(dev_res) {
				var str = '';
				dev_res.on('data', function(chunk) {
					str += chunk;
				});
				dev_res.on('end', function() {
					console.log("createDevice end: ", str.toString());
					res.send({ result: "Success!" });
				});
			}).on('error', function(e) { console.log("ERROR", e); });
			dev_req.write(JSON.stringify(deviceDetails));
			dev_req.end();
		});
	}).on('error', function(e) { console.log("ERROR", e); });
	type_req.write(JSON.stringify(deviceTypeDetails));
	type_req.end();
});

app.listen(appEnv.port, function() {
	console.log("server starting on " + appEnv.url);
});
