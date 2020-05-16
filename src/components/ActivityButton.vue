<template>
  <div class="interaction pl-2 pr-3">
    <span class="pl-0" v-if="get('type') === 'link'">
      <b-button
        class="p-0"
        variant="link"
        @click="click(value)"
        :disabled="loading">
        {{ get('text') }}
      </b-button>
    </span>
    <span class="pl-0" v-else-if="get('type') === 'fa-icon'">
      <font-awesome-layers
        :class="get('className')"
        @click="click(get('next') || get('value'))">
        <font-awesome-icon :icon="get('icon')" v-if="!!get('icon')"></font-awesome-icon>
        <font-awesome-layers-text
          :value="get('text')"
          class="nh-text text-white font-weight-bold">
        </font-awesome-layers-text>
      </font-awesome-layers>
    </span>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import debounce from 'lodash/debounce';

export default {
  name: 'ActivityButton',
  props: [
    'type',
    'value',
    'text',
    'icon',
    'className',
    'next',
    'displayOnly',
  ],
  methods: {
    ...mapActions({
      addLog: 'address/addLog',
    }),

    click: debounce(async function (value) {
      if (this.displayOnly) {
        this.$emit('display-click', value);
      } else {
        this.$emit('button-click', value);
      }
    }, 500, { leading: true, trailing: false }),

    get(property) {
      return this[property] || this.item[property];
    },
  },
  computed: {
    ...mapGetters({
      loading: 'auth/loading',
      actionButtonList: 'address/actionButtonList',
    }),
    item() {
      return this.actionButtonList.find(b => b.value === this.value) || {};
    },
  },
};
</script>
<style>
.nh-text {
  font-size: 0.5em;
}

.interaction {
  cursor: pointer;
  overflow: hidden;
}

@media print {
  .interaction {
    display: none;
  }
}
</style>
