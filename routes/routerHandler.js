// this file is for message router operation
var iptable = require('./iptable');

// config routing table
exports.config = function(req, res) {
    var service = req.params.service;
    var key = req.params.key;
    var value = req.params.value;

    var response = iptable.configTable(service, key, value);

    res.setHeader('Content-Type', 'application/json');
    res.send(response);
};