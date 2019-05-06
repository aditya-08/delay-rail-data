var SERVER_ADDRESS = "127.0.0.1";
var SERVER_PORT = 61613;
var QUEUE = "/queue/thing";

if (process.argv.length > 2) {
  if (process.argv[2]) {
    SERVER_PORT = process.argv[2];
  }
} else {
  var stompServer = require("../lib/server")
    .createStompServer(SERVER_PORT)
    .listen();
}
var StompClient = require("../lib/client").StompClient;

var stompClient = new StompClient(SERVER_ADDRESS, SERVER_PORT, "", "", "1.0");

stompClient.connect(function() {
  stompClient.subscribe(QUEUE, function(data, headers) {
    console.log("GOT A MESSAGE", data, headers);
  });
});
