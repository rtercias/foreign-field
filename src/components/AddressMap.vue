<template>
  <div class="address-map">
    <l-map
      class="map"
      ref="addressMap"
      :zoom="zoom"
      :center="center"
      :draggable="true"
      @update:bounds="getNearest"
      @update:zoom="updateZoom($event)"
      :bounds="bounds">
      <l-tile-layer :url="url"></l-tile-layer>
      <l-marker
        :lat-lng="center"
        :draggable="draggable"
        @update:latLng="updateLatLng">
      </l-marker>
      <v-marker-cluster
        class="marker-cluster"
        ref="markerCluster"
        :options="{
          maxClusterRadius: 4000,
          zoomToBoundsOnClick: false,
          spiderfyOnMaxZoom: false,
        }"
        v-for="(terr, terrIndex) in nearestTerritories"
        :key="terrIndex"
        :name="`${terr.description} (${terr.name})`"
        :id="terr.territory_id">
        <l-marker
          v-for="(addr, addrIndex) in terr.territory.addresses"
          :key="addrIndex"
          :lat-lng="[addr.latitude, addr.longitude]">
        </l-marker>
      </v-marker-cluster>
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
  LCircleMarker,
  LTooltip,
} from 'vue2-leaflet';
import Vue2LeafletMarkerCluster from 'vue2-leaflet-markercluster';
import { latLngBounds } from 'leaflet';
import { mapGetters, mapActions } from 'vuex';
import MapLinks from './MapLinks';

export default {
  name: 'AddressMap',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup,
    LControlZoom,
    LCircleMarker,
    LTooltip,
    MapLinks,
    'v-marker-cluster': Vue2LeafletMarkerCluster,
  },
  props: ['address', 'defaultZoom', 'step'],
  data() {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      showCard: false,
      center: [0, 0],
      newCoords: [],
      selectedTerritory: null,
      zoom: this.defaultZoom,
    };
  },
  async mounted() {
    this.center = this.getLatLng();
    await this.getNearest();
  },
  computed: {
    ...mapGetters({
      token: 'auth/token',
      congId: 'auth/congId',
      nearestTerritories: 'territories/nearestTerritories',
    }),
    bounds() {
      return latLngBounds([this.getLatLng()]);
    },
    sortDisplay(sort) {
      return !sort ? '' : sort;
    },
    draggable() {
      return this.step === 2;
    },
  },
  methods: {
    ...mapActions({
      addAddress: 'address/addAddress',
      getNearestTerritories: 'territories/getNearestTerritories',
    }),
    getLatLng() {
      if (this.address.latitude && this.address.longitude) {
        return [this.address.latitude, this.address.longitude];
      }
      return [0, 0];
    },
    updateLatLng(coordinates) {
      if (coordinates) {
        this.center = [coordinates.lat, coordinates.lng];
        this.$emit('updated', coordinates);
      }
    },
    selectTerritory(terr) {
      this.selectedTerritory = terr;
    },
    getRadius() {
      try {
        const bounds = this.$refs.addressMap.mapObject.getBounds();
        const center = this.$refs.addressMap.mapObject.getCenter();
        const mapBoundNorthEast = bounds.getNorthEast();
        const mapDistance = mapBoundNorthEast.distanceTo(center);
        return Math.ceil(mapDistance / 1000 / 1.6);
      } catch (e) {
        return 1;
      }
    },
    async getNearest() {
      if (this.step === 3) {
        await this.getNearestTerritories({
          congId: this.congId,
          coordinates: [this.address.latitude, this.address.longitude],
          radius: this.getRadius(),
          unit: 'mi',
        });

        for (const cluster of this.$refs.markerCluster) {
          const vm = this;
          cluster.mapObject.on('clustermouseover', (c) => {
            c.layer.bindTooltip(cluster.$attrs.name).openTooltip();
          });

          cluster.mapObject.on('clusterclick', (c) => {
            const selected = c.originalEvent.target.closest('.leaflet-marker-pane')
              .getElementsByClassName('selected') || [];

            for (const el of selected) {
              el.classList.remove('selected');
            }

            c.originalEvent.target.closest('.leaflet-interactive').classList.add('selected');
            c.layer.bindTooltip(cluster.$attrs.name).openTooltip();
            vm.$emit('territory-selected', cluster.$attrs.id);
          });

          // zoom out to show nearest territories
          this.bounds.extend(cluster.mapObject.getBounds());
        }
      }
    },

    updateZoom(e) {
      this.zoom = e;
    },
  },
  watch: {
    'address.longitude': function () {
      this.center = this.getLatLng();
    },
  },
};
</script>

<style lang="scss">
  @import "../assets/foreign-field-theme.scss";

  .step-2 .address-map {
    height: calc(100vh - 355px);
  }
  .step-3 .address-map {
    height: calc(100vh - 385px);
  }
  .map {
    width: 100%;
  }
  .marker-cluster {
    width: 80px !important;
    height: 80px !important;
    border-radius: 50% !important;
    &.selected {
      background-color: $primary;
    }
    div {
      width: 70px !important;
      height: 70px !important;
      border-radius: 50% !important;
    }
    span {
      line-height: 70px !important;
      font-size: 20px;
    }
  }
</style>
