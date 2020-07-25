<template>
  <div>
    <l-map
    class="map"
    ref="leafmap"
    style="height: 100%"
    :zoom="zoom"
    :options="{zoomControl:false}"
    :center="center">
      <l-tile-layer :url="url"></l-tile-layer>
      <l-marker
      ref="markerwindow"
      v-for="(x, i) in territory.addresses"
      :key="i"
      @click="() => centerMarker(x)"
      :lat-lng="[x.latitude, x.longitude]">
      <l-popup>
        <MapLinks :address='x'></MapLinks>
      </l-popup>
      </l-marker>
    </l-map>
  </div>
</template>

<script>
import {
  LMap, LTileLayer, LMarker, LPopup, LControlZoom,
} from 'vue2-leaflet';
import { mapGetters, mapActions } from 'vuex';
import MapLinks from './MapLinks';

export default {
  name: 'MyMap',
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
      markers: [],
      showCard: false,
      center: [0, 0],
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
      setLeftNavRoute: 'auth/setLeftNavRoute',
    }),
    centerAll() {
      this.territory.addresses.forEach(e => this.markers.push([e.latitude, e.longitude]));
      this.$refs.leafmap.mapObject.fitBounds(this.markers);
    },
    centerMarker(address) {
      this.heading = address.addr1;
      this.center = [address.latitude, address.longitude];
    },
  },
  async mounted() {
    await this.getTerritory(this.id);
    this.setLeftNavRoute(`/territories/${this.group}/${this.id}`);
    this.centerAll();
  },
};
</script>

<style>
.fixed-wrapper {
  position: absolute;
  bottom: 0;
  overflow: scroll;
  width: 100%;
}
.card-scroller {
  scroll-snap-type: x mandatory;
  display: flex;
  flex-direction: row;
  position: relative;
  z-index: 1;
}
.interactable {
  scroll-snap-align: center;
  height: 200px;
  background-color: white;
  padding-right: 100px;
  padding-left: 100px;
  margin: 5px;
}
.map {
  z-index: 0;
}
.map-links {
  font-size: 1rem;
}
</style>
