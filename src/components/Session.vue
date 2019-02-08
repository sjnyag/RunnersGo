<template>
  <div style="background-color:#DAFFAD;">
    <p>{{session.name}}</p>
    <p>{{period}}</p>
    <p>{{elapsedTime}}</p>
    <p>{{step_count}} 歩</p>
    <p>{{distance}} メートル</p>
  </div>
</template>
<script>
import { mapActions } from 'vuex'
import moment from 'moment'
export default {
  name: 'Session',
  props: {
    session: Object
  },
  data: function() {
    return {
      step_count: null,
      distance: null
    }
  },
  mounted() {
    this.isSignedIn().then(isSignedIn => {
      if (isSignedIn) {
        this.calcDetail()
      } else {
        this.signIn().then(_ => this.calcDetail())
      }
    })
  },
  computed: {
    period: function() {
      return (
        this.formatDate(this.session.startTimeMillis) +
        '~' +
        this.formatDate(this.session.endTimeMillis)
      )
    },
    elapsedTime: function() {
      let seconds = this.toMoment(this.session.endTimeMillis).diff(
        this.toMoment(this.session.startTimeMillis),
        'seconds',
        true
      )
      const minute = parseInt(seconds / 60)
      seconds = parseInt(seconds - minute * 60)
      return minute + '分' + seconds + '秒'
    },
    aggregateRequest: function() {
      return {
        userId: 'me',
        aggregateBy: [
          {
            dataTypeName: 'com.google.distance.delta'
          },
          {
            dataTypeName: 'com.google.step_count.delta'
          }
        ],
        bucketBySession: { minDurationMillis: 100 },
        startTimeMillis: parseInt(this.session.startTimeMillis),
        endTimeMillis: parseInt(this.session.endTimeMillis)
      }
    },
    speedRequest: function() {
      return {
        userId: 'me',
        aggregateBy: [
          {
            dataTypeName: 'com.google.speed'
          }
        ],
        bucketByTime: { durationMillis: 600000 },
        startTimeMillis: parseInt(this.session.startTimeMillis),
        endTimeMillis: parseInt(this.session.endTimeMillis)
      }
    }
  },
  methods: {
    calcSpeed() {
      window.gapi.client.fitness.users.dataset
        .aggregate(this.speedRequest)
        .then(
          response => {
            if (response.result.bucket.length === 0) {
              return
            }
            response.result.bucket.forEach(bucket => {
              if (bucket.dataset[0].point.length !== 0) {
                bucket.dataset[0].point[0].value.forEach(value => {
                  console.log(value)
                })
              }
            })
          },
          reason => {
            console.log('Error: ' + reason.result.error.message)
          }
        )
    },
    calcDetail() {
      window.gapi.client.fitness.users.dataset
        .aggregate(this.aggregateRequest)
        .then(
          response => {
            if (response.result.bucket.length === 0) {
              return
            }
            this.step_count =
              response.result.bucket[0].dataset[1].point[0].value[0].intVal
            this.distance =
              response.result.bucket[0].dataset[0].point[0].value[0].fpVal
            this.calcSpeed()
          },
          reason => {
            console.log('Error: ' + reason.result.error.message)
          }
        )
    },
    toMoment(timeMills) {
      return moment(new Date(parseInt(timeMills)))
    },
    formatDate(timeMills) {
      return this.toMoment(timeMills).format('YYYY/MM/DD HH:mm')
    },
    ...mapActions('auth', ['isSignedIn', 'signIn', 'signOut'])
  }
}
</script>
