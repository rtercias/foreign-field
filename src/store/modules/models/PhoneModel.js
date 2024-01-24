import gql from 'graphql-tag';
import clone from 'lodash/clone';
import { InvalidPhoneError } from '../../exceptions/custom-errors';

export const model = gql`fragment PhoneModel on Phone {
  id
  congregationId
  parent_id
  territory_id
  type
  status
  phone
  notes
  sort
  create_user
  create_date
  update_user
  update_date
}`;

export const ACTION_BUTTON_LIST = [
  {
    type: 'fa-icon',
    value: 'START',
    text: '',
    icon: '',
    color: 'success',
    description: '(Cleared)',
  },
  {
    type: 'fa-icon',
    value: 'NA',
    text: 'NA',
    icon: '',
    color: 'warning',
    description: 'No Answer',
  },
  {
    type: 'fa-icon',
    value: 'CT',
    text: '',
    icon: 'check',
    color: 'success',
    description: 'Contacted',
  },
  {
    type: 'fa-icon',
    value: 'VM',
    text: '',
    icon: 'voicemail',
    color: 'success',
    description: 'Voicemail',
  },
  {
    type: 'fa-icon',
    value: 'LW',
    text: '',
    icon: 'envelope',
    color: 'success',
    description: 'Letter',
    disabledText: 'Do Not Mail',
  },
  {
    type: 'fa-icon',
    value: 'invalid',
    text: '',
    icon: 'ban',
    color: 'danger',
    description: 'Invalid',
  },
  {
    type: 'fa-icon',
    value: 'do not call',
    text: '',
    icon: 'ban',
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

export const LEFT_BUTTON_LIST = [
  'invalid',
  'confirmed',
  'do not call',
];

export const RIGHT_BUTTON_LIST = [
  'CT',
  'NA',
  'VM',
];

export const NOT_ALLOWED = [
  'invalid',
  'do not call',
];

export function validate(_phone, isNew) {
  const phone = clone(_phone);

  if (isNew && phone.id) {
    throw new InvalidPhoneError('Phone ID must be empty when adding a new phone');
  }
  if (!phone.congregationId) {
    throw new InvalidPhoneError('Congregation ID is required');
  }
  if (!phone.territory_id) {
    throw new InvalidPhoneError('Territory ID is required');
  }
  if (!Number.isInteger(phone.sort)) {
    phone.sort = 0;
  }
  if (!phone.phone) {
    throw new InvalidPhoneError('Phone is required');
  }
  if (phone.notes === null) {
    phone.notes = '';
  }

  const ignoredProperties = [
    'activityLogs', 'lastActivity', 'incomingResponse', 'selectedResponse', 'selectedResponseTS',
    'isBusy', 'editMode', 'create_date', 'update_date',
  ];

  for (const ignored of ignoredProperties) {
    if (ignored in phone) {
      delete phone[ignored];
    }
  }

  return phone;
}
