<template>
  <div class="w-100 d-flex justify-content-between">
    <div v-if="field === 'added'"><span>added this entry</span></div>
    <div v-else-if="field === 'removed'"><span>removed this entry</span></div>
    <div v-else-if="field === 'notes'">
      <div v-if="!!newItems.length">
        <span>added</span>&nbsp;
        <b-badge v-for="(tag, index) in newItems" :key="index">{{formattedValue(tag)}}</b-badge>&nbsp;
        <span>tag</span>
      </div>
      <div v-if="!!oldItems.length">
        <span>removed</span>&nbsp;
        <b-badge v-for="(tag, index) in oldItems" :key="index">{{formattedValue(tag)}}</b-badge>&nbsp;
        <span>tag</span>
      </div>
    </div>
    <div v-else-if="field === 'status' && change.new === 'Inactive'">removed this entry</div>
    <div v-else>
      <div v-if="!change.new">
        <span>removed</span>&nbsp;
        <span v-if="!!change.old"><b-badge>{{oldValue}}</b-badge></span>&nbsp;
        <span>from {{field}}</span>
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
      return this.formattedValue(this.change.old);
    },
    newValue() {
      return this.formattedValue(this.change.new);
    },
    language() {
      return get(this.congregation, 'language') || 'Tagalog';
    },
    newItems() {
      const newValues = get(this.change, 'new.length') ? this.change.new.split(',') : [];
      const oldValues = get(this.change, 'old.length') ? this.change.old.split(',') : [];
      return difference(newValues, oldValues) || [];
    },
    oldItems() {
      const newValues = get(this.change, 'new.length') ? this.change.new.split(',') : [];
      const oldValues = get(this.change, 'old.length') ? this.change.old.split(',') : [];
      return difference(oldValues, newValues) || [];
    },
  },
  methods: {
    ...mapActions({
      updateAddress: 'address/updateAddress',
    }),
    formattedValue(value) {
      const val = formatLanguage(value, this.language);
      return val === undefined || val === null ? 'nothing' : val;
    },
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
