<template>
  <div id="map">
    <l-map style="height: 350px" :zoom="zoom" :center="center">
      <l-tile-layer :url="url"></l-tile-layer>
      <l-marker
      v-for="(x, i) in territory.addresses"
      :key="i"
      :lat-lng="[x.latitude, x.longitude]">
      <l-popup>{{ x.addr1 }}</l-popup>
      </l-marker>
    </l-map>
    <b-button @click="testthing()" variant="success">TEST</b-button>
  </div>
</template>

<script>
// eslint-disable-next-line
import L from 'leaflet';
import {
  LMap, LTileLayer, LMarker, LPopup,
} from 'vue2-leaflet';
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'MyMap',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup,
  },
  data() {
    return {
      terrId: this.$route.params.id,
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      zoom: 13,
      center: [40.9, -74],
    };
  },
  computed: {
    ...mapGetters({
      territory: 'territory/territory',
    }),
  },
  methods: {
    ...mapActions({
      getTerritory: 'territory/getTerritory',
    }),
  },
  async mounted() {
    await this.getTerritory(this.terrId);
  },
};
</script>

<style>

</style>
