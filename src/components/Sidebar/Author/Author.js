// @flow
import React from 'react';
import { withPrefix, Link } from 'gatsby';
import styles from './Author.module.scss';

type Props = {
  author: {
    name: string,
    bio: string,
    photo: string
  },
  isIndex: ?boolean
};

const iconViewBox = '0 0 40 40';
const iconPaths = [
  'M3.44615311,11.6601601 C6.57294867,5.47967718 12.9131553,1.5 19.9642857,1.5 C27.0154162,1.5 33.3556228,5.47967718 36.4824183,11.6601601 L37.3747245,11.2087295 C34.0793076,4.69494641 27.3961457,0.5 19.9642857,0.5 C12.5324257,0.5 5.84926381,4.69494641 2.55384689,11.2087295 L3.44615311,11.6601601 Z',
  'M36.4824183,28.2564276 C33.3556228,34.4369105 27.0154162,38.4165876 19.9642857,38.4165876 C12.9131553,38.4165876 6.57294867,34.4369105 3.44615311,28.2564276 L2.55384689,28.7078582 C5.84926381,35.2216412 12.5324257,39.4165876 19.9642857,39.4165876 C27.3961457,39.4165876 34.0793076,35.2216412 37.3747245,28.7078582 L36.4824183,28.2564276 Z'
]

const Author = ({ author, isIndex }: Props) => (
  <div className={styles['author']}>
    <Link to="/">
      <img
        src={withPrefix(author.photo)}
        className={styles['author__photo']}
        alt={author.name}
      />
      <div className={styles.avatarHalo}>
        <svg className={styles['icon']} viewBox={iconViewBox}>
          <path d={iconPaths[0]} />
          <path d={iconPaths[1]} />
        </svg>
      </div>  
    </Link>

    { isIndex ? (
      <h1 className={styles['author__title']}>
        <Link className={styles['author__title-link']} to="/">{author.name}</Link>
      </h1>
    ) : (
      <h2 className={styles['author__title']}>
        <Link className={styles['author__title-link']} to="/">{author.name}</Link>
      </h2>
    )}
    <p className={styles['author__subtitle']}>{author.bio}</p>
  </div>
);

export default Author;
