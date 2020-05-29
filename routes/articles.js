const express = require('express');
const router = express.Router();

// Bring in Article model
let Article = require('../models/article');
// Bring in User model
let User = require('../models/user');

// Add route
router.get('/add', ensureAuthenticated, (req, res) => {
  res.render('add_article', {
    title: 'Add Articles'
  });
});

// // This works with the older express-validator@4
// // Add submit POST route
// router.post('/add', (req, res) => {
//   let article = new Article();
//   article.title = req.body.title;
//   article.author = req.body.author;
//   article.body = req.body.body;

//   article.save( err => {
//     if (err) {
//       console.log(err);
//       return;
//     } else {
//       res.redirect('/');
//     }
//   });
// });

// replacement code from ccrt1234
const { check, validationResult } = require('express-validator');

//no middleware

router.post('/add',
  [
    check('title').isLength({min:1}).trim().withMessage('Title required'),
//    check('author').isLength({min:1}).trim().withMessage('Author required'),
    check('body').isLength({min:1}).trim().withMessage('Body required')
  ],
  (req,res,next) => {
    let article = new Article({
      title:req.body.title,
      author:req.body.author,
      body:req.body.body
    });

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('add_article', { 
        article,
        errors: errors.mapped()
      });
      return;
    }
    article.title = req.body.title;
    article.author = req.user._id;
    article.body = req.body.body;

    article.save(err => {
      if (err) throw err;
      req.flash('success', 'Article Added');
      res.redirect('/');
    });
  }
);

// Load Edit Form
router.get('/edit/:id', ensureAuthenticated, (req, res) => {
  Article.findById(req.params.id, (err, article) => {
    if (article.author != req.user._id) {
      req.flash('danger', 'Not Authorized: not your article to edit');
      res.redirect('/');
      return;
    }
    res.render('edit_article', {
      title: 'Edit Article',
      article
    });
  });
});

// Update submit POST route
router.post('/edit/:id', (req, res) => {
  let article = {};
  article.title = req.body.title;
  article.author = req.body.author;
  article.body = req.body.body;

  let query = { _id: req.params.id };

  Article.updateOne( query, article, err => {
    if (err) {
      console.log(err);
      return;
    }
    req.flash('success', 'Article Updated');
    res.redirect('/');
  });
});

// Delete an article using jQuery and Ajax
router.delete('/:id', (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(500).send();
    return;
  }
  let query = { _id: req.params.id }
  Article.findById(req.params.id, (err, article) => {
    if (article.author != req.user._id) {
      res.status(500).send();
      return;
    }
  })

  Article.deleteOne(query, err => {
    if (err) {
      console.log(err);
      req.flash('danger', 'Article Deletion Failed');
      return;
    }
    req.flash('success', 'Article Deleted');
    res.send('Success');
  });
});

// Get Single article
router.get('/:id', (req, res) => {
  Article.findById(req.params.id, (err, article) => {
    User.findById(article.author, (err, user) => {
      res.render('article', {
        article,
        author: user.name
      });  
    });
  });
});

// Access Control
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('danger', 'Please login');
  res.redirect('/users/login');
}

module.exports = router;
