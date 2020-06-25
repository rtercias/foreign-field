<template>
  <div class="address-tags w-100">
    <div class="read-only-tags mt-1">
      <b-badge pill class="mr-1" v-for="(x, i) in preview" :key="i" variant="primary">{{ x }}</b-badge>
    </div>
    <transition name="slide-up">
      <div v-show="!collapsed" class="tag-selection">
        <b-button-group class="pt-3 pl-2 pr-2 flex-wrap" size="sm">
          <div>
            <b-button
              pill
              class="tag-button mr-1 mb-1"
              size='sm'
              v-for="(tag, index) in combinedTags"
              :key="index"
              :pressed.sync="tag.state"
              @click="() => updateTag(tag)"
              :variant="tag.state ? 'primary' : 'outline-primary'">
              <span v-if="tag.state">
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

export default {
  data() {
    return {
      collapsed: true,
      availableTags: [
        'daysleeper',
        'spouse speaks Tagalog',
        'only Evening',
        'only Noon',
        'RANDOM',
        'cheeseburger',
        'movies',
        'zebras',
      ],
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
      const index = this.selectedTags.findIndex(t => t === tag.caption);

      this.$set(this.selectedTags, index, tag);
      this.setAddress(this.address);

      if (index !== -1 && !tag.state) {
        await this.removeTag({ addressId: this.address.id, userid: this.user.id, tag: tag.caption });
      } else {
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
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
    }),
    combinedTags() {
      const newArr = unionWith(this.selectedTags, this.availableTags);
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
  .read-only-tags {
    display: flex;
    flex-direction: row;
    white-space: nowrap;
    width: 90%;
    overflow: hidden;
  }
  .tag-selection {
    background-color: white;
    position: absolute;
    left: 0;
    bottom: 0;
    height: 100%;
  }
  .slide-up-enter-active, .slide-up-leave-active {
    transition: all .3s ease-in-out;
  }
  .slide-up-enter, .slide-up-leave-to {
    height: 0%;
  }
</style>
