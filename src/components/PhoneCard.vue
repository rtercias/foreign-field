<template>
  <div class="phone-card p-2 mb-2 d-flex align-items-center justify-content-between">
    <font-awesome-layers class="left-panel-button ellipsis-v-static text-muted fa-1x" @click="toggleLeftPanel">
      <font-awesome-icon icon="ellipsis-v" class="ml-0"></font-awesome-icon>
    </font-awesome-layers>
    <div class="d-flex flex-column pl-4 col-9">
      <h5 class="mb-0 mr-auto">
        <a v-if="allowedToCall && !disabled" :href="`tel:${phoneRecord.phone}`">{{ formattedPhone }}</a>
        <span v-else>{{ formattedPhone }}</span>
        <font-awesome-icon
          class="edit-phone small text-primary ml-3"
          icon="pencil-alt"
          @click="edit">
        </font-awesome-icon>
      </h5>
      <Tags :record="phoneRecord" class="mt-3" variant="info" />
    </div>
    <div class="static-buttons col-3 pl-1">
      <font-awesome-icon class="logging-spinner text-info ml-3" icon="circle-notch" spin v-if="phoneRecord.isBusy" />
      <span v-else class="d-flex flex-column w-100">
        <ActivityButton
          v-if="!allowedToCall"
          class="fa-2x px-2 ml-n2"
          :value="notAllowedTag"
          :selected="true"
          :display-only="true"
          :actionButtonList="actionButtonList">
        </ActivityButton>
        <ActivityButton
          v-else
          class="selected-response fa-2x px-2"
          :class="{
            faded: !isMySelectedResponse || isIncomingResponse,
            hidden: selectedResponse === 'START' || phoneRecord.isBusy,
          }"
          :value="selectedResponse"
          :next="'START'"
          :selected="true"
          :actionButtonList="actionButtonList"
          @button-click="confirmClearStatus">
        </ActivityButton>
      </span>
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
import intersection from 'lodash/intersection';
import ActivityButton from './ActivityButton';
import Tags from './Tags';
import { format as formatPhone } from '../utils/phone';
import { NOT_ALLOWED } from '../store/modules/models/PhoneModel';

export default {
  name: 'PhoneCard',
  props: ['phoneRecord', 'address', 'incomingResponse', 'revealed', 'index', 'editPhone', 'disabled'],
  components: {
    ActivityButton,
    Tags,
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
          this.$set(this.phoneRecord, 'isBusy', true);
          await this.getLastActivityPublisher();
          publisherName = this.publisher.firstname && this.publisher.lastname
            && `${this.publisher.firstname} ${this.publisher.lastname}`;
          this.$set(this.phoneRecord, 'isBusy', false);
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
          title: this.formattedPhone,
          centered: true,
          okTitle: 'Remove',
          cancelTitle: 'Close',
        });
        if (value) {
          this.$set(this.phoneRecord, 'isBusy', true);
          this.$emit('update-response', this.phoneRecord, 'START', () => {
            this.$set(this.phoneRecord, 'isBusy', false);
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
    edit() {
      this.$set(this.phoneRecord, 'editMode', !this.phoneRecord.editMode);
      this.$emit('edit-phone', this.phoneRecord.phone);
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
      const phone = get(this, 'phoneRecord.phone') || '';
      return formatPhone(phone);
    },
    formattedSelectedResponseTS() {
      const parsed = Number(this.lastActivity.timestamp);
      const timestamp = Number.isNaN(parsed) ? this.lastActivity.timestamp : parsed;
      return format(new Date(timestamp), 'MM/dd/yy p');
    },
    lastActivity() {
      return get(this.phoneRecord, 'lastActivity') || { value: 'START', timestamp: '' };
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
      const tags = this.phoneRecord.notes ? this.phoneRecord.notes.split(',') : [];
      return intersection(NOT_ALLOWED, tags).length === 0;
    },
    hasConfirmed() {
      const notes = get(this.phoneRecord, 'notes', '') || '';
      return notes.includes('confirmed');
    },
    notAllowedTag() {
      const tags = this.phoneRecord.notes ? this.phoneRecord.notes.split(',') : [];
      const notAllowedTags = intersection(NOT_ALLOWED, tags) || [];
      return notAllowedTags[0];
    },
  },
  watch: {
    incomingResponse(log) {
      if (log && this.user && log.publisher_id !== this.user.id) {
        this.$set(this.phoneRecord, 'selectedResponse', log.value);
        this.$set(this.phoneRecord, 'selectedResponseTS', log.timestamp);
        this.isIncomingResponse = (get(log, 'publisher_id') || '').toString() !== (get(this.user, 'id') || '').toString();
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
.left-panel-button {
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
  position: absolute;
}
.edit-phone {
  cursor: pointer;
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
