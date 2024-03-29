'use strict';

module.exports = {
  site: {
    siteMetadata: {
      url: 'https://kwoncheol.me',
      title: 'Test title',
      subtitle: 'Test subtitle',
      copyright: 'Test copyright',
      disqusShortname: 'kwoncheol',
      postsPerPage: 4,
      menu: [
        {
          label: 'Test label 1',
          path: '/test/1/'
        },
        {
          label: 'Test label 2',
          path: '/test/2/'
        },
        {
          label: 'Test label 3',
          path: '/test/3/'
        }
      ],
      author: {
        name: 'Test name',
        photo: '/test.jpg',
        bio: 'Test bio',
        contacts: {
          email: 'skc7401@gmail.com',
          linkedin: 'kwoncheolshin',
          // twitter: '#',
          github: 'kwoncharles',
          // rss: '#'
        }
      }
    }
  }
};
