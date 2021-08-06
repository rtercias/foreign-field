export const CongDefault = {
  options: {
    territories: {
      defaultSort: {
        options: [
          'Description',
          'Name',
        ],
      },
      daysAsRecent: 30,
    },
    territory: {
      defaultView: {
        options: [
          { value: 'address-list', text: 'Address List' },
          { value: 'phone-list', text: 'Phone List' },
        ],
      },
    },
    address: {
      customTags: '',
    },
    phone: {
      customTags: '',
    },
  },
};
