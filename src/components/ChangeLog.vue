<template>
  <div class="change-log" :class="{ 'text-left': isFullScreen }">
    <div
      class="d-flex justify-content-between align-items-center pb-0"
      :class="{ 'p-3': isFullScreen }">
      <span :class="{ small: !isFullScreen, lead: isFullScreen }">{{title}}</span>
      <!-- <b-dropdown v-if="isFullScreen" class="sort-btn" right variant="secondary">
        <span slot="button-content">
          <font-awesome-icon icon="sort-amount-down-alt" />
          {{sortOption}}
        </span>
        <b-dropdown-item v-for='option in sortOptions' :key="option" @click="() => sort(option)">
          <font-awesome-icon class="selected" icon="check" v-if="sortOption === option" /> {{option}}
        </b-dropdown-item>
      </b-dropdown> -->
    </div>
    <font-awesome-icon v-if="loading" class="loading text-info text-center w-100 mt-5" icon="circle-notch" :spin="true" />
    <b-list-group v-else>
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
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import { mapCacheActions } from 'vuex-cache';
import { SwipeList, SwipeOut } from 'vue-swipe-actions';
import ChangeLogAddressCard from './ChangeLogAddressCard';

export default {
  name: 'ChangeLog',
  props: ['type'],
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
    };
  },
  async mounted() {
    this.loading = true;
    this.setLeftNavRoute('/');
    this.refresh();
  },
  methods: {
    ...mapCacheActions({
      getChangeLog: 'addresses/getChangeLog',
    }),
    ...mapActions({
      setLeftNavRoute: 'auth/setLeftNavRoute',
    }),
    async refresh() {
      this.$set(this, 'loading', true);
      this.$store.cache.delete('addresses/getChangeLog');
      await this.getChangeLog({ congId: this.congId });
      this.loading = false;
    },
    setLastEvent(name, { item, index }) {
      this.lastEventDescription = {
        name,
        index,
        id: item.id,
      };
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
      return this.isFullScreen ? this.storeLogs : this.preview;
    },
    isFullScreen() {
      return this.$route.query.fullscreen;
    },
    sortOptions() {
      return ['Date', 'Address', 'Territory'];
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
