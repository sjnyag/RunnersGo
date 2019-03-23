'use strict'
module.exports = {
  NODE_ENV: '"production"',
  config: `{
    authDomain: 'runnersgo.firebaseapp.com',
    databaseURL: 'https://runnersgo.firebaseio.com',
    projectId: 'runnersgo',
    storageBucket: 'runnersgo.appspot.com',
    messagingSenderId: '762064213637',
    clientId:
      '762064213637-np6vfbar65jjc5gderi14kfabred9rcf.apps.googleusercontent.com',
    discoveryDocs: [
      'https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest',
      'https://www.googleapis.com/discovery/v1/apis/oauth2/v1/rest',
      'https://www.googleapis.com/discovery/v1/apis/oauth2/v2/rest'
    ],
    scopes: [
      'profile', 'email',
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.location.read'
    ]
  }`,
  cloud_function_base_url: '"https://us-central1-runnersgo.cloudfunctions.net/"',
  public_valid_key: '"BPCS-Hb6qRiiPHD7u7Hr-MiSo5k7voBnFLJ_pl6DXRpi5kUm4mdTze5vb4Fl4jNQOzHDCmjBkg9twwYOgFFAno4"'
}
