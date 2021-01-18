<template>
  <div class="change-log" :class="{ 'text-left': isFullScreen }">
    <div
      class="d-flex justify-content-between pb-0 text-center"
      :class="{ 'py-3 px-2': isFullScreen }">
      <div :class="{ small: !isFullScreen, lead: isFullScreen,  'text-left': !isDesktop }">{{subtitle}}</div>
      <div
        v-if="isSingleRecord"
        :class="{
          small: !isFullScreen,
          lead: isFullScreen,
          'font-weight-bold': isFullScreen,
        }">
        <div>{{title1}}</div>
        <div>{{title2}}</div>
      </div>
      <div :class="{ 'text-right': !isDesktop }">
        <b-dropdown
          v-if="showFilters"
          class="status-filter"
          :class="{ 'pr-3': isDesktop, 'pb-3': !isDesktop }"
          right
          variant="primary">
          <span slot="button-content">Status: {{formatLanguage(selectedStatus.text, language)}}</span>
          <b-dropdown-item
            v-for='(status, index) in addressStatus'
            :key="index"
            class="w-100 mx-0"
            @click="() => selectStatus(status)">
            {{formatLanguage(status.text, language)}}
          </b-dropdown-item>
        </b-dropdown>
        <b-dropdown v-if="showFilters" class="date-filter" right variant="secondary">
          <span slot="button-content">Range: {{selectedRange.text}}</span>
          <b-dropdown-item
            v-for='(range, index) in dateRanges'
            :key="index"
            class="w-100 mx-0"
            @click="() => selectRange(range)">
            {{range.text}}
          </b-dropdown-item>
        </b-dropdown>
      </div>
    </div>
    <b-form-checkbox v-model="excludeTests" v-if="isFullScreen && canManage" class="pr-3 text-right">
      exclude tests
    </b-form-checkbox>
    <Loading v-if="loading && isFullScreen"></Loading>
    <font-awesome-icon v-else-if="loading" class="loading text-info text-center w-100" icon="circle-notch" :spin="true" />
    <div v-else>
      <SearchBar
        v-if="isFullScreen"
        :search-text="'Filter by address, phone, or publisher'"
        :results="logs"
        @on-change="filter">
      </SearchBar>
      <b-list-group>
        <b-list-group-item class="px-3" :class="{ small: !isFullScreen }" v-for="log in logs" :key="log.id">
          <ChangeLogAddressCard :log="log" :is-single-record="isSingleRecord" />
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
import get from 'lodash/get';
import toLower from 'lodash/toLower';
import ChangeLogAddressCard from './ChangeLogAddressCard';
import Loading from './Loading';
import SearchBar from './SearchBar';
import addDays from 'date-fns/addDays';
import addWeeks from 'date-fns/addWeeks';
import addMonths from 'date-fns/addMonths';
import startOfDay from 'date-fns/startOfDay';
import format from 'date-fns/format';
import { unmask } from '../utils/phone';
import { ADDRESS_STATUS } from '../store/modules/models/AddressModel';
import { formatLanguage } from '../utils/tags';

const ALL = { value: '', text: 'All' };

export default {
  name: 'ChangeLog',
  props: ['territoryId', 'type', 'recordId', 'publisherId'],
  components: {
    ChangeLogAddressCard,
    Loading,
    SearchBar,
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
      selectedStatus: ALL,
      addressStatus: { All: ALL, ...ADDRESS_STATUS },
      excludeTests: true,
    };
  },
  async mounted() {
    this.loading = true;
    this.refresh();
  },
  methods: {
    ...mapActions({
      getChangeLog: 'addresses/getChangeLog',
      fetchAddress: 'address/fetchAddress',
    }),
    formatLanguage,
    async refresh() {
      this.$set(this, 'loading', true);
      await this.getChangeLog({
        congId: this.congId,
        minDate: this.selectedRange.startDate,
        recordId: this.recordId,
        publisherId: this.publisherId,
      });

      if (this.isFullScreen && this.logs && this.logs.length
        && this.logs[0].address && this.logs[0].address.type === 'Phone') {
        await this.fetchAddress({ addressId: this.logs[0].address.parent_id });
      }

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
    async selectStatus(status) {
      if (!status || status.value === '') {
        this.selectedStatus = ALL;
      } else {
        this.selectedStatus = status;
      }
    },
    compareToKeyword(values) {
      return values.reduce(
        (acc, value) => acc || toLower(value).includes(toLower(this.keywordFilter)),
        false,
      );
    },
    filter(value) {
      this.keywordFilter = value;
    },
  },
  computed: {
    ...mapGetters({
      congId: 'auth/congId',
      congregation: 'congregation/congregation',
      user: 'auth/user',
      storeLogs: 'addresses/logs',
      address: 'address/address',
      canManage: 'auth/canManage',
      isDesktop: 'auth/isDesktop',
    }),
    title1() {
      const record = this.logs && this.logs.length && this.logs[0].address;
      const address = record.type === 'Phone' ? this.address : record;
      return this.isSingleRecord && address ? `${address.addr1} ${address.addr2}` : '';
    },
    title2() {
      const record = this.logs && this.logs.length && this.logs[0].address;
      const address = record.type === 'Phone' ? this.address : record;
      return this.isSingleRecord && address ? `${address.city}, ${address.state_province}` : '';
    },
    subtitle() {
      return 'Recent Updates';
    },
    cleanLogs() {
      if (this.isSingleRecord) {
        return this.storeLogs;
      }

      if (!this.excludeTests) return this.storeLogs;

      return this.storeLogs.filter((log) => {
        const { name } = get(log, 'address.territory') || {};
        return name && !name.includes('TEST');
      });
    },
    preview() {
      return this.cleanLogs.slice(0, 3);
    },
    logs() {
      if (this.keywordFilter || this.selectedStatus.value) {
        return this.cleanLogs
          .filter(log => get(log.changes, 'status.new') === this.selectedStatus.value)
          .filter(log => this.compareToKeyword([
            log.address.addr1,
            log.address.addr2,
            log.address.city,
            log.address.postal_code,
            log.publisher.firstname,
            log.publisher.lastname,
            log.address.territory.name,
            unmask(log.address.phone),
          ]));
      }

      return this.isFullScreen ? this.cleanLogs : this.preview;
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
    showFilters() {
      return this.isFullScreen;
    },
    returnRoute() {
      if (this.recordId && this.type === 'addresses') {
        return `/territories/${this.territoryId}/addresses/${this.recordId}/detail`;
      }

      return '/';
    },
    isSingleRecord() {
      return !!this.recordId || !!this.publisherId;
    },
    language() {
      return (get(this.congregation, 'language') || 'Tagalog');
    },
  },
  watch: {
    user() {
      this.refresh();
    },
  },
};
</script>
<style scoped lang="scss">
  .loading {
    font-size: 40px;
  }
</style>
