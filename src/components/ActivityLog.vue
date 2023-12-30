<template>
  <div class="activity-log w-100" v-if="isCheckedOut && !includesDoNotCall">
    <hr class="w-100 my-2" />
    <div class="d-flex justify-content-between align-items-center">
      <span>Visit Record</span>
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
        v-for="log in recentActivityLogs"
        :key="log.id"
        :class="getBgColor(log.value)"
      >
        <td class="text-left log-date pl-2">{{ formatDate(log.timestamp) }}</td>
        <td class="text-left log-description">{{ getDescription(log.value) }}</td>
        <td class="remove-log-container">
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
  ACTION_BUTTON_LIST,
  ADDRESS_LEFT_BUTTON_LIST,
  ADDRESS_RIGHT_BUTTON_LIST,
  DO_NOT_CALL,
  DO_NOT_MAIL,
} from '../store/modules/models/AddressModel';

export default {
  name: 'ActivityLog',
  props: ['entity'],
  methods: {
    ...mapActions({
      addAddressLog: 'address/addLog',
      removeAddressLog: 'address/removeLog',
      markAsDoNotCall: 'address/markAsDoNotCall',
      addAddressTag: 'address/addTag',
    }),
    async addRecord(value) {
      if (this.isDoNotCall(value) || this.isDoNotMail(value)) {
        await this.addTag(value);
      } else if (this.isActivity(value)) {
        await this.addLog(value);
      }
    },
    async addTag(value) {
      const item = this.entity.type === 'Regular'
        ? `${this.entity.addr1} ${this.entity.addr2}`
        : formatPhone(this.entity.phone);

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
          addressId: this.entity.id,
          userid: this.user.id,
          tag: value,
        });
        this.$set(this.entity, 'isBusy', false);
      }
    },
    async addLog(_value) {
      let value = _value;
      if (this.entity.selectedResponse === 'START' && value === 'START') {
        this.$set(this.entity, 'isBusy', false);
        return;
      }
      if (!this.actionButtonList.some(b => b.value === value)) {
        value = 'START';
      }

      try {
        this.$set(this.entity, 'isBusy', true);
        await this.addAddressLog({
          entityId: this.entity.id,
          value,
          checkoutId: this.checkoutId,
        });
        this.$set(this.entity, 'isBusy', false);
      } catch (e) {
        console.error('Unable to save activity log', e);
      }
    },
    getActionButton(status, attr) {
      const actionButton = ACTION_BUTTON_LIST.find(btn => btn.value === status) || {};
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
      return this.getActionButton(status, 'description');
    },
    formatDate(timestamp) {
      if (Number.isNaN(timestamp)) {
        return '';
      }
      const d = new Date(Number(timestamp));
      return format(d, 'MMM dd EEE');
    },
    async removeLog({ id, value, timestamp }) {
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
        await this.removeAddressLog({ id, entityId: this.entity.id });
      }
    },
    isDoNotCall(value) {
      return value.includes(DO_NOT_CALL);
    },
    isDoNotMail(value) {
      return value.includes(DO_NOT_MAIL);
    },
    isActivity(value) {
      return ADDRESS_RIGHT_BUTTON_LIST.includes(value);
    },
  },
  computed: {
    ...mapGetters({
      territory: 'territory/territory',
      user: 'auth/user',
      isCheckedOut: 'territory/isCheckedOut',
    }),
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
        ACTION_BUTTON_LIST.find((btn => btn.value === value))
      ));
    },
    actionButtonList() {
      return this.entity.type === 'Regular' ? this.addressButtonList : this.phoneButtonList;
    },
    checkoutId() {
      return get(this.territory, 'status.checkout_id');
    },
    recentActivityLogs() {
      const logs = get(this.entity, 'activityLogs') || [];
      const ordered = orderBy(logs, ['timestamp'], ['desc']);
      return ordered.slice(0, 3);
    },
    includesDoNotCall() {
      return this.entity.notes.includes(DO_NOT_CALL);
    },
    includesDoNotMail() {
      return this.entity.notes.includes(DO_NOT_MAIL);
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
