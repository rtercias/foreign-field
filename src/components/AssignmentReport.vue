<template>
  <table class="assignment-report">
    <thead>
      <tr class="w-100 p-3 pb-5">
        <td class="buttons w-100 d-flex justify-content-between align-items-center">
          <b-dropdown class="campaign-filter pr-2 py-1" left variant="outline-dark">
            <span slot="button-content">
              <font-awesome-icon icon="bolt" />
              <span class="pl-2" v-if="isDesktop">{{get(campaignMode, 'text')}}</span>
            </span>
            <b-dropdown-item
              class="d-block mr-0 pl-1"
              v-for="option in campaignOptions"
              :key="get(option, 'value')"
              :class="{ 'ml-n2': get(campaignMode, 'value') === get(option, 'value') }"
              @click="() => fetch({ campaignMode: option })">
              <font-awesome-icon
                class="selected mr-1"
                icon="check"
                v-if="get(campaignMode, 'value') === get(option, 'value')" />
              <span>{{get(option, 'text')}}</span>
            </b-dropdown-item>
          </b-dropdown>
          <b-dropdown class="survey-filter pr-2 py-1" left variant="outline-dark">
            <span slot="button-content">
              <font-awesome-icon icon="binoculars" />
              <span class="pl-2" v-if="isDesktop">{{get(surveyMode, 'text')}}</span>
            </span>
            <b-dropdown-item
              class="d-block mr-0 pl-1"
              v-for="option in surveyOptions"
              :key="get(option, 'value')"
              :class="{ 'ml-n2': get(surveyMode, 'value') === get(option, 'value') }"
              @click="() => fetch({ surveyMode: option })">
              <font-awesome-icon
                class="selected mr-1"
                icon="check"
                v-if="get(surveyMode, 'value') === get(option, 'value')" />
              <span>{{get(option, 'text')}}</span>
            </b-dropdown-item>
          </b-dropdown>
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
              <span class="pl-2" v-if="isDesktop">{{sortOptions.find(o => o.value === sortField).text}}</span>
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
      <tr v-if="campaignMode !== false" class="d-flex justify-content-end mr-5"><td>*Campaign Mode</td></tr>
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
                  <div class="box box-1">{{ record.publisher_name }}<span v-if="record.campaign">*</span></div>
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
import get from 'lodash/get';
import format from 'date-fns/format';
import isAfter from 'date-fns/isAfter';

const sortOptions = [
  { value: 'territory_name', text: 'Name' },
  { value: 'territory_description, territory_name', text: 'Description' },
];

const campaignOptions = [
  { value: undefined, text: 'Include Campaigns' },
  { value: false, text: 'Exclude Campaigns' },
  { value: true, text: 'Campaigns Only' },
];

const surveyOptions = [
  { value: undefined, text: 'Include Surveys' },
  { value: false, text: 'Exclude Surveys' },
  { value: true, text: 'Surveys Only' },
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
      campaignOptions,
      surveyOptions,
      campaignMode: campaignOptions[0],
      sortField: 'territory_name',
      surveyMode: surveyOptions[0],
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
    get,
    async fetch(params) {
      if (this.user && this.user.congregation.id !== this.congregationId) {
        this.$router.push('/unauthorized');
      }
      const campaignMode = get(params, 'campaignMode') || this.campaignMode;
      const surveyMode = get(params, 'surveyMode') || this.surveyMode;
      this.campaignMode = campaignMode;
      this.surveyMode = surveyMode;
      await this.fetchAssignmentRecords({
        congId: this.congregationId,
        campaignMode: campaignMode.value,
        surveyMode: surveyMode.value,
      });
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
