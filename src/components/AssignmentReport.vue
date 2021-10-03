<template>
  <table class="assignment-report">
    <thead>
      <tr class="w-100 p-3">
        <td class="buttons w-100 d-flex justify-content-between align-items-center">
          <b-form-radio-group v-model="campaignMode" class="text-left" :class="{ 'small': !isDesktop }">
            <b-form-radio :value="true"><span>No Campaigns</span></b-form-radio>
            <b-form-radio :value="undefined"><span>Include Campaigns</span></b-form-radio>
            <b-form-radio :value="false"><span>Campaign Mode Only</span></b-form-radio>
          </b-form-radio-group>
          <div>
            <span v-if="isDesktop" class="pr-2">Date Filter:</span>
            <the-mask
              class="date-filter text-center"
              :mask="'##/##/####'"
              :masked="true"
              placeholder="mm/dd/yyyy"
              v-model="dateFilter">
            </the-mask>
          </div>
          <b-dropdown class="sort-btn pr-2 py-1" right variant="outline-dark">
            <span slot="button-content">
              <font-awesome-icon icon="sort-amount-down-alt" />
              <span class="pl-1" v-if="isDesktop">{{sortOptions.find(o => o.value === sortField).text}}</span>
            </span>
            <b-dropdown-item
              class="d-block mr-0 pl-1"
              v-for="option in sortOptions"
              :key="option.value"
              :class="{ 'ml-n2': sortField === option.value }"
              @click="sortField = option.value">
              <font-awesome-icon class="selected mr-1" icon="check" v-if="sortField === option.value" />
              <span>{{option.text}}</span>
            </b-dropdown-item>
          </b-dropdown>
        </td>
      </tr>
      <tr><td>
        <h3 class="font-weight-bold mt-0">Territory Assignment Record (S-13)</h3>
      </td></tr>
    </thead>
    <tbody>
      <tr v-for="(group, groupIndex) in groupedRecords" :key="groupIndex">
        <td>
          <div class="flex justify-content-center">
            <div class="box-group">
              <div class="text-left font-weight-bold">Terr. No. {{ group[0].territory_name }}</div>
              <div v-if="sortField!=='territory_name'" class="terr-desc text-left small text-truncate">
                {{ group[0].territory_description }}
              </div>
              <div class="" v-for="(record, recordIndex) in group" :key="recordIndex">
                <div class="box box-main flex">
                  <div class="box box-1">{{ record.publisher_name }}</div>
                  <div class="row-2">
                    <div class="box box-2">{{ record.out }}</div>
                    <div class="box box-3">{{ record.in }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
    <tfoot></tfoot>
  </table>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { TheMask } from 'vue-the-mask';
import groupBy from 'lodash/groupBy';
import orderBy from 'lodash/orderBy';
import format from 'date-fns/format';
import isAfter from 'date-fns/isAfter';

const sortOptions = [
  { value: 'territory_name', text: 'Name' },
  { value: 'territory_description, territory_name', text: 'Description' },
];

export default {
  name: 'AssignmentReport',
  props: ['congregationId'],
  components: {
    TheMask,
  },
  data() {
    return {
      sortOptions,
      campaignMode: true,
      sortField: 'territory_name',
      dateFilter: '',
    };
  },
  async mounted() {
    await this.fetch();
  },
  methods: {
    ...mapActions({
      fetchAssignmentRecords: 'reports/fetchAssignmentRecords',
    }),
    async fetch() {
      if (this.user && this.user.congregation.id !== this.congregationId) {
        this.$router.push('/unauthorized');
      }
      const campaignMode = this.campaignMode === 'undefined' ? undefined : this.campaignMode;
      await this.fetchAssignmentRecords({ congId: this.congregationId, campaignMode });
    },
  },
  computed: {
    ...mapGetters({
      assignmentRecords: 'reports/assignmentRecords',
      loading: 'auth/loading',
      isDesktop: 'auth/isDesktop',
      user: 'auth/user',
    }),
    filteredRecords() {
      const records = this.assignmentRecords || [];
      if (!this.dateFilter) return records;
      return records.filter(r => isAfter(new Date(r.out), new Date(this.dateFilter)));
    },
    groupedRecords() {
      return groupBy(
        orderBy(this.filteredRecords, this.sortField.split(',')),
        'territory_name'
      );
    },
    reportDate() {
      return format(new Date(), 'MM/dd/yyyy p');
    },
  },
  watch: {
    async campaignMode() {
      await this.fetch();
    },
    user() {
      if (this.user && this.user.congregation.id !== this.congregationId) {
        this.$router.push('/unauthorized');
      }
    },
  },
};
</script>

<style scoped>
  .assignment-report {
    margin: 3px;
  }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  .assignment-report tr {
    display: inline-block;
    vertical-align: top;
  }
  .assignment-report td {
    padding: 0;
  }
  .flex {
    display: flex;
    flex-wrap: wrap;
  }
  .box-group {
    margin: 20px 0 70px 0;
    position: relative;
    top: 50px;
  }
  .page-break {
    display: none;
  }
  .box-main {
    flex-direction: column;
    border: 1px solid;
    margin: -1px 0 0 -1px;
    width: 195px;
    height: 60px;
  }
  .row-2 {
    display: flex;
  }
  .box-1 {
    border-bottom: 1px solid;
    min-height: 30px;
  }
  .box-2 {
    width: 95px;
    min-height: 28px;
    border-right: 1px solid;
  }
  .box-3 {
    width: 95px;
    min-height: 28px;
  }
  .date-filter {
    width: 120px;
  }
  .terr-desc {
    width: 195px;
  }
  @media print
  {
    .assignment-report {
      width: 125%;
    }
    .buttons {
      display: none !important;
    }
  }
</style>
