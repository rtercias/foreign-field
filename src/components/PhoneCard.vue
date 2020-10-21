<template>
  <div class="phone-card p-2 d-flex align-items-center justify-content-between">
    <font-awesome-layers class="ellipsis-v-static text-muted fa-1x" @click="toggleLeftPanel">
      <font-awesome-icon icon="ellipsis-v" class="ml-0"></font-awesome-icon>
    </font-awesome-layers>
    <div class="d-flex flex-column pl-0 col-8">
      <h5 class="mb-0 mr-auto">
        <a v-if="allowedToCall" :href="`tel:${phoneRecord.phone}`">{{ formattedPhone }}</a>
        <span v-else>{{ formattedPhone }}</span>
      </h5>
      <PhoneTags :phone="phoneRecord"></PhoneTags>
    </div>
    <div class="static-buttons col-3 pr-2 justify-content-end">
      <font-awesome-icon class="logging-spinner text-info" icon="circle-notch" spin v-if="isBusy">
      </font-awesome-icon>
      <div
        :class="{ hidden: selectedResponse === 'START' || isBusy }"
        class="d-flex flex-column">
        <ActivityButton
          class="selected-response fa-2x"
          :class="{ faded: !isMySelectedResponse || isIncomingResponse }"
          :value="selectedResponse"
          :next="'START'"
          :selected="true"
          :actionButtonList="actionButtonList"
          @button-click="confirmClearStatus">
        </ActivityButton>
      </div>
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
import ActivityButton from './ActivityButton';
import PhoneTags from './PhoneTags';

export default {
  name: 'PhoneCard',
  props: ['phoneRecord', 'addressId', 'incomingResponse', 'revealed', 'index'],
  components: {
    ActivityButton,
    PhoneTags,
  },
  data() {
    return {
      storageId: `foreignfield-${this.phoneRecord.id}`,
      isIncomingResponse: false,
      responseText: '',
      animate: false,
      currentOffset: 0,
      containerRight: 0,
      isRightPanelVisible: false,
      isLeftPanelVisible: false,
      transform: '',
      clickedToOpen: false,
      isBusy: false,
    };
  },
  methods: {
    ...mapActions({
      addLog: 'address/addLog',
      setPhone: 'phone/setPhone',
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
          this.phoneRecord.isBusy = true;
          await this.getLastActivityPublisher();
          publisherName = this.publisher.firstname && this.publisher.lastname
            && `${this.publisher.firstname} ${this.publisher.lastname}`;
          this.phoneRecord.isBusy = false;
        }
        const message = h('p', {
          domProps: {
            innerHTML:
            `<div class="pb-3">
              ${publisherName ? `Updated by <b>${publisherName}</b> on ${this.formattedSelectedResponseTS}
            </div>` : ''}
            <div class="fa-lg">Clear the status?</div>`,
          },
        });
        const value = await this.$bvModal.msgBoxConfirm([message], {
          title: this.phoneRecord.phone,
          centered: true,
        });
        if (value) {
          this.isBusy = true;
          this.$emit('update-response', this.phoneRecord, 'START', () => {
            this.isBusy = false;
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
  computed: {
    ...mapGetters({
      loading: 'auth/loading',
      actionButtonList: 'phone/actionButtonList',
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
      return this.phoneRecord && this.phoneRecord.phone
        && this.phoneRecord.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    },
    formattedSelectedResponseTS() {
      return this.phoneRecord.selectedResponseTS && format(new Date(this.phoneRecord.selectedResponseTS), 'M/d/yyyy') || '';
    },
    lastActivity() {
      return this.phoneRecord.lastActivity || { value: 'START', timestamp: '' };
    },
    selectedResponse() {
      return this.lastActivity.value;
    },
    isMySelectedResponse() {
      const publisherId = get(this.phoneRecord.lastActivity, 'publisher_id', '') || '';
      return publisherId.toString() === get(this.user, 'id', '').toString();
    },
    allowedToCall() {
      const notAllowed = ['INVALID', 'DNC'];
      const lastActivity = this.lastActivity || {};
      return !notAllowed.includes(lastActivity.value);
    },
  },
  watch: {
    incomingResponse(log) {
      if (log) {
        this.$set(this.phoneRecord, 'selectedResponse', log.value);
        this.$set(this.phoneRecord, 'selectedResponseTS', log.timestamp);
        this.isIncomingResponse = get(log, 'publisher_id', '').toString() !== get(this.user, 'id', '').toString();
      }
    },
  },
};
</script>
<style scoped>
.phone-card {
  min-height: 80px;
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
