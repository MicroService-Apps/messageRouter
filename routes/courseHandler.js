/*
 * This file is for action in course service, including CRUD
 */

var request = require('request');
var ipTable = require('./iptable');
var serviceType = 'course';

// handle create a new course
exports.createCourse = function(req, res) {
    // get content from body
    var body = '';
    req.on('data', function (data) {
        body += data;

        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6)
            request.connection.destroy();
    });

    var ip = ipTable.getIp(serviceType, 'all');
    var port = ipTable.getPort(serviceType, 'all');

    if(ip == null || port == null) {
        var response = {};
        response['status'] = 'failed';
        response['message'] = 'invalid cid';

        res.send(response);
        return;
    }

    req.on('end', function () {
        // send http request to course service
        var url = 'http://'+ip+':'+port+'/course/';
        url += req.params.cid;

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

// handle delete an existing course
exports.deleteCourse = function(req, res) {
    var ip = ipTable.getIp(serviceType, 'all');
    var port = ipTable.getPort(serviceType, 'all');

    if(ip == null || port == null) {
        var response = {};
        response['status'] = 'failed';
        response['message'] = 'invalid cid';

        res.send(response);
        return;
    }

    // send http request to course service
    var url = 'http://'+ip+':'+port+'/course/';
    url += req.params.cid;

    request({
        headers: {
            'Content-Type': 'application/x-message_router-form-urlencoded'
        },
        uri: url,
        method: 'DELETE'
    }, function (err, response, body) {
        var allAddress = ipTable.getAll('student');

        for(var key in allAddress) {
            sendToStudentService(allAddress[key]['host'], allAddress[key]['port']);
        }

        res.setHeader('Content-Type', 'application/json');
        res.send(body);
    });

    function sendToStudentService(ip, port) {
        // send http request to student service
        var url = 'http://'+ip+':'+port+'/student/all/'+ req.params.cid;

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

// handle read course information
exports.readCourse = function(req, res) {
    var ip = ipTable.getIp(serviceType, 'all');
    var port = ipTable.getPort(serviceType, 'all');

    if(ip == null || port == null) {
        var response = {};
        response['status'] = 'failed';
        response['message'] = 'invalid cid';

        res.send(response);
        return;
    }

    // send http request to course service
    var url = 'http://'+ip+':'+port+'/course/';
    url += req.params.cid;

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

// handle update course information
exports.updateCourse = function(req, res) {
    // get content from body
    var body = '';
    req.on('data', function (data) {
        body += data;

        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6)
            request.connection.destroy();
    });

    var ip = ipTable.getIp(serviceType, 'all');
    var port = ipTable.getPort(serviceType, 'all');

    req.on('end', function () {
        // send http request to course service
        var url = 'http://'+ip+':'+port+'/course/';
        url += req.params.cid;

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

// handle delete student in student list
exports.deleteStudent = function(req, res) {
    var courseIp = ipTable.getIp(serviceType, 'all');
    var coursePort = ipTable.getPort(serviceType, 'all');

    var firstChar = (req.params.uni).toLowerCase()[0];
    var studentIp = ipTable.getIp('student', firstChar);
    var studentPort = ipTable.getPort('student', firstChar);

    if(studentIp == null || studentPort == null) {
        var response = {};
        response['status'] = 'failed';
        response['message'] = 'uni invalid';

        res.send(response);
        return;
    }

    // send http request to course service
    var url = 'http://'+courseIp+':'+coursePort+'/course/';
    url += req.params.cid+'/'+req.params.uni;

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
            // If succeed , synchronize student service
            sendToStudentService(studentIp, studentPort, courseIp, coursePort);
        } else {
            // send error info
            res.setHeader('Content-Type', 'application/json');
            res.send(body);
        }
    });

    function sendToStudentService(studentIp, studentPort, courseIp, coursePort) {
        // send request to student service
        var url = 'http://' + studentIp + ':' + studentPort + '/student/';
        url += req.params.uni + '/' + req.params.cid;

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
                revertCourseService(courseIp, coursePort);
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(body);
        });
    }

    function revertCourseService(courseIp, coursePort) {
        // send http request to student service
        var url = 'http://'+courseIp+':'+coursePort+'/course/revert';

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

// handle add student in student list
exports.addStudent = function(req, res) {
    var courseIp = ipTable.getIp(serviceType, 'all');
    var coursePort = ipTable.getPort(serviceType, 'all');

    var firstChar = (req.params.uni).toLowerCase()[0];
    var studentIp = ipTable.getIp('student', firstChar);
    var studentPort = ipTable.getPort('student', firstChar);

    if(studentIp == null || studentPort == null) {
        var response = {};
        response['status'] = 'failed';
        response['message'] = 'uni invalid';

        res.send(response);
        return;
    }

    // send http request to course service
    var url = 'http://'+courseIp+':'+coursePort+'/course/';
    url += req.params.cid+'/'+req.params.uni;

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
            // If succeed , synchronize student service
            sendToStudentService(studentIp, studentPort, courseIp, coursePort);
        } else {
            // send error info
            res.setHeader('Content-Type', 'application/json');
            res.send(body);
        }
    });

    function sendToStudentService(studentIp, studentPort, courseIp, coursePort) {
        // send request to student service
        var url = 'http://' + studentIp + ':' + studentPort + '/student/';
        url += req.params.uni + '/' + req.params.cid;

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
                revertCourseService(courseIp, coursePort);
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(body);
        });
    }

    function revertCourseService(courseIp, coursePort) {
        // send http request to student service
        var url = 'http://'+courseIp+':'+coursePort+'/course/revert';

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

// handle configuration, add field
exports.addField = function(req, res) {
    var ip = ipTable.getIp(serviceType, 'all');
    var port = ipTable.getPort(serviceType, 'all');

    // send http request to student service
    var url = 'http://'+ip+':'+port+'/course/';
    url += 'add' + '/' + req.params.field;

    request({
        headers: {
            'Content-Type': 'application/x-message_router-form-urlencoded'
        },
        uri: url,
        method: 'PATCH'
    }, function (err, response, body) {
        // send ack
        res.setHeader('Content-Type', 'application/json');
        res.send(body);
    });
};

// handle configuration, delete field
exports.deleteField = function(req, res) {
    var ip = ipTable.getIp(serviceType, 'all');
    var port = ipTable.getPort(serviceType, 'all');

    // send http request to student service
    var url = 'http://'+ip+':'+port+'/course/';
    url += 'delete' + '/' + req.params.field;

    request({
        headers: {
            'Content-Type': 'application/x-message_router-form-urlencoded'
        },
        uri: url,
        method: 'PATCH'
    }, function (err, response, body) {
        // send ack
        res.setHeader('Content-Type', 'application/json');
        res.send(body);
    });
};