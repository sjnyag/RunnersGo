// [START initialize_firebase_in_sw]
// Import and configure the Firebase SDK
// These scripts are made available when the app is served or
// deployed on Firebase Hosting
// If you do not serve/host your project using Firebase Hosting
// see https://firebase.google.com/docs/web/setup

importScripts('https://www.gstatic.com/firebasejs/5.0.0/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/5.0.0/firebase-messaging.js')

firebase.initializeApp({
  messagingSenderId: '762064213637'
})

firebase.messaging().setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload)
  // Customize notification here
  var notification = payload.data
  var notificationTitle = 'Runners GO: ' + notification.title
  var notificationOptions = {
    body: notification.body,
    icon: '/static/img/icons/android-chrome-512x512.png',
    url: '/index.html',
    tag: 'push-test'
  }
  if (notification.body === 'error') {
    return new Promise(function(resolve, _) {
      resolve()
    })
  }

  return self.registration.showNotification(notificationTitle, notificationOptions)
})
