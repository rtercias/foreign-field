<template>
  <div v-if="disabled"></div>
  <div
    v-else-if="get('type') === 'link'"
    class="interaction d-flex justify-content-center align-items-center px-3"
    :class="{ [`bg-${get('color')}`]: !invert }">
    <span class="pl-0">
      <b-button
        class="p-0"
        variant="link"
        @click="click(value)">
        {{ get('text') }}
      </b-button>
    </span>
  </div>
  <div
    v-else-if="displayOnly || get('type') === 'fa-icon'" @click="click(get('next') || get('value'))"
    class="interaction d-flex flex-column justify-content-center align-items-center px-3"
    :class="{ [`bg-${get('color')}`]: !invert }">
    <span class="pl-0">
      <font-awesome-layers
        class="text-white fa-fw"
        :class="{ [`text-${get('color')}`]: invert }"
        @click="click(get('next') || get('value'))">
        <font-awesome-icon :icon="get('icon')" v-if="!!get('icon')"></font-awesome-icon>
        <font-awesome-icon icon="slash" v-if="isSlashed"
          :class="{ [`text-${get('color')}`]: invert }">
        </font-awesome-icon>
        <font-awesome-icon icon="slash" v-if="isSlashed"
          class="slash-shadow"
          :class="{ [`text-${get('color')}`]: !invert }">
        </font-awesome-icon>
        <font-awesome-layers-text
          :value="get('text')"
          class="nh-text font-weight-bold"
          :class="{ [`text-${get('color')}`]: !invert, 'text-white': invert }">
        </font-awesome-layers-text>
      </font-awesome-layers>
    </span>
    <span
      v-if="!displayOnly && !selected && !!get('description')"
      class="description"
      :class="{ [`text-${get('color')}`]: invert, 'text-white': !invert }">
      {{disabled ? get('disabledText') : get('description')}}
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
    'selected',
    'actionButtonList',
    'spin',
    'slashed',
    'disabled',
  ],
  methods: {
    ...mapActions({
      addLog: 'address/addLog',
    }),

    click: debounce(async function (value) {
      if (this.disabled) return;
      if (this.displayOnly) {
        this.$emit('display-click', value, this.item);
      } else {
        this.$emit('button-click', value, this.item);
      }
    }, 500, { leading: true, trailing: false }),

    get(property) {
      return this[property] || this.item[property];
    },
  },
  computed: {
    ...mapGetters({
      loading: 'auth/loading',
    }),
    item() {
      return this.actionButtonList && this.actionButtonList.find(b => b.value === this.value) || {};
    },
    invert() {
      return this.displayOnly || this.selected;
    },
    isSlashed() {
      return this.slashed || this.get('slashed');
    },
  },
};
</script>
<style lang="scss">
.swipeout-left, .swipeout-right {
  .interaction:nth-child(even) {
    opacity: 0.9;
  }
}
.nh-text {
  font-size: 0.5em;
}

.interaction {
  cursor: pointer;

  &.disabled {
    cursor: not-allowed;
  }
  .description {
    font-size: 7pt;
    white-space: nowrap;
  }
  .slash-shadow {
    top: 10px !important;
  }
}

@media print {
  .interaction {
    display: none;
  }
}
</style>
