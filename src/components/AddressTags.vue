<template>
  <div>
    <div class="tag-container">
      <b-badge class="mr-1" v-for="(x, i) in notesPreview" :key="i" variant="light">{{ x }}</b-badge>
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
              {{ tag.caption }}
            </b-button>
          </div>
        </b-button-group>
      </div>
    </transition>
    <div class="expand-notes">
    <b-badge v-on:click="collapsed = !collapsed" variant="light">
      <span v-if="collapsed">...</span>
      <span v-if="!collapsed">close</span>
    </b-badge>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  data() {
    return {
      collapsed: true,
      availableTags: [
        { caption: 'daysleeper', state: true },
        { caption: 'spouse speaks Tagalog', state: false },
        { caption: '🍔', state: false },
        { caption: 'cheeseburger', state: false },
      ],
      notes: [],
    };
  },

  name: 'AddressTags',
  props: ['address'],
  methods: {
    ...mapActions({
      addNote: 'address/addNote',
      removeNote: 'address/remoteNote',
      fetchAddress: 'address/fetchAddress',
    }),
    updateTag(tag) {
      const index = this.selectedTags.findIndex(t => t === tag.caption);

      if (index !== -1 && !tag.state) {
        this.removeNote(this.address.id, this.user.id, tag.caption);
      } else {
        this.addNote(this.address.id, this.user.id, tag.caption);
      }

      this.fetchAddress(this.address.id);
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
      return this.notes.slice(0, 2);
    },
  },
};
</script>

<style>
  .badge-light {
    background-color: #d9dcdf !important;
  }
  .expand-notes {
    position: absolute;
    right: 26px;
    bottom: 10px;
  }
  .tag-container {
    margin-left: 14px;
    display: flex;
    flex-direction: row;
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
