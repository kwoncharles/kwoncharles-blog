---
title: SSR에서의 redux-saga
date: "2019-12-02T21:19:02.169Z"
template: "post"
draft: true
slug: "/posts/redux-saga-with-next-js/"
category: "Tech"
tags:
  - "Next.js"
  - "Server Side Rendering"
  - "Redux-saga"
  - "Generator"
description: "제너레이터 기반으로 동작하는 redux-saga는 SSR(Server Side Rendering)에서 어떻게 동작해야 할까요?"
---

> 이 글은 redux에 대한 이해가 있는 독자를 대상으로 작성했습니다.

## Intro

최근 SSR(Server Side Rendering, 이하 SSR) 작업을 할 일이 있었습니다. 사실 SSR의 개념만 알뿐 구현은 커녕 튜토리얼조차 해본 경험이 없었습니다. 

다행히 [여러가지](https://subicura.com/2016/06/20/server-side-rendering-with-react.html) [좋은](https://www.popit.kr/react-%EC%84%9C%EB%B2%84%EC%82%AC%EC%9D%B4%EB%93%9C-%EB%A0%8C%EB%8D%94%EB%A7%81/) [글이](https://velopert.com/3425) 있었고 해당 글을 참고하며 개발을 했습니다.

## 제너레이터 vs 프로미스

그런데 문제가 있었습니다.

만약 SSR로 렌더링하려는 페이지에서 API 요청을 통해 사전에 불러와야 하는 값이 있고, 해당 작업을 서버에서 수행하고 싶은 경우, 서버는 **해당 비동기 작업이 끝나길 기다렸다가** 클라이언트 렌더링을 시작해야 합니다.

제가 작업하고 있는 프로젝트에서는 상태관리 라이브러리로 redux를 사용하고 있었는데, 비동기 처리를 위한 middleware 라이브러리로는 제너레이터 기반으로 동작하는 [redux-saga](https://redux-saga.js.org/)를 사용하고 있었습니다.

하지만 제가 참고하고 있는 글에서는 redux middleware로 [프로미스](https://github.com/reduxjs/redux-thunk) [기반으로](https://pburtchaell.gitbook.io/redux-promise-middleware/) [동작하는](https://github.com/velopert/redux-pender) 라이브러리들을 사용하고 있었습니다.

제너레이터와 프로미스는 비동기 작업을 처리할 수 있다는 점에서 비슷하지만 해당 작업이 끝났다는 