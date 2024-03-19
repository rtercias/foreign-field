<template>
  <div
    class="address-card-container min-height d-flex justify-content-center py-2"
    :class="{
      'min-height-phone-address': $route.name === 'phone-list',
      'p-2': $route.name === 'phone-list',
      'px-2 min-height': $route.name === 'address-list',
    }">
    <div
      class="w-100 row"
    >
      <div class="address-card row justify-content-between align-items-start ml-0 mr-0 w-100"
        :class="{
          'min-height text-dark': $route.name === 'address-list',
          'text-white': $route.name === 'phone-list',
          'col-12 p-0': mode === 'map-view',
        }">
        <div class="d-flex pb-1" :class="{ 'w-75': $route.name === 'map-view' }">
          <AddressIcon :index="index+1" :record="address" />
          <div class="pl-2">
            <div class="address d-flex align-items-center">
              <div class="d-inline mb-0">{{address.addr1}}&nbsp;</div>
              {{address.addr2}}
            </div>
            <div class="text-left city-state-zip mb-1">
              {{address.city}} {{address.state_province}} {{address.postal_code}}
            </div>
          </div>
        </div>
        <b-dropdown
          variant="light"
          right
        >
          <template #button-content>
            <font-awesome-icon icon="ellipsis-h" />
          </template>
          <b-dropdown-item
            v-if="$route.name === 'map-view'"
            @click="startHere"
          >
            Reorder - Start Here
          </b-dropdown-item>
          <b-dropdown-item
            v-if="$route.name === 'map-view'"
            @click="endHere"
          >
            Reorder - End Here
          </b-dropdown-item>
          <b-dropdown-item :href="mapsUrl" target="_blank">
            Get Driving Direction
          </b-dropdown-item>
          <b-dropdown-item :href="lookupFastPeopleSearch" target="_blank">
            Lookup Fast People Search
          </b-dropdown-item>
          <b-dropdown-item
            v-if="canWrite"
            :to="{
              name: 'address-edit',
              params: { territoryId, addressId: address.id, mode: 'edit' },
              query: { origin: $route.name }
            }"
          >
            Edit Address
          </b-dropdown-item>
          <b-dropdown-item v-if="canWrite" variant="danger" @click="removeAddress">
            Delete
          </b-dropdown-item>
        </b-dropdown>
        <Tags
          :record="address"
          :variant="$route.name === 'phone-list' ? 'info' : 'primary'"
          :class="{'pl-2': $route.name === 'phone-list'}"
          :addressIndex="index"
          v-on="$listeners"
        ></Tags>
        <ActivityLog v-if="mode!=='phone-list'" :entity="address" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import format from 'date-fns/format';
import get from 'lodash/get';
import AddressLinks from './AddressLinks';
import ActivityButton from './ActivityButton';
import AddressIcon from './AddressIcon';
import Tags from './Tags';
import ActivityLog from './ActivityLog';
import { format as formatPhone } from '../utils/phone';
import { AddressStatus } from '../store';

export default {
  name: 'AddressCard',
  props: ['address', 'addressId', 'territoryId', 'index', 'mode'],
  components: {
    AddressLinks,
    ActivityButton,
    Tags,
    AddressIcon,
    ActivityLog,
  },
  data() {
    return {
      responseText: '',
      animate: false,
      currentOffset: 0,
      containerRight: 0,
      transform: '',
      clickedToOpen: false,
      isLogging: false,
    };
  },
  created() {
    if (
      this.$route.name === 'address-detail'
      && !this.address && this.territory.addresses.length
    ) {
      const address = this.territory.addresses.find(a => a.id === this.addressId)
        || this.territory.addresses[0];
      this.setAddress(address);
    }
  },

  methods: {
    ...mapActions({
      addLog: 'address/addLog',
      setAddress: 'address/setAddress',
      updateAddress: 'address/updateAddress',
      setStartingAddress: 'addresses/setStartingAddress',
      setEndingAddress: 'addresses/setEndingAddress',
    }),
    get,
    getPxValue(styleValue) {
      return Number(styleValue.substring(0, styleValue.indexOf('px')));
    },
    async removeAddress() {
      const response = await this.$bvModal.msgBoxConfirm(
        'Remove address from the list?', {
          title: `${this.address.addr1} ${this.address.addr2}`,
          centered: true,
        }
      );

      if (response) {
        await this.updateAddress({ ...this.address, status: AddressStatus.Inactive });

        // remove address from list if it's no longer active
        if (this.territory && this.territory.id === this.territoryId) {
          const index = this.territory.addresses.findIndex(a => a.id === this.address.id);
          if (index >= 0) this.territory.addresses.splice(index, 1);
        }
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
  computed: {
    ...mapGetters({
      loading: 'auth/loading',
      territory: 'territory/territory',
      updatedAddress: 'address/address',
      actionButtonList: 'address/actionButtonList',
      user: 'auth/user',
      isTerritoryBusy: 'territory/isBusy',
      isDesktop: 'auth/isDesktop',
      isCheckedOut: 'territory/isCheckedOut',
      canWrite: 'auth/canWrite',
    }),
    overflowRatio() {
      return this.$refs.activityContainer.scrollWidth / this.$refs.activityContainer.offsetWidth;
    },

    itemWidth() {
      return this.$refs.activityContainer.scrollWidth / this.count;
    },

    count() {
      return this.$refs.activityContainer.children.length;
    },

    containerWidth() {
      const styles = window.getComputedStyle(this.$refs.activityContainer);
      const width = styles.getPropertyValue('width');
      return this.getPxValue(width);
    },

    formattedPhone() {
      return this.address && this.address.phone && formatPhone(this.address.phone);
    },

    formattedSelectedResponseTS() {
      const parsed = Number(this.lastActivity.timestamp);
      const timestamp = Number.isNaN(parsed) ? this.lastActivity.timestamp : parsed;
      return format(new Date(timestamp), 'MM/dd/yy p');
    },
    lastActivity() {
      return get(this.address, 'lastActivity') || { value: 'START', timestamp: '' };
    },
    selectedResponse() {
      return this.lastActivity.value;
    },
    mapQueryParam() {
      return this.mode === 'map' ? '?origin=map-view' : '';
    },
    storageId() {
      return `foreignfield-${this.address.id}`;
    },
    mapsUrl() {
      const addr1 = get(this.address, 'addr1') || '';
      const city = get(this.address, 'city') || '';
      const state = get(this.address, 'state_province') || '';
      return `https://www.google.com/maps/dir/?api=1&destination=${addr1} ${city} ${state}`;
    },
    lookupFastPeopleSearch() {
      const addr1 = `${(get(this.address, 'addr1') || '').trim().replace(/\s+/g, '-')}`;
      const city = `${(get(this.address, 'city') || '').trim().replace(/\s+/g, '-')}`;
      const state = `${(get(this.address, 'state_province') || '').trim().replace(/\s+/g, '-')}`;
      return `https://www.fastpeoplesearch.com/address/${addr1}_${city}-${state}`;
    },
  },
};
</script>
<style scoped lang="scss">
.v-touch-address-card {
  touch-action: pan-y;
  height: 100%;
}
.address-card-container {
  &.min-height {
    min-height: 150px;
  }
  &.min-height-phone-address {
    min-height: 119px;
  }
  .address-card {
    display: flex;
    flex-direction: row;
    transition: ease-in-out 0.3s;

    &.min-height {
      min-height: 60px;
    }
  }
}
.address {
  display: flex;
  text-align: left;
  font-size: 18px;
}

.phone-address {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  display: block;
}
.nh-text {
  font-size: 0.5em;
}
.ellipsis-v, .ellipsis-v-static {
  cursor: pointer;
  z-index: 1;
}
.static-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.selected-response {
  width: 60px;
  height: 40px;
}
.selected-response.faded {
  opacity: 0.6;
}
.last-activity {
  font-size: small;
  position: relative;
  bottom: 2px;
}
.logging-spinner {
  font-size: 30px;
}
.tiny-busy {
  font-size: 8px;
}
.sort-order-icon {
  display: inline-block;
  border: solid 3px;
  border-radius: 50%;
  line-height: 14px;
  height: 20px;
  width: 20px;
  font-size: 14px;
  text-align: center;
}
.footer {
  margin-bottom: 57px;
  left: unset;
}

@media print {
  .interaction {
    display: none;
  }

  .address a {
    text-decoration: none;
  }
  .ellipsis-v-static {
    display: none;
  }
}
</style>
