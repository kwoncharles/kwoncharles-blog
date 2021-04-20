'use strict';

module.exports = {
  url: 'https://kwoncharles.netlify.com',
  pathPrefix: '/',
  title: 'Kwoncharles Blog',
  subtitle: '기술에 대해 이야기하고, 더 나은 삶에 대해 이야기합니다.',
  copyright: '© Powered by gatsby-starter-lumen and All rights reserved by Kwoncheol ',
  disqusShortname: 'kwoncheol',
  postsPerPage: 4,
  googleAnalyticsId: 'G-MEJPH4ECS6',
  menu: [
    {
      label: 'About me',
      path: '/pages/about'
    },
    {
      label: 'Post',
      path: '/'
    },
    {
      label: 'Tags',
      path: '/tags',
    }
    // {
    //   label: 'Contact me',
    //   path: '/pages/contacts'
    // }
  ],
  author: {
    name: '신 권철 (Charles)',
    photo: '/charles.jpeg',
    bio: '',
    contacts: {
      email: 'hello.kwon.charles@gmail.com',
      linkedin: 'kwoncheolshin',
      // twitter: '#',
      github: 'kwoncharles'
      // rss: '#'
    }
  }
};
