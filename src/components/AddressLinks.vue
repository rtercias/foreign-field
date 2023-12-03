<template>
  <div class="address-links">
    <b-list-group class="d-flex flex-row">
      <b-list-group-item
        class="w-25"
        :href="mapsUrl"
        variant="primary"
        target="_blank"
      >
        <font-awesome-icon class="button" icon="directions"></font-awesome-icon>&nbsp;
        Google Maps
      </b-list-group-item>
      <b-list-group-item
        class="w-25"
        variant="warning"
        :href="lookupFastPeopleSearch"
        target="_blank"
      >
        <font-awesome-icon class="button" icon="phone-alt"></font-awesome-icon>&nbsp;
        Fast People Search
      </b-list-group-item>
      <b-list-group-item
        class="w-25"
        variant="dark"
        :to="`/territories/${territoryId}/addresses/${get(address, 'id')}/history`"
      >
        <font-awesome-icon icon="history"></font-awesome-icon>&nbsp;
        Activity History
      </b-list-group-item>
      <b-list-group-item
        class="w-25"
        v-if="canWrite"
        variant="danger"
        :to="`/territories/${territoryId}/addresses/${get(address, 'id')}/logs?fullscreen=true`"
      >
        <font-awesome-icon icon="archive"></font-awesome-icon>&nbsp;
        Change Log
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import Loading from './Loading';

export default {
  name: 'AddressLinks',
  props: ['addressId', 'territoryId'],
  components: {
    Loading,
  },
  data() {
    return {
      isLoading: false,
    };
  },
  async mounted() {
    this.isLoading = true;
  },
  computed: {
    ...mapGetters({
      address: 'address/address',
      token: 'auth/token',
      canWrite: 'auth/canWrite',
      user: 'auth/user',
    }),
    mapsUrl() {
      const addr1 = get(this.address, 'addr1') || '';
      const city = get(this.address, 'city') || '';
      const state = get(this.address, 'state_province') || '';
      return `https://www.google.com/maps/dir/?api=1&destination=${addr1} ${city} ${state}`;
    },
    lookup411() {
      const addr1 = `${(get(this.address, 'addr1') || '').trim().replace(/\s+/g, '-')}`;
      const city = `${(get(this.address, 'city') || '').trim().replace(/\s+/g, '-')}`;
      const state = `${(get(this.address, 'state_province') || '').trim().replace(/\s+/g, '-')}`;
      return `https://www.411.com/address/${addr1}/${city}-${state}`;
    },
    lookupFastPeopleSearch() {
      const addr1 = `${(get(this.address, 'addr1') || '').trim().replace(/\s+/g, '-')}`;
      const city = `${(get(this.address, 'city') || '').trim().replace(/\s+/g, '-')}`;
      const state = `${(get(this.address, 'state_province') || '').trim().replace(/\s+/g, '-')}`;
      return `https://www.fastpeoplesearch.com/address/${addr1}_${city}-${state}`;
    },
    returnRoute() {
      const { origin = '' } = this.$route.query;
      if (origin === 'change-logs') {
        return '/reports/logs/addresses?fullscreen=true';
      }

      if (origin === 'home') {
        return '/';
      }

      return `/territories/${this.territoryId}/${origin}`;
    },
    queryParamOrigin() {
      const { origin = '' } = this.$route.query;
      return origin ? `?origin=${origin}` : '';
    },
    congregationIdStatus() {
      return get(this.user, 'congregation.id') && get(this.address, 'congregationId');
    },
  },
  methods: {
    ...mapActions({
      fetchAddress: 'address/fetchAddress',
      back: 'auth/back',
    }),
    get,
    goBack() {
      this.back({ vm: this });
    },
  },
  watch: {
    congregationIdStatus(isLoaded) {
      if (isLoaded && this.user && get(this.user, 'congregation.id') !== get(this.address, 'congregationId')) {
        this.$router.replace('/unauthorized');
      } else {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
  .address-links {
    font-size: 12px;
  }
</style>
