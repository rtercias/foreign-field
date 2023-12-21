<template>
  <div>
    <ActivityButton
      v-if="!allowedToCall"
      class="selected-tag"
      :value="notAllowedTag"
      :bg="$route.name === 'phone-list' ? 'light' : 'white'"
      :actionButtonList="actionButtonList"
    />
    <ActivityButton
      v-else-if="selectedResponse !== 'START'"
      class="selected-response"
      :class="{
        faded: !isMySelectedResponse || isIncomingResponse,
        hidden: record.isBusy,
      }"
      :value="selectedResponse"
      :next="'START'"
      :actionButtonList="actionButtonList"
      @button-click="confirmClearStatus"
    />
    <ActivityButton
      v-else
      :text="record.sort"
    />
  </div>
</template>
<script>
import intersection from 'lodash/intersection';
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
    allowedToCall() {
      const tags = this.record.notes ? this.record.notes.split(',') : [];
      return intersection(NOT_ALLOWED, tags).length === 0;
    },
    notAllowedTag() {
      const tags = this.record.notes ? this.record.notes.split(',') : [];
      const notAllowedTags = intersection(NOT_ALLOWED, tags) || [];
      return notAllowedTags[0];
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
    async confirmClearStatus() {
      try {
        const h = this.$createElement;
        let publisherName = '';
        if (this.lastActivity.publisher_id === this.user.id) {
          publisherName = 'you';
        } else {
          await this.getLastActivityPublisher();
          if (this.publisher) {
            publisherName = this.publisher.firstname && this.publisher.lastname
              && `${this.publisher.firstname} ${this.publisher.lastname}`;
          } else {
            publisherName = 'a guest publisher';
          }
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
          title: `${this.record.addr1} ${this.record.addr2}`,
          centered: true,
          okTitle: 'Remove',
          cancelTitle: 'Close',
        });

        if (value) {
          this.isLogging = true;
          this.$emit('update-response', this.record, 'START', () => {
            this.isLogging = false;
          });
        }
      } catch (err) {
        // do nothing
      }
    },
    async getLastActivityPublisher() {
      const id = Number.parseInt(this.lastActivity.publisher_id, 10);
      await this.fetchPublisher({ id });
    },
  },
};
</script>
<style scoped lang="scss">
</style>
