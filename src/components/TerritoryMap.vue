<template>
  <div class="territory-map">
    <l-map
      class="map"
      :zoom="zoom"
      :center="center"
      :bounds="bounds">
      <l-tile-layer :url="url"></l-tile-layer>
      <l-marker
        v-for="(x, i) in territory.addresses"
        :key="i"
        @click="() => centerMarker(x)"
        :lat-lng="getLatLng(x)">
        <l-popup>
          <MapLinks :address='x'></MapLinks>
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
  LPopup,
  LControlZoom,
} from 'vue2-leaflet';
import { latLngBounds } from 'leaflet';
import { mapGetters, mapActions } from 'vuex';
import MapLinks from './MapLinks';

export default {
  name: 'TerritoryMap',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup,
    LControlZoom,
    MapLinks,
  },
  props: ['group', 'id'],
  data() {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      zoom: 13,
      showCard: false,
      center: [0, 0],
      mapOptions: {},
    };
  },
  computed: {
    ...mapGetters({
      territory: 'territory/territory',
      token: 'auth/token',
    }),
    bounds() {
      return latLngBounds(this.territory.addresses.map(terr => [terr.latitude, terr.longitude]));
    },
  },
  methods: {
    ...mapActions({
      getTerritory: 'territory/getTerritory',
      setLeftNavRoute: 'auth/setLeftNavRoute',
    }),
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
  async mounted() {
    this.setLeftNavRoute(`/territories/${this.group}/${this.id}`);
    if (this.token) {
      await this.getTerritory(this.id);
    }
  },
  watch: {
    async token() {
      await this.getTerritory(this.id);
    },
    immediate: true,
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
  .leaflet-popup h2 {
    font-size: 18px;
  }
</style>
