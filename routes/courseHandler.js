/*
 * This file is for action in course service, including CRUD
 */

var request = require('request');
var ipTable = require('./iptable');

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

    req.on('end', function () {
        // send http request to course service
        var url = 'http://'+ipTable.courseServiceIp+':'+ipTable.courseServicePort+'/course/';
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
    // send http request to course service
    var url = 'http://'+ipTable.courseServiceIp+':'+ipTable.courseServicePort+'/course/';
    url += req.params.cid;

    request({
        headers: {
            'Content-Type': 'application/x-message_router-form-urlencoded'
        },
        uri: url,
        method: 'DELETE'
    }, function (err, response, body) {
        sendToStudentService();

        res.setHeader('Content-Type', 'application/json');
        res.send(body);
    });

    function sendToStudentService() {
        // send http request to student service
        var url = 'http://'+ipTable.studentServiceIp+':'+ipTable.studentServicePort+'/student/all/'+ req.params.cid;

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
    // send http request to course service
    var url = 'http://'+ipTable.courseServiceIp+':'+ipTable.courseServicePort+'/course/';
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

    req.on('end', function () {
        // send http request to course service
        var url = 'http://'+ipTable.courseServiceIp+':'+ipTable.courseServicePort+'/course/';
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
    // send http request to course service
    var url = 'http://'+ipTable.courseServiceIp+':'+ipTable.courseServicePort+'/course/';
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
            sendToStudentService();
        } else {
            // send error info
            res.setHeader('Content-Type', 'application/json');
            res.send(body);
        }
    });

    function sendToStudentService() {
        // send request to student service
        var url = 'http://' + ipTable.studentServiceIp + ':' + ipTable.studentServicePort + '/student/';
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
                revertCourseService();
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(body);
        });
    }

    function revertCourseService() {
        // send http request to student service
        var url = 'http://'+ipTable.courseServiceIp+':'+ipTable.courseServicePort+'/course/revert';

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
    // send http request to course service
    var url = 'http://'+ipTable.courseServiceIp+':'+ipTable.courseServicePort+'/course/';
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
            sendToStudentService();
        } else {
            // send error info
            res.setHeader('Content-Type', 'application/json');
            res.send(body);
        }
    });

    function sendToStudentService() {
        // send request to student service
        var url = 'http://' + ipTable.studentServiceIp + ':' + ipTable.studentServicePort + '/student/';
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
                revertCourseService();
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(body);
        });
    }

    function revertCourseService() {
        // send http request to student service
        var url = 'http://'+ipTable.courseServiceIp+':'+ipTable.courseServicePort+'/course/revert';

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

// handle configuration
exports.config = function(req, res) {
    // send http request to student service
    var url = 'http://'+ipTable.courseServiceIp+':'+ipTable.courseServicePort+'/course/';
    url += 'config' + '/' + req.params.field;

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

// handle revert
exports.revert = function(req, res) {
    // send http request to course service
    var url = 'http://'+ipTable.courseServiceIp+':'+ipTable.courseServicePort+'/course/';
    url += 'revert';

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