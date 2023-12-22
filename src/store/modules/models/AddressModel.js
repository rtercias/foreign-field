import gql from 'graphql-tag';
import clone from 'lodash/clone';
import intersection from 'lodash/intersection';
import { InvalidAddressError } from '../../exceptions/custom-errors';

const GEOCODE_CITY_TYPES = ['locality', 'sublocality'];
export const DO_NOT_CALL = 'do not call';
export const DO_NOT_MAIL = 'do not mail';
export const LETTER_WRITING = 'mail sent';

export const model = gql`fragment AddressModel on Address {
  congregationId
  territory_id
  type
  id
  addr1
  addr2
  city
  state_province
  postal_code
  phone
  longitude
  latitude
  notes
  status
  sort
  parent_id
  phones {
    id
    congregationId
    territory_id
    parent_id
    type
    status
    phone
    notes
    sort
    create_user
  }
}`;

export const ADDRESS_STATUS = {
  Active: { value: 'Active', text: 'Active' },
  Inactive: { value: 'Inactive', text: 'Inactive' },
  // NF: { value: 'NF', text: 'Does not speak #language#' },
  DNC: { value: 'DNC', text: 'Do not call' },
};

export const ACTION_BUTTON_LIST = [
  {
    type: 'fa-icon',
    value: 'START',
    text: '',
    icon: '',
    color: 'success',
  },
  {
    type: 'fa-icon',
    value: 'NH',
    text: 'NH',
    icon: '',
    color: 'warning',
    description: 'Not Home',
  },
  {
    type: 'fa-icon',
    value: 'HOME',
    text: '',
    icon: 'house-user',
    color: 'primary',
    description: 'Home',
  },
  {
    type: 'fa-icon',
    value: 'PH',
    text: '',
    icon: 'phone',
    color: 'info',
    description: 'Phone',
  },
  {
    type: 'fa-icon',
    value: 'LW',
    text: '',
    icon: 'envelope',
    color: 'success',
    description: 'Letter Sent',
    disabledText: 'Do Not Mail',
  },
  {
    type: 'fa-icon',
    value: 'no number',
    text: '',
    icon: 'phone-slash',
    color: 'danger',
    description: 'No Number',
  },
  {
    type: 'fa-icon',
    value: 'do not mail',
    text: '',
    icon: 'ban',
    color: 'danger',
    description: 'Do Not Mail',
    slashed: false,
  },
  {
    type: 'fa-icon',
    value: 'do not call',
    text: '',
    icon: 'minus-circle',
    color: 'danger',
    description: 'Do Not Call',
  },
  {
    type: 'fa-icon',
    value: 'confirmed',
    text: '',
    icon: 'check',
    color: 'success',
    description: 'Confirmed',
  },
];

export const ADDRESS_LEFT_BUTTON_LIST = [
  'do not call',
  'confirmed',
];

export const ADDRESS_RIGHT_BUTTON_LIST = [
  'HOME',
  'do not mail',
  'NH',
  'do not call',
  'LW',
];

export const PHONE_ADDRESS_RIGHT_BUTTON_LIST = [
  'LW',
];
export const PHONE_ADDRESS_LEFT_BUTTON_LIST = [
  'do not mail',
  'do not call',
];

export const NOT_ALLOWED = [
  'do not call',
  'do not mail',
];


export function validate(_address, isNew) {
  const address = clone(_address);

  if (isNew && address.id) {
    throw new InvalidAddressError('Address ID must be empty when adding a new address');
  }
  if (!address.congregationId) {
    throw new InvalidAddressError('Congregation ID is required');
  }
  if (!address.territory_id) {
    throw new InvalidAddressError('Territory ID is required');
  }
  if (!address.addr1) {
    throw new InvalidAddressError('Address 1 is required');
  }
  if (!address.city) {
    throw new InvalidAddressError('City is required');
  }
  if (!address.state_province) {
    throw new InvalidAddressError('State is required');
  }
  if (!Number.isInteger(address.sort)) {
    address.sort = 0;
  }

  // convert nullable fields to empty string when null
  if (address.addr2 === null) {
    address.addr2 = '';
  }

  if (address.postal_code === null) {
    address.postal_code = '';
  }

  if (address.phone === null) {
    address.phone = '';
  }

  if (address.notes === null) {
    address.notes = '';
  }

  const ignoredProperties = [
    'activityLogs', 'lastActivity', 'incomingResponse', 'selectedResponse', 'selectedResponseTS',
    'phones', 'type', 'parent_id', 'isBusy',
  ];

  for (const ignored of ignoredProperties) {
    if (ignored in address) {
      delete address[ignored];
    }
  }

  return address;
}

export function isCity(types) {
  const i = intersection(types, GEOCODE_CITY_TYPES);
  return i.length;
}
