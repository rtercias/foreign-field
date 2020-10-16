<template>
  <div class="change-log" :class="{ 'text-left': isFullScreen }">
    <div
      class="d-flex justify-content-between align-items-center pb-0"
      :class="{ 'p-3': isFullScreen }">
      <span :class="{ small: !isFullScreen, lead: isFullScreen }">{{title}}</span>
      <b-dropdown v-if="showDateFilter" class="date-filter" right variant="secondary">
        <span slot="button-content">Range: {{selectedRange.text}}</span>
        <b-dropdown-item v-for='(range, index) in dateRanges' :key="index" @click="() => selectRange(range)">
          {{range.text}}
        </b-dropdown-item>
      </b-dropdown>
    </div>
    <font-awesome-icon v-if="loading" class="loading text-info text-center w-100 mt-5" icon="circle-notch" :spin="true" />
    <div v-else>
      <div class="mx-3 mb-3">
        <b-form-input v-model="keywordFilter" placeholder="Filter" />
        <span class="d-block small pt-1 text-right">Count: {{logs.length}}</span>
      </div>
      <b-list-group>
        <b-list-group-item class="pl-3 pr-3" :class="{ small: !isFullScreen }" v-for="log in logs" :key="log.id">
          <ChangeLogAddressCard :log="log" />
        </b-list-group-item>
        <b-link
          v-if="!isFullScreen"
          class="btn-sm align-self-end text-right"
          :to="{ path: `/reports/logs/${type}`, query: { fullscreen: true }}">
          more
        </b-link>
      </b-list-group>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import { SwipeList, SwipeOut } from 'vue-swipe-actions';
import ChangeLogAddressCard from './ChangeLogAddressCard';
import addDays from 'date-fns/addDays';
import addWeeks from 'date-fns/addWeeks';
import addMonths from 'date-fns/addMonths';
import startOfDay from 'date-fns/startOfDay';
import format from 'date-fns/format';

export default {
  name: 'ChangeLog',
  props: ['group', 'territoryId', 'type', 'recordId', 'publisherId'],
  components: {
    ChangeLogAddressCard,
    SwipeOut,
    SwipeList,
  },
  data() {
    return {
      interval: 'week',
      loading: false,
      sortOption: 'Date',
      lastEventDescription: '',
      keywordFilter: '',
      selectedRange: {
        text: 'One Day',
        startDate: format(addDays(this.startOfCurrentDay(), -1), 'yyyy-MM-dd pp'),
      },
    };
  },
  async mounted() {
    this.loading = true;
    this.setLeftNavRoute(this.returnRoute);
    this.refresh();
  },
  methods: {
    ...mapActions({
      getChangeLog: 'addresses/getChangeLog',
      setLeftNavRoute: 'auth/setLeftNavRoute',
    }),
    async refresh() {
      this.$set(this, 'loading', true);
      await this.getChangeLog({
        congId: this.congId,
        minDate: this.selectedRange.startDate,
        recordId: this.recordId,
        publisherId: this.publisherId,
      });
      this.loading = false;
    },
    setLastEvent(name, { item, index }) {
      this.lastEventDescription = {
        name,
        index,
        id: item.id,
      };
    },
    startOfCurrentDay() {
      return startOfDay(new Date());
    },
    async selectRange(range) {
      this.selectedRange = range;
      await this.refresh();
    },
    compareToKeyword(text) {
      return String(text).toLowerCase().includes(this.keywordFilter.toLowerCase());
    },
  },
  computed: {
    ...mapGetters({
      congId: 'auth/congId',
      user: 'auth/user',
      storeLogs: 'addresses/logs',
    }),
    title() {
      return 'Recent Updates:';
    },
    preview() {
      return this.storeLogs.slice(0, 3);
    },
    logs() {
      if (this.keywordFilter) {
        return this.storeLogs.filter(log => this.compareToKeyword(log.address.addr1)
          || this.compareToKeyword(log.address.addr2)
          || this.compareToKeyword(log.publisher.firstname)
          || this.compareToKeyword(log.publisher.lastname));
      }

      return this.isFullScreen ? this.storeLogs : this.preview;
    },
    isFullScreen() {
      return this.$route.query.fullscreen;
    },
    sortOptions() {
      return ['Date', 'Address', 'Territory'];
    },
    dateRanges() {
      return [
        { text: 'One Day', startDate: format(addDays(this.startOfCurrentDay(), -1), 'yyyy-MM-dd pp') },
        { text: 'One Week', startDate: format(addWeeks(this.startOfCurrentDay(), -1), 'yyyy-MM-dd pp') },
        { text: 'Two Weeks', startDate: format(addWeeks(this.startOfCurrentDay(), -2), 'yyyy-MM-dd pp') },
        { text: 'One Month', startDate: format(addMonths(this.startOfCurrentDay(), -1), 'yyyy-MM-dd pp') },
        { text: 'Three Months', startDate: format(addMonths(this.startOfCurrentDay(), -3), 'yyyy-MM-dd pp') },
      ];
    },
    showDateFilter() {
      return this.isFullScreen && !this.recordId && !this.publisherId;
    },
    returnRoute() {
      if (this.recordId && this.type === 'addresses') {
        return `/territories/${this.group}/${this.territoryId}/addresses/${this.recordId}/detail`;
      }

      return '/';
    },
  },
  watch: {
    user() {
      this.refresh();
    },
  },
};
</script>
<style scoped>
  .loading {
    font-size: 40px;
  }
</style>
