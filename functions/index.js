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
