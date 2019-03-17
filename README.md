# runners_go

> A Vue.js project

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# serve with at localhost:5000
firebase serve --only functions

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test

# Deploy to Firebase
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy

# Deploy Functions to Firebase
firebase functions:config:get
firebase deploy --only functions
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).
