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
      this.activities(datasetId).then(response => {
        this.sessions = response.data
      })
    },
    lastWeek: function() {
      return moment(new Date()).subtract(7, 'days')
    },
    ...mapActions('gameData', ['activities'])
  }
}
</script>
