<template>
  <!-- <h3 v-if="territory.addresses.length === 0" class="w-100 text-center">
    There are no addresses in this territory.
  </h3> -->
  <div class="territory-map">
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
          <div
            class="sort-order-icon font-weight-bolder"
            :class="{
              'text-white bg-primary border-primary': ['HOME', 'LW'].includes(get(x, 'lastActivity.value')),
              'bg-warning': get(x, 'lastActivity.value') === 'NH',
              'bg-white': get(x, 'lastActivity.value', '') === '',
              'bg-light text-info border-info': disabled,
              'border-success text-success': get(x, 'id') === get(startingAddress, 'id'),
              'border-danger text-danger': get(x, 'id') === get(endingAddress, 'id'),
            }"
          >
            {{ i + 1 }}
          </div>
        </l-icon>
        <l-popup ref="addressPopup" :options="{ keepInView: true, zIndex: 1100 }">
          <MapLinks
            :address="x"
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
  },
  props: ['id', 'territory', 'options', 'disabled'],
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
      updateCoordinates: 'auth/updateCoordinates',
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
  height: calc(100vh - 226px);

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
