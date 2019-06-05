<template>
  <div>
    <modal :modal="modal" v-if="modal"></modal>
    <div class="item-container" @scroll="infiniteScroll">
      <template v-for="(sessions, date) in dailySessions">
        <template v-if="Object.keys(sessions).length > 0">{{date}}</template>
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
      baseMoment: moment(new Date())
        .utc()
        .add(1, 'days')
        .startOf('day'),
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
      this.activities({ startMoment: this.baseMoment.clone(), endMoment: this.baseMoment.subtract(4, 'days').clone() })
        .then(result => {
          this._.forEach(result, session => {
            const dateLabel = this.toDateLabel(session.aggregated.startTimeNanos)
            if (!this.dailySessions.hasOwnProperty(dateLabel)) {
              this.$set(this.dailySessions, dateLabel, {})
            }
            this.dailySessions[dateLabel][session.aggregated.startTimeNanos] = session
          })
        })
        .catch(error => {
          console.log(error)
          this.showUnknownError()
        })
    },
    toDateLabel(unixTime) {
      return moment(parseInt(unixTime) / (1000 * 1000)).format('YYYY/MM/DD')
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
