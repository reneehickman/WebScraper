var express = require("express");
var axios = require("axios");
var cheerio = require("cheerio");

var app = express.Router();

// Require all models
var db = require("../models");


//index
app.get('/', function (req, res) {
  res.redirect('/articles');
});


//Route for getting all Articles from the db
app.get('/articles', function (req, res) {
  db.Article.find({ saved: false }).sort({ _id: -1 })
    .then(function (articles) {
      // console.log(articles);
      let hbsObj = {
        articles: articles
      };
      res.render('index', hbsObj);
    })
    .catch(function (err) {
      console.log(err);
    });
});


//api
app.get('/api/articles', function (req, res) {
  db.Article.find().sort({ _id: -1 })
    .then(function (dbArticles) {
      // res.render('index', { articles: dbArticles });
      res.json(dbArticles);
    })
    .catch(function (err) {
      console.log(err);
    });
});

// // A GET route for scraping the nhl website
app.get("/articles/scrape", function (req, res) {

  axios.get("https://www.nhl.com/").then(function (response) {
    console.log("Load Response");

    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);


    $("li.mixed-feed__item.mixed-feed__item--article").each(function (i, element) {

      // Initialize Empty Object to Store Cheerio Objects
      var result = {};


     
      result.image = $(this).children('.mixed-feed__item-content')
      .children('.mixed-feed__content')
      .children('a')
      .children('.mixed-feed__media')
      .children('.mixed-feed__media-overlay')
      .children('div')
      .children('.mixed-feed__img-article')
      .attr('data-srcset');
      if (result.image){
      result.image = "https://nhl.bamcontent.com/images/photos/" + result.image.slice(41, 50) + "/960x540/cut.jpg";
      } 
      
      // .slice(41, 50)
      // var imgLink = 'https://nhl.bamcontent.com/images/photos/' + '/1024x576/cut.jpg'
      // Store Scrapped Data into result object
      result.title = $(this).children('.mixed-feed__item-content')
      .children('.mixed-feed__content')
      .children('.mixed-feed__social')
      .children('.mixed-feed__share')
      .attr('data-share-title');
      result.intro = $(this)
      .children('.mixed-feed__item-header')
      .children('.mixed-feed__item-header-text')
      .children('a')
      .children('h5')
      .text();
      result.link = "https://www.nhl.com" + $(this).children('.mixed-feed__item-content')
      .children('.mixed-feed__content')
      .children('.mixed-feed__social')
      .children('.mixed-feed__share')
      .attr('data-share-url');
      
      // result.image = "https://nhl.bamcontent.com/images/photos/" + img.slice(41, 50) + "/960x540/cut.jpg";
      result.comments = null;    

      console.log(result);
      // console.log(result.image);

      db.Article.create(result)
        .then(function (dbArticle) {
          // console.log(dbArticle)
        })
        .catch(function (err) {
          //  res.json(err);
          console.log(err);
          // return res.json(err);
        })
    });
    res.redirect("/articles");
  })
});


// Route for getting all saved Articles from the db
app.get("/articles/saved", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({ saved: true })
  .populate('comment')
    .then(function (dbArticleSaved) {
      // If we were able to successfully find Articles, send them back to the client
      // res.json(dbArticle);
      res.render('saved', { articles: dbArticleSaved });
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      // res.json(err);
      console.log(err)
    });
});


// save an article
app.post('/save/:id', function(req, res) {
  db.Article.findByIdAndUpdate(req.params.id, {
      $set: { saved: true}
      },
      { new: true },
      function(error, doc) {
          if (error) {
              console.log(error);
              res.status(500);
          } else {
              res.redirect('/articles');
          }
      });
});

// save an article
app.post('/unsave/:id', function(req, res) {
  db.Article.findByIdAndUpdate(req.params.id, {
      $set: { saved: false}
      },
      { new: false },
      function(error, doc) {
          if (error) {
              console.log(error);
              res.status(500);
          } else {
              res.redirect('/articles/saved');
          }
      });
});



// Route to see comments we have added
app.get("/articles/saved", function (req, res) {
  // Find all comments in the comment collection with our Comment model
  db.Comment.find({}, function (error, doc) {
      // Send any errors to the browser
      if (error) {
          res.send(error);
      }
      // Or send the doc to the browser
      else {
          res.json(doc);
      }
  });
});

// Route for grabbing a specific Article by id, populate it with it's comment
app.get("/articles/saved", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("comment")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
     console.log(err);
    });
});

// Route for saving/updating an Article's associated Comment
app.post("/articles/comments/:id", function(req, res) {
  // Create a new comment and pass the req.body to the entry
  db.Comment.create(req.body)
    .then(function(dbComment) {
     return db.Article.findOneAndUpdate({ _id: req.params.id }, {$push: {'comment' : dbComment._id }}, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      // res.send(dbArticle);
      res.redirect('/articles/saved');
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      console.log(err);
    });
});


// delete a Comment from a saved article
app.delete('/articles/comments/:id', function(req, res) {
  db.Comment.findByIdAndRemove(req.params.id, function(err, Comment) {
      if (err) {
          console.log(err);
          res.status(500);
      } else {
          res.redirect('/articles/saved');
      }
  });
});





// Export routes for server.js to use.
module.exports = app;