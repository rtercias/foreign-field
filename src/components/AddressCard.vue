<template>
  <div class="address-card-container p-2 d-flex align-items-center">
    <div class="w-100">
      <div class="address-card row justify-content-between align-items-start pr-2 text-black-50">
        <div class="address col-9 flex-column pt-2 pb-4">
          <div>
            <h5 class="mb-0">
              <b-link :to="`/territories/${group}/${territoryId}/addresses/${address.id}/detail`">
                {{address.addr1}}
              </b-link>&nbsp;
            </h5>
            {{address.addr2}}
            <div class="mb-1">
              {{address.city}} {{address.state_province}} {{address.postal_code}}
            </div>
          </div>
        </div>
        <div class="static-buttons col-3 pt-3 pr-2 justify-content-end">
          <font-awesome-icon class="logging-spinner text-info" icon="circle-notch" spin v-if="isLogging"></font-awesome-icon>
          <div
            :class="{ hidden: address.selectedResponse === 'START' || isLogging }"
            class="d-flex flex-column">
            <ActivityButton
              class="selected-response fa-2x"
              :class="{ faded: !isMySelectedResponse || isIncomingResponse }"
              :value="address.selectedResponse"
              :next="'START'"
              :selected="true"
              :actionButtonList="actionButtonList"
              @button-click="confirmClearStatus">
            </ActivityButton>
          </div>
        </div>
      </div>
      <AddressTags :address="address" v-on="$listeners"></AddressTags>
    </div>
    <font-awesome-layers class="ellipsis-v-static text-muted fa-1x" @click="toggleRightPanel">
      <font-awesome-icon icon="ellipsis-v" class="mr-0"></font-awesome-icon>
    </font-awesome-layers>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import format from 'date-fns/format';
import get from 'lodash/get';
import AddressLinks from './AddressLinks';
import ActivityButton from './ActivityButton';
import AddressTags from './AddressTags';
import { format as formatPhone } from '../utils/phone';

export default {
  name: 'AddressCard',
  props: ['address', 'territoryId', 'group', 'incomingResponse', 'revealed', 'index'],
  components: {
    AddressLinks,
    ActivityButton,
    AddressTags,
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
      fetchAddress: 'address/fetchAddress',
      getTerritory: 'territory/getTerritory',
      fetchPublisher: 'publisher/fetchPublisher',
    }),
    toggleRightPanel() {
      this.$emit('togglePanel', this.index, this.revealed);
    },
    async confirmClearStatus() {
      try {
        const h = this.$createElement;
        let publisherName = '';
        if (this.lastActivity.publisher_id === this.user.id) {
          publisherName = 'you';
        } else {
          await this.getLastActivityPublisher();
          publisherName = this.publisher.firstname && this.publisher.lastname
            && `${this.publisher.firstname} ${this.publisher.lastname}`;
        }

        const message = h('p', {
          domProps: {
            innerHTML:
            `<div class="pb-3">
              ${publisherName ? `Updated by <b>${publisherName}</b> on ${this.formattedSelectedResponseTS}
            </div>` : ''}
            <div class="fa-lg">Clear the address status?</div>`,
          },
        });
        const value = await this.$bvModal.msgBoxConfirm([message], {
          title: `${this.address.addr1} ${this.address.addr2}`,
          centered: true,
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
      const id = this.lastActivity.publisher_id;
      const congId = this.user.congregation.id;
      await this.fetchPublisher({ id, congId });
    },
  },
  mounted() {
    this.setAddress(this.address);
    if (this.lastActivity) {
      this.$set(this.address, 'selectedResponse', this.lastActivity.value || this.START);
      this.$set(this.address, 'selectedResponseTS', Number(this.lastActivity.timestamp) || null);
    }
  },
  computed: {
    ...mapGetters({
      loading: 'auth/loading',
      territory: 'territory/territory',
      updatedAddress: 'address/address',
      actionButtonList: 'address/actionButtonList',
      user: 'auth/user',
      publisher: 'publisher/publisher',
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
      const timestamp = Number(this.lastActivity.timestamp);
      if (!Number.isNaN(timestamp)) {
        return format(new Date(timestamp), 'MM/dd/yy p');
      }
      return '';
    },
    lastActivity() {
      return this.address.lastActivity || { value: 'START', timestamp: '' };
    },
    isMySelectedResponse() {
      const publisherId = get(this.address.lastActivity, 'publisher_id', '') || '';
      return publisherId.toString() === get(this.user, 'id', '').toString();
    },
  },

  watch: {
    incomingResponse(log) {
      if (log) {
        this.address.selectedResponse = log.value;
        this.address.selectedResponseTS = log.timestamp;
        this.isIncomingResponse = get(log, 'publisher_id', '').toString() !== get(this.user, 'id', '').toString();
      }
    },
  },
};
</script>
<style scoped>
.v-touch-address-card {
  touch-action: pan-y;
  height: 100%;
}
.address-card {
  display: flex;
  flex-direction: row;
  overflow: hidden;
  position: relative;
  transition: ease-in-out 0.3s  ;
  min-height: 60px;
}
.address {
  display: flex;
  text-align: left;
}
.nh-text {
  font-size: 0.5em;
}
.ellipsis-v, .ellipsis-v-static {
  cursor: pointer;
}
.static-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.selected-response {
  width: 60px;
  height: 40px;
  border-radius: 50%;
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
  position: absolute;
  right: 21px;
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
