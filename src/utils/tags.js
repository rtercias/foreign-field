export const ADDRESS_TAGS = [
  'verify',
  'day sleeper',
  'wife speaks #language#',
  'husband speaks #language#',
  'business',
];

export const PHONE_TAGS = [
];

export const PHONE_ADDRESS_TAGS = [
  'no number',
  'do not mail',
  'verify',
  'business',
];

export const READ_ONLY_PHONE_ADDRESS_TAGS = [
  'verify',
  'business',
];

export const NF_TAG = 'does not speak #language#';
export const DNC_TAG = 'do not call';

export function formatLanguage(tag = '', value) {
  return String(tag).replaceAll('#language#', value);
}
