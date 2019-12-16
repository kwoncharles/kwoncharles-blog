---
title: SSR에서의 redux-saga
date: "2019-12-16T21:19:02.169Z"
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

다행히 [여러가지](https://subicura.com/2016/06/20/server-side-rendering-with-react.html) [좋은](https://www.popit.kr/react-%EC%84%9C%EB%B2%84%EC%82%AC%EC%9D%B4%EB%93%9C-%EB%A0%8C%EB%8D%94%EB%A7%81/) [참고자료가](https://velopert.com/3425) 있었기에 개발을 진행할 수 있었습니다.

## 제너레이터, 잠시만 기다려 줄 수 없니?

그런데 문제가 있었습니다.

페이지 렌더링에 필요한 데이터를 얻기 위해 API 호출을 **웹서버에서** 해야 했습니다. 

> API 호출을 브라우저가 아닌 서버에서 미리 하고 싶은 이유는 여러가지가 있을 수 있습니다. CORS 이슈가 있거나, user의 network throughput을 최소화해야 하는 상황이 있을 수 있습니다.

웹서버는 API 호출이 **끝날 때까지 기다렸다가**, 데이터가 준비되면 해당 데이터를 주입하여 완성된 HTML 문서를 클라이언트에게 전달해줘야합니다.

문제는 제가 개발중인 프로젝트에서는 (API 호출과 같은) side effect를 담당하는 라이브러리로 [redux-saga](https://redux-saga.js.org/)를 사용하고 있었는데, redux-saga가 ES6의 제너레이터를 기반으로 동작하는 라이브러리라는 것입니다.

redux-saga에서 API 호출 및 응답을 처리하는 코드는 대략 다음과 같은 모습을 갖습니다.

```javascript
// function* 인 것을 주목하세요. 
function* getUser(id) {
  // 1. getUserById API 호출
  const data = yield call(UserAPI.getUserById, id);

  // 2. API 호출 이후 실행 context가 getUser를 호출한 곳으로 돌아감.
  // 3. getUserById API 응답이 오면, 현재 generator 함수가 다시 실행 context를 얻음.
  // 4. getUserById의 응답값이 data 변수에 전달됨.

  // 5. 응답 데이터를 redux SET action의 파라미터로 전달
  yield put({
    type: 'user/SET_USER',
    payload: {
      user: data.user,
    },
  });
}
```

주석으로 달아 놓은 부분에서 2~3번에서 나와있듯이, 페이지 초기화 코드에서 `getUser`를 호출하면, `call` 함수를 통해 `getUserById` API가 호출되고, 실행 context가 `getUser`를 호출한 곳으로 돌아가서 **다른 일들을 처리하다가**, `getUserById`의 응답이 오면 실행 context가 다시 `getUser`로 돌아옵니다.

문제는 웹서버에서 `getUser`를 호출하면, `getUserById`의 응답이 올 때까지 기다렸다가 HTML을 만들어야 하는데, 제너레이터는 Promise처럼 `then`이나 `await`을 통해 동기적(synchrous)으로 기다리는 방법을 제공하지 않습니다.

결국 2번과정 이후 `getUser`를 호출한 곳으로 돌아온 , `getUserById`의 응답이 오기 전에 HTML을 먼저 만들어버립니다.

## 구세주 Action, END





브라우저에서 호출 않고 웹서버에서 미리 불러오게 만들고 싶은 경우, 웹서버는 데이터가 준비된 이후에 HTML 문서를 생성해야 합니다. 만약 데이터를 불러오는 로직이 Promise 기반이라면 Promise가 resolved된 이후에 

만약 SSR로 렌더링하려는 페이지에서 API 요청을 통해 사전에 불러와야 하는 값이 있고, 해당 작업을 서버에서 수행하고 싶은 경우, 서버는 **해당 비동기 작업이 끝나길 기다렸다가** 클라이언트 렌더링을 시작해야 합니다.

제가 작업하고 있는 프로젝트에서는 상태관리 라이브러리로 redux를 사용하고 있었는데, 비동기 처리를 위한 middleware 라이브러리로는 제너레이터 기반으로 동작하는 [redux-saga](https://redux-saga.js.org/)를 사용하고 있었습니다.

하지만 제가 참고하고 있는 글에서는 redux middleware로 [프로미스](https://github.com/reduxjs/redux-thunk) [기반으로](https://pburtchaell.gitbook.io/redux-promise-middleware/) [동작하는](https://github.com/velopert/redux-pender) 라이브러리들을 사용하고 있었습니다.

제너레이터와 프로미스는 비동기 작업을 처리할 수 있다는 점에서 비슷하지만 해당 작업이 끝났다는 