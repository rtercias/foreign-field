export function displayName(publisher) {
  if (!publisher) return '';
  if (publisher.firstname && publisher.lastname) {
    return `${publisher.firstname} ${publisher.lastname}`;
  }
  return publisher.username;
}
