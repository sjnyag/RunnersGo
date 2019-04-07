<template>
  <div class="mdc-grid-list">
    <full-screen-loader v-if="loading"></full-screen-loader>
    <ul class="mdc-grid-list__tiles">
      <template v-for="(monster, index) in monsters">
        <li :key="index" class="mdc-grid-tile">
          <div class="mdc-grid-tile__primary">
            <img
              class="mdc-grid-tile__primary-content"
              v-lazy="'./static/img/monsters/' + monster.url"
            >
          </div>
          <span class="mdc-grid-tile__secondary">
            <span class="mdc-grid-tile__title">{{monster.name}}</span>
          </span>
        </li>
      </template>
    </ul>
  </div>
</template>
<script>
import { mapActions } from 'vuex'
import FullScreenLoader from './FullScreenLoader'
export default {
  name: 'Monsters',
  components: {
    FullScreenLoader
  },
  data() {
    return {
      monsters: [],
      loading: true
    }
  },
  mounted() {
    this.execApi()
  },
  methods: {
    execApi() {
      this.allMonsters().then(response => {
        this.loading = false
        console.log(response)
        this.monsters = response.data
      })
    },
    ...mapActions('gameData', ['allMonsters'])
  }
}
</script>

<style lang="scss" scoped>
@import '@material/grid-list/mdc-grid-list.scss';
.mdc-grid-tile__primary {
  img {
    width: auto;
    height: 100%;
    margin: auto;
  }
}
.mdc-grid-tile__title {
  text-align: center;
}
.mdc-grid-tile {
  margin: auto;
}
</style>
