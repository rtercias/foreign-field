<template>
  <div>
    <b-modal
    ok-variant="outline-info"
    @submit="handleSubmit"
    ref="modal-note"
    footer-class="border-top-0"
    header-class="border-bottom-0"
    hide-header
    hide-footer
    centered>
      <div class="row align-items-center">
        <b-col cols="8">
          <form @submit.stop.prevent='handleSubmit'>
            <b-form-input v-model="formText" maxlength="25" placeholder="Add a tag..."/>
          </form>
        </b-col>
        <b-col cols="2">
          <span class="tag-counter">{{ formText.length }}/25</span>
        </b-col>
        <b-col cols="2" class="pl-0">
          <b-button variant="info" @click="handleSubmit">+</b-button>
        </b-col>
      </div>
    </b-modal>
    <b-row class="pl-2 pr-2 pt-2 bottom-tags align-items-center">
      <b-col cols="12">
        <div class="tag-container">
          <b-button-group size="sm">
            <b-button
            class="mr-1"
            v-for="(tag, index) in tags"
            :key="index"
            :pressed.sync="tag.state"
            variant="primary"
            >
              {{ tag.caption }}
            </b-button>
          </b-button-group>
        </div>
      </b-col>
    </b-row>
    <div class="align-items-center">
        <span @click="showModal">add a tag</span>
      </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      activeToggle: false,
      formText: '',
      tags: [
        { caption: 'daysleeper', state: false },
        { caption: 'wife is filipina', state: false },
        { caption: 'daysleeper', state: false },
      ],
    };
  },

  methods: {
    showModal() {
      this.$refs['modal-note'].show();
    },

    handleSubmit() {
      // The replace method gets rid of the spaces in the text field
      if (this.formText) {
        if (this.formText) {
          if (!this.tags.includes(this.formText)) {
            this.tags.unshift(this.formText.replace(/\s/g, '-'));
            this.formText = '';
            this.$nextTick(() => {
              this.$refs['modal-note'].hide();
            });
          }
        }
      }
    },
  },
};
</script>

<style>
  .bottom-tags {
    /* white-space: nowrap; */
    text-align: left;
    color: #17a2b8;
  }
  .tag-container {
    /* overflow: scroll; */
  }
  .tag-names-list {
    display: inline;
  }
</style>
