"use strict";
var env = process.env.NODE_ENV || 'development',
    config = require('./config')[env],
    port = config.port || 4000,
    restify = require('restify'),
    cluster = require('cluster'),
    corsMiddleware = require('restify-cors-middleware'),
    numCPUs = require('os').cpus().length;


function registerService(service) {
  require('./services/' + service)(server,config);
}

function formatHTML(req, res, body) {
  if (body instanceof Error) {
    return body.stack;
  }

  if (Buffer.isBuffer(body)){
    return body.toString('utf-8');
  }

  return body;
}

function exceptionHandler(req, res, route, err) {
  console.error((new Date).toUTCString() + " Caught exception:", err, err.stack);
  res.end();
}

function ready() {
  console.log("Server " + process.pid + " is listening on port", port);
}

function masterExit(worker, code, signal) {
  console.log('worker ' + worker.process.pid + ' died: ' + code + ' - ' + signal);
  cluster.fork();
}

if (cluster.isMaster) {
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', masterExit);
} else {

console.log('Using NodeJS version: '+ process.version);
  var server = restify.createServer({name: 'Clustermapping.us Data Services'});
  server.formatters['text/html'] = formatHTML;
  const cors = corsMiddleware({});
  server.use(cors.actual);
  server.use(restify.plugins.queryParser({ mapParams: true }));
  server.use(restify.plugins.bodyParser({ mapParams: false }));
  // server.use(restify.CORS());
  server.use(restify.plugins.gzipResponse());
  server.use();
  registerService('regions');
  registerService('report');
  registerService('meta');
  server.get(/\/viz\/?.*/, restify.plugins.serveStatic({directory: '../web',match: /\/viz\/?.*/}));
  server.on('uncaughtException', exceptionHandler);
  server.listen(port, ready);
}

process.on('uncaughtException', function (err) {
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
  console.error(err.stack);
  process.exit(1);
});


