<template>
  <div
    class="address-card-container d-flex align-items-center justify-content-center py-2"
    :class="{
      'min-height-phone-address': $route.name === 'phone-list',
      'mb-2': $route.name === 'phone-list' && isDesktop,
      'p-2': $route.name === 'phone-list',
      'px-2 min-height': $route.name === 'address-list',
      'm-3 pb-0': $route.name === 'address-detail',
    }">
    <font-awesome-layers
      v-show="$route.name === 'address-list' || $route.name === 'phone-list'"
      class="ellipsis-v-static text-muted fa-1x"
      @click="toggleLeftPanel"
    >
      <font-awesome-icon icon="ellipsis-v" class="ml-0"></font-awesome-icon>
    </font-awesome-layers>
    <div
      class="w-100 row"
    >
      <div class="address-card row justify-content-between align-items-start ml-0 mr-0 text-black-50"
        :class="{
          'min-height': $route.name === 'address-list',
          'col-12 p-0': mode === 'map',
          'pl-0': $route.name === 'address-detail',
        }">
        <div v-if="$route.name === 'phone-list'" class="pb-3 pl-2">
          <b-link
            class="w-100"
            @click="setAddress(record)"
            :to="`/territories/${territory.id}/addresses/${record.id}${mapQueryParam}`">
            <div class="address text-primary font-weight-bold" :class="{ 'phone-address': $route.name === 'phone-list' }">
              {{record.addr1}} {{record.addr2}}
            </div>
            <div class="text-left small font-weight-bold">
              {{record.city}} {{record.state_province}} {{record.postal_code}}
            </div>
          </b-link>
        </div>
        <div v-else class="address flex-column pb-1">
          <div>
            <div class="d-flex align-items-center">
              <div class="sort-order-icon font-weight-bolder bg-white mr-2">
                {{record.sort}}
              </div>
              <h4 class="d-inline mb-0">
                <b-link :to="`/territories/${territory.id}/addresses/${record.id}${mapQueryParam}`">
                  {{record.addr1}}
                </b-link>&nbsp;
              </h4>
            </div>
            {{record.addr2}}
            <div class="mb-1">
              {{record.city}} {{record.state_province}} {{record.postal_code}}
            </div>
          </div>
        </div>
        <div
          class="static-buttons"
          :class="{
            'align-items-start': $route.name === 'address-list',
            'align-self-center': $route.name === 'phone-list',
            'justify-content-end align-items-start': $route.name === 'address-detail',
            'ml-n1': mode !== 'map',
            'tiny-busy position-absolute mt-n3': mode === 'map',
          }"
        >
          <font-awesome-icon
            class="text-info text-left fa-2x"
            icon="circle-notch"
            spin
            v-if="isLogging || record.isBusy"
          />
          <span
            v-else-if="mode !== 'map'"
            class="d-flex flex-column">
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
                hidden: selectedResponse === 'START' || record.isBusy,
              }"
              :value="selectedResponse"
              :next="'START'"
              :selected="true"
              :actionButtonList="actionButtonList"
              @button-click="confirmClearStatus">
            </ActivityButton>
          </span>
        </div>
        <Tags
          :record="record"
          :variant="$route.name === 'phone-list' ? 'info' : 'primary'"
          :class="{'pl-2': $route.name === 'phone-list'}"
          :addressIndex="index"
          v-on="$listeners"
        ></Tags>
        <div
          class="bg-white w-100"
          :class="{
            'w-80': isDesktop && $route.name === 'address-detail',
            'footer fixed-bottom': $route.name === 'address-detail',
            'pt-4': $route.name !== 'address-detail',
            'd-none': $route.name === 'phone-list',
          }"
        >
          <b-button
            v-if="showAddressLinksToggle"
            class="toggle-address-links w-100 mt-0 text-black-50
              d-flex align-items-center justify-content-center"
            @click="showAddressLinks = !showAddressLinks"
          >
            <font-awesome-icon v-if="!showAddressLinks" icon="chevron-up" />
            <font-awesome-icon v-else icon="chevron-down" />
          </b-button>
          <div v-if="isCheckedOut && $route.name === 'address-detail'" class="col-12 p-0">
            <hr class="mb-2 mt-0" />
            <ActivityButtons :address="record" :selectedResponse="selectedResponse" />
            <hr class="my-2" />
          </div>
          <div class="p-0">
            <AddressLinks
              :class="{
                'slide-up': showAddressLinksToggle && showAddressLinks,
                'slide-down': showAddressLinksToggle && !showAddressLinks,
              }"
              :territoryId="territory.id"
              :addressId="record.id"
              :checkoutId="get(this.territory, 'status.checkout_id')"
            />
          </div>
        </div>
      </div>
    </div>
    <font-awesome-layers
      v-show="!isTerritoryBusy && ($route.name === 'address-list' || $route.name === 'phone-list')"
      class="ellipsis-v-static text-muted fa-1x"
      @click="toggleRightPanel"
    >
      <font-awesome-icon icon="ellipsis-v" class="mr-0"></font-awesome-icon>
    </font-awesome-layers>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import format from 'date-fns/format';
import get from 'lodash/get';
import intersection from 'lodash/intersection';
import AddressLinks from './AddressLinks';
import ActivityButton from './ActivityButton';
import Tags from './Tags';
import Notes from './Notes';
import ActivityButtons from './ActivityButtons';
import { format as formatPhone } from '../utils/phone';
import { NOT_ALLOWED } from '../store/modules/models/AddressModel';

export default {
  name: 'AddressCard',
  props: ['address', 'addressId', 'territoryId', 'incomingResponse', 'revealed', 'index', 'mode'],
  components: {
    AddressLinks,
    ActivityButton,
    Tags,
    Notes,
    ActivityButtons,
  },
  data() {
    return {
      record: {},
      isIncomingResponse: false,
      responseText: '',
      animate: false,
      currentOffset: 0,
      containerRight: 0,
      transform: '',
      clickedToOpen: false,
      isLogging: false,
      showAddressLinks: this.$route.name !== 'address-detail',
    };
  },
  created() {
    if (
      this.$route.name === 'address-detail'
      && !this.address && this.territory.addresses.length
    ) {
      const address = this.territory.addresses.find(a => a.id === this.addressId)
        || this.territory.addresses[0];
      this.record = address || {};
      this.setAddress(this.record);
    } else {
      this.record = this.address || {};
    }
  },

  methods: {
    ...mapActions({
      addLog: 'address/addLog',
      setAddress: 'address/setAddress',
      fetchPublisher: 'publisher/fetchPublisher',
    }),
    get,
    toggleRightPanel() {
      this.$emit('toggle-right-panel', this.index, this.revealed);
    },
    toggleLeftPanel() {
      this.$emit('toggle-left-panel', this.index, this.revealed);
    },
    async confirmClearStatus() {
      try {
        const h = this.$createElement;
        let publisherName = '';
        if (this.lastActivity.publisher_id === this.user.id) {
          publisherName = 'you';
        } else {
          await this.getLastActivityPublisher();
          if (this.publisher) {
            publisherName = this.publisher.firstname && this.publisher.lastname
              && `${this.publisher.firstname} ${this.publisher.lastname}`;
          } else {
            publisherName = 'a guest publisher';
          }
        }

        const message = h('p', {
          domProps: {
            innerHTML:
            `<div class="pb-3">
              ${publisherName ? `Updated by <b>${publisherName}</b> on ${this.formattedSelectedResponseTS}
            </div>` : ''}`,
          },
        });
        const value = await this.$bvModal.msgBoxConfirm([message], {
          title: `${this.record.addr1} ${this.record.addr2}`,
          centered: true,
          okTitle: 'Remove',
          cancelTitle: 'Close',
        });

        if (value) {
          this.isLogging = true;
          this.$emit('update-response', this.record, 'START', () => {
            this.isLogging = false;
          });
        }
      } catch (err) {
        // do nothing
      }
    },
    getPxValue(styleValue) {
      return Number(styleValue.substring(0, styleValue.indexOf('px')));
    },

    async getLastActivityPublisher() {
      const id = Number.parseInt(this.lastActivity.publisher_id, 10);
      await this.fetchPublisher({ id });
    },
  },
  computed: {
    ...mapGetters({
      loading: 'auth/loading',
      territory: 'territory/territory',
      updatedAddress: 'address/address',
      actionButtonList: 'address/actionButtonList',
      user: 'auth/user',
      publisher: 'publisher/publisher',
      isTerritoryBusy: 'territory/isBusy',
      isDesktop: 'auth/isDesktop',
      isCheckedOut: 'territory/isCheckedOut',
    }),
    showAddressLinksToggle() {
      return !this.isDesktop && (
        this.$route.name === 'address-detail'
        || this.$route.name === 'map-view'
      );
    },
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
      return this.record && this.record.phone && formatPhone(this.record.phone);
    },

    formattedSelectedResponseTS() {
      const parsed = Number(this.lastActivity.timestamp);
      const timestamp = Number.isNaN(parsed) ? this.lastActivity.timestamp : parsed;
      return format(new Date(timestamp), 'MM/dd/yy p');
    },
    lastActivity() {
      return get(this.record, 'lastActivity') || { value: 'START', timestamp: '' };
    },
    selectedResponse() {
      return this.lastActivity.value;
    },
    isMySelectedResponse() {
      const publisherId = get(this.lastActivity, 'publisher_id') || '';
      const userId = get(this.user, 'id') || '';
      return publisherId.toString() === userId.toString();
    },
    allowedToCall() {
      const tags = this.record.notes ? this.record.notes.split(',') : [];
      return intersection(NOT_ALLOWED, tags).length === 0;
    },
    notAllowedTag() {
      const tags = this.record.notes ? this.record.notes.split(',') : [];
      const notAllowedTags = intersection(NOT_ALLOWED, tags) || [];
      return notAllowedTags[0];
    },
    mapQueryParam() {
      return this.mode === 'map' ? '?origin=map-view' : '';
    },
    storageId() {
      return `foreignfield-${this.address.id}`;
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

    .slide-up {
      transition: 0.5s;
      height: 90px;
    }

    .slide-down {
      transition: 0.5s;
      height: 0px;
    }
  }
}
.address {
  display: flex;
  text-align: left;
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
.toggle-address-links {
  border-radius: 5px 5px 0 0;
  height: 25px;
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
