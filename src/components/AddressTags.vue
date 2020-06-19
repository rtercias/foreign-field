<template>
  <div class="address-tags w-100">
    <div class="tagcontainerthing">
      <div class="read-only-tags w-100 mr-2">
        <b-badge class="mr-1" v-for="(x, i) in notesPreview" :key="i" variant="light">{{ x }}</b-badge>
      </div>
      <b-badge v-on:click="collapsed = !collapsed" variant="light">
        <span v-if="collapsed">...</span>
      </b-badge>
    </div>
    <transition name="slide-up">
      <div v-show="!collapsed" class="tag-selection">
        <b-button-group class="pt-3 pl-2 pr-2 flex-wrap" size="sm">
          <div>
            <b-button
            class="mr-1 mb-1"
            size='sm'
            v-for="(tag, index) in availableTags"
            :key="index"
            :pressed.sync="tag.state"
            @click="() => updateTag(tag)"
            variant="outline-primary"
            >
            <span v-if="tag.state">
              <b-badge variant="primary">
                <font-awesome-icon icon="times"></font-awesome-icon>
              </b-badge>
            </span>
              {{ tag.caption }}
            </b-button>
          </div>
        </b-button-group>
      </div>
    </transition>
    <div class="expand-notes">
      <b-badge v-on:click="collapsed = !collapsed" variant="light">
        <span v-if="!collapsed">close</span>
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
        { caption: 'daysleeper', state: false },
        { caption: 'spouse speaks Tagalog', state: false },
        { caption: 'RANDOM', state: false },
        { caption: 'cheeseburger', state: false },
        { caption: 'movies', state: false },
        { caption: 'zebras', state: false },
      ],
    };
  },

  name: 'AddressTags',
  props: ['address'],
  methods: {
    ...mapActions({
      addNote: 'address/addNote',
      removeNote: 'address/removeNote',
      fetchAddress: 'address/fetchAddress',
    }),
    async updateTag(tag) {
      const index = this.selectedTags.findIndex(t => t === tag.caption);

      if (index !== -1 && !tag.state) {
        await this.removeNote({ addressId: this.address.id, userid: this.user.id, note: tag.caption });
      } else {
        await this.addNote({ addressId: this.address.id, userid: this.user.id, note: tag.caption });
      }
    },
    loadselectedTags() {
      const newArr = unionWith(this.selectedTags, map(this.availableTags, 'caption'));
      // eslint-disable-next-line
      const finalArr = map(newArr, function (x) {
        return { caption: x, state: false };
      });

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
    selectedTags() {
      return this.address.notes.split(',');
    },
    notesPreview() {
      return this.address.notes.split(',');
    },
  },
  mounted() {
    this.loadselectedTags();
  },
};
</script>

<style>
  .badge-light {
    background-color: #d9dcdf !important;
  }
  .tagcontainerthing {
    display: flex;
    flex-direction: row;
  }
  .expand-notes {
    position: absolute;
    right: 26px;
    bottom: 10px;
  }
  .read-only-tags {
    display: flex;
    flex-direction: row;
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
