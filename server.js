
var logger = require("morgan");
var mongoose = require("mongoose");

// Initialize Express
var express = require("express");
var app = express();

var PORT = process.env.PORT || 3000;


//middlewear to override the method, aka HTTP verb, so form elements support PUT and DELETE
var methodOverride = require('method-override')
//configure method-override to look for _method in the query string
app.use(methodOverride('_method'));


// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
// app.use(express.static("public"));
app.use(express.static(process.cwd() + "/public"));

// Set Handlebars
var exphbs = require('express-handlebars');
app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');



// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/webScraper", { useNewUrlParser: true });

// Import routes and give the server access to them.
var routes = require("./controller/controller.js");
app.use('/', routes);

// Start the server
app.listen(PORT, function() {
    console.log("Server listening on: http://localhost: " + PORT + "!");
  });