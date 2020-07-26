<template>
  <div class="address-links">
    <div class="address-header d-flex justify-content-between align-items-center text-center pt-3 pb-3">
      <div class="lead font-weight-bold w-100">
        <div>
          {{address.addr1}} {{address.addr2}}
        </div>
        <div>{{address.city}} {{address.state_province}} {{address.postalCode}}</div>
      </div>
    </div>
    <b-list-group-item
      class="d-flex lead p-2 justify-content-around align-items-center font-weight-bold"
      :href="mapsUrl"
      target="_blank">
      <font-awesome-icon icon="directions"></font-awesome-icon>
      <span>Get directions</span>
    </b-list-group-item>
  </div>
</template>

<script>
export default {
  name: 'MapLinks',
  props: ['address'],
  computed: {
    mapsUrl() {
      const addr1 = this.address.addr1 || '';
      const city = this.address.city || '';
      const state = this.address.state_province || '';
      return `https://www.google.com/maps/dir/?api=1&destination=${addr1} ${city} ${state}`;
    },
  },
};
</script>

<style>
  .address-header {
    display: flex;
  }
</style>
