// This file defines operation on routing table 

var path = require('path');
var fs = require('fs');

var defaultConfigPath = path.join(path.dirname(__dirname),'config/default.json');
var configFile = fs.readFileSync(defaultConfigPath);
var defaultSetting = JSON.parse(configFile);

// config service table
exports.configTable = function(service, name, ip, port) {
    var response = new Object();

    if(defaultSetting[service] != null && defaultSetting[service][name] != null) {
        defaultSetting[service][name]['host'] = ip;
        defaultSetting[service][name]['port'] = port;

        response.status = 'succeed';
        response.message = service+'\' '+' routing table is set successfully';
    } else {
        response.status = 'failed';
        response.message = 'no such service or setting';
    }

    console.log(defaultSetting);

    return response;
};

// get ip
exports.getIp = function(service, key) {
    if(defaultSetting[service] != null && defaultSetting[service][key] != null) {
        return defaultSetting[service][key]['host'];
    } else {
        return null;
    }
};

// get port
exports.getPort = function(service, key) {
    if(defaultSetting[service] != null && defaultSetting[service][key] != null) {
        return defaultSetting[service][key]['port'];
    } else {
        return null;
    }
};

// get all ip and port
exports.getAll = function(service) {
    var hashMap = {};
    var alphabet = 'abcdefghijklmnopqrstuvwxyz';

    for(var i = 0; i < alphabet.length; i++) {
        var ch = alphabet[i];
        var ip = defaultSetting[service][ch]['host'];
        var port = defaultSetting[service][ch]['port'];
        var str = ip + port;

        if(hashMap[str] == null) {
            hashMap[str] = {
                'host': ip,
                'port': port
            };
        }
    }

    return hashMap;
};
