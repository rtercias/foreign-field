<template>
  <div class="address-links">
    <div class="address-header d-flex justify-content-between align-items-center text-center py-3">
      <router-link
        v-if="canWrite"
        :is="editable ? 'router-link' : 'div'"
        :class="{ 'font-weight-bold w-100': !simple, 'simple m-auto': simple }"
        :to="`/territories/${address.territory_id}/addresses/${address.id}/edit?origin=map-view`"
      >
        <div>{{address.addr1}} {{address.addr2}}</div>
        <div>{{address.city}} {{address.state_province}} {{address.postalCode}}</div>
      </router-link>
      <div v-else>
        <div>{{address.addr1}} {{address.addr2}}</div>
        <div>{{address.city}} {{address.state_province}} {{address.postalCode}}</div>
      </div>
    </div>
    <b-list-group-item
      v-if="!simple"
      class="d-flex p-2 justify-content-around align-items-center font-weight-bold"
      :href="mapsUrl"
      target="_blank">
      <font-awesome-icon class="mr-2" icon="directions"></font-awesome-icon>
      <span>Get directions</span>
    </b-list-group-item>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'MapLinks',
  props: ['address', 'simple', 'editable'],
  computed: {
    ...mapGetters({
      canWrite: 'auth/canWrite',
    }),
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
    font-size: 16px;
  }
  .simple {
    font-size: 14px;
  }
</style>
