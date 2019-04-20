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
  db.Article.find({ saved: false }).sort({ _id: 1 })
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
      // result.image = "https://nhl.bamcontent.com/images/photos/" + img + "/960x540/cut.jpg";
      // if (result.image){
      //   img = img.slice(41, 50);
      // }
      
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
  .populate('Comment')
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



// add a Comment to a saved article
app.post('/articles/:id', function(req, res) {
  let newComment = new Comment(req.body);
  newComment.save(function(err, doc) {
      if (err) {
          console.log(err);
          res.status(500);
      } else {
          db.Article.findOneAndUpdate(
              { _id: req.params.id },
              { $push: { 'Comment': doc.id } },
              function(error, newDoc) {
                  if (error) {
                      console.log(error);
                      res.status(500);
                  } else {
                      res.redirect('/articles/saved');
                  }
              }
          );
      }
  });
});


// Route for grabbing a specific Article by id, populate it with it's comment
app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("Comment")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
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








// app.delete('/articles/delete', function (req, res) {
//   db.Article.remove({})
//     .then(function (response) {
//       return db.Comment.remove({});
//     })
//     .then(function (commentResponse) {
//       console.log('Articles removed!');
//       res.send('Articles removed!');
//     })
//     .catch(function (err) {
//       console.log(err);
//       res.send(err);
//     });
// });


// // Route for grabbing a specific Article by id, populate it with it's Comment
// app.get("/articles/:id", function (req, res) {
//   // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
//   db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: true }, { new: true })
//     // ..and populate all of the Comments associated with it
//     .populate("Comment")
//     .then(function (dbArticle) {
//       // If we were able to successfully find an Article with the given id, send it back to the client
//       res.send(dbArticle);
//       res.redirect('/articles');
//     })
//     .catch(function (err) {
//       // If an error occurred, send it to the client
//       console.error(err);
//     });
// });

// // Route for saving/updating an Article's associated Comment
// app.post("/articles/:id", function (req, res) {
//   // Create a new Comment and pass the req.body to the entry
//   db.Comment.create(req.body)
//     .then(function (dbComment) {
//       console.log(dbComment);
//       // If a Comment was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Comment
//       // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
//       // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
//       return db.Article.findOneAndUpdate({ _id: req.params.id }, { Comment: dbComment._id }, { new: true });
//     })
//     .then(function (dbArticle) {
//       // If we were able to successfully update an Article, send it back to the client
//       res.send(dbArticle);
//     })
//     .catch(function (err) {
//       // If an error occurred, send it to the client
//       console.log(err);
//     });
// });

// app.get('remove/:id', function (req, res) {
//   db.Article.findOneAndUpdate({ _id: req.params.id }, { $unset: { comment: '', saved: '' } }, { new: true })
//     .then(function (remove) {
//       console.log(`article ${remove._id} saved: ${remove.saved}`);
//       res.send(remove);
//     })
//     .catch(function (err) {
//       console.error(err);
//     });
// });




// Export routes for server.js to use.
module.exports = app;