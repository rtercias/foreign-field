<template>
  <div
    class="phone-card p-2 my-2 text-left"
    :class="{ 'mb-2': isDesktop }">
    <div>
      <div v-if="!phoneRecord.editMode" class="d-flex justify-content-between mt-2">
        <div class="d-flex align-items-center">
          <AddressIcon :index="index+1" :record="phoneRecord" bg="light" />
          <h5 class="mb-0 ml-2">
            <a v-if="allowedToCall && !disabled" :href="`tel:${phoneRecord.phone}`">{{ formattedPhone }}</a>
            <span v-else>{{ formattedPhone }}</span>
          </h5>
        </div>
        <b-dropdown variant="light" right>
          <template #button-content>
            <font-awesome-icon icon="ellipsis-h" />
          </template>
          <b-dropdown-item @click="edit">Edit</b-dropdown-item>
          <b-dropdown-item @click="remove" variant="danger">Delete</b-dropdown-item>
        </b-dropdown>
      </div>
      <div v-else class="d-flex border-0">
        <the-mask
          class="form-control mr-2 pl-4"
          type="tel"
          :mask="'###-###-####'"
          :masked="false"
          v-model="phoneRecord.phone"
        >
        </the-mask>
        <b-button
          variant="white"
          class="cancel text-danger position-absolute px-2"
          @click="() => cancel(phoneRecord)"
        >
          <font-awesome-icon icon="times"></font-awesome-icon>
        </b-button>
        <b-button class="ml-1 text-primary" variant="light" @click="() => update(phoneRecord)">
          <font-awesome-icon v-if="phoneRecord.isBusy" icon="circle-notch" spin></font-awesome-icon>
          <font-awesome-icon v-else icon="save"></font-awesome-icon>
        </b-button>
      </div>
      <Tags :record="phoneRecord" class="mt-3" variant="info" />
      <ActivityLog :entity="phoneRecord" />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import format from 'date-fns/format';
import get from 'lodash/get';
import intersection from 'lodash/intersection';
import Tags from './Tags';
import AddressIcon from './AddressIcon';
import ActivityLog from './ActivityLog';
import { format as formatPhone, unmask } from '../utils/phone';
import { NOT_ALLOWED } from '../store/modules/models/PhoneModel';
import { TheMask } from 'vue-the-mask';
import { ADDRESS_STATUS } from '../store/modules/models/AddressModel';

export default {
  name: 'PhoneCard',
  props: ['phoneRecord', 'address', 'incomingResponse', 'revealed', 'index', 'editPhone', 'disabled'],
  components: {
    Tags,
    TheMask,
    AddressIcon,
    ActivityLog,
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
      oldPhone: '',
    };
  },
  methods: {
    ...mapActions({
      addLog: 'address/addLog',
      setPhone: 'phone/setPhone',
      fetchPublisher: 'publisher/fetchPublisher',
      phoneSearch: 'phone/phoneSearch',
      updatePhone: 'phone/updatePhone',
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
          if (this.publisher) {
            publisherName = this.publisher.firstname && this.publisher.lastname
              && `${this.publisher.firstname} ${this.publisher.lastname}`;
          } else {
            publisherName = `Unknown (ID: ${this.lastActivity.publisher_id})`;
          }
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
      await this.fetchPublisher({ id });
    },
    edit() {
      this.$set(this.phoneRecord, 'editMode', !this.phoneRecord.editMode);
    },
    cancel(phone) {
      if (this.oldPhone) this.$set(phone, 'phone', formatPhone(this.oldPhone));
      this.$set(phone, 'editMode', false);
    },
    async update(phone) {
      this.$set(phone, 'isBusy', true);
      const duplicates = await this.checkDuplicates(phone.phone, phone.id);
      if (duplicates) {
        this.$set(phone, 'isBusy', false);
        return;
      }
      phone.phone = unmask(phone.phone);
      await this.updatePhone(phone);
      this.$set(phone, 'editMode', false);
      this.$set(phone, 'isBusy', false);
    },
    async checkDuplicates(phone, id) {
      const title = formatPhone(phone);
      await this.phoneSearch({ congId: this.congId, searchTerm: phone });
      const searchResults = this.search.filter(s => s.address.status === ADDRESS_STATUS.Active.value);
      if (searchResults && searchResults.length) {
        // same record is ok
        if (id && searchResults.some(s => s.id === id)) return false;

        if (searchResults.some(s => s.parent_id === this.address.id)) {
          this.$bvModal.msgBoxOk('This number already exists.', { title, centered: true });
        } else {
          const terr = searchResults[0].territory;
          const h = this.$createElement;
          const message = h('p', {
            domProps: {
              innerHTML:
              `This number already exists in territory
              <b-link :to="/territories/${terr.id}">
                ${terr.name}
              </b-link>`,
            },
          });
          this.$bvModal.msgBoxOk(message, { title, centered: true });
        }
        return true;
      }

      return false;
    },
    async remove(phone) {
      this.$set(phone, 'isBusy', true);
      const response = await this.$bvModal.msgBoxConfirm(
        `Remove "${formatPhone(phone.phone)}" from the list?`, {
          title: 'Remove Phone',
          centered: true,
        }
      );

      if (response) {
        phone.phone = unmask(phone.phone);
        await this.updatePhone({ ...phone, status: ADDRESS_STATUS.Inactive.value });
      }
      this.$set(phone, 'isBusy', false);
    },
  },
  computed: {
    ...mapGetters({
      loading: 'auth/loading',
      actionButtonList: 'phone/actionButtonList',
      user: 'auth/user',
      publisher: 'publisher/publisher',
      isDesktop: 'auth/isDesktop',
      search: 'phone/search',
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
  .ellipsis-v-static {
    display: none;
  }
  .edit-phone {
    display: none;
  }
}
</style>
