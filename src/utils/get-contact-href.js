// @flow
const getContactHref = (name: string, contact: string) => {
  let href;

  switch (name) {
    // case 'twitter':
    //   href = `https://www.twitter.com/${contact}`;
    //   break;
    case 'github':
      href = `https://github.com/${contact}`;
      break;
    case 'linkedin':
      href = `https://www.linkedin.com/in/${contact}`;
      break;
    case 'email':
      href = `mailto:${contact}`;
      break;
    default:
      href = contact;
      break;
  }

  return href;
};

export default getContactHref;
