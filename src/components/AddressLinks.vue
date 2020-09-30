<template>
  <div class="address-links">
    <Loading v-if="isLoading"></Loading>
    <div v-else>
      <div class="address-header justify-content-around align-items-center pt-3 pb-3">
        <div class="lead font-weight-bold w-100 pl-5">
          <div>{{address.addr1}} {{address.addr2}}</div>
          <div>{{address.city}} {{address.state_province}} {{address.postalCode}}</div>
        </div>
        <b-link class="pr-4" :to="`/territories/${group}/${territoryId}/addresses/${address.id}/edit`">
          <font-awesome-icon class="button" icon="edit"></font-awesome-icon>
        </b-link>
      </div>
      <div class="lead border-top pt-2 pb-2">Link to...</div>
      <b-list-group>
        <b-list-group-item class="lead p-4 font-weight-bold w-auto" :href="mapsUrl" variant="primary" target="_blank">
          <font-awesome-icon class="button" icon="directions"></font-awesome-icon>&nbsp;
          Google Maps
        </b-list-group-item>
        <b-list-group-item class="lead p-4 font-weight-bold w-auto" variant="warning" :href="lookupFastPeopleSearch">
          <font-awesome-icon class="button" icon="phone-alt"></font-awesome-icon>&nbsp;
          Fast People Search
        </b-list-group-item>
        <b-list-group-item class="lead p-4 font-weight-bold w-auto" :href="lookup411" variant="success">
          <font-awesome-icon class="button" icon="phone-alt"></font-awesome-icon>&nbsp;
          411.com
        </b-list-group-item>
        <b-list-group-item class="lead p-4 font-weight-bold w-auto" variant="dark"
          :href="`/territories/${group}/${territoryId}/addresses/${address.id}/history`">
          <font-awesome-icon icon="history"></font-awesome-icon>&nbsp;
          Activity History
        </b-list-group-item>
        <b-list-group-item
          class="lead p-4 font-weight-bold w-auto"
          :to="`/territories/${group}/${territoryId}`"
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
  props: ['addressId', 'group', 'territoryId'],
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
    this.setLeftNavRoute(`/territories/${this.group}/${this.territoryId}`);
    await this.fetchAddress(this.addressId);
    this.isLoading = false;
  },
  computed: {
    ...mapGetters({
      address: 'address/address',
      token: 'auth/token',
    }),
    mapsUrl() {
      const addr1 = this.address.addr1 || '';
      const city = this.address.city || '';
      const state = this.address.state_province || '';
      return `https://www.google.com/maps/dir/?api=1&destination=${addr1} ${city} ${state}`;
    },
    lookup411() {
      const addr1 = `${get(this.address, 'addr1', '').trim().replace(/\s+/g, '-')}`;
      const city = `${get(this.address, 'city', '').trim().replace(/\s+/g, '-')}`;
      const state = `${get(this.address, 'state_province', '').trim().replace(/\s+/g, '-')}`;
      return `https://www.411.com/address/${addr1}/${city}-${state}`;
    },
    lookupFastPeopleSearch() {
      const addr1 = `${get(this.address, 'addr1', '').trim().replace(/\s+/g, '-')}`;
      const city = `${get(this.address, 'city', '').trim().replace(/\s+/g, '-')}`;
      const state = `${get(this.address, 'state_province', '').trim().replace(/\s+/g, '-')}`;
      return `https://www.fastpeoplesearch.com/address/${addr1}_${city}-${state}`;
    },
  },
  methods: {
    ...mapActions({
      fetchAddress: 'address/fetchAddress',
      setLeftNavRoute: 'auth/setLeftNavRoute',
    }),
  },
  watch: {
    async token() {
      await this.fetchAddress(this.addressId);
    },
    immediate: true,
  },
};
</script>

<style>
  .address-header {
    display: flex;
  }
</style>
