const express = require("express");
const serverless = require("serverless-http");
const app = express();

app.get("/", (req, res) => {
  console.log("Hello, World!");
  res.send("Hello, World!!");
});

module.exports.handler = serverless(app);
