<template>
  <div>
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
  name: 'History',
  components: {
    Session
  },
  data() {
    return {
      sessions: []
    }
  },
  mounted() {
    this.execApi()
  },
  methods: {
    execApi() {
      const datasetId = this.lastWeek().unix() * 1000 * 1000 * 1000 + '-' + moment().unix() * 1000 * 1000 * 1000
      this.readFitnessDataSets(datasetId).then(response => {
        const isContinuous = function(before, after) {
          return (after - before) / (1000 * 1000 * 1000) < 15 * 60
        }
        const isWorkout = function(summary) {
          return (summary.endTimeNanos - summary.startTimeNanos) / (1000 * 1000 * 1000) > 5 * 60
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
        this.sessions = this._.reverse(this._.filter(result, point => isWorkout(point.summary)))
      })
    },
    lastWeek: function() {
      return moment(new Date()).subtract(7, 'days')
    },
    ...mapActions('google', ['readFitnessDataSets'])
  }
}
</script>
