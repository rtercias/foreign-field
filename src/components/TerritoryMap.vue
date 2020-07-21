<template>
  <div>
    <div v-show="showCard" class="interactable">
      <h2>{{ heading }}</h2>
    </div>
    <!-- <b-button :to="territory" variant="success">LIST VIEW</b-button> -->
    <l-map class="map" ref="leafmap" style="height: 100%" :zoom="zoom" @click="hideInteractable">
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
  props: ['group', 'id'],
  data() {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      zoom: 13,
      markers: [],
      showCard: false,
      heading: '',
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
    centerView() {
      this.territory.addresses.forEach(e => this.markers.push([e.latitude, e.longitude]));
      this.$refs.leafmap.mapObject.fitBounds(this.markers);
    },
    detailFromMap(idtest) {
      // eslint-disable-next-line
      this.$router.push({ name: 'address-links', params: { group: this.group, territoryId: this.id, addressId: idtest } });
    },
    interactiveMarker(idthing) {
      this.showCard = true;
      this.heading = idthing.addr1;
    },
    hideInteractable() {
      this.showCard = false;
    },
  },
  async mounted() {
    this.setLeftNavRoute(`/territories/${this.group}/${this.id}`);
    await this.getTerritory(this.id);
    this.centerView();
  },
};
</script>

<style>
.interactable {
  position: absolute;
  bottom: 0;
  left: 20px;
  z-index: 2;
  height: 350px;
  width: 90%;
  background-color: white;
}
.map {
  z-index: 0;
}
h2 {
  padding-top:20px;
}
</style>
