<template>
  <div>
    <div class="mdc-card">
      <div class="mdc-card__primary-action" tabindex="0">
        <h3 class="mdc-typography mdc-typography--subtitle2">{{period}} ({{elapsedTime}})</h3>
        <div
          class="mdc-card__media mdc-card__media--16-9 demo-card__media"
          v-lazy:background-image="backgroundImage"
        ></div>
      </div>
      <div class="mdc-typography mdc-typography--body2">
        <p class="icon-text">
          <i class="material-icons">directions_run</i>
          {{session.stepCount}} 歩
        </p>
        <p class="icon-text">
          <i class="material-icons">trending_up</i>
          {{session.distance}} メートル
        </p>
      </div>
      <div class="mdc-card__actions">
        <div class="mdc-card__action-icons">
          <button
            class="mdc-icon-button mdc-card__action mdc-card__action--icon--unbounded"
            aria-pressed="false"
            aria-label="Add to favorites"
            title="Add to favorites"
          >
            <i class="material-icons mdc-icon-button__icon mdc-icon-button__icon--on">favorite</i>
            <i class="material-icons mdc-icon-button__icon">favorite_border</i>
          </button>
          <button
            class="mdc-icon-button material-icons mdc-card__action mdc-card__action--icon--unbounded"
            title="Share"
            data-mdc-ripple-is-unbounded="true"
          >share</button>
          <button
            class="mdc-icon-button material-icons mdc-card__action mdc-card__action--icon--unbounded"
            title="More options"
            data-mdc-ripple-is-unbounded="true"
          >more_vert</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import moment from 'moment'
moment.locale('ja')
const IMAGES = {
  MOVING: './static/img/activity/undraw_modern_life_u1ev.svg',
  WALKING_DAY: './static/img/activity/undraw_sunny_day_bk3m.svg',
  WALKING_NIGHT: './static/img/activity/undraw_walking_around_25f5.svg',
  WALKING_MORNING: './static/img/activity/undraw_walk_in_the_city_1ma6.svg',
  DOG: './static/img/activity/undraw_dog_walking_0jpt.svg',
  ENJOYING: './static/img/activity/undraw_running_wild_ni0y.svg',
  JOGGING: './static/img/activity/undraw_Jogging_t14q.svg',
  RUNNING: './static/img/activity/undraw_working_out_6psf.svg',
  GOAL: './static/img/activity/undraw_finish_line_katerina_limpitsouni_xy20.svg'
}
export default {
  name: 'Session',
  props: {
    session: Object
  },
  computed: {
    period: function() {
      return this.start.format('YYYY/MM/DD HH:mm') + ' ~ ' + this.end.format('HH:mm')
    },
    elapsedTime: function() {
      const minute = parseInt(this.session.seconds / 60)
      const second = parseInt(this.session.seconds - minute * 60)
      return minute + '分' + second + '秒'
    },
    start: function() {
      return this.nanoStringToMoment(this.session.startTimeNanos)
    },
    end: function() {
      return this.nanoStringToMoment(this.session.endTimeNanos)
    },
    backgroundImage: function() {
      return IMAGES[this.resolveImage()]
    }
  },
  methods: {
    resolveImage() {
      if (this.session.distance / this.session.seconds > 1.6 || this.session.type === 8) {
        return 'RUNNING'
      }
      const hour = (this.start.hour() + this.end.hour()) / 2
      if (hour >= 5 && hour <= 11) {
        return 'WALKING_MORNING'
      } else if (hour >= 11 && hour <= 17) {
        return 'WALKING_DAY'
      } else {
        return 'WALKING_NIGHT'
      }
    },
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
<style lang="scss" scoped>
@import '@material/icon-button/mdc-icon-button';
@import '@material/card/mdc-card';
.mdc-card {
  margin: 16px;
  max-width: 640px;
}
.icon-text {
  display: inline-flex;
}
</style>
