<template>
  <div class="address-links" :class="{ 'max-size-mobile': !isDesktop }">
    <div
      class="address-header d-flex justify-content-between text-center pt-2"
      :class="{ 'pb-2': disabled }"
    >
      <AddressCard
        v-if="address.type === 'Regular'"
        mode="map"
        :address="address"
        :territoryId="address.territory_id"
        :incomingResponse="address.lastActivity"
        @update-response="updateResponse"
      >
      </AddressCard>
      <div class="d-flex flex-column">
        <b-button
          v-if="simple"
          id="start-here"
          class="w-100 p-1 mb-1"
          :class="{
            'bg-success text-white': get(startingAddress, 'id') === get(address, 'id'),
            'bg-white text-success': get(startingAddress, 'id') !== get(address, 'id'),
          }"
          @click="startHere"
        >
          <span class="d-block">
            <font-awesome-layers class="mx-2">
              <font-awesome-icon icon="flag-checkered"></font-awesome-icon>
            </font-awesome-layers>
          </span>
        </b-button>
        <b-button
          id="end-here"
          class="w-100 p-1 mb-1"
          :class="{
            'bg-danger text-white': get(endingAddress, 'id') === get(address, 'id'),
            'bg-white text-danger': get(endingAddress, 'id') !== get(address, 'id'),
          }"
          @click="endHere"
        >
          <span class="d-block">
            <font-awesome-layers class="mx-2">
              <font-awesome-icon icon="flag-checkered"></font-awesome-icon>
            </font-awesome-layers>
          </span>
        </b-button>
      </div>
    </div>
    <hr class="my-2" v-if="!disabled" />
    <ActivityButtons :address="address" />
  </div>
</template>

<script>
import {
  ADDRESS_RIGHT_BUTTON_LIST,
  NOT_ALLOWED as ADDRESS_NOT_ALLOWED,
} from '../store/modules/models/AddressModel';

import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import intersection from 'lodash/intersection';
import AddressCard from './AddressCard';
import ActivityButtons from './ActivityButtons';

export default {
  name: 'MapLinks',
  props: ['address', 'territory', 'simple', 'disabled', 'index'],
  components: {
    AddressCard,
    ActivityButtons,
  },
  computed: {
    ...mapGetters({
      canWrite: 'auth/canWrite',
      actionButtonList: 'address/actionButtonList',
      startingAddress: 'addresses/startingAddress',
      endingAddress: 'addresses/endingAddress',
      optimized: 'addresses/optimized',
      isDesktop: 'auth/isDesktop',
    }),
    mapsUrl() {
      const addr1 = this.address.addr1 || '';
      const city = this.address.city || '';
      const state = this.address.state_province || '';
      return `https://www.google.com/maps/dir/?api=1&destination=${addr1} ${city} ${state}`;
    },
    isOptimized() {
      return this.optimized && !!this.optimized.length;
    },
  },
  methods: {
    ...mapActions({
      addLog: 'address/addLog',
      setStartingAddress: 'addresses/setStartingAddress',
      setEndingAddress: 'addresses/setEndingAddress',
    }),
    get,
    rightButtonList(item) {
      const rightButtons = ADDRESS_RIGHT_BUTTON_LIST;

      if (!this.allowedToCall(item)) return [];
      return this.actionButtonList.filter(b => rightButtons.includes(b.value));
    },

    selectedNotAllowed(item) {
      const notes = get(item, 'notes', '') || '';
      const tags = notes ? notes.split(',') : [];
      const notAllowed = ADDRESS_NOT_ALLOWED;
      return intersection(notAllowed, tags) || [];
    },

    allowedToCall(item) {
      return this.selectedNotAllowed(item).length === 0;
    },

    goToActivityHistory() {
      this.$router.push({
        name: 'activity-history-checkout',
        params: {
          territoryId: this.address.territory_id,
          addressId: this.address.id,
          checkoutId: get(this.territory, 'lastActivity.checkout_id') || '',
        },
        query: {
          origin: 'map-view',
        },
      });
    },

    async updateResponse(entity, _value) {
      let value = _value;
      if (entity.selectedResponse === 'START' && value === 'START') {
        this.$set(entity, 'isBusy', false);
        return;
      }
      if (!this.actionButtonList.some(b => b.value === value)) {
        value = 'START';
      }

      try {
        this.$set(entity, 'isBusy', true);

        await this.addLog({
          entityId: entity.id,
          value,
          checkoutId: get(this.territory, 'lastActivity.checkout_id'),
        });

        this.$set(entity, 'isBusy', false);
      } catch (e) {
        console.error('Unable to save activity log', e);
      }
    },

    startHere() {
      if (get(this.startingAddress, 'id') === get(this.address, 'id')) {
        this.setStartingAddress(null);
      } else {
        this.setStartingAddress(this.address);
      }
    },

    endHere() {
      if (get(this.endingAddress, 'id') === get(this.address, 'id')) {
        this.setEndingAddress(null);
      } else {
        this.setEndingAddress(this.address);
        if (this.$route.name === 'map-view') {
          this.$emit('on-end-here-clicked');
        }
      }
    },
  },
};
</script>

<style scoped lang="scss">
.address-links {
  overflow-y: scroll;
}
.max-size-mobile {
  max-height: 225px;
  max-width: 100%;
}
.leaflet-popup-content {
  width: 100%;
}

.address-header {
  display: flex;
  font-size: 16px;
}
.simple {
  font-size: 14px;
}
#start-here, #end-here {
  font-size: 20px;
}
.activity-button {
  display: flex;
  width: 60px;
  padding: 0;
}

#get-direction, #activity-history {
  font-size: 24px;
}
</style>
