<template>
  <div>
    <div v-show="collapsed" class="tag-container">
      <b-badge v-for="(x, i) in tagNotes" :key="i" variant="primary">{{ x }}</b-badge>
      <b-badge v-on:click="collapsed = !collapsed" variant="primary">...</b-badge>
    </div>
    <transition name="slide-up">
      <div v-show="!collapsed" class="tag-selection">
        <b-button-group class="flex-wrap" size="sm">
          <div>
            <b-button
            class="mr-1 mb-1"
            size='sm'
            v-for="(tag, index) in tags"
            :key="index"
            :pressed.sync="tag.state"
            v-on:click="updateTags"
            variant="outline-primary"
            >
              {{ tag.caption }}
            </b-button>
          </div>
        </b-button-group>
        <b-badge v-on:click="collapsed = !collapsed" variant="secondary">close</b-badge>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  data() {
    return {
      collapsed: true,
      tags: [
        { caption: 'daysleeper', state: true },
        { caption: 'spouse speaks Tagalog', state: false },
        { caption: '🍔', state: false },
        { caption: 'cheeseburger', state: false },
      ],
      tagNotes: [],
    };
  },

  name: 'Address',
  props: ['address'],
  methods: {
    dbtoArr() {
      this.tagNotes.push(this.address.notes);
    },
    updateTags() {
      this.tags.forEach((element) => {
        const index = this.tagNotes.indexOf(element.caption);

        if (!this.tagNotes.includes(element.caption)) {
          if (element.state === true) {
            this.tagNotes.push(element.caption);
          }
        } else if (element.state === false) {
          this.tagNotes.splice(index, 1);
        }
      });
    },
  },
  mounted() {
    this.dbtoArr();
  },
};
</script>

<style>
  .tag-selection {
    background-color: white;
    position: absolute;
    left: 0;
    bottom: 0;
    height: 100%;
  }
  .bottom-tags {
    text-align: left;
    color: #17a2b8;
  }
  .slide-up-enter-active, .slide-up-leave-active {
    transition: all .3s ease-in-out;
  }
  .slide-up-enter, .slide-up-leave-to {
    height: 0%;
  }
</style>
