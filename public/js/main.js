document.addEventListener('DOMContentLoaded', init, false);

function init() {
    adsBlocked(function (blocked) {
        if (blocked) {
            // window.location = "http://uploads.poonkje.com/adb"; // Replace this with adblock page
            window.location = "/adb"; // Replace this with adblock page
        } else {
        }
    })
}

function adsBlocked(callback) {
    var testURL = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'

    var myInit = {
        method: 'HEAD',
        mode: 'no-cors'
    };

    var myRequest = new Request(testURL, myInit);

    fetch(myRequest).then(function (response) {
        return response;
    }).then(function (response) {
        console.log(response);
        callback(false)
    }).catch(function (e) {
        console.log(e)
        callback(true)
    });
}

$('document').ready(function () {
    document.getElementById("selector").value = 1;
});
function UpdateForm(id, el) {
    document.getElementById(id).style.display = el.value == "perm" ? "table-cell" : "none";
}

