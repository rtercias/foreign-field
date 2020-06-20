<template>
  <div class="address-links">
    <div class="address-header justify-content-around align-items-center pt-3 pb-3">
      <b-link class="button pl-4" :to="`/territories/${groupCode}/${territoryId}`">
        <font-awesome-icon icon="chevron-left"></font-awesome-icon>
      </b-link>
      <div class="lead font-weight-bold w-100">
        <div>{{address.addr1}} {{address.addr2}}</div>
        <div>{{address.city}} {{address.state_province}} {{address.postalCode}}</div>
      </div>
      <b-link class="pr-4" :to="`/addresses/${address.id}/edit`">
        <font-awesome-icon class="button" icon="edit"></font-awesome-icon>
      </b-link>
    </div>
    <div class="lead border-top pt-3 pb-3">Link to...</div>
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
      <b-list-group-item
        class="lead p-4 font-weight-bold w-auto"
        :to="`/territories/${groupCode}/${territoryId}`"
        variant="light">
        Cancel
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';

export default {
  name: 'AddressLinks',
  props: [
    'addressId',
  ],
  async mounted() {
    await this.fetchAddress(this.addressId);
    await this.getTerritory(this.address.territory_id);
  },
  computed: {
    ...mapGetters({
      address: 'address/address',
      territory: 'territory/territory',
    }),
    groupCode() {
      return this.territory && this.territory.group_code;
    },
    territoryId() {
      return this.territory.id;
    },
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
      getTerritory: 'territory/getTerritory',
    }),
  },
};
</script>

<style>
  .address-header {
    display: flex;
  }
</style>
