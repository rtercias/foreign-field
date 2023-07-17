<template>
  <!-- <h3 v-if="territory.addresses.length === 0" class="w-100 text-center">
    There are no addresses in this territory.
  </h3> -->
  <div class="territory-map">
    <l-map class="map" :center="center" :bounds="bounds" :options="{zoomControl: false}">
      <l-tile-layer :url="url"></l-tile-layer>
      <l-marker
        v-for="(x, i) in territory.addresses"
        :key="i"
        @click="() => centerMarker(x)"
        :lat-lng="getLatLng(x)"
      >
        <l-icon v-if="mapOptions.showSortOrder">
          <div class="sort-order-icon font-weight-bolder text-primary bg-warning">
            {{ i + 1 }}
          </div>
        </l-icon>
        <l-popup ref="addressPopup" :options="{ keepInView: true, zIndex: 1100 }">
          <MapLinks
            :address="x"
            :territory="territory"
            :simple="mapOptions.simple"
            :disabled="disabled"
          ></MapLinks>
        </l-popup>
      </l-marker>
    </l-map>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker, LIcon, LPopup } from 'vue2-leaflet';
import { latLngBounds } from 'leaflet';
import get from 'lodash/get';
import { mapGetters, mapActions } from 'vuex';
import MapLinks from './MapLinks';

const defaultOptions = {
  showSortOrder: false,
  simple: false,
};

export default {
  name: 'TerritoryMap',
  components: {
    LMap,
    LTileLayer,
    LIcon,
    LMarker,
    LPopup,
    MapLinks,
  },
  props: ['id', 'territory', 'options', 'disabled'],
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
      let latLng = [[0, 0]];
      if (get(this.territory, 'addresses').length) {
        latLng = get(this.territory, 'addresses').map(terr => [
          terr.latitude,
          terr.longitude,
        ]);
      }
      return latLngBounds(latLng);
    },
    mapOptions() {
      return this.options || defaultOptions;
    },
    sortDisplay(sort) {
      return !sort ? '' : sort;
    },
  },
  methods: {
    ...mapActions({
      getTerritory: 'territory/getTerritory',
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
    if (this.token && !this.territory) {
      await this.getTerritory({ id: this.id, getLastActivity: true });
    }
  },
};
</script>

<style lang="scss" scoped>
.territory-map {
  height: calc(100vh - 107px);

  .map {
    width: 100%;
  }
}
.leaflet-popup h2 {
  font-size: 18px;
}

.sort-order-icon {
  border: solid 3px;
  border-radius: 50%;
  line-height: 22px;
  min-height: 30px;
  width: 30px;
  font-size: 18px;
}
</style>
