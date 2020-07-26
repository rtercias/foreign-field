<template>
  <div class="address-links">
    <div class="address-header justify-content-around align-items-center text-center pt-3 pb-3">
      <div class="lead font-weight-bold w-100">
        <div>{{address.addr1}} {{address.addr2}}</div>
        <div>{{address.city}} {{address.state_province}} {{address.postalCode}}</div>
      </div>
    </div>
    <b-list-group>
      <b-list-group-item class="lead p-4 font-weight-bold w-auto" :href="mapsUrl" variant="primary" target="_blank">
        <font-awesome-icon class="button" icon="directions"></font-awesome-icon>&nbsp;
        Google Maps
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'AddressLinks',
  props: ['addressId', 'group', 'id', 'address'],
  async mounted() {
    this.setLeftNavRoute(`/territories/${this.group}/${this.id}/map`);
  },
  computed: {
    mapsUrl() {
      const addr1 = this.address.addr1 || '';
      const city = this.address.city || '';
      const state = this.address.state_province || '';
      return `https://www.google.com/maps/dir/?api=1&destination=${addr1} ${city} ${state}`;
    },
  },
  methods: {
    ...mapActions({
      setLeftNavRoute: 'auth/setLeftNavRoute',
    }),
  },
};
</script>

<style>
  .address-header {
    display: flex;
  }
</style>
