<template>
  <div class="change-log-address-card d-flex flex-column justify-content-between">
    <div class="d-flex justify-content-between pb-3">
      <div>
        <div>{{log.address.addr1}} {{log.address.addr2}}</div>
        <div>{{log.address.city}} {{log.address.state_province}} {{log.address.postal_code}}</div>
      </div>
      <div class="text-right">
        <div>{{log.address.territory.name}}</div>
        <div class="formatted-date">{{formattedDate(log.date)}}</div>
      </div>
    </div>
    <div>
      <b-list-group>
        <b-list-group-item v-for="(change, key, index) in log.changes" :key="index">
          <span>{{changeDescription(change, key)}}</span>
          <b-button variant="link">Undo</b-button>
        </b-list-group-item>
      </b-list-group>
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import format from 'date-fns/format';

export default {
  name: 'ChangeLogAddressCard',
  props: ['log'],
  methods: {
    changeDescription(change, key) {
      return `Changed ${key} ${change.old ? `from ${this.value(change.old)}` : ''} to ${this.value(change.new)}`;
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
  },
};
</script>
<style scoped>
  .formatted-date {
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
