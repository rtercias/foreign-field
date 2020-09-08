<template>
  <div
    class="activity-container pl-0 pr-2">
    <font-awesome-layers class="ellipsis-v text-muted fa-2x mr-8" @click="show">
      <font-awesome-icon icon="ellipsis-v"></font-awesome-icon>
    </font-awesome-layers>
    <div class="buttons" v-if="isTerritoryCheckedOut">
      <ActivityButton
        v-for="(button, index) in containerButtonList"
        :key="index"
        class="fa-2x"
        :value="button.value"
        @button-click="updateResponse">
      </ActivityButton>
    </div>
    <b-link
      class="text-info"
      :to="`/territories/${group}/${territoryId}/addresses/${address.id}/history`"
      @click="setAddress(address)">
      <font-awesome-layers class="text-info fa-2x">
        <font-awesome-icon icon="history"></font-awesome-icon>
      </font-awesome-layers>
    </b-link>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import ActivityButton from './ActivityButton';

const BUTTON_LIST = ['NH', 'HOME', 'PH', 'LW'];

export default {
  name: 'AddressActivityButtons',
  props: ['address', 'show', 'isTerritoryCheckedOut'],
  components: {
    ActivityButton,
  },
  methods: {
    ...mapActions({
      setAddress: 'address/setAddress',
    }),
    updateResponse(value) {
      this.$emit('update-response', value);
    },
  },
  computed: {
    ...mapGetters({
      loading: 'auth/loading',
      territory: 'territory/territory',
      updatedAddress: 'address/address',
      actionButtonList: 'address/actionButtonList',
    }),
    containerButtonList() {
      return this.actionButtonList.filter(b => BUTTON_LIST.includes(b.value));
    },
    group() {
      return this.territory && this.territory.group_code;
    },
    territoryId() {
      return this.territory && this.territory.id;
    },
  },
};
</script>
