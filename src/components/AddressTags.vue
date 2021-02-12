<template>
  <div class="address-tags w-100">
    <div class="preview-tags" :class="{ 'd-none': !collapsed }">
      <b-button-group size="sm">
        <div class="d-flex flex-wrap">
          <b-badge
            v-for="(tag, index) in preview"
            pill
            class="tag-button mr-1 mb-1 text-white d-flex "
            :class="highlight(tag) ? 'border-danger' : 'border-primary'"
            size='sm'
            :key="index"
            :variant="highlight(tag) ? 'danger' : 'primary'"
            @click="() => mode === 'phoneAddress' && updateTag({ caption: tag, state: true })">
            <span v-if="mode === 'phoneAddress' && !readOnlyTag(tag) && !disabled" class="mr-1">
              <font-awesome-icon icon="times"></font-awesome-icon>
            </span>
              {{ formatLanguage(tag, language) }}
          </b-badge>
        </div>
      </b-button-group>
    </div>
    <div v-show="!collapsed" class="tag-selection w-100">
      <div v-if="isSaving" class="d-flex justify-content-center align-items-center h-100">
        <font-awesome-icon class="text-primary" icon="circle-notch" spin></font-awesome-icon>
      </div>
      <b-button-group v-else class="flex-wrap" size="sm">
        <div class="combined-tags text-left">
          <b-badge
            v-for="(tag, index) in combinedTags"
            pill
            class="tag-button mr-1 mb-1 border-primary"
            :class="{ active: false, 'text-primary': !tag.state }"
            size='sm'
            :key="index"
            @click="() => updateTag(tag)"
            :variant="tag.state ? (highlight(tag.caption) ? 'danger' : 'primary') : 'outline-primary'">
            <span v-if="tag.state && !readOnlyTag(tag)">
              <font-awesome-icon icon="times"></font-awesome-icon>
            </span>
              {{ formatLanguage(tag.caption.toLowerCase(), language) }}
          </b-badge>
        </div>
      </b-button-group>
    </div>
    <div class="expand-tags" v-if="mode !== 'phoneAddress' && !disabled">
      <b-badge v-on:click="collapsed = !collapsed" variant="light">
        <span v-if="!collapsed">done</span>
        <span v-else-if="!preview || preview.length===0">new tag</span>
        <span v-else>edit tags</span>
      </b-badge>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import union from 'lodash/union';
import map from 'lodash/map';
import get from 'lodash/get';
import startsWith from 'lodash/startsWith';
import addYears from 'date-fns/addYears';
import format from 'date-fns/format';
import { format as formatPhone } from '../utils/phone';
import {
  formatLanguage,
  ADDRESS_TAGS,
  PHONE_ADDRESS_TAGS,
  READ_ONLY_PHONE_ADDRESS_TAGS,
  NF_TAG,
  DNC_TAG,
} from '../utils/tags';

const READ_ONLY_ADDRESS_TAGS = [];

export default {
  name: 'AddressTags',
  props: ['address', 'mode', 'disabled'],
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
      if (this.disabled || this.readOnlyTag(tag.caption)) return;
      this.isSaving = true;
      const index = this.selectedTags.findIndex(t => t === tag.caption);
      let cancel;

      this.setAddress(this.address);

      if (index !== -1 && tag.state) {
        const confirm = await this.confirmRemoveTag(tag);
        if (confirm) {
          this.$set(this.address, 'isBusy', true);
          this.setAddress(this.address);
          this.$set(this.selectedTags, index, tag.caption);
          await this.removeTag({ addressId: this.address.id, userid: this.user.id, tag: tag.caption });
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
      this.$set(this.address, 'isBusy', false);
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
      if (this.user && this.address && this.selectedTags) {
        this.$set(this.selectedTags, this.selectedTags.length, tag);
        await this.addTag({ addressId: this.address.id, userid: this.user.id, tag: tag.caption });
      }
    },
    async confirmRemoveTag(tag) {
      const response = await this.$bvModal.msgBoxConfirm(
        `Remove "${formatLanguage(tag.caption, this.language)}" tag?`, {
          title: `${this.address.addr1} ${this.address.addr2}`,
          centered: true,
        }
      );

      return response;
    },
    async doNotCall(tag) {
      const response = await this.$bvModal.msgBoxConfirm('Press OK to mark this address as "Do Not Call".', {
        title: `${this.address.addr1} ${this.address.addr2} - Do Not Call`,
        centered: true,
      });

      if (response) {
        const datestamped = `${tag.caption} until ${format(addYears(new Date(), 1), 'P')}`;
        this.setAddress(this.address);
        await this.markAsDoNotCall({ addressId: this.address.id, userid: this.user.id, tag: datestamped });
        await this.getTerritory({ id: this.address.territory_id });
      }
    },
    async notForeign(tag) {
      const response = await this.$bvModal.msgBoxConfirm('Press OK to remove this address from the territory.', {
        title: `${this.address.addr1} ${this.address.addr2} - Remove address`,
        centered: true,
      });

      if (response) {
        this.setAddress(this.address);
        await this.markAsNotForeign({ addressId: this.address.id, userid: this.user.id, tag: tag.caption });
        await this.getTerritory({ id: this.address.territory_id });
      }
    },
    hasPhone() {
      if (!this.address.phone) {
        this.$bvToast.toast('There is no phone number on record', {
          variant: 'danger',
          solid: true,
          toaster: 'b-toaster-top-full',
        });
        return false;
      }

      return true;
    },
    readOnlyTag(tag = '') {
      const readOnlyTags = this.mode === 'phoneAddress' ? READ_ONLY_PHONE_ADDRESS_TAGS : READ_ONLY_ADDRESS_TAGS;
      return readOnlyTags.some(t => tag === t);
    },
    highlight(tag) {
      const tagsToHighlight = ['no number', 'do not mail'];
      return tagsToHighlight.includes(tag);
    },
    hide(tag) {
      const hidden = ['invalid #', 'confirmed phone'];
      return hidden.some(t => startsWith(tag, t));
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
      const all = ADDRESS_TAGS;

      if (this.mode === 'phoneAddress') {
        return all.filter(t => PHONE_ADDRESS_TAGS.includes(t));
      }

      return all;
    },
    combinedTags() {
      const newArr = union(this.selectedTags, this.availableTags)
        .map(t => t.toLowerCase())
        .filter(t => !this.hide(t))
        .sort();
      const finalArr = map(newArr, x => ({ caption: x, state: this.selectedTags.includes(x) }));

      return finalArr;
    },
    selectedTags() {
      const notes = get(this.address, 'notes') || '';
      return (notes.toLowerCase().split(',').filter(n => n.length)) || [];
    },
    preview() {
      const all = this.selectedTags.sort();
      if (this.mode === 'phoneAddress') {
        return all.filter(t => PHONE_ADDRESS_TAGS.includes(t));
      }

      return all.filter(t => !this.hide(t));
    },
    formattedPhone() {
      const { phone } = this.address;
      return formatPhone(phone);
    },
  },
  mounted() {
    this.loadSelectedTags();
  },
};
</script>

<style>
  .address-tags {
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
  .tag-selection {
    background-color: white;
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
  }
  .tag-button-preview {
    cursor: pointer;
  }
</style>
