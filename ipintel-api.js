const request = require('request');
const info = require('./ipintel.json');

function checkIP(ip) {
    request(`http://check.getipintel.net/check.php?ip=${ip}&contact=${info["contactEmail"]}&flags=b`,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (parseFloat(body) > 0.99) {
                    return true;
                } else {
                    return false;
                }
            }
        });
};


module.exports = {
    IpBanned: function (ip) {
        return checkIP(ip);
    }
}