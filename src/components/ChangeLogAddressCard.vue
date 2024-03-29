<template>
  <div class="change-log-address-card d-flex flex-column justify-content-between">
    <div class="d-flex justify-content-between">
      <div>
        <div v-if="!isSingleRecord">
          <b-link
            v-if="log.address.type === 'Phone'"
            :to="`/territories/${territoryId}/phone?
              origin=${$route.name}&addressId=${log.address.parent_id}${isFullScreen ? '&fullscreen=true' : ''}`"
          >
            <div>{{formatPhone(log.address.phone)}}</div>
          </b-link>
          <b-link
            v-else
            :to="`/territories/${territoryId}/addresses/${log.address.id}/edit?
              origin=${$route.name}${isFullScreen ? '&fullscreen=true' : ''}`"
          >
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
      <span>{{displayName(log.publisher)}}&nbsp;</span>
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
import { displayName } from '../utils/publisher';

export default {
  name: 'ChangeLogAddressCard',
  props: ['log', 'isSingleRecord'],
  components: {
    Change,
  },
  methods: {
    formatPhone,
    displayName,
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
    territoryId() {
      return get(this.log, 'address.territory.id');
    },
    isFullScreen() {
      return this.$route.query.fullscreen;
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
