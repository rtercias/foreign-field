import toLower from 'lodash/toLower';
import { DO_NOT_CALL } from '../store/modules/models/AddressModel';

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

export function addTag(notes, _tag) {
  const tags = (notes || '').split(',') || [];
  const tag = _tag.charAt(0 === ',') ? _tag.substring(0) : _tag;
  if (!tags.includes(tag)) tags.push(tag);
  return tags.join(',');
}

export function removeTag(notes, tag) {
  const tags = (notes || '').split(',') || [];
  return tags.filter(t => toLower(t) !== toLower(tag)).join(',');
}

export function removeDoNotCallTag(notes) {
  const tags = (notes || '').split(',') || [];
  return tags.filter(t => !t.includes(DO_NOT_CALL)).join(',');
}
