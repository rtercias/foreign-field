<template>
  <div class="activity-log w-100" v-if="isCheckedOut && !isDisabled">
    <hr class="w-100 my-2" />
    <div class="d-flex justify-content-between align-items-center">
      <span v-if="$route.name === 'address-list'">Visit Record</span>
      <span v-if="$route.name === 'map-view'">Visit Record</span>
      <span v-if="$route.name === 'phone-list'">Call Record</span>
      <b-button
        variant="link"
        class="see-history pr-0"
        :to="{
          name: 'activity-history',
          params: { territoryId: territory.id, addressId: entity.id, checkoutId },
          query: { origin: $route.name }
        }"
      >
        See History
      </b-button>
    </div>
    <b-dropdown
      variant="info"
      class="add-record w-100 pt-1"
      menu-class="dropdown-items"
      dropup
      right
    >
      <template #button-content>
        <font-awesome-icon icon="plus" class="plus mr-1" />
        <span>Add Record</span>
      </template>
      <b-dropdown-header>Mark as...</b-dropdown-header>
      <b-dropdown-item
        v-for="button in actionButtonList" :key="button.value"
        @click="() => addRecord(button.value)"
        :variant="button.color === 'danger' && button.color || ''"
      >
        {{ button.description }}
      </b-dropdown-item>
    </b-dropdown>
    <table class="recent-logs w-100">
      <tr
        v-for="log = {} in recentActivity"
        :key="log.id"
        :class="getBgColor(log.value)"
      >
        <td class="text-left log-date pl-2">{{ formatDate(log.timestamp) }}</td>
        <td class="text-left log-description m">
          <b-button variant="link" class="p-0 text-decoration-none" @click="showLogDetails(log)">
            {{ getDescription(log.value) }}
          </b-button>
        </td>
        <td class="remove-log-container text-center">
          <b-button variant="link" class="remove-log p-0" @click="() => removeLog(log)">
            <font-awesome-icon icon="times" />
          </b-button>
        </td>
      </tr>
    </table>
  </div>
</template>
<script>
import get from 'lodash/get';
import orderBy from 'lodash/orderBy';
import startCase from 'lodash/startCase';
import { mapActions, mapGetters } from 'vuex';
import format from 'date-fns/format';
import { format as formatPhone } from '../utils/phone';
import {
  ACTION_BUTTON_LIST as ADDRESS_ACTION_BUTTON_LIST,
  ADDRESS_LEFT_BUTTON_LIST,
  ADDRESS_RIGHT_BUTTON_LIST,
  DO_NOT_CALL,
  DO_NOT_MAIL,
  INVALID,
} from '../store/modules/models/AddressModel';
import {
  ACTION_BUTTON_LIST as PHONE_ACTION_BUTTON_LIST,
  LEFT_BUTTON_LIST as PHONE_LEFT_BUTTON_LIST,
  RIGHT_BUTTON_LIST as PHONE_RIGHT_BUTTON_LIST,
} from '../store/modules/models/PhoneModel';

export default {
  name: 'ActivityLog',
  props: ['entity'],
  methods: {
    ...mapActions({
      addEntityLog: 'address/addLog',
      removeEntityLog: 'address/removeLog',
      markAsDoNotCall: 'address/markAsDoNotCall',
      addAddressTag: 'address/addTag',
      addPhoneTag: 'phone/addTag',
      setAddress: 'address/setAddress',
    }),
    async addRecord(value) {
      await this.setAddress(this.entity);
      if (this.isActivity(value)) {
        await this.addLog(value);
      } else {
        await this.addTag(value);
      }
    },
    async addTag(value) {
      const isAddress = this.entity.type === 'Regular';
      const isPhone = this.entity.type === 'Phone';

      const item = isAddress
        ? `${this.entity.addr1 || ''} ${this.entity.addr2 || ''}`
        : formatPhone(this.entity.phone);

      if (isAddress) {
        if (this.isDoNotCall(value)) {
          const message = `Are you sure you want to mark ${item} as a "${startCase(value)}"?`;
          const response = await this.$bvModal.msgBoxConfirm(message, {
            title: startCase(value),
            centered: true,
            okTitle: `Mark as ${startCase(value)}`,
            okVariant: 'danger',
          });

          if (response) {
            this.$set(this.entity, 'isBusy', true);
            await this.markAsDoNotCall({
              addr: this.entity,
              userid: this.user.id,
              tag: value,
            });
            this.$set(this.entity, 'isBusy', false);
          }
        } else {
          this.$set(this.entity, 'isBusy', true);
          await this.addAddressTag({
            addr: this.entity,
            userid: this.user.id,
            tag: value,
          });
          this.$set(this.entity, 'isBusy', false);
        }
      } else if (isPhone) {
        this.$set(this.entity, 'isBusy', true);
        await this.addPhoneTag({
          phoneRecord: this.entity,
          userid: this.user.id,
          tag: value,
        });
        this.$set(this.entity, 'isBusy', false);
      }
    },
    async addLog(_value) {
      let value = _value;
      if (this.entity.selectedResponse === 'START' && value === 'START') {
        return;
      }
      if (!this.actionButtonList.some(b => b.value === value)) {
        value = 'START';
      }

      try {
        await this.addEntityLog({
          entityId: this.entity.id,
          value,
          checkoutId: this.checkoutId,
          parentId: this.entity.parent_id,
          type: this.entity.type,
        });
      } catch (e) {
        console.error('Unable to save activity log', e);
      }
    },
    getActionButton(status, attr) {
      const actionButton = this.actionButtonList.find(btn => btn.value === status) || {};
      switch (attr) {
        case 'color':
          return `bg-light-${actionButton[attr] || 'light'}`;
        default:
          return actionButton[attr];
      }
    },
    getBgColor(status) {
      return this.getActionButton(status, 'color');
    },
    getDescription(status) {
      return this.getActionButton(status, 'description') || '(Cleared)';
    },
    formatDate(timestamp) {
      if (!timestamp || Number.isNaN(timestamp)) {
        return '';
      }
      const d = new Date(Number(timestamp));
      return format(d, 'MMM dd EEE');
    },
    async removeLog({ id, value, timestamp }) {
      await this.setAddress(this.entity);
      const description = this.getDescription(value);
      const date = this.formatDate(timestamp);
      const response = await this.$bvModal.msgBoxConfirm(`
        Are you sure you want to delete this "${description}" record from ${date}?
      `, {
        title: 'Delete Record',
        centered: true,
        okVariant: 'danger',
        okTitle: 'Delete',
      });

      if (response) {
        await this.removeEntityLog({
          id,
          entityId: this.entity.id,
          parentId: this.entity.parent_id,
          type: this.entity.type,
        });
      }
    },
    isDoNotCall(value) {
      return value && value.includes(DO_NOT_CALL);
    },
    isDoNotMail(value) {
      return value && value.includes(DO_NOT_MAIL);
    },
    isActivity(value) {
      return value && this.activityButtons.includes(value);
    },
    async showLogDetails(log) {
      const publisher = this.publishers.find(p => p.id === log.publisher_id);
      const publisherName = `${publisher.firstname} ${publisher.lastname}`;
      const message = `
        "${this.getDescription(log.value)}"
        added by ${publisherName}
        on ${this.formatDate(log.timestamp)}
      `;
      await this.$bvModal.msgBoxOk(message, {
        title: 'Activity Record',
        centered: true,
      });
    },
  },
  computed: {
    ...mapGetters({
      territory: 'territory/territory',
      user: 'auth/user',
      isCheckedOut: 'territory/isCheckedOut',
      publishers: 'publishers/publishers',
    }),
    activityButtons() {
      const list = {
        Regular: ADDRESS_RIGHT_BUTTON_LIST,
        Phone: PHONE_RIGHT_BUTTON_LIST,
      };

      return list[this.entity.type];
    },
    addressButtonList() {
      let activityButtons = ADDRESS_RIGHT_BUTTON_LIST;
      let tagButtons = ADDRESS_LEFT_BUTTON_LIST;

      if (this.includesDoNotMail) {
        // hide LW when marked 'do not mail'
        activityButtons = activityButtons.filter(btn => btn !== 'LW');
        // hide DO_NOT_MAIL when marked 'do not mail'
        tagButtons = tagButtons.filter(btn => this.includesDoNotMail && btn !== DO_NOT_MAIL);
      }

      if (this.includesDoNotCall) {
        // hide DO_NOT_CALL when marked 'do not call'
        tagButtons = tagButtons.filter(btn => btn !== DO_NOT_CALL);
      }

      const combined = [
        ...activityButtons,
        ...tagButtons,
      ];

      return combined.map(value => (
        ADDRESS_ACTION_BUTTON_LIST.find((btn => btn.value === value))
      ));
    },
    phoneButtonList() {
      const activityButtons = PHONE_RIGHT_BUTTON_LIST;
      const tagButtons = PHONE_LEFT_BUTTON_LIST;

      const combined = [
        ...activityButtons,
        ...tagButtons,
      ];

      return combined.map(value => (
        PHONE_ACTION_BUTTON_LIST.find((btn => btn.value === value))
      ));
    },
    actionButtonList() {
      const buttonLists = {
        Regular: this.addressButtonList,
        Phone: this.phoneButtonList,
      };

      return buttonLists[this.entity.type];
    },
    checkoutId() {
      return get(this.territory, 'status.checkout_id');
    },
    includesDoNotCall() {
      return (get(this.entity, 'notes') || '').includes(DO_NOT_CALL);
    },
    includesDoNotMail() {
      return (get(this.entity, 'notes') || '').includes(DO_NOT_MAIL);
    },
    includesInvalid() {
      return (get(this.entity, 'notes') || '').includes(INVALID);
    },
    isDisabled() {
      return this.includesDoNotCall || this.includesInvalid;
    },
    recentActivity() {
      const activityLogs = get(this.entity, 'activityLogs') || [];
      const filtered = activityLogs.filter(l => l.checkout_id === this.checkoutId);
      const ordered = orderBy(filtered, ['timestamp'], ['desc']);
      return ordered.slice(0, 3);
    },
  },
};
</script>
<style lang="scss">
  .activity-log {
    font-size: 16px;

    .see-history {
      font-size: 14px;
    }

    .add-record {
      font-size: 14px;

      .dropdown-toggle {
        padding: 8px 0;
        height: 37px;

        svg.plus {
          font-size: 10px;
          position: relative;
          top: -2px;
        }

        &::after {
          top: 14px;
          right: 11px;
          position: absolute;
        }
      }

      .dropdown-menu {
        li {
          width: 44%;

          &:first-of-type {
            width: 100%;
          }
        }
      }
    }

    .recent-logs {
      font-size: 14px;
      border-spacing: 0px 8px;
      border-collapse: separate;

      .log-date {
        width: 100px;
        max-width: 100px;
      }
      .remove-log-container {
        width: 34px;
        height: 32px;
        .remove-log {
          font-size: 12px;
        }
      }
    }
  }


</style>
