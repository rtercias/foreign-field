<template>
  <!-- <h3 v-if="territory.addresses.length === 0" class="w-100 text-center">
    There are no addresses in this territory.
  </h3> -->
  <div class="territory-map">
    <div v-if="error" class="text-danger font-weight-bold">
      <span>Error: {{ error }}</span>
      <b-button variant="link" class="text-danger p-0 pl-2 mt-n1" @click="clearError">x</b-button>
    </div>
    <b-button
      class="btn-show-status position-absolute border-dark text-dark px-2"
      @click="toggleIcon"
    >
      <span class="check px-1 bg-success text-white mr-1" v-if="mapIcon === 'ACTIVITY'">
        <font-awesome-icon icon="check" />
      </span>
      <span>Show Status</span>
    </b-button>
    <l-map
      class="map"
      :center="center"
      :bounds="bounds"
      :options="{ zoomControl: true }"
      :setView="true"
      :watch="true"
      @ready="onReady"
      @locationfound="onLocationFound"
      @locateactivate="onLocating"
      @locationerror="onLocationError"
    >
      <l-tile-layer :url="url"></l-tile-layer>
      <l-locate-control
        ref="locateControl"
        :options="{
          setView: 'untilPan',
          keepCurrentZoomLevel: true,
          returnToPrevBounds: true,
          flyTo: true,
          strings: {
            popup: 'Yep, you\'re the blue dot.',
          },
        }"
      >
        <font-awesome-icon v-if="isLocating" icon="circle-notch" spin class="location-icon text-primary">
        </font-awesome-icon>
        <font-awesome-icon v-else icon="location-arrow" class="location-icon text-primary">
        </font-awesome-icon>
      </l-locate-control>
      <l-marker
        v-for="(x, i) in territory.addresses"
        :key="i"
        @click="() => centerMarker(x)"
        :lat-lng="getLatLng(x)"
      >
        <l-icon v-if="mapOptions.showSortOrder">
          <AddressIcon :index="i+1" :record="x" />
        </l-icon>
        <l-popup ref="addressPopup" :options="{ keepInView: true, zIndex: 1100, minWidth: 250 }">
          <MapLinks
            :address="x"
            :index="i"
            :territory="territory"
            :simple="mapOptions.simple"
            :disabled="disabled"
            v-on="$listeners"
          ></MapLinks>
        </l-popup>
      </l-marker>
    </l-map>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker, LIcon, LPopup } from 'vue2-leaflet';
import LLocateControl from 'vue2-leaflet-locatecontrol';
import { latLngBounds } from 'leaflet';
import get from 'lodash/get';
import { mapGetters, mapActions } from 'vuex';
import MapLinks from './MapLinks';
import AddressIcon from './AddressIcon';
import { MAP_ICON } from '../store/modules/models/TerritoryModel';

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
    LLocateControl,
    MapLinks,
    AddressIcon,
  },
  props: ['territoryId', 'options', 'disabled'],
  data() {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      zoom: 13,
      showCard: false,
      center: [0, 0],
      isLocating: false,
    };
  },
  computed: {
    ...mapGetters({
      token: 'auth/token',
      coordinates: 'auth/coordinates',
      startingAddress: 'addresses/startingAddress',
      endingAddress: 'addresses/endingAddress',
      territory: 'territory/territory',
      error: 'addresses/error',
      mapIcon: 'territory/mapIcon',
    }),
    bounds() {
      let latLng = [[0, 0]];
      if (get(this.territory, 'addresses.length')) {
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
      updateCoordinates: 'auth/updateCoordinates',
      fetchActivityLogs: 'territory/fetchActivityLogs',
      clearError: 'addresses/clearError',
      toggleMapIcon: 'territory/toggleMapIcon',
    }),
    get,
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
    onReady() {
      const $parent = get(this.$refs.locateControl, 'parentContainer.$el') || {};
      const $locateContainer = $parent.getElementsByClassName('leaflet-control-locate') || [];
      $locateContainer[0].classList.add('d-none');

      // the code below is needed if we need to show the locate button on the map.
      // it adds support for vue fontawesome icons
      // const $controlContainer = $parent.getElementsByClassName('fa-map-marker') || [];
      // const $svgContainer = get(this.$refs.locateControl, '$el') || {};
      // const $locationArrow = $svgContainer.getElementsByClassName('location-icon') || [];
      // $locationArrow[0].addEventListener('click', this.onLocationClick);
      // $controlContainer[0].insertAdjacentElement('beforebegin', $locationArrow[0]);
    },
    // onLocationClick() {
    //   this.$emit('location-click');
    // },
    async onLocating() {
      this.isLocating = true;
      if (this.$parent.isNearMeClicked) {
        this.$emit('locating');
      }
    },
    onLocationFound(location) {
      this.isLocating = false;
      this.updateCoordinates(location);
      if (this.$parent.isNearMeClicked) {
        this.$emit('location-found', location);
      }
    },
    onLocationError(e) {
      this.isLocating = false;
      if (this.$parent.isNearMeClicked) {
        this.$emit('location-error', e);
      }
      console.log('Unable to determine user location. Please try again.', e);
    },
    onMapClick() {
      this.$emit('map-click');
    },
    toggleIcon() {
      if (this.mapIcon === MAP_ICON.ACTIVITY) {
        this.toggleMapIcon(MAP_ICON.NUMBER);
      } else {
        this.toggleMapIcon(MAP_ICON.ACTIVITY);
      }
    },
  },
  async mounted() {
    const addresses = get(this.territory, 'addresses') || [];
    if (this.token && (!addresses.length || this.territoryId !== this.territory.id)) {
      await this.getTerritory({ id: this.territoryId });
    }
  },
};
</script>

<style lang="scss" scoped>
.territory-map {
  height: calc(100vh - 226px);

  .btn-show-status {
    z-index: 2;
    background: #fff;
    border-radius: 20px;
    right: 10px;
    margin-top: 10px;
    box-shadow: 0 0.5rem 1rem #6C757D;

    .check {
      border: solid 1px;
      border-radius: 50%;
      padding-top: 2px;
    }
  }

  .map {
    width: 100%;
    z-index: 1;
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
