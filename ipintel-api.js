const request = require('request');
const info = require('./ipintel.json');

module.exports = {
    IpBanned: function (ip, res, callback) {
        request(`http://check.getipintel.net/check.php?ip=${ip}&contact=${info["contactEmail"]}&flags=b`,
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    if (parseFloat(body) > 0.99) {
                        console.log(`ALERT: ${ip} Has been blocked!`)
                        res.send("Oops! The usage of a VPN/Proxy is not allowed!")
                    } else {
                        callback.call();
                    }
                }
            });
    }
}