<template>
  <div class="address-links">
    <Loading v-if="isLoading"></Loading>
    <div v-else>
      <div class="address-header justify-content-around align-items-center py-3">
        <div class="lead font-weight-bold w-100 pl-5">
          <div>{{get(address, 'addr1')}} {{get(address, 'addr2')}}</div>
          <div>{{get(address, 'city')}} {{get(address, 'state_province')}} {{get(address, 'postal_code')}}</div>
        </div>
        <div class="pr-4">
          <b-link
            v-if="canWrite"
            :to="`/territories/${territoryId}/addresses/${get(address, 'id')}/edit${queryParamOrigin}`">
            <font-awesome-icon class="button" icon="edit"></font-awesome-icon>
          </b-link>
        </div>
      </div>
      <div class="lead border-top py-2">Link to...</div>
      <b-list-group>
        <b-list-group-item class="lead p-4 font-weight-bold w-auto" :href="mapsUrl" variant="primary" target="_blank">
          <font-awesome-icon class="button" icon="directions"></font-awesome-icon>&nbsp;
          Google Maps
        </b-list-group-item>
        <b-list-group-item
          class="lead p-4 font-weight-bold w-auto"
          variant="warning"
          :href="lookupFastPeopleSearch"
          target="_blank">
          <font-awesome-icon class="button" icon="phone-alt"></font-awesome-icon>&nbsp;
          Fast People Search
        </b-list-group-item>
        <b-list-group-item
          class="lead p-4 font-weight-bold w-auto"
          :href="lookup411"
          variant="success"
          target="_blank">
          <font-awesome-icon class="button" icon="phone-alt"></font-awesome-icon>&nbsp;
          411.com
        </b-list-group-item>
        <b-list-group-item class="lead p-4 font-weight-bold w-auto" variant="dark"
          :to="`/territories/${territoryId}/addresses/${get(address, 'id')}/history`">
          <font-awesome-icon icon="history"></font-awesome-icon>&nbsp;
          Activity History
        </b-list-group-item>
        <b-list-group-item v-if="canWrite" class="lead p-4 font-weight-bold w-auto" variant="danger"
          :to="`/territories/${territoryId}/addresses/${get(address, 'id')}/logs?fullscreen=true`">
          <font-awesome-icon icon="archive"></font-awesome-icon>&nbsp;
          Address Change Log
        </b-list-group-item>
        <b-list-group-item
          class="cancel lead p-4 font-weight-bold w-100"
          @click="goBack"
          variant="light">
          Cancel
        </b-list-group-item>
      </b-list-group>
    </div>
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
    if (this.token) {
      await this.fetchAddress({ addressId: this.addressId });
    }
    this.isLoading = false;
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

<style>
  .address-header {
    display: flex;
  }
  .cancel {
    cursor: pointer;
  }
</style>
