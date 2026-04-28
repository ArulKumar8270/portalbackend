function randomString(len, charSet) {
  charSet =
    charSet || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var randomString = "";
  for (var i = 0; i < len; i++) {
    var randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz, randomPoz + 1);
  }
  return randomString;
}

function validateEmail(email) {
  var re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function secondsToTime(secs) {
  var hours = Math.floor(secs / (60 * 60));

  var divisor_for_minutes = secs % (60 * 60);
  var minutes = Math.floor(divisor_for_minutes / 60);

  var divisor_for_seconds = divisor_for_minutes % 60;
  var seconds = Math.ceil(divisor_for_seconds);

  return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
}

function getDomainName(hostname) {
  var domain = hostname;
  if (hostname != null) {
    var parts = hostname.split(".").reverse();

    if (parts != null && parts.length > 1) {
      domain = parts[1] + "." + parts[0];

      if (hostname.toLowerCase().indexOf(".co.uk") != -1 && parts.length > 2) {
        domain = parts[2] + "." + domain;
      }
    }
  }
  return domain;
}

function pad(n) {
  return n < 10 ? "0" + n : n;
}

global.json = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

module.exports = {
  randomString,
  validateEmail,
  secondsToTime,
  getDomainName,
};
