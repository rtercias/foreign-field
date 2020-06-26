<template>
  <div class="address-tags w-100">
    <div class="preview-tags mt-1" :class="{ hidden: !collapsed }">
      <b-badge pill class="mr-1" v-for="(x, i) in preview" :key="i" variant="primary">{{ x }}</b-badge>
    </div>
    <transition name="slide-up">
      <div v-show="!collapsed" class="tag-selection">
        <b-button-group class="pt-2 pb-2 pl-2 pr-2 flex-wrap" size="sm">
          <div class="combined-tags">
            <b-button
              v-for="(tag, index) in combinedTags"
              pill
              class="tag-button mr-1 mb-1"
              :class="{ active: false, 'd-none': readOnlyTag(tag) }"
              size='sm'
              :key="index"
              @click="() => updateTag(tag)"
              :variant="tag.state ? 'primary' : 'outline-primary'">
              <span v-if="tag.state && !readOnlyTag(tag)">
                <font-awesome-icon icon="times"></font-awesome-icon>
              </span>
                {{ tag.caption.toLowerCase() }}
            </b-button>
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
      } else {
        this.$set(this.selectedTags, this.selectedTags.length, tag);
        await this.addTag({ addressId: this.address.id, userid: this.user.id, tag: tag.caption });
      }

      this.$parent.$emit('address-updated');
    },
    loadselectedTags() {
      this.availableTags.forEach((e) => {
        if (this.selectedTags.includes(e.caption)) {
          e.state = true;
        }
      });
    },
    async confirmRemoveTag(tag) {
      const value = await this.$bvModal.msgBoxConfirm(`Remove "${tag.caption}" tag?`, {
        title: `${this.address.addr1} ${this.address.addr2}`,
        centered: true,
      });

      return value;
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
        'daysleeper',
        `wife speaks ${this.language}`,
        `husband speaks ${this.language}`,
        `does not speak ${this.language}`,
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
      return (this.address.notes && this.address.notes
        .toLowerCase()
        .split(',')
        .filter(n => n.length))
        || [];
    },
    preview() {
      return [...this.selectedTags].reverse();
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
  }
  .preview-tags {
    display: flex;
    flex-direction: row;
    white-space: nowrap;
    width: 90%;
    overflow: hidden;
  }
  .tag-button.btn-outline-primary:hover {
    color: #007bff;
    background-color: transparent;
    border-color: #007bff;
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
</style>
