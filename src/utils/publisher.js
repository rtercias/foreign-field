export function displayName(publisher) {
  if (!publisher) return '';
  if (publisher.firstname && publisher.lastname) {
    return `${publisher.firstname} ${publisher.lastname}`;
  }
  return publisher.username;
}

export function displayShortName(publisher) {
  if (!publisher) return '';
  if (publisher.firstname && publisher.lastname) {
    return `${publisher.firstname.charAt(0)}. ${publisher.lastname}`;
  }
  return publisher.username;
}
