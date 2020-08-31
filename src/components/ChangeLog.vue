<template>
  <div class="change-log" :class="{ 'text-left': isFullScreen }">
    <div class="d-flex justify-content-between align-items-center p-3">
      <span :class="{ small: !isFullScreen, lead: isFullScreen }">{{title}}</span>
      <!-- <font-awesome-icon
        v-if="isFullScreen"
        class="text-info"
        icon="circle-notch"
        :spin="loading"
        @click="refresh">
      </font-awesome-icon> -->
      <b-dropdown class="sort-btn" right variant="secondary">
        <span slot="button-content">
          <font-awesome-icon icon="sort-amount-down-alt" />
          {{sortOption}}
        </span>
        <b-dropdown-item v-for='option in sortOptions' :key="option" @click="() => sort(option)">
          <font-awesome-icon class="selected" icon="check" v-if="sortOption === option" /> {{option}}
        </b-dropdown-item>
      </b-dropdown>
    </div>
    <font-awesome-icon v-if="loading" class="loading text-info text-center w-100 mt-5" icon="circle-notch" :spin="true" />
    <b-list-group v-else>
      <b-list-group-item class="pl-3 pr-3" v-for="log in logs" :key="log.id">
        <ChangeLogAddressCard :log="log" />
      </b-list-group-item>
      <b-link
        v-if="!isFullScreen"
        class="btn-sm align-self-end"
        :to="{ path: `/reports/logs/${type}`, query: { fullscreen: true }}">
        more
      </b-link>
    </b-list-group>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import { mapCacheActions } from 'vuex-cache';
import ChangeLogAddressCard from './ChangeLogAddressCard';

export default {
  name: 'ChangeLog',
  props: ['type'],
  components: {
    ChangeLogAddressCard,
  },
  data() {
    return {
      interval: 'week',
      loading: false,
      sortOption: 'Address',
    };
  },
  async mounted() {
    this.loading = true;
    this.refresh();
  },
  methods: {
    ...mapCacheActions({
      getChangeLog: 'addresses/getChangeLog',
    }),
    async refresh() {
      this.$set(this, 'loading', true);
      this.$store.cache.delete('addresses/getChangeLog');
      await this.getChangeLog({ congId: this.congId });
      this.loading = false;
    },
  },
  computed: {
    ...mapGetters({
      congId: 'auth/congId',
      user: 'auth/user',
      storeLogs: 'addresses/logs',
    }),
    title() {
      return 'Recent updates:';
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
      return ['Address', 'Territory'];
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
