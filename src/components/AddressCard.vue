<template>
  <div
    class="address-card-container p-2 d-flex align-items-center"
    :class="{
      'min-height-phone-address mb-2': $route.name === 'phone-list',
      'min-height': $route.name === 'address-list'
    }">
    <font-awesome-layers
      class="ellipsis-v-static text-muted fa-1x"
      @click="toggleLeftPanel">
      <font-awesome-icon icon="ellipsis-v" class="ml-0"></font-awesome-icon>
    </font-awesome-layers>
    <div class="w-100 row">
      <div class="address-card col-9 row justify-content-between align-items-start ml-0 mr-0 text-black-50"
        :class="{ 'min-height': $route.name === 'address-list' }">
        <div v-if="$route.name === 'phone-list'" class="pb-3 pl-2">
          <b-link
            class="w-100"
            :to="`/territories/${territory.id}/addresses/${address.id}/detail?origin=phone`">
            <div class="address text-primary font-weight-bold" :class="{ 'phone-address': $route.name === 'phone-list' }">
              {{address.addr1}} {{address.addr2}}
            </div>
            <div class="text-left small font-weight-bold">
              {{address.city}} {{address.state_province}} {{address.postal_code}}
            </div>
          </b-link>
        </div>
        <div v-else class="address flex-column pt-2 pb-4">
          <div>
            <h5 class="mb-0">
              <b-link :to="`/territories/${territory.id}/addresses/${address.id}/detail`">
                {{address.addr1}}
              </b-link>&nbsp;
            </h5>
            {{address.addr2}}
            <div class="mb-1">
              {{address.city}} {{address.state_province}} {{address.postal_code}}
            </div>
          </div>
        </div>
        <Tags
          :record="address"
          :variant="$route.name === 'phone-list' ? 'info' : ''"
          :class="{'pl-2': $route.name === 'phone-list'}"></Tags>
      </div>
      <div
        class="static-buttons col-3 ml-n1"
        :class="{ 'align-self-center': $route.name === 'phone-list' }">
        <font-awesome-icon
          class="text-info text-left fa-2x"
          icon="circle-notch"
          spin
          v-if="isLogging || address.isBusy"
        />
        <span
          v-else
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
            v-else
            class="selected-response fa-2x d-flex"
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
    <font-awesome-layers v-show="!isTerritoryBusy" class="ellipsis-v-static text-muted fa-1x" @click="toggleRightPanel">
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
import { format as formatPhone } from '../utils/phone';
import { NOT_ALLOWED } from '../store/modules/models/AddressModel';

export default {
  name: 'AddressCard',
  props: ['address', 'territoryId', 'incomingResponse', 'revealed', 'index', 'mode'],
  components: {
    AddressLinks,
    ActivityButton,
    Tags,
  },
  data() {
    return {
      storageId: `foreignfield-${this.address.id}`,
      isIncomingResponse: false,
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
      fetchPublisher: 'publisher/fetchPublisher',
    }),
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
          title: `${this.address.addr1} ${this.address.addr2}`,
          centered: true,
          okTitle: 'Remove',
          cancelTitle: 'Close',
        });

        if (value) {
          this.isLogging = true;
          this.$emit('update-response', this.address, 'START', () => {
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
      const congId = Number.parseInt(this.user.congregation.id, 10);
      await this.fetchPublisher({ id, congId });
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
    isMySelectedResponse() {
      const publisherId = get(this.lastActivity, 'publisher_id') || '';
      const userId = get(this.user, 'id') || '';
      return publisherId.toString() === userId.toString();
    },
    allowedToCall() {
      const tags = this.address.notes ? this.address.notes.split(',') : [];
      return intersection(NOT_ALLOWED, tags).length === 0;
    },
    notAllowedTag() {
      const tags = this.address.notes ? this.address.notes.split(',') : [];
      const notAllowedTags = intersection(NOT_ALLOWED, tags) || [];
      return notAllowedTags[0];
    },
  },

  watch: {
    incomingResponse(log) {
      if (log) {
        this.$set(this.address, 'selectedResponse', log.value);
        this.$set(this.address, 'selectedResponseTS', log.timestamp);

        const publisherId = get(log, 'publisher_id') || '';
        const userId = get(this.user, 'id') || '';
        this.isIncomingResponse = publisherId.toString() !== userId.toString();
      }
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

@media print {
  .interaction {
    display: none;
  }

  .address a {
    text-decoration: none;
  }
}
</style>
