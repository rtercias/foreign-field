<template>
  <div class="activity-history p-4">
    <h3 class="w-100">Activity History</h3>
    <h5 class="w-100">{{address.addr1}} {{address.addr2}} {{address.city}}</h5>
    <Loading v-if="isLoading"></Loading>
    <div class="pt-3" v-else>
      <span class="blockquote" v-if="activityLogs.length === 0">
        No activity logs. This address is fresh!
      </span>
      <div class="group" v-for="(group, index) in groups" :key="index" v-else>
        <span>
          <b-icon-plus @click="toggleGroup(index)" v-if="groupKeys[index].collapsed" />
          <b-icon-dash @click="toggleGroup(index)" v-else />
        </span>
        {{index}} - {{group[0].value}} - {{getPublisherName(group[0].publisher_id)}}
        <div :id="index" class="pl-4" v-show="!groupKeys[index].collapsed">
          <div v-for="log in group" :key="log.id">
            {{friendlyTime(log.timestamp)}} - {{log.value}} - {{getPublisherName(log.publisher_id)}}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { BIconPlus, BIconDash } from 'bootstrap-vue';
import format from 'date-fns/format';
import orderBy from 'lodash/orderBy';
import groupBy from 'lodash/groupBy';
import forEach from 'lodash/forEach';
import Loading from './Loading.vue';

export default {
  name: 'ActivityHistory',
  props: ['group', 'id', 'addressId'],
  components: {
    Loading,
    BIconPlus,
    BIconDash,
  },
  data() {
    return {
      isLoading: true,
      groups: {},
      groupKeys: {},
    };
  },
  mounted() {
    this.fetch();
  },
  computed: {
    ...mapGetters({
      address: 'address/address',
      congId: 'auth/congId',
      publishers: 'publishers/publishers',
    }),
    activityLogs() {
      return this.address && orderBy(this.address.activityLogs, a => (new Date(a.timestamp)), 'desc') || [];
    },
  },
  watch: {
    congId() {
      this.fetch();
    },
    address() {
      this.isLoading = false;
    },
  },
  methods: {
    ...mapActions({
      fetchAddress: 'address/fetchAddress',
      fetchPublishers: 'publishers/fetchPublishers',
    }),
    async fetch() {
      await this.fetchPublishers(this.congId);
      await this.fetchAddress(this.addressId);
      this.groups = this.logsGroupedByDate();
    },
    getPublisherName(id) {
      const pub = this.publishers && this.publishers.find(p => p.id === id);
      return pub && `${pub.firstname} ${pub.lastname}`;
    },
    friendlyTime(timestamp) {
      return format(new Date(timestamp), 'hh:mm a');
    },
    friendlyDate(timestamp) {
      return new Date(timestamp).toLocaleDateString();
    },
    logsGroupedByDate() {
      const group = groupBy(this.activityLogs, log => this.friendlyDate(log.timestamp));
      const filteredGroup = forEach(group, (date, index) => {
        this.$set(this.groupKeys, index, { collapsed: true });
        date.filter((log, logIndex) => logIndex !== 0 && log.value !== 'START');
      });
      return filteredGroup;
    },
    toggleGroup(index) {
      this.$set(this.groupKeys, index, { collapsed: !this.groupKeys[index].collapsed });
    },
  },
};
</script>

<style>
  .activity-history {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .group, .log {
    text-align: left;
  }
</style>
