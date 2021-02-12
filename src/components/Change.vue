<template>
  <div class="w-100 d-flex justify-content-between">
    <div v-if="field === 'notes'">
      <div v-if="!!newItems.length">
        <span>added</span>&nbsp;
        <b-badge v-for="(tag, index) in newItems" :key="index">{{tag}}</b-badge>&nbsp;
        <span>tag</span>
      </div>
      <div v-if="!!oldItems.length">
        <span>removed</span>&nbsp;
        <b-badge v-for="(tag, index) in oldItems" :key="index">{{tag}}</b-badge>&nbsp;
        <span>tag</span>
      </div>
    </div>
    <div v-else-if="field === 'status' && change.new === 'Inactive'">removed this entry</div>
    <div v-else>
      <div v-if="!change.new">
        <span>removed</span>&nbsp;
        <span v-if="!!change.old"><b-badge>{{oldValue}}</b-badge></span>&nbsp;
        <span>from {{field}}</span>&nbsp;
      </div>
      <div v-else>
        <span>changed</span>&nbsp;
        <span>{{field}}</span>&nbsp;
        <span v-if="!!change.old">from <b-badge>{{oldValue}}</b-badge></span>&nbsp;
        <span>to <b-badge>{{newValue}}</b-badge></span>
      </div>
    </div>
    <!-- <div class="buttons">
      <font-awesome-icon icon="check" class="btn lead m-1 bg-success text-white" />
      <font-awesome-icon icon="times" class="btn lead m-1 bg-danger text-white" />
    </div> -->
  </div>
</template>
<script>
import { mapActions, mapGetters } from 'vuex';
import get from 'lodash/get';
import difference from 'lodash/difference';
import { formatLanguage } from '../utils/tags';

export default {
  name: 'Change',
  props: ['change', 'field'],
  computed: {
    ...mapGetters({
      congregation: 'congregation/congregation',
    }),
    oldValue() {
      const val = formatLanguage(this.change.old, this.language);
      return val === undefined || val === null ? 'nothing' : val;
    },
    newValue() {
      const val = formatLanguage(this.change.new, this.language);
      return val === undefined || val === null ? 'nothing' : val;
    },
    language() {
      return (get(this.congregation, 'language') || 'Tagalog');
    },
    newItems() {
      const newValues = this.change.new.length ? this.change.new.split(',') : [];
      const oldValues = this.change.old.length ? this.change.old.split(',') : [];
      return difference(newValues, oldValues) || [];
    },
    oldItems() {
      const newValues = this.change.new.length ? this.change.new.split(',') : [];
      const oldValues = this.change.old.length ? this.change.old.split(',') : [];
      return difference(oldValues, newValues) || [];
    },
  },
  methods: {
    ...mapActions({
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
