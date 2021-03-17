<template>
  <div class="tags w-100">
    <div class="w-100 text-left">
      <b-button-group size="sm">
        <div class="combined-tags d-flex flex-wrap text-left">
          <b-badge
            v-for="(tag, index) in displayedTags"
            pill
            class="tag-button d-flex mr-1 mb-1 text-white small"
            :class="{
              active: false,
              [`border-${color(tag.caption)}`]: true,
              [`text-${color(tag.caption)}`]: !tag.state,
              'border-danger': tag.state && highlight(tag.caption),
            }"
            size='sm'
            :key="index"
            @click="() => updateTag(tag)"
            :variant="tag.state
              ? (highlight(tag.caption) ? 'danger' : color(tag.caption))
              : `outline-${color(tag.caption)}`">
            <span class="tag-text d-flex align-items-center small font-weight-bold">
              <font-awesome-icon icon="times" class="tag-icon mr-1" v-if="tag.state" />
              {{ formatLanguage(tag.caption.toLowerCase(), language) }}
            </span>
          </b-badge>
          <b-badge
            v-if="availableTags.length && !allTagsSelected"
            v-on:click="collapsed = !collapsed"
            pill
            class="tag-button border-info d-flex mr-1 mb-1"
            :class="`border-${variant}`"
            :variant="variant"
            size='sm'>
            <span class="tag-text d-flex align-items-center small" :class="{ 'text-white': variant === 'info' }">
              <span v-if="collapsed">add tag</span>
              <span v-else>done</span>
            </span>
          </b-badge>
        </div>
      </b-button-group>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import union from 'lodash/union';
import map from 'lodash/map';
import get from 'lodash/get';
import difference from 'lodash/difference';
import startsWith from 'lodash/startsWith';
import addYears from 'date-fns/addYears';
import format from 'date-fns/format';
import { format as formatPhone } from '../utils/phone';
import { ACTION_BUTTON_LIST } from '../store/modules/models/PhoneModel';
import {
  formatLanguage,
  ADDRESS_TAGS,
  PHONE_TAGS,
  PHONE_ADDRESS_TAGS,
  NF_TAG,
  DNC_TAG,
} from '../utils/tags';

export default {
  name: 'Tags',
  props: ['record', 'disabled', 'variant'],
  data() {
    return {
      collapsed: true,
      isSaving: false,
    };
  },
  methods: {
    ...mapActions({
      setAddress: 'address/setAddress',
      addTag: 'address/addTag',
      removeTag: 'address/removeTag',
      markAsDoNotCall: 'address/markAsDoNotCall',
      markAsNotForeign: 'address/markAsNotForeign',
      updateAddress: 'address/updateAddress',
      getTerritory: 'territory/getTerritory',
    }),
    formatLanguage,
    async updateTag(tag) {
      if (this.disabled) return;
      this.$set(this.record, 'isBusy', true);
      const index = this.selectedTags.findIndex(t => t === tag.caption);
      let cancel;

      this.setAddress(this.record);

      if (index !== -1 && tag.state) {
        const confirm = await this.confirmRemoveTag(tag);
        if (confirm) {
          this.setAddress(this.record);
          this.$set(this.selectedTags, index, tag.caption);
          await this.removeTag({ addressId: this.record.id, userid: this.user.id, tag: tag.caption });
        }
      } else if (startsWith(tag.caption, DNC_TAG)) {
        await this.doNotCall(tag);
      } else if (startsWith(tag.caption, NF_TAG)) {
        await this.notForeign(tag);
      } else {
        await this.addAddressTag(tag);
      }

      if (!cancel) {
        this.$parent.$emit('address-updated', this.updatedAddress);
      }

      this.collapsed = true;
      this.isSaving = false;
      this.$set(this.record, 'isBusy', false);
    },
    loadSelectedTags() {
      this.availableTags.forEach((e) => {
        if (this.selectedTags.includes(e.caption)) {
          e.caption = formatLanguage(e.caption, this.language);
          e.state = true;
        }
      });
    },
    async addAddressTag(tag) {
      if (this.user && this.record && this.selectedTags) {
        this.$set(this.selectedTags, this.selectedTags.length, tag);
        await this.addTag({ addressId: this.record.id, userid: this.user.id, tag: tag.caption });
      }
    },
    async confirmRemoveTag(tag) {
      const response = await this.$bvModal.msgBoxConfirm(
        `Remove "${formatLanguage(tag.caption, this.language)}" tag?`, {
          title: `${this.record.addr1} ${this.record.addr2}`,
          centered: true,
        }
      );

      return response;
    },
    async doNotCall(tag) {
      const response = await this.$bvModal.msgBoxConfirm('Press OK to mark this address as "Do Not Call".', {
        title: `${this.record.addr1} ${this.record.addr2} - Do Not Call`,
        centered: true,
      });

      if (response) {
        const datestamped = `${tag.caption} until ${format(addYears(new Date(), 1), 'P')}`;
        this.setAddress(this.record);
        await this.markAsDoNotCall({ addressId: this.record.id, userid: this.user.id, tag: datestamped });
        await this.getTerritory({ id: this.record.territory_id });
      }
    },
    async notForeign(tag) {
      const response = await this.$bvModal.msgBoxConfirm('Press OK to remove this address from the territory.', {
        title: `${this.record.addr1} ${this.record.addr2} - Remove address`,
        centered: true,
      });

      if (response) {
        this.setAddress(this.record);
        await this.markAsNotForeign({ addressId: this.record.id, userid: this.user.id, tag: tag.caption });
        await this.getTerritory({ id: this.record.territory_id });
      }
    },
    hasPhone() {
      if (!this.record.phone) {
        this.$bvToast.toast('There is no phone number on record', {
          variant: 'danger',
          solid: true,
          toaster: 'b-toaster-top-full',
        });
        return false;
      }

      return true;
    },
    highlight(tag) {
      const tagsToHighlight = ['no number', 'do not mail', 'do not call', 'invalid'];
      return tagsToHighlight.includes(tag);
    },
    hide(tag) {
      const hidden = ['invalid #', 'confirmed phone'];
      return hidden.some(t => startsWith(tag, t));
    },
    color(tag) {
      const button = ACTION_BUTTON_LIST.find(b => b.value === tag);
      return button ? button.color : 'primary';
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      updatedAddress: 'address/address',
      congregation: 'congregation/congregation',
    }),
    language() {
      return (get(this.congregation, 'language') || 'Tagalog').toLowerCase();
    },
    availableTags() {
      const tags = this.record.type === 'Phone' ? PHONE_TAGS : ADDRESS_TAGS;
      return union(tags, this.customTags).filter(t => t);
    },
    customTags() {
      const options = get(this.congregation, 'options', {});
      const record = this.record.type === 'Regular' ? options.address : options.phone;
      const tags = get(record, 'customTags', '');
      return tags.split(',').map(t => t.trim()) || [];
    },
    combinedTags() {
      const newArr = union(this.selectedTags, this.availableTags)
        .map(t => t.toLowerCase())
        .filter(t => t && !this.hide(t))
        .sort();

      const finalArr = map(newArr, x => ({ caption: x, state: this.selectedTags.includes(x) }));
      return finalArr;
    },
    selectedTags() {
      const notes = get(this.record, 'notes') || '';
      return (notes.toLowerCase().split(',').filter(n => n.length)) || [];
    },
    allTagsSelected() {
      return difference(this.availableTags, this.selectedTags).length === 0;
    },
    preview() {
      const all = this.selectedTags.sort();
      if (this.mode === 'phoneAddress') {
        return all.filter(t => PHONE_ADDRESS_TAGS.includes(t));
      }

      return all.filter(t => !this.hide(t)).map(t => ({ caption: t, state: true }));
    },
    displayedTags() {
      return this.collapsed ? this.preview : this.combinedTags;
    },
    formattedPhone() {
      const { phone } = this.record;
      return formatPhone(phone);
    },
  },
  mounted() {
    this.loadSelectedTags();
  },
};
</script>

<style>
  .tags {
    min-height: 18px;
    bottom: 10px;
  }
  .expand-tags {
    position: absolute;
    right: 13px;
    bottom: -3px;
    cursor: pointer;
  }
  .preview-tags {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    overflow: hidden;
    font-size: large;
  }
  .combined-tags {
    font-size: large;
    color: initial;
  }
  .slide-up-enter-active, .slide-up-leave-active {
    transition: all .3s ease-in-out;
  }
  .slide-up-enter, .slide-up-leave-to {
    height: 0%;
  }
  .tag-button {
    border: solid 1px;
    cursor: pointer;
    font-size: 14px;
  }
  .tag-icon {
    font-size: 16px;
  }
  .tag-text {
    font-size: 14px;
  }
  .tag-button-preview {
    cursor: pointer;
  }
</style>
