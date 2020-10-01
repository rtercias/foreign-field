<template>
  <div class="w-100 d-flex justify-content-between">
    <div>
      <span>changed</span>&nbsp;
      <span>{{field}}</span>&nbsp;
      <span v-if="!!change.old">from <b-badge>{{oldValue}}</b-badge></span>&nbsp;
      <span>to <b-badge>{{newValue}}</b-badge></span>
    </div>
    <!-- <div class="buttons">
      <font-awesome-icon icon="check" class="btn lead m-1 bg-success text-white" />
      <font-awesome-icon icon="times" class="btn lead m-1 bg-danger text-white" />
    </div> -->
  </div>
</template>
<script>
import { mapActions } from 'vuex';

export default {
  name: 'Change',
  props: ['change', 'field'],
  computed: {
    oldValue() {
      const val = this.change.old;
      return val === undefined || val === null ? 'nothing' : val;
    },
    newValue() {
      const val = this.change.new;
      return val === undefined || val === null ? 'nothing' : val;
    },
  },
  methods: {
    ...mapActions({
      fetchAddress: 'address/fetchAddress',
      updateAddress: 'address/updateAddress',
    }),
  },
};
</script>
<style lang="scss" scoped>
  .buttons {
    white-space: nowrap;

    .btn {
      width: 35px;
      height: 35px;
    }
  }
  .badge {
    white-space: normal;
  }
</style>
