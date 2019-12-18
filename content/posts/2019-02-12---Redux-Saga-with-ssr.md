---
title: SSR에서의 redux-saga
date: "2019-12-16T21:19:02.169Z"
template: "post"
draft: true
slug: "/posts/redux-saga-with-ssr/"
category: "Tech"
tags:
  - "Next.js"
  - "Server Side Rendering"
  - "Redux-saga"
  - "Generator"
description: "제너레이터 기반으로 동작하는 redux-saga는 SSR(Server Side Rendering)에서 어떻게 동작해야 할까요?"
---

> ### 이 글은 react + redux + redux-saga 환경에서의 SSR에 대해 이야기합니다.


## Intro

최근 **SSR(Server Side Rendering, 이하 SSR)** 작업을 했습니다. 사실 SSR의 개념만 알뿐 구현은 커녕 튜토리얼조차 해본 경험이 없었습니다. 

다행히 [여러가지](https://subicura.com/2016/06/20/server-side-rendering-with-react.html) [좋은](https://www.popit.kr/react-%EC%84%9C%EB%B2%84%EC%82%AC%EC%9D%B4%EB%93%9C-%EB%A0%8C%EB%8D%94%EB%A7%81/) [참고자료가](https://velopert.com/3425) 있었기에 개발을 진행할 수 있었습니다.

## 제너레이터, 잠시만 기다려 줄 수 없니?

그런데 문제가 있었습니다.

브라우저가 아닌 웹서버에서 API 호출을 해야하는 경우가 있었는데, 그렇게 하려면 웹서버가 API 호출의 **응답이 올 때까지 기다려줘야 했습니다.**

> **API 호출을 브라우저가 아닌 서버에서 미리 해야 하는 경우는 CORS 이슈, 보안이슈 혹은 user의 network throughput을 최소화해야 하는 상황 등이 있습니다.**

---

Promise를 이용해 API 호출을 한다면 기다린다는 것이 그리 어려운 일은 아닐 것입니다. 하지만 개발중인 프로젝트에서는 API 호출과 같은 side effect를 [redux-saga](https://redux-saga.js.org/)로 처리하고 있었습니다. redux-saga는 Promise가 아닌 **제너레이터** 기반으로 동작합니다 😢

redux-saga에서 API 호출 및 응답을 처리하는 코드는 대략 다음과 같은 모습을 갖습니다.

```javascript
// 제너레이터 함수(*)인 것을 주목하세요. 

function* getUser(id) {
  // 1. getUserById API 호출
  const data = yield call(UserAPI.getUserById, id);

  // 2. API 호출 이후 실행 context가 getUser를 호출한 곳으로 돌아간다.
  // 3. getUserById API 응답이 오면 다시 실행 context를 얻게 되고
  //    아래 코드를 마저 실행한다.

  yield put({
    type: 'user/SET_USER',
    payload: {
      user: data.user,
    },
  });
}
```

주석 2~3번에 나와있듯이 제너레이터는 API호출 이후 실행 context를 반환합니다. 그리고 API 응답이 오면 다시 실행 context를 얻게 되어 나머지 코드를 마저 실행합니다.

그런데 이렇게 되면 SSR에서는 웹서버가 API 호출 응답이 오기전에 HTML을 만들어버리게 됩니다. 

```javascript
// SSR 코드 예제

const routes = [
  ...
  {
    path: '/user/:id',
    preload: async (ctx, store, match) => {
      // 1. getUser 호출 
      UserActions.getUser(ctx.params.id);

      // 2. 제너레이터 함수가 getUser호출 이후 context를 돌려줬기 때문에
      //    API 응답이 오기 전에 return 되고 HTML 문서 생성
      return;
    }
  },
];

```

> *사실 이런 경우만 예외로 Promise를 사용하도록 한다면 쉽게 해결될 문제이긴 합니다만,,*


## 전통적인 해결법

redux-saga는 **4년** 넘게 사용돼왔습니다. 그리고 위와 같은 이슈는 [초창기부터](https://github.com/redux-saga/redux-saga/issues/13) 존재했습니다. redux-saga는 사실 제너레이터를 Promise로 다룰 수 있는 방법을 [일찍이 제공](https://github.com/redux-saga/redux-saga/issues/13#issuecomment-166953222)하고 있었습니다. 

다음과 같은 모습입니다.

```jsx
import runSaga from 'redux-saga'
import sagas from '../sagas' // [saga1, saga2, ...]

const sagaMiddleware = runSaga(...sagas)

// 대기중인 제너레이터 함수들을 각각의 Promise로 관리.
// 해당 saga의 제너레이터가 종료되면 promise가 resolve된다.
const [saga1, ...] = sagaMiddleware.promises
```

하지만 이 방법은 SSR에 적합한 방법은 아니었습니다.

`sagaMiddleware.promises` 가 반환하는 프로미스의 개수는 서비스가 고도화될수록 **점점 많아질 것입니다.** 그리고 우리는 웹서버에서의 API 호출이 필요한 새로운 **상황이 생길 때마다** `sagaMiddleware.promises` 가 반환하는 Promise 중 알맞은 것을 골라내어 **별도로 처리**를 해줘야만 합니다.

```jsx

const sagaMiddleware = runSaga(...sagas);
const [productSaga, userSaga, ...] = sagaMiddleware.promises;

// 경로에 알맞은 saga를 기다려야한다.
switch (path) {
  case: '/user':
    userSaga.then(() => {
      ...
    });
    break;
  case: '/product':
    productSaga.then(() => {
      ...
    });
    break;
  ...
}

// ... 중략

const html = await renderToString(
  <Provider store={store}>
    <StaticRouter context={context} location={url}>
      <App />
    </StaticRouter>
  </Provider>
);

// ... 생략
```
> 별도로 처리해야하는 이유는 호출한 saga를 제외한 다른 saga들의 promise는 **resolve되지 않을 것**이기 때문입니다.

---

## 조금 더 깔끔하게, END

2016년 4월, redux-saga 이슈 게시판에 [API Proposal](https://github.com/redux-saga/redux-saga/issues/255)이 하나 올라왔습니다. `END` 라는 Action을 프로젝트 내에 포함할 것을 제안하는 내용이었습니다. 
