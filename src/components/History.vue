<template>
  <div>
    <modal :modal="modal" v-if="modal"></modal>
    <template v-for="(session, index) in sessions">
      <session :key="'session_'+index" :session="session"></session>
    </template>
    <infinite-loading @infinite="infiniteHandler"></infinite-loading>
  </div>
</template>
<script>
import { mapActions } from 'vuex'
import Session from './Session'
import Modal from './Modal'
import moment from 'moment'
import InfiniteLoading from 'vue-infinite-loading'

export default {
  name: 'History',
  components: {
    Session,
    InfiniteLoading,
    Modal
  },
  data() {
    return {
      fromMoment: moment(new Date()),
      sessions: [],
      modal: null
    }
  },
  methods: {
    infiniteHandler($state) {
      this.activities(this.calcRequest(this.fromMoment))
        .then(response => {
          this.sessions.push(...response.data)
          if (response.data.length === 0) {
            $state.complete()
          }
          $state.loaded()
        })
        .catch(() => {
          $state.complete()
          this.showUnknownError()
        })
    },
    calcRequest: function(startMoment) {
      return { startTimeNanos: startMoment.unix() * 1000 * 1000 * 1000, endTimeNanos: startMoment.subtract(4, 'days').unix() * 1000 * 1000 * 1000 }
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
