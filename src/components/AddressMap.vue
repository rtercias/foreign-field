<template>
  <div class="address-map">
    <l-map
      class="map"
      :zoom="zoom"
      :center="center"
      :bounds="bounds">
      <l-tile-layer :url="url"></l-tile-layer>
      <l-marker
        :lat-lng="center"
        :draggable="true"
        :options="{ autoPan: true }"
        @update:latLng="updateLatLng">
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
  props: ['address', 'zoom'],
  data() {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      showCard: false,
      center: [0, 0],
      newCoords: [],
    };
  },
  mounted() {
    this.center = this.getLatLng();
  },
  computed: {
    ...mapGetters({
      token: 'auth/token',
    }),
    bounds() {
      return latLngBounds(this.getLatLng());
    },
    sortDisplay(sort) {
      return !sort ? '' : sort;
    },
  },
  methods: {
    getLatLng() {
      if (this.address.latitude && this.address.longitude) {
        return [this.address.latitude, this.address.longitude];
      }
      return [0, 0];
    },
    updateLatLng(coordinates) {
      this.center = [coordinates.lat, coordinates.lng];
    },
  },
  watch: {
    'address.longitude': function () {
      this.center = this.getLatLng();
    },
  },
};
</script>

<style>
  .address-map {
    height: calc(100% - 60px);
  }
  .map {
    height: 100%;
    width: 100%;
  }
</style>
