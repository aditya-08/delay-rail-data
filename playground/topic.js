var stompit = require("stompit");
var async = require("async");
var unzip = require("unzip");
var fs = require("fs");
var zlib = require("zlib");

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
    getstring(message, "utf8", function(error, body) {
      if (error) {
        console.log("Failed to read a message", error);
        return;
      }
      if (body) {
        console.log(body);
      }
    });

    // message.readString("utf8", function(error, body) {
    //   if (error) {
    //     console.log("Failed to read a message", error);
    //     return;
    //   }
    //   // // console.log(body);
    //   // if (body) {
    //   //   // console.log(body);
    //   //   // zlib.gunzip(body, function(err, dezipped) {
    //   //   //   console.log(dezipped);
    //   //     // var json_string = dezipped.toString("utf-8");
    //   //     // var json = JSON.parse(json_string);
    //   //     // Process the json..
    //   //     //console.log(json_string);
    //   //   });
    //     // var data;
    //     // try {
    //     //   data = JSON.parse(body);
    //     // } catch (e) {
    //     //   console.log("Failed to parse JSON", e);
    //     //   return;
    //     // }
    //     // async.each(data, function(item, next) {
    //     //   // Look for Train Activation messages (msg_type 0001)
    //     //   if (item.header && item.header.msg_type == "0001") {
    //     //     console.log(
    //     //       "Train",
    //     //       item.body.train_id,
    //     //       "activated at stanox",
    //     //       item.body.tp_origin_stanox
    //     //         ? item.body.tp_origin_stanox
    //     //         : item.body.sched_origin_stanox
    //     //     );
    //     //   }
    //     //   next();
    //     // });
    //   }
    //   client.ack(message); // Send ACK frame to server
    // });
  });
});

var getstring = function(data, encoding, callback) {
  var readable = data;

  var buffer = "";

  var read = function() {
    var chunk = readable.read();
    if (chunk !== null) {
      zlib.gunzip(chunk, function(err, dezipped) {
        if (dezipped) {
          buffer += dezipped.toString(encoding);
          //console.log(dezipped.toString("utf8"));
        }
      });

      read();
    }
  };

  readable.on("readable", read);

  readable.on("end", function() {
    callback(null, buffer);
  });

  readable.on("error", callback);

  read();
};
