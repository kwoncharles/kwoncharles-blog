// @flow
import { ICONS } from '../constants';

const getIcon = (name: string) => {
  let icon;

  switch (name) {
    // case 'twitter':
    //   icon = ICONS.TWITTER;
    //   break;
    case 'github':
      icon = ICONS.GITHUB;
      break;
    case 'linkedin':
      icon = ICONS.LINKEDIN;
      break;
    case 'email':
      icon = ICONS.EMAIL;
      break;
    case 'rss':
      icon = ICONS.RSS;
      break;
    default:
      icon = {};
      break;
  }

  return icon;
};

export default getIcon;
