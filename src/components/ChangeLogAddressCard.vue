<template>
  <div class="change-log-address-card d-flex flex-column justify-content-between">
    <div class="d-flex justify-content-between pb-3">
      <div>
        <b-link :to="`/territories/${group}/${territoryId}/addresses/${log.address.id}/edit?origin=change-logs`">
          <div>{{log.address.addr1}} {{log.address.addr2}}</div>
          <div>{{log.address.city}} {{log.address.state_province}} {{log.address.postal_code}}</div>
        </b-link>
      </div>
      <div class="text-right">
        <div>{{log.address.territory.name}}</div>
        <div class="formatted-date">{{formattedDate(log.date)}}</div>
      </div>
    </div>
    <div>
      <b-list-group>
        <b-list-group-item
          class="p-2 d-flex flex-column justify-content-between align-items-start"
          v-for="(change, key, index) in log.changes"
          :key="index">
          <Change :change="change" :field="key" />
        </b-list-group-item>
      </b-list-group>
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import get from 'lodash/get';
import format from 'date-fns/format';
import Change from './Change';

export default {
  name: 'ChangeLogAddressCard',
  props: ['log'],
  components: {
    Change,
  },
  methods: {
    changeDescription(change, key) {
      return `Changed ${key} ${change.old
        ? `from <b-badge>${this.value(change.old)}</b-badge>`
        : ''} to ${this.value(change.new)}`;
    },
    value(val) {
      return val === undefined || val === null ? 'nothing' : val;
    },
    formattedDate(ts) {
      const timestamp = Number(ts);
      if (!Number.isNaN(timestamp)) {
        return format(new Date(timestamp), 'MM/dd/yy p');
      }
      return '';
    },
  },
  computed: {
    ...mapGetters({
      congId: 'auth/congId',
    }),
    group() {
      return get(this.log, 'address.territory.group_code');
    },
    territoryId() {
      return get(this.log, 'address.territory.id');
    },
  },
};
</script>
<style scoped>
  .formatted-date {
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
