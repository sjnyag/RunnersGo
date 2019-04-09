<template>
  <div>
    <modal :modal="modal" v-if="modal"></modal>
    <div class="page" v-lazy:background-image="backgroundImage">
      <div class="round-table">
        <div class="summoning-circle" v-if="loaded">
          <div class="magic-circuit" v-lazy:background-image="magicCircuitImage"></div>
          <div class="stress-dots">
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </div>
        </div>
        <div class="spark-area" v-if="loaded">
          <div class="foreground">
            <div class="spark" style="--pos-x:15.0%; --pos-y:11.0%;--size:2.8%;--delay:4.0s;"></div>
            <div class="spark" style="--pos-x:20.0%; --pos-y:17.0%;--size:2.8%;--delay:4.0s;"></div>
            <div class="spark" style="--pos-x:25.0%; --pos-y:19.0%;--size:2.4%;--delay:4.0s;"></div>
            <div class="spark" style="--pos-x:30.0%; --pos-y:11.0%;--size:2.8%;--delay:4.0s;"></div>
            <div class="spark" style="--pos-x:35.0%; --pos-y: 6.0%;--size:2.4%;--delay:4.0s;"></div>
            <div class="spark" style="--pos-x:40.0%; --pos-y:21.0%;--size:2.8%;--delay:3.8s;"></div>
            <div class="spark" style="--pos-x:45.0%; --pos-y:12.0%;--size:3.1%;--delay:3.8s;"></div>
            <div class="spark" style="--pos-x:50.0%; --pos-y:10.5%;--size:3.4%;--delay:4.5s;"></div>
            <div class="spark" style="--pos-x:55.0%; --pos-y:12.0%;--size:2.8%;--delay:4.5s;"></div>
            <div class="spark" style="--pos-x:60.0%; --pos-y:22.0%;--size:2.8%;--delay:4.0s;"></div>
            <div class="spark" style="--pos-x:65.0%; --pos-y:23.0%;--size:2.2%;--delay:4.0s;"></div>
            <div class="spark" style="--pos-x:70.0%; --pos-y:11.0%;--size:2.8%;--delay:3.8s;"></div>
            <div class="spark" style="--pos-x:75.0%; --pos-y:12.0%;--size:3.1%;--delay:3.8s;"></div>
            <div class="spark" style="--pos-x:80.0%; --pos-y:10.5%;--size:3.4%;--delay:4.5s;"></div>
          </div>
          <div class="background">
            <div class="spark" style="--pos-x:13.0%; --pos-y:11.0%;--size:0.8%;--delay:5.0s;"></div>
            <div class="spark" style="--pos-x:20.0%; --pos-y:17.0%;--size:1.8%;--delay:5.0s;"></div>
            <div class="spark" style="--pos-x:25.0%; --pos-y: 9.0%;--size:2.4%;--delay:5.0s;"></div>
            <div class="spark" style="--pos-x:30.0%; --pos-y:11.0%;--size:1.8%;--delay:5.0s;"></div>
            <div class="spark" style="--pos-x:35.0%; --pos-y:13.0%;--size:1.4%;--delay:5.0s;"></div>
            <div class="spark" style="--pos-x:40.0%; --pos-y:19.0%;--size:4.8%;--delay:4.8s;"></div>
            <div class="spark" style="--pos-x:45.0%; --pos-y:17.0%;--size:2.1%;--delay:4.8s;"></div>
            <div class="spark" style="--pos-x:50.0%; --pos-y: 7.5%;--size:2.4%;--delay:5.5s;"></div>
            <div class="spark" style="--pos-x:55.0%; --pos-y:11.0%;--size:1.8%;--delay:5.5s;"></div>
            <div class="spark" style="--pos-x:60.0%; --pos-y:12.0%;--size:1.8%;--delay:5.0s;"></div>
            <div class="spark" style="--pos-x:65.0%; --pos-y:13.0%;--size:3.2%;--delay:5.0s;"></div>
            <div class="spark" style="--pos-x:70.0%; --pos-y:11.0%;--size:1.8%;--delay:4.8s;"></div>
            <div class="spark" style="--pos-x:75.0%; --pos-y:12.0%;--size:2.1%;--delay:4.8s;"></div>
            <div class="spark" style="--pos-x:80.0%; --pos-y:10.5%;--size:2.4%;--delay:5.5s;"></div>
          </div>
        </div>
        <div ref="monster" class="monster"></div>
        <p ref="monsterName">{{name}}</p>
      </div>
      <div class="salt-burst"></div>
    </div>
  </div>
</template>
<script>
import { mapActions } from 'vuex'
import Modal from './Modal'
import { setInterval } from 'timers'
export default {
  name: 'Top',
  components: {
    Modal
  },
  data() {
    return {
      name: '',
      loaded: false,
      backgroundImage: {
        src: './static/img/summon.jpg'
      },
      magicCircuitImage: {
        src: './static/img/magic_circuit.svg'
      },
      modal: null
    }
  },
  mounted() {
    this.dailySummon()
      .then(result => {
        console.log(result.data)
        console.log(this.$refs.monster)
        const img = new Image()
        img.onload = () => {
          this.loaded = true
          this.$refs.monster.style.display = 'block'
          this.$refs.monsterName.style.display = 'block'
          this.$refs.monster.style.backgroundImage = 'url(' + img.src + ')'
          setInterval(() => {
            this.modal = {
              header: '本日のガチャは終了しました。',
              body: '明日また回してね。',
              buttons: [
                {
                  label: 'OK',
                  onClick: () => {
                    this.$router.push('/home')
                  }
                }
              ]
            }
          }, 14000)
        }
        img.onerror = () => {
          this.showUnknownError()
        }
        this.name = result.data.name
        img.src = './static/img/monsters/' + result.data.url
        this.$refs.monster.style.display = 'none'
        this.$refs.monsterName.style.display = 'none'
      })
      .catch(error => {
        console.log(error)
        if (error.response.data.type === 'AlreadySummonedError') {
          this.modal = {
            header: '本日のガチャは終了しています。',
            body: '明日また回してね。',
            buttons: [
              {
                label: 'OK',
                onClick: () => {
                  this.$router.push('/home')
                }
              }
            ]
          }
        } else {
          this.showUnknownError()
        }
      })
  },
  methods: {
    showUnknownError: function() {
      this.modal = {
        header: 'エラーが発生しました。',
        body: 'TOPに戻ります。',
        buttons: [
          {
            label: 'OK',
            onClick: () => {
              this.$router.push('/home')
            }
          }
        ]
      }
    },
    ...mapActions('gameData', ['dailySummon'])
  }
}
</script>
<style lang="scss" scoped>
p {
  text-shadow: 1px 1px 2px red, 0 0 1em blue, 0 0 0.2em blue;
  text-align: center;
  font-size: 200%;
  -webkit-text-fill-color: black;
  -webkit-text-stroke-width: 1px;
  -webkit-text-stroke-color: white;
  letter-spacing: 10px;
  z-index: 1;
  opacity: 0;
  transform: translateY(-30%) scale(0);
  animation: 3s MonsterNameScale 8s ease-in forwards;
}
@keyframes MonsterNameScale {
  from {
    opacity: 0;
    transform: translateY(-30%) scale(0);
  }
  to {
    opacity: 1;
    transform: translateY(0%) scale(1);
  }
}
.spark-area {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
  height: 80%;
  width: 80%;
  transform-origin: 50% 100%;
  .background {
    .spark {
      z-index: -2;
    }
  }
  .foreground {
    .spark {
      z-index: 2;
    }
  }
  .spark {
    --pos-y: 0;
    --size: 20;
    position: absolute;
    left: var(--pos-x);
    bottom: var(--pos-y);
    width: calc(var(--size) * 4);
    height: calc(var(--size) * 4);
    background-color: rgb(255, 241, 202);
    -webkit-border-radius: 50%;
    border-radius: 50%;
    opacity: 0;
    box-shadow: 0 0 2vw 2vw rgb(255, 241, 202);
    animation: 0.2s Spark var(--delay) ease-in forwards, 0.5s Disappear 10s ease-in forwards;
  }
}
@keyframes Disappear {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes Spark {
  from {
    transform: scale(0.01);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 0.8;
  }
}
.round-table {
  --color: white;
  --max-length: 100vw;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: var(--max-length);
  height: var(--max-length);
  margin: auto;
  z-index: -3;
  .summoning-circle {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    height: 80%;
    width: 80%;
    transform-origin: 50% 100%;
    transform-style: preserve-3d;
    transform: rotateX(70deg);
    .magic-circuit {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      top: 0;
      margin: auto;
      transform-origin: 50% 50%;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center center;
      animation: 1.5s MagicCircuitScale ease-in forwards, 6.8s Rotate 1.5s linear infinite;
    }
    .stress-dots {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      top: 0;
      margin: auto;
      transform-origin: 50% 50%;
      transform-style: preserve-3d;
      animation: 1.5s DotsScale ease-in forwards, 0.8s Rotate 1.5s linear infinite;
    }
  }
}

@keyframes MagicCircuitScale {
  from {
    transform: scale(0.01);
  }
  to {
    transform: scale(1);
  }
}
@keyframes DotsScale {
  from {
    transform: scale(0.01) translate(0%, -100%);
  }
  to {
    transform: scale(1) translateZ(0px);
  }
}
@keyframes Rotate {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
i {
  height: 5%;
  width: 5%;
  position: absolute;
  border-radius: 50%;
  background-color: var(--color);
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  margin: auto;
  transform-style: preserve-3d;
  transform: rotate(0) rotateX(-90deg);
  box-shadow: 0 0 30% white;

  &:before {
    content: '';
    position: absolute;
    height: 100%;
    width: 100%;
    border-radius: 50%;
    top: 0;
    left: 0;
    background-color: inherit;
    transform: rotateY(-90deg);
    box-shadow: 0 0 60% white;
  }

  &:first-child {
    top: -100%;
  }
  &:nth-child(2) {
    top: -70%;
    right: -70%;
  }
  &:nth-child(3) {
    right: -100%;
  }
  &:nth-child(4) {
    right: -70%;
    bottom: -70%;
  }
  &:nth-child(5) {
    bottom: -100%;
  }
  &:nth-child(6) {
    bottom: -70%;
    left: -70%;
  }
  &:nth-child(6) {
    bottom: -70%;
    left: -70%;
  }
  &:nth-child(7) {
    left: -100%;
  }
  &:nth-child(8) {
    top: -70%;
    left: -70%;
  }
}

.salt-burst {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: auto;
  height: 30%;
  width: 30%;
  z-index: -4;
  background-image: url('https://i.imgur.com/recX9HH.png');
  background-size: 100% 100%;
  animation: 12s salt-spin linear reverse infinite;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: inherit;
    background-size: inherit;
    transform-origin: 50% 50%;
    animation: 6s salt-pulsate linear infinite;
  }
}

@keyframes salt-pulsate {
  0% {
    transform: scale(0.8, 0.8) rotate(0);
  }

  50% {
    transform: scale(0.5, 0.8) rotate(180deg);
    opacity: 0.5;
  }

  100% {
    transform: scale(1, 1) rotate(360deg);
    opacity: 1;
  }
}
@keyframes salt-spin {
  0% {
    transform: rotate(45deg);
  }
  100% {
    transform: rotate(405deg);
  }
}
div.page {
  width: 100vw;
  height: 100vh;
  padding: 0;
  background-position: center center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-size: cover;
  background-color: #464646;
  position: relative;
  overflow: hidden;
  z-index: -10;
  justify-self: center;
  align-self: center;
  text-align: center;
  &:before {
    content: '';
    background-color: rgba(0, 0, 0, 0.8);
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -11;
  }
  div.monster {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto;
    transform-origin: bottom;
    width: 65%;
    height: 65%;
    z-index: 0;
    transform: translateY(-30%) scale(0);
    animation: 3s MonsterScale 6s ease-in forwards;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center bottom;
  }
}
@keyframes MonsterScale {
  from {
    transform: translateY(-30%) scale(0);
  }
  to {
    transform: translateY(-25%) scale(1);
  }
}
@media all and (orientation: landscape) {
  .round-table {
    --color: white;
    --max-length: 100vh;
  }
}
@media all and (orientation: portrait) {
  .round-table {
    --color: white;
    --max-length: 100vw;
  }
}
</style>
