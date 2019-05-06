var stompit = require("stompit");
var async = require("async");
var unzip = require("unzip");
var fs = require("fs");
var zlib = require("zlib");
var fs = require("fs");
var parser = require("xml2json");

// Connect options with standard headers
var connectOptions = {
  host: "darwin-dist-44ae45.nationalrail.co.uk",
  port: 61613,
  connectHeaders: {
    "heart-beat": "15000,15000", // hear-beat of 15 seconds
    "client-id": "DARWINdab712f1-2d8a-472b-8e92-00da776c5a80", // request a durable subscription - set this to the login name you use to subscribe
    host: "/",
    login: "DARWINdab712f1-2d8a-472b-8e92-00da776c5a80", // your username
    passcode: "30c03ad9-644f-4092-8e84-e394f90ddd1d" // your password
  }
};

// Reconnect management for stompit client
var reconnectOptions = {
  initialReconnectDelay: 10, // milliseconds delay of the first reconnect
  maxReconnectDelay: 30000, // maximum milliseconds delay of any reconnect
  useExponentialBackOff: true, // exponential increase in reconnect delay
  maxReconnects: 30, // maximum number of failed reconnects consecutively
  randomize: false // randomly choose a server to use when reconnecting
  // (there are no other servers at this time)
};

var connectionManager = new stompit.ConnectFailover(
  [connectOptions],
  reconnectOptions
);

connectionManager.connect(function(error, client, reconnect) {
  if (error) {
    console.log("Terminal error, gave up reconnecting");
    return;
  }

  client.on("error", function(error) {
    console.log("Connection lost. Reconnecting...");
    reconnect();
  });
  var headers = {
    destination: "/topic/darwin.pushport-v16", // subscribe for a destination to which messages are sent
    "activemq.subscriptionName": "somename-train_mvt", // request a durable subscription - set this to an unique string for each feed
    ack: "client-individual" // the client will send ACK frames individually for each message processed
  };
  client.subscribe(headers, function(error, message) {
    if (error) {
      console.log("Subscription failed:", error.message);
      return;
    }

    const read = function() {
      let chunk;
      while (null !== (chunk = message.read())) {
        zlib.gunzip(chunk, function(error, response) {
          if (error) {
            console.log(message.headers);
            console.log(error);
          } else {
            // console.log(message.headers.FilterHeaderLevel);
            // console.log(response.toString(), "******************");
            var xml_data = response.toString();
            var json_out = parser.toJson(xml_data);
            console.log(json_out);
          }
        });
      }
    };

    message.on("readable", read);

    message.on("end", function() {
      client.ack(message);
    });
  });
});
