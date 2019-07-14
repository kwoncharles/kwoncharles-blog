// @flow
import React from 'react';
import Author from './Author';
import Contacts from './Contacts';
import Copyright from './Copyright';
import Menu from './Menu';
import Tags from './Tags';
import styles from './Sidebar.module.scss';
import { Link } from 'gatsby';
import { useSiteMetadata, useTagsList } from '../../hooks';

type Props = {
  isIndex?: boolean,
};

const Sidebar = ({ isIndex }: Props) => {
  const { author, copyright, menu } = useSiteMetadata();
  const tags = useTagsList();

  return (
    <div className={styles['sidebar']}>
      <div className={styles['sidebar__inner']}>
        <Author author={author} isIndex={isIndex} />
        <Menu menu={menu} />
        <Contacts contacts={author.contacts} />
        {/* <Tags tags={tags}/> */}
        <Copyright copyright={copyright} />
      </div>
    </div>
  );
};

export default Sidebar;
