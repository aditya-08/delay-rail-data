const Darwin = require("openraildata-darwin");

const client = new Darwin();

var queueName = {
  destination: "/topic/darwin.pushport-v16", // subscribe for a destination to which messages are sent
  "activemq.subscriptionName": "darwin.pushport-v16", // request a durable subscription - set this to an unique string for each feed
  ack: "client-individual" // the client will send ACK frames individually for each message processed
};

client.on("trainStatus", status => {
  console.log("========");
  console.log(status);
});

client.connect(queueName);
