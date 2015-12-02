/*
 * This file is for action in course service, including CRUD
 */

var request = require('request');
var ipTable = require('./iptable');
var serviceType = 'student';

// handle create a new student
exports.createStudent = function(req, res) {
    // get content from body
    var body = '';
    req.on('data', function (data) {
        body += data;

        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6)
            request.connection.destroy();
    });

    var firstChar = (req.params.uni).toLowerCase()[0];
    var ip = ipTable.getIp(serviceType, firstChar);
    var port = ipTable.getPort(serviceType, firstChar);

    if(ip == null || port == null) {
        var response = {};
        response['status'] = 'failed';
        response['message'] = 'uni invalid';

        res.send(response);
        return;
    }

    req.on('end', function () {
        // send http request to student service
        var url = 'http://'+ip+':'+port+'/student/'+req.params.uni;

        request({
            headers: {
                'Content-Type': 'application/x-message_router-form-urlencoded'
            },
            uri: url,
            body: body,
            method: 'PUT'
        }, function (err, response, body) {
            // send ack
            res.setHeader('Content-Type', 'application/json');
            res.send(body);
        });
    });
};

// handle delete an existing student
exports.deleteStudent = function(req, res) {
    var firstChar = (req.params.uni).toLowerCase()[0];
    var ip = ipTable.getIp(serviceType, firstChar);
    var port = ipTable.getPort(serviceType, firstChar);

    // send http request to student service
    var url = 'http://'+ip+':'+port+'/student/'+req.params.uni;

    request({
        headers: {
            'Content-Type': 'application/x-message_router-form-urlencoded'
        },
        uri: url,
        method: 'DELETE'
    }, function (err, response, body) {
        var courseIp = ipTable.getIp('course', 'all');
        var coursePort = ipTable.getPort('course', 'all');

        sendToCourseService(courseIp, coursePort);

        res.setHeader('Content-Type', 'application/json');
        res.send(body);
    });

    if(ip == null || port == null) {
        var response = {};
        response['status'] = 'failed';
        response['message'] = 'uni invalid';

        res.send(response);
        return;
    }

    function sendToCourseService(ip, port) {
        // send http request to course service
        var url = 'http://'+ip+':'+port+'/course/all/'+ req.params.uni;

        request({
            headers: {
                'Content-Type': 'application/x-message_router-form-urlencoded'
            },
            uri: url,
            method: 'DELETE'
        }, function (err, response, body) {
            // finish
        });
    }
};

// handle read student information
exports.readStudent = function(req, res) {
    var firstChar = (req.params.uni).toLowerCase()[0];
    var ip = ipTable.getIp(serviceType, firstChar);
    var port = ipTable.getPort(serviceType, firstChar);

    if(ip == null || port == null) {
        var response = {};
        response['status'] = 'failed';
        response['message'] = 'uni invalid';

        res.send(response);
        return;
    }

    // send http request to student service
    var url = 'http://'+ip+':'+port+'/student/'+req.params.uni;

    request({
        headers: {
            'Content-Type': 'application/x-message_router-form-urlencoded'
        },
        uri: url,
        method: 'GET'
    }, function (err, response, body) {
        // send ack

        res.setHeader('Content-Type', 'application/json');
        res.send(body);
    });
};

// handle update student information
exports.updateStudent = function(req, res) {
    // get content from body
    var body = '';
    req.on('data', function (data) {
        body += data;

        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6)
            request.connection.destroy();
    });

    var firstChar = (req.params.uni).toLowerCase()[0];
    var ip = ipTable.getIp(serviceType, firstChar);
    var port = ipTable.getPort(serviceType, firstChar);

    if(ip == null || port == null) {
        var response = {};
        response['status'] = 'failed';
        response['message'] = 'uni invalid';

        res.send(response);
        return;
    }

    req.on('end', function () {
        // send http request to student service
        var url = 'http://'+ip+':'+port+'/student/'+req.params.uni;

        request({
            headers: {
                'Content-Type': 'application/x-message_router-form-urlencoded'
            },
            uri: url,
            body: body,
            method: 'POST'
        }, function (err, response, body) {
            // send ack

            res.setHeader('Content-Type', 'application/json');
            res.send(body);
        });
    });
};

// handle delete course in course list
exports.deleteCourse = function(req, res) {
    var firstChar = (req.params.uni).toLowerCase()[0];
    var studentIp = ipTable.getIp(serviceType, firstChar);
    var studentPort = ipTable.getPort(serviceType, firstChar);

    var courseIp = ipTable.getIp('course', 'all');
    var coursePort = ipTable.getPort('course', 'all');

    if(studentIp == null || studentPort == null) {
        var response = {};
        response['status'] = 'failed';
        response['message'] = 'uni invalid';

        res.send(response);
        return;
    }

    // send http request to student service
    var url = 'http://'+studentIp+':'+studentPort+'/student/';
    url += req.params.uni+'/'+req.params.cid;

    request({
        headers: {
            'Content-Type': 'application/x-message_router-form-urlencoded'
        },
        uri: url,
        method: 'DELETE'
    }, function (err, response, body) {
        // decode response
        var response = JSON.parse(body);

        if(response.status == 'succeed') {
            // If succeed , synchronize course service
            sendToCourseService(courseIp, coursePort, studentIp, studentPort);
        } else {
            // send error info

            res.setHeader('Content-Type', 'application/json');
            res.send(body);
        }
    });

    function sendToCourseService(courseIp, coursePort, studentIp, studentPort) {
        // send request to course service
        var url = 'http://' + courseIp + ':' + coursePort + '/course/';
        url += req.params.cid + '/' + req.params.uni;

        request({
            headers: {
                'Content-Type': 'application/x-message_router-form-urlencoded'
            },
            uri: url,
            method: 'DELETE'
        }, function (err, response, body) {
            // decode response
            var response = JSON.parse(body);

            if(response.status == 'failed') {
                // If fails, revert the operation in student
                revertStudentService(studentIp, studentPort);
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(body);
        });
    }

    function revertStudentService(studentIp, studentPort) {
        // send http request to student service
        var url = 'http://'+studentIp+':'+studentPort+'/student/revert';

        request({
            headers: {
                'Content-Type': 'application/x-message_router-form-urlencoded'
            },
            uri: url,
            method: 'PATCH'
        }, function (err, response, body) {
            // finish
        });
    }
};

// handle add course in course list
exports.addCourse = function(req, res) {
    var firstChar = (req.params.uni).toLowerCase()[0];
    var studentIp = ipTable.getIp(serviceType, firstChar);
    var studentPort = ipTable.getPort(serviceType, firstChar);

    var courseIp = ipTable.getIp('course', 'all');
    var coursePort = ipTable.getPort('course', 'all');

    if(studentIp == null || studentPort == null) {
        var response = {};
        response['status'] = 'failed';
        response['message'] = 'uni invalid';

        res.send(response);
        return;
    }

    // send http request to student service
    var url = 'http://'+studentIp+':'+studentPort+'/student/';
    url += req.params.uni+'/'+req.params.cid;

    request({
        headers: {
            'Content-Type': 'application/x-message_router-form-urlencoded'
        },
        uri: url,
        method: 'PUT'
    }, function (err, response, body) {
        // decode response
        var response = JSON.parse(body);

        if(response.status == 'succeed') {
            // If succeed , synchronize course service
            sendToCourseService(courseIp, coursePort, studentIp, studentPort);
        } else {
            // send error info

            res.setHeader('Content-Type', 'application/json');
            res.send(body);
        }
    });

    function sendToCourseService(courseIp, coursePort, studentIp, studentPort) {
        // send request to course service
        var url = 'http://' + courseIp + ':' + coursePort + '/course/';
        url += req.params.cid + '/' + req.params.uni;

        request({
            headers: {
                'Content-Type': 'application/x-message_router-form-urlencoded'
            },
            uri: url,
            method: 'PUT'
        }, function (err, response, body) {
            // decode response
            var response = JSON.parse(body);

            if(response.status == 'failed') {
                // If fails, revert the operation in student
                revertStudentService(studentIp, studentPort);
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(body);
        });
    }

    function revertStudentService(studentIp, studentPort) {
        // send http request to student service
        var url = 'http://'+studentIp+':'+studentPort+'/student/revert';

        request({
            headers: {
                'Content-Type': 'application/x-message_router-form-urlencoded'
            },
            uri: url,
            method: 'PATCH'
        }, function (err, response, body) {
            // finish
        });
    }
};

// handle configuration, add a field
exports.addField = function(req, res) {
    var allAddress = ipTable.getAll(serviceType);
    var response = {};

    for(var key in allAddress) {
        var ip = allAddress[key]['host'];
        var port = allAddress[key]['port'];

        sendToStudent(ip, port);
    }

    response['status'] = 'succeed';
    response['message'] = 'field ' + req.params.field + ' is added successfully';
    res.send(response);

    function sendToStudent(ip, port) {
        // send http request to student service
        var url = 'http://' + ip + ':' + port + '/student/';
        url += 'add' + '/' + req.params.field;

        request({
            headers: {
                'Content-Type': 'application/x-message_router-form-urlencoded'
            },
            uri: url,
            method: 'PATCH'
        }, function (err, response, body) {
            // finish
        });
    }
};

// handle configuration, delete a field
exports.deleteField = function(req, res) {
    var allAddress = ipTable.getAll(serviceType);
    var response = {};

    for(var key in allAddress) {
        var ip = allAddress[key]['host'];
        var port = allAddress[key]['port'];

        sendToStudent(ip, port);
    }

    response['status'] = 'succeed';
    response['message'] = 'field ' + req.params.field + ' is deleted successfully';
    res.send(response);

    function sendToStudent(ip, port) {
        // send http request to student service
        var url = 'http://' + ip + ':' + port + '/student/';
        url += 'delete' + '/' + req.params.field;

        request({
            headers: {
                'Content-Type': 'application/x-message_router-form-urlencoded'
            },
            uri: url,
            method: 'PATCH'
        }, function (err, response, body) {
            // finish
        });
    }
};