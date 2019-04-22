<template>
  <div style="background-color:#DAFFAD;">
    <p>{{period}}</p>
    <p>{{elapsedTime}}</p>
    <p>{{session.aggregated.stepCount}} 歩</p>
    <p>{{session.aggregated.distance}} メートル</p>
  </div>
</template>
<script>
import moment from 'moment'
moment.locale('ja')
export default {
  name: 'Session',
  props: {
    session: Object
  },
  computed: {
    period: function() {
      return this.formatDate(this.start) + '~' + this.formatDate(this.end)
    },
    elapsedTime: function() {
      let seconds = this.end.diff(this.start, 'seconds', true)
      const minute = parseInt(seconds / 60)
      seconds = parseInt(seconds - minute * 60)
      return minute + '分' + seconds + '秒'
    },
    start: function() {
      return this.nanoStringToMoment(this.session.aggregated.startTimeNanos)
    },
    end: function() {
      return this.nanoStringToMoment(this.session.aggregated.endTimeNanos)
    }
  },
  methods: {
    nanoStringToMoment(nano) {
      return moment(new Date(parseInt(nano) / 1000000))
    },
    formatDate(momentTime) {
      if (!momentTime) {
        return ''
      }
      return momentTime.format('YYYY/MM/DD(ddd) HH:mm')
    }
  }
}
</script>
