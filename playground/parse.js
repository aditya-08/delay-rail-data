var fs = require("fs");
var xml2js = require("xml2js");

var parser = new xml2js.Parser({ explicitArray: true });
fs.readFile(__dirname + "/ts.xml", function(err, data) {
  parser.parseString(data, function(err, result) {
    console.dir(result.Pport.uR);
    console.log("Done");
  });
});
