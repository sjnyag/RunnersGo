<template>
  <div class="hello">
    <template v-for="(session, index) in sessions">
      <session :key="'session_'+index" :session="session"></session>
    </template>
  </div>
</template>
<script>
import Session from './Session'
import moment from 'moment'
export default {
  name: 'Home',
  components: {
    Session
  },
  data() {
    return {
      sessions: [],
      signedIn: true
    }
  },
  mounted() {
    this.execApi()
  },
  methods: {
    execApi() {
      window.gapi.client.fitness.users.dataSources.datasets
        .get({
          userId: 'me',
          dataSourceId:
            'derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes',
          datasetId:
            this.lastWeek().unix() * 1000 * 1000 * 1000 +
            '-' +
            moment().unix() * 1000 * 1000 * 1000
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
            this.sessions = this._.reverse(
              this._.filter(result, point => isWorkout(point.summary))
            )
          },
          reason => {
            console.log('Error: ' + reason.result.error.message)
          }
        )
    },
    lastWeek: function() {
      return moment(new Date()).subtract(7, 'days')
    }
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
