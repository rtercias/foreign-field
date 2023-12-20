<template>
  <div class="address-links">
    <b-list-group class="d-flex flex-row">
      <b-list-group-item
        class="w-25 p-2"
        :href="mapsUrl"
        variant="primary"
        target="_blank"
      >
        <font-awesome-icon class="button" icon="car"></font-awesome-icon>
        <div class="pt-2" v-if="$route.name === 'address-detail'">Google Maps</div>
      </b-list-group-item>
      <b-list-group-item
        class="w-25 p-2"
        variant="warning"
        :href="lookupFastPeopleSearch"
        target="_blank"
      >
        <font-awesome-layers
          class="fa-fw fa-stack mx-2">
          <font-awesome-icon icon="user" class="fa-2x"></font-awesome-icon>
          <font-awesome-icon icon="search" class="mr-0 mt-0"></font-awesome-icon>
          <font-awesome-icon icon="search" class="mr-0 mt-0 search-shadow text-success"></font-awesome-icon>
        </font-awesome-layers>
        <div class="pt-2" v-if="$route.name === 'address-detail'">People Search</div>
      </b-list-group-item>
      <b-list-group-item
        class="w-25 p-2"
        v-if="canWrite"
        variant="success"
        :to="{
          name: 'address-edit',
          params: { territoryId, addressId, mode: 'edit' },
          query: { origin: $route.name }
        }"
      >
        <font-awesome-icon class="button" icon="edit"></font-awesome-icon>
        <div class="pt-2" v-if="$route.name === 'address-detail'">Edit Address</div>
      </b-list-group-item>
      <b-list-group-item
        class="w-25 p-2"
        variant="dark"
        :to="{
          name: 'activity-history',
          params: { territoryId, addressId, checkoutId },
          query: { origin: $route.name }
        }"
      >
        <font-awesome-icon class="button" icon="history"></font-awesome-icon>
        <div class="pt-2" v-if="$route.name === 'address-detail'">Activity History</div>
      </b-list-group-item>
      <b-list-group-item
        class="w-25 p-2"
        v-if="canWrite"
        variant="danger"
        :to="{
          name: 'change-logs',
          params: { territoryId, addressId },
          query: { origin: $route.name }
        }"
      >
        <font-awesome-icon class="button" icon="archive"></font-awesome-icon>
        <div class="pt-2" v-if="$route.name === 'address-detail'">Change Log</div>
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
  props: ['addressId', 'territoryId', 'checkoutId'],
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
