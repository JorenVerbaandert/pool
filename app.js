    var port = 8123;
    var connect = require('connect');
    var serveStatic = require('serve-static');

    connect().use(serveStatic(__dirname)).listen(port, function(){
        console.log("Server listening on: http://localhost:%s", port);
    });
