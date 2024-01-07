<template>
  <div>
    <b-badge
      class="tag-button add-tag mr-2 mb-2 p-2"
      size='sm'
      @click="$bvModal.show(`tag-confirm-${id}`)"
    >
      <span class="tag-text d-flex align-items-center">
        <span>
          <font-awesome-icon icon="plus" class="tag-icon" />
          Add Note
        </span>
      </span>
    </b-badge>
    <b-modal
      :id="`tag-confirm-${id}`"
      :title="title"
      ok-title="Create"
      @ok="() => addTag()"
      footerClass="border-top-0 pt-0"
    >
      <div>
        <div v-if="availableTags.length" class="text-muted pb-2">
          Select from predefined notes:
        </div>
        <b-button
          v-for="(tag, index) in availableTags"
          :key="index"
          class="badge available-tags mr-2 mb-2 p-2 border-0"
          variant="light"
          @click="() => addTag(tag)"
        >
          {{ formatLanguage(tag, language) }}
        </b-button>
      </div>
      <hr v-if="availableTags.length" />
      <div>
        <div v-if="availableTags.length" class="text-muted pb-2">...or, create a new note:</div>
        <div v-else class="text-muted pb-2">
          Create a new note:
        </div>
        <input class="w-100" type="text" maxlength="30" v-model="newTag" />
      </div>
    </b-modal>
</div>
</template>
<script>
import get from 'lodash/get';
import { mapGetters, mapActions } from 'vuex';
import { formatLanguage } from '../utils/tags';
import { format as formatPhone } from '../utils/phone';

export default {
  name: 'TagConfirm',
  props: ['id', 'record', 'availableTags'],
  data() {
    return {
      newTag: '',
    };
  },
  computed: {
    ...mapGetters({
      language: 'congregation/language',
      user: 'auth/user',
    }),
    tags() {
      const notes = get(this.record, 'notes') || '';
      return notes.split(',');
    },
    title() {
      const labels = {
        'address-list': `${this.record.addr1} ${this.record.addr2 || ''}`,
        'phone-list': formatPhone(this.record.phone),
      };
      const description = labels[this.$route.name];
      return `Add new note for ${description}`;
    },
  },
  methods: {
    ...mapActions({
      addAddressTag: 'address/addTag',
      removeAddressTag: 'address/removeTag',
      addPhoneTag: 'phone/addTag',
      removePhoneTag: 'phone/removeTag',
      setPhone: 'phone/setPhone',
      setAddress: 'address/setAddress',
    }),
    formatLanguage,
    async addTag(_tag) {
      const tag = _tag || this.newTag;
      if (this.user && this.record) {
        if (this.record.type === 'Phone') {
          await this.setPhone(this.record);
          await this.addPhoneTag({ phoneId: this.record.id, userid: this.user.id, tag });
        } else {
          await this.setAddress(this.record);
          await this.addAddressTag({ addressId: this.record.id, userid: this.user.id, tag });
        }
      }
      this.$bvModal.hide(`tag-confirm-${this.id}`);
    },
  },
};
</script>
<style lang="scss">
  @import '../assets/foreign-field-theme.scss';

  .available-tags {
    font-size: 14px;
    color: initial;
    font-weight: 300;
    cursor: pointer;
  }

  .add-tag {
    border: solid 1px;
    color: $secondary;
    cursor: pointer;
    background: white;
  }
</style>
