<template>
  <div>
    <font-awesome-icon v-if="record.isBusy" icon="circle-notch" spin class="busy text-primary" />
    <ActivityButton
      v-else-if="notAllowedTag"
      class="selected-tag bg-danger text-white"
      :value="notAllowedTag"
      :actionButtonList="actionButtonList"
    />
    <ActivityButton
      v-else-if="selectedResponse !== 'START'"
      class="selected-response"
      :class="{
        faded: !isMySelectedResponse || isIncomingResponse,
      }"
      :value="selectedResponse"
      :next="'START'"
      :actionButtonList="actionButtonList"
    />
    <ActivityButton
      v-else
      :text="record.sort"
    />
  </div>
</template>
<script>
import get from 'lodash/get';
import { mapGetters, mapActions } from 'vuex';
import { NOT_ALLOWED } from '../store/modules/models/AddressModel';
import ActivityButton from './ActivityButton.vue';

export default {
  name: 'AddressIcon',
  props: ['record', 'index', 'mode', 'isLogging'],
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
      actionButtonList: 'address/actionButtonList',
    }),
    notAllowedTag() {
      const tags = this.record.notes ? this.record.notes.split(',') : [];
      return NOT_ALLOWED.find(na => tags.some(t => t.includes(na)));
    },
    lastActivity() {
      return get(this.record, 'lastActivity') || { value: 'START', timestamp: '' };
    },
    selectedResponse() {
      return this.lastActivity.value;
    },
    isMySelectedResponse() {
      const publisherId = get(this.lastActivity, 'publisher_id') || '';
      const userId = get(this.user, 'id') || '';
      return publisherId.toString() === userId.toString();
    },
  },
  methods: {
    ...mapActions({
      fetchPublisher: 'publisher/fetchPublisher',
    }),
    async getLastActivityPublisher() {
      const id = Number.parseInt(this.lastActivity.publisher_id, 10);
      await this.fetchPublisher({ id });
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
