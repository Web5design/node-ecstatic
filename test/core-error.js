var test = require('tap').test,
    ecstatic = require('../lib/ecstatic'),
    http = require('http'),
    request = require('request'),
    mkdirp = require('mkdirp'),
    fs = require('fs'),
    path = require('path');

var root = __dirname + '/public',
    baseDir = 'base';

mkdirp.sync(root + '/emptyDir');

var cases = require('./common-cases-error');

test('core', function (t) {
  var filenames = Object.keys(cases);
  var port = Math.floor(Math.random() * ((1<<16) - 1e4) + 1e4);

  var server = http.createServer(
    ecstatic({
      root: root,
      gzip: true,
      baseDir: baseDir,
      autoIndex: true,
      showDir: true,
      handleError: false
    })
  );

  server.listen(port, function () {
    var pending = filenames.length;
    filenames.forEach(function (file) {
      var uri = 'http://localhost:' + port + path.join('/', baseDir, file),
          headers = cases[file].headers || {};

      request.get({
        uri: uri,
        followRedirect: false,
        headers: headers
      }, function (err, res, body) {
        if (err) t.fail(err);
        var r = cases[file];
        t.equal(res.statusCode, r.code, 'status code for `' + file + '`');

        if (r.type !== undefined) {
          t.equal(
            res.headers['content-type'].split(';')[0], r.type,
            'content-type for `' + file + '`'
          );
        }

        if (r.body !== undefined) {
          t.equal(body, r.body, 'body for `' + file + '`');
        }

        if (r.location !== undefined) {
          t.equal(res.headers.location, path.join('/', baseDir, r.location), 'location for `' + file + '`');
        }

        if (--pending === 0) {
          server.close();
          t.end();
        }
      });
    });
  });
});
