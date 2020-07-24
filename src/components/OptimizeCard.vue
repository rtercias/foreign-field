<template>
  <div class="optimize-card col justify-content-between text-black-0 pt-0 pb-0">
    <div class="address d-flex justify-content-between align-items-center w-100 pl-0 pr-0">
      <div>
        <div class="mb-0">
          {{address.addr1}}
        </div>
        {{address.addr2}}
        <div class="mb-2">
          {{address.city}}
        </div>
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
  watch: {
    pos(value) {
      this.address.sort = value + 1;
    },
  },
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
  min-height: 104px;
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
</style>
