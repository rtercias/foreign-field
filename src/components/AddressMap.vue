<template>
  <div class="address-map">
    <l-map
      class="map"
      :zoom="zoom"
      :center="center"
      :bounds="bounds">
      <l-tile-layer :url="url"></l-tile-layer>
      <l-marker
        v-for="(x, i) in (addresses || territory.addresses)"
        :key="i"
        @click="() => centerMarker(x)"
        :lat-lng="getLatLng(x)">
        <l-icon v-if="mapOptions.showSortOrder">
          <div class="sort-order-icon font-weight-bolder text-primary bg-warning">{{i + 1}}</div>
        </l-icon>
        <l-popup>
          <MapLinks :address='x' :simple="mapOptions.simple"></MapLinks>
        </l-popup>
      </l-marker>
    </l-map>
  </div>
</template>

<script>
import {
  LMap,
  LTileLayer,
  LMarker,
  LIcon,
  LPopup,
  LControlZoom,
} from 'vue2-leaflet';
import { latLngBounds } from 'leaflet';
import { mapGetters } from 'vuex';
import MapLinks from './MapLinks';

export default {
  name: 'AddressMap',
  components: {
    LMap,
    LTileLayer,
    LIcon,
    LMarker,
    LPopup,
    LControlZoom,
    MapLinks,
  },
  props: ['coordinates'],
  data() {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      zoom: 13,
      showCard: false,
      center: [0, 0],
    };
  },
  computed: {
    ...mapGetters({
      token: 'auth/token',
    }),
    bounds() {
      return latLngBounds(this.coordinates);
    },
    sortDisplay(sort) {
      return !sort ? '' : sort;
    },
  },
  methods: {
    centerMarker(address) {
      this.heading = address.addr1;
      if (address.latitude && address.longitude) {
        this.center = [address.latitude, address.longitude];
      }
    },
    getLatLng(address) {
      if (address.latitude && address.longitude) {
        return [address.latitude, address.longitude];
      }
      return [0, 0];
    },
  },
};
</script>

<style>
  .territory-map {
    height: calc(100% - 163px);
  }
  .map {
    height: 100%;
    width: 100%;
  }
</style>
