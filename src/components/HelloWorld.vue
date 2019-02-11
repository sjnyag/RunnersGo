<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <button v-if="!signedIn" v-on:click="signin">SignIn</button>
    <h2>Essential Links</h2>
    <ul>
      <li>
        <a href="https://vuejs.org" target="_blank">Core Docs</a>
      </li>
      <li>
        <a href="https://forum.vuejs.org" target="_blank">Forum</a>
      </li>
      <li>
        <a href="https://chat.vuejs.org" target="_blank">Community Chat</a>
      </li>
      <li>
        <a href="https://twitter.com/vuejs" target="_blank">Twitter</a>
      </li>
      <br>
      <li>
        <a href="http://vuejs-templates.github.io/webpack/" target="_blank">Docs for This Template</a>
      </li>
    </ul>
    <h2>Ecosystem</h2>
    <ul>
      <li>
        <a href="http://router.vuejs.org/" target="_blank">vue-router</a>
      </li>
      <li>
        <a href="http://vuex.vuejs.org/" target="_blank">vuex</a>
      </li>
      <li>
        <a href="http://vue-loader.vuejs.org/" target="_blank">vue-loader</a>
      </li>
      <li>
        <a href="https://github.com/vuejs/awesome-vue" target="_blank">awesome-vue</a>
      </li>
    </ul>
    <template v-for="(session, index) in sessions">
      <session :key="'session_'+index" :session="session"></session>
    </template>
  </div>
</template>
<script>
import { mapActions } from 'vuex'
import Session from './Session'
import moment from 'moment'
export default {
  name: 'HelloWorld',
  components: {
    Session
  },
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
      sessions: [],
      signedIn: true
    }
  },
  mounted() {
    this.isSignedIn().then(isSignedIn => {
      if (isSignedIn) {
        this.execApi()
      } else {
        this.signedIn = false
      }
    })
  },
  methods: {
    signin() {
      this.signIn().then(_ => {
        this.signedIn = true
        this.execApi()
      })
    },
    execApi() {
      window.gapi.client.fitness.users.dataSources.datasets
        .get({
          userId: 'me',
          dataSourceId:
            'derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes',
          datasetId:
            this.lastWeek().unix() * 1000 * 1000 * 1000 + '-' + moment().unix() * 1000 * 1000 * 1000
        })
        .then(
          response => {
            const isContinuous = function(before, after) {
              return (after - before) / (1000 * 1000 * 1000) < 15 * 60
            }
            const isWorkout = function(summary) {
              return (
                (summary.endTimeNanos - summary.startTimeNanos) /
                  (1000 * 1000 * 1000) >
                5 * 60
              )
            }
            let before = 0
            const result = []
            response.result.point.forEach(point => {
              if (isContinuous(before, point.startTimeNanos)) {
                this._.last(result).summary.endTimeNanos = point.endTimeNanos
              } else {
                point.summary = {
                  startTimeNanos: point.startTimeNanos,
                  endTimeNanos: point.endTimeNanos
                }
                result.push(point)
              }
              before = point.endTimeNanos
            })
            this.sessions = this._.reverse(this._.filter(result, point =>
              isWorkout(point.summary)
            ))
          },
          reason => {
            console.log('Error: ' + reason.result.error.message)
          }
        )
    },
    lastWeek: function() {
      return moment(new Date()).subtract(7, 'days')
    },
    ...mapActions('auth', ['isSignedIn', 'signIn', 'signOut'])
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1,
h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
