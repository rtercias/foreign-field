<template>
  <div class="change-log-address-card d-flex flex-column justify-content-between">
    <div class="d-flex justify-content-between pb-3">
      <div>
        <div v-if="!isSingleRecord">
          <b-link
            v-if="log.address.type === 'Phone'"
            :to="`/territories/${territoryId}/addresses/${log.address.parent_id}/detail?origin=${$route.name}`">
            <div>{{formatPhone(log.address.phone)}}</div>
          </b-link>
          <b-link
            v-else
            :to="`/territories/${territoryId}/addresses/${log.address.id}/detail?origin=${$route.name}`">
            <div>{{log.address.addr1}} {{log.address.addr2}}</div>
            <div>{{log.address.city}} {{log.address.state_province}} {{log.address.postal_code}}</div>
          </b-link>
        </div>
        <div v-else>
          <div v-if="log.address.type === 'Phone'">
            <div>{{formatPhone(log.address.phone)}}</div>
          </div>
          <div v-else>
            <div>{{log.address.addr1}} {{log.address.addr2}}</div>
            <div>{{log.address.city}} {{log.address.state_province}} {{log.address.postal_code}}</div>
          </div>
        </div>
      </div>
      <div class="text-right">
        <div>{{log.address.territory.name}}</div>
        <div class="formatted-date">{{formattedDate(log.date)}}</div>
      </div>
    </div>
    <div>
      <span>{{log.publisher.firstname}} {{log.publisher.lastname}}&nbsp;</span>
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
import Change from './Change';
import format from 'date-fns/format';
import { format as formatPhone } from '../utils/phone';

export default {
  name: 'ChangeLogAddressCard',
  props: ['log', 'isSingleRecord'],
  components: {
    Change,
  },
  methods: {
    formatPhone,
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
