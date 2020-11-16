<template>
  <div class="phone-tags w-100">
    <div class="preview-tags mt-3" :class="{ 'd-none': !collapsed }">
      <b-button-group class="flex-wrap" size="sm">
        <div class="text-left">
          <b-badge
            v-for="(tag, index) in preview"
            pill
            class="d-flex tag-button mr-1 mb-1 border-primary text-white"
            size='sm'
            :key="index"
            :variant="highlight(tag) ? 'success' : 'danger'"
            @click="() => remove(tag)">
            <span class="mr-1"><font-awesome-icon icon="times"></font-awesome-icon></span>
            {{tag}}
          </b-badge>
        </div>
      </b-button-group>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import unionWith from 'lodash/unionWith';
import map from 'lodash/map';
import get from 'lodash/get';
import { format } from '../utils/phone';

export default {
  name: 'PhoneTags',
  props: ['phone', 'address'],
  data() {
    return {
      collapsed: true,
      language: get(this.user, 'congregation.language') || 'Tagalog',
      isSaving: false,
    };
  },
  methods: {
    ...mapActions({
      removeTag: 'phone/removeTag',
      updateAddress: 'address/updateAddress',
    }),
    loadselectedTags() {
      this.availableTags.forEach((e) => {
        if (this.selectedTags.includes(e.caption)) {
          e.state = true;
        }
      });
    },
    highlight(tag) {
      return tag === 'confirmed';
    },
    async remove(tag) {
      this.isSaving = true;
      const index = this.selectedTags.findIndex(t => t === tag);

      if (index !== -1) {
        const isAddressPhone = this.address.phone === this.phone.phone;
        const confirm = await this.$bvModal.msgBoxConfirm(`Remove "${tag}" tag?`, {
          title: `${format(this.phone.phone)}`,
          centered: true,
        });
        if (confirm) {
          const arrTags = this.phone.notes ? this.phone.notes.split(',') : [];
          this.$set(this.phone, 'notes', arrTags.filter(t => t !== tag).join(','));
          await this.removeTag({ phoneId: this.phone.id, userid: this.user.id, tag });
          if (isAddressPhone) {
            this.$set(this.address, 'phone', '');
            await this.updateAddress(this.address);
          }
        }
      }

      this.collapsed = true;
      this.isSaving = false;
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
    }),
    availableTags() {
      return [
        'invalid',
        'do not call',
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
      return (this.phone.notes && this.phone.notes
        .toLowerCase()
        .split(',')
        .filter(n => n.length))
        || [];
    },
    preview() {
      return this.selectedTags.sort();
    },
  },
  mounted() {
    this.loadselectedTags();
  },
};
</script>

<style lang="scss" scoped>
  .phone-tags {
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
