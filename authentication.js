var express = require('express')
var router = express.Router()

// Load external dependencies
require('cookie-session')
var CentralAuthenticationService = require('cas')

// Load internal modules
var config = require('./config.js')
var UserModel = require('./user.js')

// Configure CAS authentication
var casURL = 'https://fed.princeton.edu/cas/'
var cas = new CentralAuthenticationService({
  base_url: casURL,
  service: config.host + '/auth/verify'
})

router.use('*', function (req, res, next) {
  console.log('In router!')
  next()
})

// Redirect the user to Princeton's CAS server
router.get('/login', function (req, res) {
  res.redirect(casURL + 'login?service=' + config.host + '/auth/verify')
})

// Handle replies from Princeton's CAS server about authentication
router.get('/verify', function (req, res) {
  if (!req.session.cas) {
    var ticket = req.param('ticket')
    if (ticket) {
      // Check if the user has a valid ticket
      cas.validate(ticket, function (err, status, netid) {
        if (err) {
          res.send({ error: err })
        } else {
          console.log('Setting session for user %s', netid)
          req.session.cas = {
            status: status,
            netid: netid
          }

          console.log('Searching the database for a user with netid %s', netid)
          UserModel.findByNetid(req.session.cas.netid, function (user) {
            if (user == null) {
              var User = new UserModel({
                netid: netid
              })
              User.save(function (error) {
                if (error) {
                  console.log('An error occured saving a user: %s', error)
                }
              })
            }
            req.app.set('user', user)
          })

          res.redirect('/')
        }
      })
    } else {
      res.redirect('/')
    }
  } else {
    res.redirect('/')
  }
})

// Log the user out
router.get('/logout', function (req, res) {
  req.session = null
  res.redirect('/')
})

// Export the routes on this router (/login, /verify, and /logout)
module.exports.router = router

// Determine whether the user sending this request is authenticated
var userIsAuthenticated = function (req) {
  return (typeof (req.session.cas) !== 'undefined')
}
module.exports.userIsAuthenticated = userIsAuthenticated

// Find the details of the currently logged in user
var loadUser = function (req, res, next) {
  if (req.session.cas) {
    UserModel.findByNetid(req.session.cas.netid, function (user) {
      if (user != null) {
        req.app.set('user', user)
      }
      next()
    })
  } else {
    next()
  }
}
module.exports.loadUser = loadUser
