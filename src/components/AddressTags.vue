<template>
  <div class="address-tags w-100">
    <div class="preview-tags mt-1" :class="{ hidden: !collapsed }">
      <b-badge pill class="tag-button-preview mr-1" v-for="(x, i) in preview" :key="i" variant="primary">{{ x }}</b-badge>
    </div>
    <transition name="slide-up">
      <div v-show="!collapsed" class="tag-selection">
        <div class="text-secondary bg-light border-bottom font-weight-bold">Address Tags</div>
        <b-button-group class="pt-2 pb-2 pl-2 pr-2 flex-wrap" size="sm">
          <div class="combined-tags">
            <b-badge
              v-for="(tag, index) in combinedTags"
              pill
              class="tag-button mr-1 mb-1 border-primary"
              :class="{ active: false, 'd-none': readOnlyTag(tag), 'text-primary': !tag.state }"
              size='sm'
              :key="index"
              @click="() => updateTag(tag)"
              :variant="tag.state ? 'primary' : 'outline-primary'">
              <span v-if="tag.state && !readOnlyTag(tag)">
                <font-awesome-icon icon="times"></font-awesome-icon>
              </span>
                {{ tag.caption.toLowerCase() }}
            </b-badge>
          </div>
        </b-button-group>
      </div>
    </transition>
    <div class="expand-tags">
      <b-badge v-on:click="collapsed = !collapsed" variant="light">
        <span v-if="!collapsed">close</span>
        <span v-else-if="!preview || preview.length===0">new tag</span>
        <span v-else>...</span>
      </b-badge>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import unionWith from 'lodash/unionWith';
import map from 'lodash/map';
import get from 'lodash/get';
import startsWith from 'lodash/startsWith';
import addYears from 'date-fns/addYears';
import format from 'date-fns/format';

export default {
  data() {
    return {
      collapsed: true,
      language: get(this.user, 'congregation.language', 'Tagalog'),
    };
  },
  name: 'AddressTags',
  props: ['address'],
  methods: {
    ...mapActions({
      setAddress: 'address/setAddress',
      addTag: 'address/addTag',
      removeTag: 'address/removeTag',
      markAsDoNotCall: 'address/markAsDoNotCall',
      markAsNotForeign: 'address/markAsNotForeign',
      updateAddress: 'address/updateAddress',
    }),
    async updateTag(tag) {
      if (this.readOnlyTag(tag)) return;

      const index = this.selectedTags.findIndex(t => t === tag.caption);
      this.setAddress(this.address);

      if (index !== -1 && tag.state) {
        const confirm = await this.confirmRemoveTag(tag);
        if (confirm) {
          this.$set(this.selectedTags, index, tag);
          await this.removeTag({ addressId: this.address.id, userid: this.user.id, tag: tag.caption });
        }
      } else if (startsWith(tag.caption, 'do not call')) {
        await this.doNotCall(tag);
      } else if (startsWith(tag.caption, 'does not speak')) {
        await this.notForeign(tag);
      } else if (startsWith(tag.caption, 'invalid phone#')) {
        await this.invalidPhoneNumber(tag);
      } else {
        this.$set(this.selectedTags, this.selectedTags.length, tag);
        await this.addTag({ addressId: this.address.id, userid: this.user.id, tag: tag.caption });
      }

      this.$parent.$emit('address-updated');
      this.collapsed = true;
    },
    loadselectedTags() {
      this.availableTags.forEach((e) => {
        if (this.selectedTags.includes(e.caption)) {
          e.state = true;
        }
      });
    },
    async confirmRemoveTag(tag) {
      const response = await this.$bvModal.msgBoxConfirm(`Remove "${tag.caption}" tag?`, {
        title: `${this.address.addr1} ${this.address.addr2}`,
        centered: true,
      });

      return response;
    },
    async doNotCall(tag) {
      const response = await this.$bvModal.msgBoxConfirm('Press OK to mark this address as "Do Not Call".', {
        title: `${this.address.addr1} ${this.address.addr2} - Do Not Call`,
        centered: true,
      });

      if (response) {
        const datestamped = `${tag.caption} until ${format(addYears(new Date(), 1), 'P')}`;
        await this.markAsDoNotCall({ addressId: this.address.id, userid: this.user.id, tag: datestamped });
      }
    },
    async notForeign(tag) {
      const response = await this.$bvModal.msgBoxConfirm('Press OK to remove this address from the territory.', {
        title: `${this.address.addr1} ${this.address.addr2} - Remove address`,
        centered: true,
      });

      if (response) {
        await this.markAsNotForeign({ addressId: this.address.id, userid: this.user.id, tag: tag.caption });
      }
    },
    async invalidPhoneNumber(tag) {
      if (!this.address.phone) {
        this.$bvToast.toast('There is no phone number on record');
        return;
      }

      const response = await this.$bvModal.msgBoxConfirm(`Make phone # "${this.formattedPhone}" invalid`, {
        title: `${this.address.addr1} ${this.address.addr2} - Remove phone`,
        centered: true,
      });

      if (response) {
        const invalidPhoneNumberTag = `${tag.caption} ${this.formattedPhone}`;
        const updatedAddress = { ...this.address, phone: '' };

        await this.updateAddress(updatedAddress);
        await this.addTag({ addressId: this.address.id, userid: this.user.id, tag: invalidPhoneNumberTag });
      }
    },
    readOnlyTag(/* tag */) {
      return false;
      // Temporarily commented out this code to allow for user cleanup
      // return !this.availableTags.some(t => tag.caption.toLowerCase() === t.toLowerCase());
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
    }),
    availableTags() {
      return [
        'verify',
        'day sleeper',
        `wife speaks ${this.language}`,
        `husband speaks ${this.language}`,
        `does not speak ${this.language}`,
        'do not call',
        'deaf/mute',
        'blind',
        'business',
        'invalid phone#',
      ];
    },
    combinedTags() {
      const newArr = unionWith(this.selectedTags, this.availableTags,
        (t1, t2) => t1.toLowerCase() === t2.toLowerCase())
        .map(t => t.toLowerCase())
        .sort();
      const finalArr = map(newArr, x => ({ caption: x, state: this.selectedTags.includes(x) }));

      return finalArr;
    },
    selectedTags() {
      return (this.address.notes && this.address.notes
        .toLowerCase()
        .split(',')
        .filter(n => n.length))
        || [];
    },
    preview() {
      return [...this.selectedTags].reverse();
    },
    formattedPhone() {
      const { phone } = this.address;
      return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    },
  },
  mounted() {
    this.loadselectedTags();
  },
};
</script>

<style>
  .address-tags {
    min-height: 18px;
  }
  .expand-tags {
    position: absolute;
    right: 26px;
    bottom: 10px;
    cursor: pointer;
  }
  .preview-tags {
    display: flex;
    flex-direction: row;
    white-space: nowrap;
    width: 90%;
    overflow: hidden;
    font-size: large;
  }
  .combined-tags {
    font-size: large;
    color: initial;
  }
  .tag-selection {
    background-color: white;
    position: absolute;
    left: 0;
    bottom: 0;
    height: 100%;
    overflow-y: auto;
    padding-top: 2.5rem;
    margin-bottom: 2.5rem;
    overflow-x: hidden;
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
