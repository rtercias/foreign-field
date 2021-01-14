<template>
  <div class="optimize-card px-3 w-100 justify-content-between text-black-0">
    <div class="address d-flex justify-content-between align-items-center w-100 pl-0 pr-0">
      <div class="w-100">
        <div class="mb-0">{{address.addr1}} {{address.addr2}}</div>
        <div class="mb-2">{{address.city}}</div>
        <div class="sort-order position-absolute w-100 h-100" v-if="mode==='manual'">{{pos}}</div>
      </div>
      <div class="p-0" v-if="showGrip">
        <font-awesome-layers class="grip fa-2x">
          <font-awesome-icon icon="grip-lines"></font-awesome-icon>
        </font-awesome-layers>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OptimizeCard',
  props: ['address', 'mode', 'state', 'pos'],
  computed: {
    showGrip() {
      return (this.mode === 'manual' && this.state === 'manual') || (this.mode === 'optimize' && this.state === 'optimize');
    },
  },
};
</script>
<style scoped>
.optimize-card {
  display: flex;
  flex-direction: row;
  overflow: hidden;
  position: relative;
  min-height: 75px;
  max-height: 75px;
}
.optimize-card .address {
  display: flex;
  text-align: left;
}
.grip {
  cursor: grab;
}
.grip:active {
  cursor: grabbing;
}
.sort-order {
  top: 1px;
  left: 1px;
  font-size: 75px;
  line-height: 75px;
  text-align: right;
  opacity: 0.1;
  padding-right: 60px;
}
</style>
