<template>
  <div class="activity-history p-4" :key="checkoutId">
    <h3 class="w-100 mt-0">Activity History</h3>
    <h5 class="w-100" v-if="address.type==='Regular'">{{address.addr1}} {{address.addr2}} {{address.city}}</h5>
    <h5 class="w-100" v-if="address.type==='Phone'">{{formatPhone(address.phone)}}</h5>
    <Loading class="w-100" v-if="isLoading"></Loading>
    <div class="pt-3 w-100" v-else>
      <span class="blockquote" v-if="activityLogs.length === 0">
        No activity logs. This address is fresh!
      </span>
      <span v-else-if="useCheckoutId">
        Activity history for current checkout only.
      </span>
      <span v-else>
        Past <span v-if="isCheckedOut">and current </span>activity.
      </span>
      <div>
        <div class="pb-3" v-if="isCheckedOut">
          Click
          <b-button class="p-0" variant="link" @click="toggleCheckout">here</b-button>
          <span v-if="useCheckoutId"> to see the past year's history.</span>
          <span v-else> to see only the current checkout.</span>
        </div>
        <div class="group" v-for="(group, index) in groups" :key="index">
          <div class="group-head">
            <span class="fa-2x pr-2">
              <b-icon-plus @click="toggleGroup(index)" v-if="groupKeys[index].collapsed" />
              <b-icon-dash @click="toggleGroup(index)" v-else />
            </span>
            <ActivityButton
              class="fa-2x pr-2"
              :displayOnly="true"
              :value="group[0].value"
              :action-button-list="buttonList"
            />
            <span>{{index}} - set by {{getPublisherName(group[0].publisher_id)}}</span>
          </div>
          <div :id="index" class="group-detail pl-4" v-show="!groupKeys[index].collapsed">
            <div class="log pl-3 pb-1" v-for="log in group" :key="log.id">
              <ActivityButton
                class="fa-2x pl-3 pr-2"
                :displayOnly="true"
                :value="log.value"
                :action-button-list="buttonList"
              />
              <span>{{friendlyTime(log.timestamp)}} - set by {{getPublisherName(log.publisher_id)}}</span>
            </div>
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
import ActivityButton from './ActivityButton';
import { format as formatPhone } from '../utils/phone';

export default {
  name: 'ActivityHistory',
  props: ['territoryId', 'addressId', 'checkoutId'],
  components: {
    Loading,
    BIconPlus,
    BIconDash,
    ActivityButton,
  },
  data() {
    return {
      isLoading: true,
      groups: {},
      groupKeys: {},
      useCheckoutId: false,
      buttonList: this.addressButtonList,
    };
  },
  async mounted() {
    await this.fetchPublishers(this.congId);
    await this.fetch();
  },
  computed: {
    ...mapGetters({
      address: 'address/address',
      congId: 'auth/congId',
      publishers: 'publishers/publishers',
      phoneButtonList: 'phone/actionButtonList',
      addressButtonList: 'address/actionButtonList',
      isCheckedOut: 'territory/isCheckedOut',
    }),
    activityLogs() {
      return this.address && orderBy(this.address.activityLogs, (a) => {
        const timestamp = Number(a.timestamp);
        if (!Number.isNaN(timestamp)) {
          return new Date(timestamp);
        }
        return null;
      }, 'desc') || [];
    },
  },
  watch: {
    async congId() {
      await this.fetchPublishers(this.congId);
      this.fetch();
    },
  },
  methods: {
    ...mapActions({
      fetchAddress: 'address/fetchAddress',
      fetchPublishers: 'publishers/fetchPublishers',
    }),
    formatPhone,
    async fetch() {
      this.isLoading = true;
      if (this.useCheckoutId) {
        await this.fetchAddress({ addressId: this.addressId, checkoutId: this.checkoutId });
      } else {
        await this.fetchAddress({ addressId: this.addressId });
      }
      this.buttonList = this.getButtonList(this.address.type);
      this.groups = this.logsGroupedByDate();
      this.isLoading = false;
    },
    async toggleCheckout() {
      this.useCheckoutId = !this.useCheckoutId;
      await this.fetch();
    },
    getPublisherName(id) {
      const pub = this.publishers && this.publishers.find(p => p.id === id);
      return pub && `${pub.firstname} ${pub.lastname}`;
    },
    friendlyTime(ts) {
      const timestamp = Number(ts);
      if (!Number.isNaN(timestamp)) {
        return format(new Date(timestamp), 'hh:mm a');
      }
      return '';
    },
    friendlyDate(ts) {
      const timestamp = Number(ts);
      if (!Number.isNaN(timestamp)) {
        return format(new Date(timestamp), 'E P');
      }
      return '';
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
    getButtonList(type) {
      if (type === 'Regular') {
        return this.addressButtonList;
      }
      return this.phoneButtonList;
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
  .group-head {
    text-align: left;
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .group-detail {
    text-align: left;
    display: flex;
    flex-direction: column;
  }
  .log {
    display: flex;
    align-items: center;
  }
</style>
