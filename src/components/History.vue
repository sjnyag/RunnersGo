<template>
  <div>
    <modal :modal="modal" v-if="modal"></modal>
    <div class="item-container" @scroll="infiniteScroll">
      <template v-for="(sessions, date) in dailySessions">
        {{date}}
        <template v-for="(session, index) in sessions">
          <session :key="'session_'+date+index" :session="session"></session>
        </template>
      </template>
      <div class="loader">
        <loader color="#eeff41" size="50px" style="margin: 20px auto;"></loader>
      </div>
    </div>
  </div>
</template>
<script>
import { mapActions } from 'vuex'
import Session from './Session'
import Modal from './Modal'
import moment from 'moment'
import Loader from './Loader'

export default {
  name: 'History',
  components: {
    Session,
    Modal,
    Loader
  },
  data() {
    return {
      fromMoment: moment(new Date()),
      dailySessions: {},
      modal: null
    }
  },
  mounted() {
    this.execApi()
  },
  methods: {
    infiniteScroll(event) {
      if (event.target.scrollTop + event.target.offsetHeight < event.target.scrollHeight) {
        return
      }
      this.execApi()
    },
    execApi: function() {
      this.activities(this.calcRequest(this.fromMoment))
        .then(response => {
          this._.forEach(response.data, session => {
            const dateLabel = this.nanoStringToDateString(session.aggregated.startTimeNanos)
            if (!this.dailySessions.hasOwnProperty(dateLabel)) {
              this.$set(this.dailySessions, dateLabel, [])
            }
            this.dailySessions[dateLabel].push(session)
          })
        })
        .catch(error => {
          console.log(error)
          this.showUnknownError()
        })
    },
    calcRequest: function(startMoment) {
      return { startTimeNanos: startMoment.unix() * 1000 * 1000 * 1000, endTimeNanos: startMoment.subtract(4, 'days').unix() * 1000 * 1000 * 1000 }
    },
    nanoStringToDateString(nano) {
      return moment(new Date(parseInt(nano) / 1000000)).format('YYYY/MM/DD')
    },
    showUnknownError: function() {
      this.modal = {
        header: 'エラーが発生しました。',
        body: 'サーバが無料プランなので、100秒あたりのリクエスト回数が制限されています。。。',
        buttons: [
          {
            label: 'OK',
            onClick: () => {
              this.modal = null
            }
          }
        ]
      }
    },
    ...mapActions('gameData', ['activities'])
  }
}
</script>

<style lang="scss" scoped>
.item-container {
  height: 90vh;
  overflow: auto;
}
</style>
