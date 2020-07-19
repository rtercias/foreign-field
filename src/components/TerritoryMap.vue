<template>
  <div id="map">
    <!-- <b-button :to="territory" variant="success">LIST VIEW</b-button> -->
    <l-map ref="leafmap" style="height: 350px" :zoom="zoom" :center="center">
      <l-tile-layer :url="url"></l-tile-layer>
      <l-marker
      v-for="(x, i) in territory.addresses"
      :key="i"
      :lat-lng="[x.latitude, x.longitude]">
      <l-popup>{{ x.addr1 }}</l-popup>
      </l-marker>
    </l-map>
  </div>
</template>

<script>
import {
  LMap, LTileLayer, LMarker, LPopup,
} from 'vue2-leaflet';
// eslint-disable-next-line
import { mapGetters, mapActions, featureGroup } from 'vuex';

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
      markers: [],
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
    centerMarkers() {
      this.territory.addresses.forEach(e => this.markers.push([e.latitude, e.longitude]));
      this.$refs.leafmap.mapObject.fitBounds(this.markers);
    },
  },
  async mounted() {
    await this.getTerritory(this.terrId);
    this.centerMarkers();
  },
};
</script>

<style>

</style>
