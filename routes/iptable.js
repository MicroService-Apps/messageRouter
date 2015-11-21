// This file define the ips and port numbers of each service

var path = require('path');
var fs = require('fs');

var defaultConfigPath = path.join(path.dirname(__dirname),'config/default.json');
var configFile = fs.readFileSync(defaultConfigPath);
var defaultSetting = JSON.parse(configFile);

exports.configTable = function(service, key, value) {
    var response = new Object();

    if(defaultSetting[service] != null && defaultSetting[service][key] != null) {
        defaultSetting[service][key] = value;
        updateExport();

        response.status = 'succeed';
        response.message = service+'\' '+key+' is set to '+value;
    } else {
        response.status = 'failed';
        response.message = 'no such service or setting';
    }

    console.log(defaultSetting);

    return response;
};

function updateExport() {
    exports.studentServiceIp = defaultSetting.student.host;
    exports.studentServicePort = defaultSetting.student.port;
    exports.courseServiceIp = defaultSetting.course.host;
    exports.courseServicePort = defaultSetting.course.port;
}

exports.studentServiceIp = defaultSetting.student.host;
exports.studentServicePort = defaultSetting.student.port;
exports.courseServiceIp = defaultSetting.course.host;
exports.courseServicePort = defaultSetting.course.port;
