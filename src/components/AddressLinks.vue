<template>
  <div>
    <div class="lead mt-3 font-weight-bold">{{address.addr1}} {{address.addr2}}</div>
    <div class="lead font-weight-bold">{{address.city}} {{address.state_province}} {{address.postalCode}}</div>
    <div class="lead mt-3 border-top pt-3 pb-3">Link to...</div>
    <b-list-group>
      <b-list-group-item class="lead p-4 font-weight-bold w-auto" :href="mapsUrl" variant="primary" target="_blank">
        Google Maps
      </b-list-group-item>
      <b-list-group-item class="lead p-4 font-weight-bold w-auto" variant="warning" :href="lookupFastPeopleSearch">
        <font-awesome-layers>
          <font-awesome-icon icon="phone-alt"></font-awesome-icon>
        </font-awesome-layers>&nbsp;
        Fast People Search
      </b-list-group-item>
      <b-list-group-item class="lead p-4 font-weight-bold w-auto" :href="lookup411" variant="success"
        >411.com
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
  props: [
    'addressId',
  ],
  async mounted() {
    await this.fetchAddress(this.addressId);
    await this.setTerritory(this.address.territoryId);
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

</style>
