<template>
  <div class="optimize-card col justify-content-between align-items-center pr-2 text-black-0">
    <div class="address" :class="{ 'col-10': isManual, 'col-5': isOptimize, 'border-right': isManual }">
      <div>
        <div class="mb-0">
          {{address.addr1}}
        </div>
        {{address.addr2}}
        <div class="mb-2">
          {{address.city}}
        </div>
      </div>
    </div>
    <div class="address col-5 border-left border-right" v-if="isOptimize">
      <div>
        <div class="mb-0">
          {{address.addr1}}
        </div>
        {{address.addr2}}
        <div class="mb-2">
          {{address.city}}
        </div>
      </div>
    </div>
    <div class="col-2 p-0" v-if="isManual || isOptimize">
      <font-awesome-layers class="drag-drop-handle fa-2x">
        <font-awesome-icon icon="grip-lines"></font-awesome-icon>
      </font-awesome-layers>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'OptimizeCard',
  props: ['address', 'territoryId', 'group', 'mode'],
  data() {
    return {
    };
  },
  methods: {
    ...mapActions({
    }),
  },
  mounted() {
  },
  computed: {
    ...mapGetters({
    }),
    isManual() {
      return this.mode === 'manual';
    },
    isOptimize() {
      return this.mode === 'optimize';
    },
  },

  watch: {
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
</style>
