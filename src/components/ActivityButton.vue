<template>
  <div v-if="disabled"></div>
  <div
    v-else-if="get('type') === 'link'"
    class="interaction d-flex justify-content-center align-items-center"
    :class="{ [`bg-${get('color')}`]: !invert }">
    <span class="pl-0">
      <b-button
        :disabled="busy"
        class="p-0"
        variant="link"
        @click="click(value)">
        {{ get('text') }}
      </b-button>
    </span>
  </div>
  <b-button
    :disabled="busy"
    variant="link"
    v-else-if="displayOnly || get('type') === 'fa-icon'" @click="click(get('next') || get('value'))"
    class="interaction"
    :class="{ [`bg-${get('color')}`]: !invert, 'display-only': displayOnly }">
    <span>
      <font-awesome-layers
        v-if="get('icon')"
        class="fa-layers text-white"
        :class="{
          [`text-${get('color')}`]: invert,
          [`${value}-icon`]: true,
        }"
        @click="click(get('next') || get('value'))">
        <font-awesome-icon :icon="get('icon')" v-if="!!get('icon')"></font-awesome-icon>
        <font-awesome-icon icon="slash" v-if="isSlashed"
          :class="{ [`text-${get('color')}`]: invert }">
        </font-awesome-icon>
        <font-awesome-icon icon="slash" v-if="isSlashed"
          class="slash-shadow"
          :class="{ [`text-${get('color')}`]: !invert, [`text-${bg}`]: bg }">
        </font-awesome-icon>
        <font-awesome-layers-text
          :value="get('text')"
          class="font-weight-bold"
          :class="{
            [`text-${get('color')}`]: !invert,
            'text-white': invert,
            [`${value}-text`]: true,
          }">
        </font-awesome-layers-text>
      </font-awesome-layers>
      <span v-else
        :class="{
          [`${value}-text font-16`]: true,
          'text-white': invert,
        }">
        {{ get('text') }}
      </span>
    </span>
  </b-button>
  <div v-else class="interaction">
    <span>{{ get('text') }}</span>
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
    'bg',
    'inverted',
    'iconOnly',
    'busy',
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
      return this.displayOnly || this.selected || this.inverted;
    },
    isSlashed() {
      return this.slashed || this.get('slashed');
    },
    showDescription() {
      if (this.iconOnly) {
        return !this.iconOnly;
      }
      return !this.displayOnly && !this.selected && !!this.get('description');
    },
    getIcon() {
      return this.get('icon');
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
.font-16 {
  font-size: 16px;
}
.NA-icon, .VM-icon {
  svg.svg-inline--fa {
    left: -2px;
  }
}
.interaction {
  cursor: pointer;
  text-decoration: none;

  &.btn {
    &.display-only {
      text-decoration: none;
      cursor: default !important;
    }
    &:focus {
      box-shadow: none;
    }
  }

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

  &:hover {
    color: #fff;
    text-decoration: none;
  }
  &:focus {
    box-shadow: 0 0 0 rgb(255, 255, 255);
  }
}

@media print {
  .interaction {
    display: none;
  }
}
</style>
