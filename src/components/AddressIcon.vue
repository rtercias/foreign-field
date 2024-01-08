<template>
  <div>
    <font-awesome-icon
      v-if="isBusy"
      icon="circle-notch"
      spin
      class="busy"
      :class="{
        'text-primary': $route.name === 'address-list',
        'text-white': $route.name === 'phone-list' && record.type === 'Regular',
      }"
    />
    <ActivityButton
      v-else-if="notAllowedTag"
      class="selected-tag bg-danger text-white"
      :value="notAllowedTag"
      :actionButtonList="actionButtonList"
    />
    <ActivityButton
      v-else-if="selectedResponse() !== 'START'"
      class="selected-response"
      :class="{
        faded: !isMySelectedResponse() || isIncomingResponse,
      }"
      :value="selectedResponse()"
      :next="'START'"
      :actionButtonList="actionButtonList"
    />
    <ActivityButton
      v-else
      :class="{ [`bg-${bg}`]: bg }"
      :text="index"
    />
  </div>
</template>
<script>
import get from 'lodash/get';
import { mapGetters, mapActions } from 'vuex';
import {
  NOT_ALLOWED,
  ACTION_BUTTON_LIST as ADDRESS_ACTION_BUTTON_LIST,
} from '../store/modules/models/AddressModel';
import {
  ACTION_BUTTON_LIST as PHONE_ACTION_BUTTON_LIST,
} from '../store/modules/models/PhoneModel';
import ActivityButton from './ActivityButton.vue';

export default {
  name: 'AddressIcon',
  props: ['record', 'index', 'bg'],
  components: {
    ActivityButton,
  },
  data() {
    return {
      isIncomingResponse: false,
    };
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      publisher: 'publisher/publisher',
    }),
    notAllowedTag() {
      const tags = this.record.notes ? this.record.notes.split(',') : [];
      return NOT_ALLOWED.find(na => tags.some(t => t.includes(na)));
    },
    isBusy() {
      return get(this.record, 'isBusy') || false;
    },
    actionButtonList() {
      const buttonLists = {
        Regular: ADDRESS_ACTION_BUTTON_LIST,
        Phone: PHONE_ACTION_BUTTON_LIST,
      };

      return buttonLists[this.record.type];
    },
  },
  methods: {
    ...mapActions({
      fetchPublisher: 'publisher/fetchPublisher',
    }),
    async getLastActivityPublisher() {
      const publisherId = get(this.record, 'lastActivity.publisher_id');
      const id = Number.parseInt(publisherId, 10);
      await this.fetchPublisher({ id });
    },
    selectedResponse() {
      return get(this.record, 'lastActivity.value') || 'START';
    },
    isMySelectedResponse() {
      const publisherId = get(this.record, 'lastActivity.publisher_id') || '';
      const userId = get(this.user, 'id') || '';
      return publisherId.toString() === userId.toString();
    },
  },
};
</script>
<style scoped lang="scss">
  .busy {
    font-size: 30px;
  }

  .btn:hover {
    cursor: default;
  }
</style>
