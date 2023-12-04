<template>
  <div>
    <b-list-group v-if="!disabled" class="d-flex flex-row justify-content-between">
      <b-list-group-item
        v-for="(button, index) in rightButtonList(address)"
        :key="index"
        class="activity-button justify-content-center"
      >
        <ActivityButton
          :value="button.value"
          :text="button.text"
          :actionButtonList="actionButtonList"
          :slashed="button.slashed"
          :inverted="get(address, 'lastActivity.value') !== button.value"
          :busy="address.isBusy"
          :disabled="disabled"
          @button-click="() => updateResponse(address, button.value)"
        >
        </ActivityButton>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>
<script>
import get from 'lodash/get';
import intersection from 'lodash/intersection';
import ActivityButton from './ActivityButton';
import { mapGetters, mapActions } from 'vuex';
import {
  ADDRESS_RIGHT_BUTTON_LIST,
  NOT_ALLOWED as ADDRESS_NOT_ALLOWED,
} from '../store/modules/models/AddressModel';


export default {
  props: ['address'],
  components: {
    ActivityButton,
  },
  data: () => ({
    disabled: false,
  }),
  methods: {
    ...mapActions({
      addLog: 'address/addLog',
    }),
    get,
    rightButtonList(item) {
      const rightButtons = ADDRESS_RIGHT_BUTTON_LIST;

      if (!this.allowedToCall(item)) return [];
      return this.actionButtonList.filter(b => rightButtons.includes(b.value));
    },
    async updateResponse(entity, _value) {
      let value = _value;
      if (entity.selectedResponse === 'START' && value === 'START') {
        this.$set(entity, 'isBusy', false);
        return;
      }
      if (!this.actionButtonList.some(b => b.value === value)) {
        value = 'START';
      }

      try {
        this.$set(entity, 'isBusy', true);

        await this.addLog({
          entityId: entity.id,
          value,
          checkoutId: get(this.territory, 'lastActivity.checkout_id'),
        });

        this.$set(entity, 'isBusy', false);
      } catch (e) {
        console.error('Unable to save activity log', e);
      }
    },

    selectedNotAllowed(item) {
      const notes = get(item, 'notes', '') || '';
      const tags = notes ? notes.split(',') : [];
      const notAllowed = ADDRESS_NOT_ALLOWED;
      return intersection(notAllowed, tags) || [];
    },

    allowedToCall(item) {
      return this.selectedNotAllowed(item).length === 0;
    },
  },
  computed: {
    ...mapGetters({
      actionButtonList: 'address/actionButtonList',
      territory: 'territory/territory',
    }),
  },
};
</script>
<style scoped lang="scss">
  .activity-button {
    width: 33%;
    .interaction {
      width: 100%;
    }
  }
</style>
