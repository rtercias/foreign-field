<template>
  <div
    class="address-card-container d-flex align-items-center"
    :class="{
      'min-height-phone-address': $route.name === 'phone-list',
      'mb-2': $route.name === 'phone-list' && isDesktop,
      'p-2': $route.name === 'phone-list',
      'px-2 min-height': $route.name === 'address-list'
    }">
    <div
      class="w-100 row"
    >
      <div class="address-card row justify-content-between align-items-start ml-0 mr-0 text-dark"
        :class="{
          'min-height': $route.name === 'address-list',
          'col-12': mode === 'map',
        }">
        <div v-if="$route.name === 'phone-list'" class="pb-3 pl-2">
          <b-link
            class="w-100"
            :to="`/territories/${territory.id}/addresses/${address.id}/detail${mapQueryParam}`">
            <div class="address text-primary font-weight-bold" :class="{ 'phone-address': $route.name === 'phone-list' }">
              {{address.addr1}} {{address.addr2}}
            </div>
            <div class="text-left small font-weight-bold">
              {{address.city}} {{address.state_province}} {{address.postal_code}}
            </div>
          </b-link>
        </div>
        <div v-else class="d-flex pb-1">
          <AddressIcon :index="index" :record="record" :mode-="mode" :isLogging="isLogging" />
          <div class="pl-2">
            <div class="address d-flex align-items-center">
              <div class="d-inline mb-0">{{record.addr1}}&nbsp;</div>
              {{record.addr2}}
            </div>
            <div class="text-left city-state-zip mb-1">
              {{record.city}} {{record.state_province}} {{record.postal_code}}
            </div>
          </div>
        </div>
        <Tags
          :record="address"
          :variant="$route.name === 'phone-list' ? 'info' : ''"
          :class="{'pl-2': $route.name === 'phone-list'}"
          :addressIndex="index"
          v-on="$listeners"
        ></Tags>
      </div>
      <div
        class="static-buttons"
        :class="{
          'align-self-center': $route.name === 'phone-list',
          'col-3 ml-n1': mode !== 'map',
          'tiny-busy position-absolute mt-n3': mode === 'map',
        }"
      >
        <font-awesome-icon
          class="text-info text-left fa-2x"
          icon="circle-notch"
          spin
          v-if="isLogging || address.isBusy"
        />
        <span
          v-else-if="mode !== 'map'"
          class="d-flex flex-column w-100">
          <ActivityButton
            v-if="!allowedToCall"
            class="fa-2x ml-n3 selected-tag"
            :value="notAllowedTag"
            :selected="true"
            :display-only="true"
            :bg="$route.name === 'phone-list' ? 'light' : 'white'"
            :actionButtonList="actionButtonList">
          </ActivityButton>
          <ActivityButton
            class="selected-response fa-2x"
            :class="{
              faded: !isMySelectedResponse || isIncomingResponse,
              hidden: selectedResponse === 'START' || address.isBusy,
            }"
            :value="selectedResponse"
            :next="'START'"
            :selected="true"
            :actionButtonList="actionButtonList"
            @button-click="confirmClearStatus">
          </ActivityButton>
        </span>
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
import { format as formatPhone } from '../utils/phone';

export default {
  name: 'AddressCard',
  props: ['address', 'territoryId', 'incomingResponse', 'revealed', 'index', 'mode'],
  components: {
    AddressLinks,
    ActivityButton,
    Tags,
    Notes,
    ActivityButtons,
    AddressIcon,
  },
  data() {
    return {
      record: {},
      responseText: '',
      animate: false,
      currentOffset: 0,
      containerRight: 0,
      transform: '',
      clickedToOpen: false,
      isLogging: false,
    };
  },
  methods: {
    ...mapActions({
      addLog: 'address/addLog',
      setAddress: 'address/setAddress',
    }),
    toggleRightPanel() {
      this.$emit('toggle-right-panel', this.index, this.revealed);
    },
    toggleLeftPanel() {
      this.$emit('toggle-left-panel', this.index, this.revealed);
    },
    getPxValue(styleValue) {
      return Number(styleValue.substring(0, styleValue.indexOf('px')));
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
  },
};
</script>
<style scoped lang="scss">
.v-touch-address-card {
  touch-action: pan-y;
  height: 100%;
}
.address-card-container {
  &.min-height-phone-address {
    min-height: 91px;
  }
  &.min-height {
    min-height: 150px;
  }
  .address-card {
    display: flex;
    flex-direction: row;
    overflow: hidden;
    position: relative;
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
