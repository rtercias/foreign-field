<template>
  <div class="activity-log w-100">
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
        @click="() => updateResponse(button.value)"
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
        <td>
          <b-button variant="link" class="remove-log px-0" @click="() => remove(log)">
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
import { mapActions, mapGetters } from 'vuex';
import format from 'date-fns/format';
import {
  ACTION_BUTTON_LIST,
  ADDRESS_RIGHT_BUTTON_LIST,
} from '../store/modules/models/AddressModel';

export default {
  name: 'ActivityLog',
  props: ['entity'],
  methods: {
    ...mapActions({
      addLog: 'address/addLog',
      removeLog: 'address/removeLog',
    }),
    async updateResponse(_value) {
      let value = _value;
      if (this.entity.selectedResponse === 'START' && value === 'START') {
        this.$set(this.entity, 'isBusy', false);
        return;
      }
      if (!this.actionButtonList(this.entity.type).some(b => b.value === value)) {
        value = 'START';
      }

      try {
        this.$set(this.entity, 'isBusy', true);
        await this.addLog({
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
    async remove({ id, value, timestamp }) {
      const description = this.getDescription(value);
      const date = this.formatDate(timestamp);
      const response = await this.$bvModal.msgBoxConfirm(`Remove ${description} record from ${date}?`, {
        title: 'Visit Record',
        centered: true,
      });

      if (response) {
        await this.removeLog({ id, entityId: this.entity.id });
      }
    },
  },
  computed: {
    ...mapGetters({
      territory: 'territory/territory',
    }),
    addressButtonList() {
      return ADDRESS_RIGHT_BUTTON_LIST
        .map(value => (
          ACTION_BUTTON_LIST.find((btn => btn.value === value))
        ));
    },
    actionButtonList() {
      if (this.entity.type === 'Regular') {
        return this.addressButtonList;
      }
      return this.phoneButtonList;
    },
    checkoutId() {
      return get(this.territory, 'status.checkout_id');
    },
    recentActivityLogs() {
      const logs = get(this.entity, 'activityLogs') || [];
      const ordered = orderBy(logs, ['timestamp'], ['desc']);
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
        width: 30%;
      }
      .log-description {
        width: 60%;
      }
      .remove-log {
        font-size: 12px;
      }
    }
  }


</style>
