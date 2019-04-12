<template>
  <div>
    <full-screen-loader v-if="loading"></full-screen-loader>
    <template v-for="(session, index) in sessions">
      <session :key="'session_'+index" :session="session"></session>
    </template>
  </div>
</template>
<script>
import { mapActions } from 'vuex'
import FullScreenLoader from './FullScreenLoader'
import Session from './Session'
import moment from 'moment'

export default {
  name: 'History',
  components: {
    Session,
    FullScreenLoader
  },
  data() {
    return {
      sessions: [],
      loading: true
    }
  },
  mounted() {
    this.execApi()
  },
  methods: {
    execApi() {
      const datasetId = this.startDay().unix() * 1000 * 1000 * 1000 + '-' + moment().unix() * 1000 * 1000 * 1000
      this.activities(datasetId).then(response => {
        this.loading = false
        this.sessions = response.data
      })
    },
    startDay: function() {
      return moment(new Date()).subtract(2, 'days')
    },
    ...mapActions('gameData', ['activities'])
  }
}
</script>
