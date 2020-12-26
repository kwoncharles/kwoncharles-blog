// @flow
import React from 'react';
import { DiscussionEmbed } from 'disqus-react';
import { useSiteMetadata } from '../../../hooks';

type Props = {
  postTitle: string,
  postSlug: string
};

const Comments = ({ postTitle, postSlug }: Props) => {
  const { url, disqusShortname } = useSiteMetadata();

  if (!disqusShortname) {
    return null;
  }

  return (
    <DiscussionEmbed
      shortname={disqusShortname}
      config={{
        url: url + postSlug,
        identifier: postSlug,
        title: postTitle,
        language: 'ko'
      }}
    />
  );
};

export default Comments;
