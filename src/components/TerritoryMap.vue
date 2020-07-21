<template>
  <div>
    <div v-show="showCard" class="interactable">
      <h3><strong>{{ heading }}</strong></h3>
    </div>
    <!-- <b-button :to="territory" variant="success">LIST VIEW</b-button> -->
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
      @click="() => interactiveMarker(x)"
      :lat-lng="[x.latitude, x.longitude]">
      <!-- <l-popup>
        <b-link @click="() => detailFromMap(x.id)">
          {{x.addr1}}
        </b-link>
      </l-popup> -->
      </l-marker>
    </l-map>
  </div>
</template>

<script>
import {
  LMap, LTileLayer, LMarker, LPopup, LControlZoom,
} from 'vue2-leaflet';
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'MyMap',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup,
    LControlZoom,
  },
  props: ['group', 'id'],
  data() {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      zoom: 13,
      markers: [],
      showCard: false,
      heading: '',
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
    detailFromMap(idtest) {
      // eslint-disable-next-line
      this.$router.push({ name: 'address-links', params: { group: this.group, territoryId: this.id, addressId: idtest } });
    },
    interactiveMarker(address) {
      this.showCard = true;
      this.heading = address.addr1;
      this.center = [address.latitude + -0.002, address.longitude];
    },
  },
  async mounted() {
    this.setLeftNavRoute(`/territories/${this.group}/${this.id}`);
    await this.getTerritory(this.id);
    this.centerAll();
  },
};
</script>

<style>
.interactable {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 2;
  height: 350px;
  width: 90%;
  background-color: white;
}
.map {
  z-index: 0;
}
h3 {
  padding-top:20px;
  color: black;
}
</style>
