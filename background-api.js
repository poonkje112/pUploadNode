const Unsplash = require('unsplash-js').default;
const unsplashInfo = require('./unsplash.json');


const unsplash = new Unsplash({
    applicationId: unsplashInfo["splashId"],
    secret: unsplashInfo["splashSecret"]
});

function toJson(res) {
    return typeof res.json === "function" ? res.json() : res;
}

function GRB(query, imgWidth, imgHeight) {
    var output = {
        userprofile: "",
        username: "",
        rawURI: ""
    }

    unsplash.photos.getRandomPhoto({
        width: imgWidth,
        height: imgHeight,
        query: query
    }).then(toJson).then(json => {
        output.userprofile = json['user']['links']['html'] + "?utm_source=pUploads&utm_medium=referral";
        output.username = json['user']['name'];
        output.rawURI = json['urls']['raw'];
    });
    return output;
}

module.exports = {
    getRandomBackground: function (query, imgWidth, imgHeight) {
        return GRB(query, imgWidth, imgHeight);
    }
}