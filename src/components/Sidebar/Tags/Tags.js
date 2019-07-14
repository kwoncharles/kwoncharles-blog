// @flow
import React from 'react';
import { Link } from 'gatsby';

type Tag = {
  fieldValue: string,
  totalCount: string,
}
type Props = {
  tags: Tag[]
}

const Tags = ({ tags }: Props) => (
  <div className={""}>
    <ul>
      {tags.map(tag => (
        <li>
          <Link to={`tag/${tag.fieldValue.toLowerCase().split(' ').join('-')}`} >
            {tag.fieldValue}{` (${tag.totalCount})`}
          </Link>
        </li>
      ))}
    </ul>
  </div>
)

export default Tags;