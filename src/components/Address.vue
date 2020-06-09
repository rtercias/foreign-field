<template>
  <div>
    <div class="tag-container">
      <b-badge class="mr-1" v-for="(x, i) in notes.slice(0, 2)" :key="i" variant="light">{{ x }}</b-badge>
    </div>
    <transition name="slide-up">
      <div v-show="!collapsed" class="tag-selection">
        <b-button-group class="pt-3 pl-2 pr-2 flex-wrap" size="sm">
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
      notes: [],
    };
  },

  name: 'Address',
  props: ['address'],
  methods: {
    dbtoArr() {
      this.notes.push(this.address.notes);
    },
    updateTags() {
      this.tags.forEach((element) => {
        const index = this.notes.indexOf(element.caption);

        if (!this.notes.includes(element.caption)) {
          if (element.state === true) {
            this.notes.splice(0, 0, element.caption);
          }
        } else if (element.state === false) {
          this.notes.splice(index, 1);
        }
      });
    },
  },
  mounted() {
    this.dbtoArr();
    this.updateTags();
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
