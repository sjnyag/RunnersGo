<template>
  <div style="background-color:#DAFFAD;">
    <p>{{formatDate(startTime)}}</p>
    <p>{{period}}</p>
    <p>{{elapsedTime}}</p>
    <p>{{stepCount}} 歩</p>
    <p>{{distance}} メートル</p>
  </div>
</template>
<script>
import moment from 'moment'
export default {
  name: 'Session',
  props: {
    session: Object
  },
  data: function() {
    return {
      stepCount: 0,
      distance: 0,
      period: null,
      elapsedTime: null,
      startTime: null,
      endTime: null
    }
  },
  mounted() {
    this.calcDetail()
  },
  computed: {
    sessionStartTime: function() {
      return this.nanoStringToMoment(
        this.session.summary.startTimeNanos
      ).subtract(2, 'minutes')
    },
    sessionEndTime: function() {
      return this.nanoStringToMoment(this.session.summary.endTimeNanos).add(
        2,
        'minutes'
      )
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
        bucketByTime: { durationMillis: 60000 },
        startTimeMillis: this.sessionStartTime.unix() * 1000,
        endTimeMillis: this.sessionEndTime.unix() * 1000
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
        startTimeMillis: this.sessionStartTime.unix() * 1000,
        endTimeMillis: this.sessionEndTime.unix() * 1000
      }
    }
  },
  methods: {
    calcSpeed() {
      // window.gapi.client.fitness.users.dataset
      //   .aggregate(this.speedRequest)
      //   .then(
      //     response => {
      //       if (response.result.bucket.length === 0) {
      //         return
      //       }
      //       response.result.bucket.forEach(bucket => {
      //         if (bucket.dataset[0].point.length !== 0) {
      //           bucket.dataset[0].point[0].value.forEach(value => {
      //             console.log(value)
      //           })
      //         }
      //       })
      //     },
      //     reason => {
      //       console.log('Error: ' + reason.result.error.message)
      //     }
      //   )
    },
    calcDetail() {
      window.gapi.client.fitness.users.dataset
        .aggregate(this.aggregateRequest)
        .then(
          response => {
            if (response.result.bucket.length === 0) {
              return
            }
            this._.each(response.result.bucket, bucket => {
              if (bucket.dataset[0].point.length > 0) {
                if (this.startTime === null) {
                  this.startTime = this.nanoStringToMoment(
                    bucket.dataset[0].point[0].startTimeNanos
                  )
                }
                this.endTime = this.nanoStringToMoment(
                  bucket.dataset[0].point[0].endTimeNanos
                )
                this.distance += bucket.dataset[0].point[0].value[0].fpVal
              }
              if (bucket.dataset[1].point.length > 0) {
                if (this.startTime === null) {
                  this.startTime = this.nanoStringToMoment(
                    bucket.dataset[1].point[0].startTimeNanos
                  )
                }
                this.endTime = this.nanoStringToMoment(
                  bucket.dataset[1].point[0].endTimeNanos
                )
                this.stepCount += bucket.dataset[1].point[0].value[0].intVal
              }
            })
            this.stepCount = Math.round(this.stepCount)
            this.distance = Math.round(this.distance)
            this.period = this.calcPeriod(this.startTime, this.endTime)
            this.elapsedTime = this.calcElapsedTime(
              this.startTime,
              this.endTime
            )
            // this.calcSpeed()
          },
          reason => {
            console.log('Error: ' + reason.result.error.message)
          }
        )
    },
    calcPeriod: function(start, end) {
      return this.formatDate(start) + '~' + this.formatDate(end)
    },
    calcElapsedTime: function(start, end) {
      let seconds = end.diff(start, 'seconds', true)
      const minute = parseInt(seconds / 60)
      seconds = parseInt(seconds - minute * 60)
      return minute + '分' + seconds + '秒'
    },
    formatDate(momentTime) {
      if (!momentTime) {
        return ''
      }
      return momentTime.format('YYYY/MM/DD HH:mm')
    },
    nanoStringToMoment(nano) {
      return moment(new Date(parseInt(nano) / 1000000))
    }
  }
}
</script>
