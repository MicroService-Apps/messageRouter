// this file is for message router operation
var iptable = require('./iptable');

// config routing table
exports.config = function(req, res) {
    var service = req.params.service;
    var name = req.params.name;
    var ip = req.params.ip;
    var port = req.params.port;

    var response = iptable.configTable(service, name, ip, port);

    res.setHeader('Content-Type', 'application/json');
    res.send(response);
};