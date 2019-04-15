var express = require("express");
var axios = require("axios");
var cheerio = require("cheerio");

var app = express.Router();

// Require all models
var db = require("../models");


//index
// app.get('/', function(req, res) {
//     res.redirect('/articles');
// });


// Index
// Route for getting all Articles from the db
app.get('/', function(req, res) {
    db.Article.find().sort({_id: -1})
    .then(function(dbArticles) {
        res.render('index', { articles: dbArticles });
    })
    .catch(function(err) {
        console.log(err);
    });
});

// A GET route for scraping the nhl website
app.get("/scrape", function(req, res) {
    var resultsArray = [];
    // First, we grab the body of the html with axios
    axios.get("https://www.nhl.com/news").then(function(response) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(response.data);
  
      // Now, we grab every h2 within an article tag, and do the following:
      $("article h1").each(function(i, element) {
        // Save an empty result object
        var result = {};
        // Add the text and href of every link, and save them as properties of the result object
        result.title = $(this)
          .children("a")
          .text();
        result.link = $(this)
          .children("a")
          .attr("href");
        resultsArray.push(result);
        });

        console.log(resultArr.length); // 30
  
        // Create a new Article using the `result` object built from scraping
        db.Article.insertMany(resultArray)
          .then(function(dbArticle) {
            // Send a message to the client
            console.log("Scrape Complete")
            // View the added result in the console
            console.log(dbArticle);
            res.redirect('/');
          })
          .catch(function(err) {
            // If an error occurred, log it
            res.redirect('/');
            console.log(err);
          });

    })
    .catch(function (err) {
        res.send(err);
    });
  });


   // Route for getting all saved Articles from the db
   app.get("/saved", function(req, res) {
    // Grab every document in the Articles collection
    db.Article.find({saved: true})
      .then(function(dbArticleSaved) {
        // If we were able to successfully find Articles, send them back to the client
        // res.json(dbArticle);
        res.render('saved', { articles: dbArticleSaved });
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        // res.json(err);
        console.log(err)
      });
  });
  
  
  // Route for grabbing a specific Article by id, populate it with it's Comment
  app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOneAndUpdate({ _id: req.params.id },{ saved: true }, { new: true })
      // ..and populate all of the Comments associated with it
      .populate("Comment")
      .then(function(dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.send(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        console.error(err);
      });
  });
  
  // Route for saving/updating an Article's associated Comment
  app.post("/articles/:id", function(req, res) {
    // Create a new Comment and pass the req.body to the entry
    db.Comment.create(req.body)
      .then(function(dbComment) {
          console.log(dbComment);
        // If a Comment was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Comment
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { Comment: dbComment._id }, { new: true });
      })
      .then(function(dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.send(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        console.log(err);
      });
  });

  app.get('remove/:id', function(req, res) {
   db.Article.findOneAndUpdate({ _id: req.params.id }, { $unset: { comment: '', saved: '' }}, { new: true })
    .then(function(remove) {
        console.log(`article ${remove._id} saved: ${remove.saved}`);
        res.send(remove);
    })
    .catch(function (err) {
        console.error(err);
    });
});


  app.get('/delete', function(req, res) {
    db.Article.remove({})
    .then(function(response) {
       return db.Comment.remove({});
    })
    .then(function(commentResponse){
        console.log('Articles removed!');
        res.send('Articles removed!');
    })
    .catch(function (err){
        console.log(err);
        res.send(err);
    });
});

  // Export routes for server.js to use.
module.exports = app;