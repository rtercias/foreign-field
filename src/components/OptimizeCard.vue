<template>
  <div class="optimize-card row justify-content-between align-items-center pr-2 text-black-50">
    <div class="address col-10">
      <div>
        <h5 class="mb-0">
          {{address.addr1}}
        </h5>
        {{address.addr2}}
        <div class="mb-2">
          {{address.city}} {{address.state_province}} {{address.postal_code}}
        </div>
      </div>
    </div>
    <div class="col-2" v-show="isManual">
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
