<template>
  <transition name="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <div class="modal-header">
            <h3>{{modal.header}}</h3>
          </div>
          <div class="modal-body">{{modal.body}}</div>
          <div class="modal-footer">
            <flat-button
              :key="index"
              :name="button.label"
              :color="'green'"
              @onclick="button.onClick"
              v-for="(button, index) in modal.buttons"
            ></flat-button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>
<script>
import FlatButton from './Button'
export default {
  name: 'Modal',
  components: {
    FlatButton
  },
  props: {
    modal: {
      default: {
        header: '本日のガチャは終了しています。',
        body: '明日また回してね。',
        buttons: [{ label: 'OK', onClick: () => {} }]
      }
    }
  },
  methods: {
    ok: function() {
      this.onOkClick()
    }
  }
}
</script>
<style lang="scss">
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: table;
  transition: opacity 0.3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
  .modal-container {
    width: 300px;
    margin: 0px auto;
    padding: 20px 30px;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
    transition: all 0.3s ease;
    .modal-header h3 {
      margin-top: 0;
      color: #42b983;
    }
    .modal-body {
      margin: 20px 0;
    }
    .modal-footer {
      text-align: center;
    }
  }
}

.modal-enter {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>
