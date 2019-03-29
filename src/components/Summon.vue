<template>
  <div class="page" v-lazy:background-image="backgroundImage">
    <div class="round-table">
      <div class="summoning-circle">
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
      <img class="monster" v-lazy="monsterImage">
    </div>
    <div class="salt-burst"></div>
  </div>
</template>
<script>
import { mapActions } from 'vuex'
export default {
  name: 'Top',
  data() {
    return {
      backgroundImage: {
        src: './static/img/summon.jpg'
      },
      monsterImage: {
        src: './static/img/kobold.png'
      },
      magicCircuitImage: {
        src: './static/img/magic_circuit.svg'
      }
    }
  },
  mounted() {
    this.dailySummon().then(result => {
      console.log(result)
    }).catch(error => {
      console.log(error)
    })
  },
  methods: {
    ...mapActions('gamedata', ['dailySummon'])
  }
}
</script>
<style lang="scss" scoped>
.round-table {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  .summoning-circle {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    height: 80vw;
    width: 80vw;
    transform-origin: 50% 50%;
    transform-style: preserve-3d;
    transform: translateY(-30vh) rotateX(70deg);
    .magic-circuit {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      top: 0;
      margin: auto;
      transform-origin: 50% 50%;
      background-size: cover;
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
    transform: scale(0.01) translateZ(50px);
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
  height: 30px;
  width: 30px;
  position: absolute;
  border-radius: 50%;
  background-color: white;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  margin: auto;
  transform-style: preserve-3d;
  transform: rotate(0) rotateX(-90deg);
  box-shadow: 0 0 10px white;

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
    box-shadow: 0 0 20px white;
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
  height: 300px;
  width: 300px;
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
  z-index: 0;
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
    z-index: -1;
  }
  img.monster {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto;
    transform-origin: bottom;
    width: 20vh;
    z-index: 5;
    transform: translateY(-28vh) scale(0);
    animation: 3s MonsterScale 3s ease-in forwards;
  }
}
@keyframes MonsterScale {
  from {
    transform: translateY(-28vh) scale(0);
  }
  to {
    transform: translateY(-28vh) scale(1);
  }
}
</style>
