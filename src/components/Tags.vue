<template>
  <div
    class="tags w-100 mt-2"
    :class="{
      'd-none': !selectedTags.length && !availableTags.length,
      'px-0': $route.name === 'map-view',
      'px-2': $route.name !== 'map-view',
    }"
  >
    <div class="w-100 text-left">
      <b-button-group size="sm">
        <div class="combined-tags d-flex flex-wrap text-left">
          <b-badge
            v-for="(tag, index) in displayedTags"
            class="badge tag-button d-flex mr-2 mb-2 p-2 border-0"
            :class="{
              active: false,
              'bg-danger': tag.state && highlight(tag.caption),
            }"
            size='sm'
            :key="index"
            :variant="tag.state && (highlight(tag.caption) ? 'danger' : 'light')"
            @click="(e) => e.stopPropagation()"
          >
            <span class="tag-text d-flex align-items-center small">
              <font-awesome-icon
                v-if="tag.state"
                class="tag-icon mr-1"
                icon="times"
                @click="() => updateTag(tag)"
              />
              {{ formatLanguage(tag.caption, language) }}
            </span>
          </b-badge>
          <b-badge
            v-if="availableTags.length && !allTagsSelected"
            @click="openAddDialog"
            class="tag-button add-tag mr-2 mb-2 p-2"
            size='sm'
          >
            <span class="tag-text d-flex align-items-center">
              <span v-if="collapsed">
                <font-awesome-icon icon="plus" class="tag-icon" />
                Add Note
              </span>
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
import toLower from 'lodash/toLower';
import difference from 'lodash/difference';
import startsWith from 'lodash/startsWith';
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
      addAddressTag: 'address/addTag',
      removeAddressTag: 'address/removeTag',
      addPhoneTag: 'phone/addTag',
      removePhoneTag: 'phone/removeTag',
      markAsDoNotCall: 'address/markAsDoNotCall',
      markAsNotForeign: 'address/markAsNotForeign',
      setPhone: 'phone/setPhone',
      setAddress: 'address/setAddress',
    }),
    toLower,
    formatLanguage,
    async updateTag(tag) {
      if (this.disabled) return;
      this.$set(this.record, 'isBusy', true);
      const index = this.selectedTags.findIndex(t => t === tag.caption);
      let cancel;

      if (index !== -1 && tag.state) {
        await this.removeTag(tag);
      } else if (startsWith(tag.caption, DNC_TAG)) {
        await this.doNotCall(tag);
      } else if (startsWith(tag.caption, NF_TAG)) {
        await this.notForeign(tag);
      } else {
        await this.addTag(tag);
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
    async addTag(tag) {
      if (this.user && this.record && this.selectedTags) {
        if (this.record.type === 'Phone') {
          await this.setPhone(this.record);
          await this.addPhoneTag({ phoneId: this.record.id, userid: this.user.id, tag: tag.caption });
        } else {
          await this.setAddress(this.record);
          await this.addAddressTag({ addressId: this.record.id, userid: this.user.id, tag: tag.caption });
        }
      }
    },
    async removeTag(tag) {
      const body = `Are you sure you want to delete the tag
        "${formatLanguage(tag.caption, this.language)}"?
      `;
      const response = await this.$bvModal.msgBoxConfirm(
        body, {
          title: 'Delete Tag',
          centered: true,
          okVariant: 'danger',
          okTitle: 'Delete',
        }
      );

      if (response) {
        if (this.record.type === 'Phone') {
          await this.setPhone(this.record);
          await this.removePhoneTag({ phoneId: this.record.id, userid: this.user.id, tag: tag.caption });
        } else {
          await this.setAddress(this.record);
          await this.removeAddressTag({ addressId: this.record.id, userid: this.user.id, tag: tag.caption });
        }
      }
    },
    async doNotCall(tag) {
      const response = await this.$bvModal.msgBoxConfirm('Press OK to mark this address as "Do Not Call".', {
        title: `${this.record.addr1} ${this.record.addr2} - Do Not Call`,
        centered: true,
      });

      if (response) {
        await this.markAsDoNotCall({ addr: this.record, userid: this.user.id, tag: tag.caption });
      }
    },
    async notForeign(tag) {
      const response = await this.$bvModal.msgBoxConfirm('Press OK to remove this address from the territory.', {
        title: `${this.record.addr1} ${this.record.addr2} - Remove address`,
        centered: true,
      });

      if (response) {
        await this.markAsNotForeign({ addressId: this.record.id, userid: this.user.id, tag: tag.caption });
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
    highlight(tag = '') {
      if (!tag) return false;
      const tagsToHighlight = ['no number', 'do not mail', 'do not call', 'invalid'];
      return tagsToHighlight.includes(tag)
        || tag.includes('not ')
        || tag.includes(' not ')
        || tag.includes('no ')
        || tag.includes(' no ');
    },
    hide(tag) {
      const hidden = ['invalid #', 'confirmed phone'];
      return hidden.some(t => startsWith(tag, t));
    },
    color(tag) {
      const button = ACTION_BUTTON_LIST.find(b => b.value === tag);
      return button ? button.color : 'primary';
    },
    collapseTags() {
      this.collapsed = !this.collapsed;
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      updatedAddress: 'address/address',
      congregation: 'congregation/congregation',
    }),
    language() {
      return toLower(get(this.congregation, 'language') || 'Tagalog');
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
        .map(t => toLower(t))
        .filter(t => t && !this.hide(t))
        .sort();

      const finalArr = map(newArr, x => ({ caption: x, state: this.selectedTags.includes(x) }));
      return finalArr;
    },
    selectedTags() {
      const notes = get(this.record, 'notes') || '';
      return (toLower(notes).split(',').filter(n => n.length)) || [];
    },
    allTagsSelected() {
      return difference(this.availableTags, this.selectedTags).length === 0;
    },
    preview() {
      const all = this.selectedTags.sort();
      const result = [];
      if (this.mode === 'phoneAddress') {
        result.push(...all.filter(t => PHONE_ADDRESS_TAGS.includes(t)));
      } else {
        result.push(...all.filter(t => !this.hide(t)));
      }

      if (result.length && typeof result[0] === 'string') {
        return result.map(t => ({ caption: t, state: true }));
      }

      return result;
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

<style scoped lang="scss">
  @import '../assets/foreign-field-theme.scss';
  $addressLinksHeight: 20px;

  .vh-16 {
    height: calc(16vh + $addressLinksHeight);
  }
  .vh-22 {
    height: calc(22vh + $addressLinksHeight);
  }
  .vh-37 {
    height: calc(37vh + $addressLinksHeight);
  }
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
    font-size: 16px;
  }
  .combined-tags {
    font-size: 16px;
    color: initial;
  }
  .slide-up-enter-active, .slide-up-leave-active {
    transition: all .3s ease-in-out;
  }
  .slide-up-enter, .slide-up-leave-to {
    height: 0%;
  }
  .tag-button {
    background-color: $extra-light;
    cursor: pointer;
    font-size: 14px;
  }
  .tag-icon {
    font-size: 10px;
  }
  .tag-text {
    font-size: 14px;
  }
  .tag-button-preview {
    cursor: pointer;
  }
  .add-tag {
    border: solid 1px;
    color: $secondary;
  }

  @media print {
    .tag-text {
      font-size: 24px !important;
    }
    .badge.add-tag {
      display: none !important;
    }
  }
</style>
