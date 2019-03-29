const functions = require('firebase-functions')
const cors = require('cors')({ origin: true })
const rp = require('request-promise')
const admin = require('firebase-admin')

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

admin.initializeApp({
  credential: admin.credential.cert(functions.config().service_account),
  databaseURL: 'https://runnersgo.firebaseio.com/'
})

exports.createCustomToken = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    if (request.method !== 'POST') {
      return response.status(401).json({
        message: 'Not allowed'
      })
    }
    return admin
      .auth()
      .createCustomToken(request.body.uid)
      .then(customToken => {
        console.log(`The customToken is: ${customToken}`)
        return response.status(200).json({ customToken: customToken })
      })
      .catch(error => {
        console.error(`Something happened buddy: ${error}`)
        return response.status(500).json({
          message: error
        })
      })
  })
})

exports.exchangeGapiToken = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    if (request.method !== 'POST') {
      return response.status(401).json({
        message: 'Not allowed'
      })
    }
    rp({
      method: 'POST',
      uri: 'https://www.googleapis.com/oauth2/v4/token',
      timeout: 30 * 1000,
      json: {
        client_id: functions.config().gapi.client_id,
        client_secret: functions.config().gapi.client_secret,
        code: request.body.code,
        grant_type: 'authorization_code',
        redirect_uri: request.body.redirect_uri
      }
    })
      .then(data => {
        console.log(data)
        return response.status(200).json(data)
      })
      .catch(err => {
        console.log(err)
        return response.status(500).json({
          message: err
        })
      })
  })
})

exports.refreshGapiToken = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    if (request.method !== 'POST') {
      return response.status(401).json({
        message: 'Not allowed'
      })
    }
    rp({
      method: 'POST',
      uri: 'https://www.googleapis.com/oauth2/v4/token',
      timeout: 30 * 1000,
      json: {
        client_id: functions.config().gapi.client_id,
        client_secret: functions.config().gapi.client_secret,
        refresh_token: request.body.refresh_token,
        grant_type: 'refresh_token'
      }
    })
      .then(data => {
        console.log(data)
        return response.status(200).json(data)
      })
      .catch(err => {
        console.log(err)
        return response.status(500).json({
          message: err
        })
      })
  })
})

const express = require('express')
const cookieParser = require('cookie-parser')()
const validateFirebaseIdToken = (req, res, next) => {
  console.log('Check if request is authorized with Firebase ID token')

  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) && !(req.cookies && req.cookies.__session)) {
    console.error(
      'No Firebase ID token was passed as a Bearer token in the Authorization header.',
      'Make sure you authorize your request by providing the following HTTP header:',
      'Authorization: Bearer <Firebase ID Token>',
      'or by passing a "__session" cookie.'
    )
    res.status(403).send('Unauthorized')
    return
  }

  let idToken
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    console.log('Found "Authorization" header')
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1]
  } else if (req.cookies) {
    console.log('Found "__session" cookie')
    // Read the ID Token from cookie.
    idToken = req.cookies.__session
  } else {
    // No cookie
    res.status(403).send('Unauthorized')
    return
  }
  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedIdToken => {
      console.log('ID Token correctly decoded', decodedIdToken)
      req.user = decodedIdToken
      return next()
    })
    .catch(error => {
      console.error('Error while verifying Firebase ID token:', error)
      res.status(403).send('Unauthorized')
    })
}

const users = express()
users.use(cors)
users.use(cookieParser)
users.use(validateFirebaseIdToken)
users.post('/dailySummon', (request, response) => {
  admin
    .firestore()
    .collection('users')
    .doc(request.user.uid)
    .get()
    .then(doc => {
      return response.status(200).json(doc)
    })
    .catch(function(error) {
      console.log('Error getting document:', error)
      return response.status(500).json({ message: err })
    })
})
// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
exports.users = functions.https.onRequest(users)
