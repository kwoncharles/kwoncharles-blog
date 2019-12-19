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

> ### 이 글은 react + redux + redux-saga 환경에서의 SSR에 대해 이야기합니다. SSR과 redux에 대한 기본 지식이 있는 분들을 대상으로 작성했습니다.


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

/**
 * 2. API 호출 이후 실행 context가 getUser를 호출한 곳으로 돌아간다.
 * 3. getUserById API 응답이 오면 다시 실행 context를 얻게 되고
 *    아래 코드를 마저 실행한다.
 */

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
// preload.js

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

## Saga -> Promise

redux-saga를 만드는 사람들은 [초창기부터](https://github.com/redux-saga/redux-saga/issues/13) 이러한 이슈를 예상했고, saga [Task를 promise로 변환하는 방법](https://github.com/redux-saga/redux-saga/issues/13#issuecomment-167006148)을 제공하였습니다.

최신(v1.1.1) redux-saga 문법으로 표현하면 대략 다음과 같은 모습입니다.


```jsx
// createClientHTML.jsx

async function createClientHTML({ path, url }) {
  const { store, runSaga } = configure();
  const task = runSaga(rootSaga);

  // 현재 경로에 필요한 Action을 dispatch하는 함수.
  // 위에서 보았던 `getUser`를 호출하는 부분이다.
  perload(path);

  // preload에서 호출되어 saga에게 전달된 Action이 끝나기를 기다린다.
  await task.done;

  const html = await renderToString(
    <Provider store={store}>
      <StaticRouter context={context} location={url}>
        <App />
      </StaticRouter>
    </Provider>
  );

  return html;
}

```

---

그런데... 과연 `task.done`은 resolve 될 수 있을까요? 

안타깝게도 프로그램이 종료되지 않는 이상 `task.done`은 **resolve되지 않습니다.**

일반적으로 redux에서 하나의 action을 **한 번만 호출하지는 않습니다.** 같은 action이라 하더라도 여러번 호출할 수 있도록 만드는 것이 일반적입니다.

redux-saga에서 action을 여러번 호출할 수 있도록 하려면 다음과 같은 패턴으로 코드를 작성해야 합니다.


```javascript
function* watchGetUser() {
  while(true) {
    yield take(GET_USER_ACTION);
    yield fork(getUser);
  }
}
```

`watchGetUser` 함수는 `GET_USER_ACTION` 을 기다리는 역할을 하는 ***watcher*** 함수입니다. 제너레이터 함수이며 동작 방식은 위에서 설명했던 `getUser`와 유사합니다.

다음과 같은 순서로 동작합니다.

- `take` 구문은 파라미터로 전달된 `GET_USER_ACTION`이 오기 전까지 기다립니다.

- `GET_USER_ACTION` action이 불리면 `watchGetUser`가 실행 context를 얻게되어 두 번째 줄의 `fork(getUser)`를 실행합니다. 

- `fork` 작업이 끝나면 **while**에 의해 다시 action을 기다리는 `take` 구문이 실행됩니다.

- 1 ~ 3을 반복합니다.


위에서 보았던 `task.done`은 `watchGetUser` 같은 watcher 함수들이 종료됐을 때 resolve되는 Promise입니다.

그런데 보시다시피 ***watcher*** 함수는 `while(true)`내부에 갇혀있습니다. 

프로그램을 임의로 종료시키지 않는 이상 `task.done` 은 절대 resolve되지 않을 것입니다. 😢


## 종결자, END

2016년 4월, redux-saga 이슈 게시판에 [API Proposal](https://github.com/redux-saga/redux-saga/issues/255)이 하나 올라왔습니다. `END` 라는 Action을 프로젝트 내에 포함할 것을 제안하는 내용이었습니다. 

`END` 의 주용도는 saga에게 action을 전달해주는 channel을 종료시키는 것입니다. (action을 기다리고 있는 saga의 watcher를 종료시킨다고 이해해도 좋습니다)

액션이 전달되는 channel을 종료시키면 우리가 원하는 바를 이룰 수 있을 것입니다. channel이 종료되면 모든 watcher도 종료되기 때문입니다.

참고로 `END` Action을 dispatch 하더라도 실행중인 task는 끝가지 실행됩니다. 때문에 우리가 호출한 `getUser`는 끝까지 수행될 것입니다.


```jsx
const { path } = ctx;
const { store, runSage } = configureStore();
const task = runSaga(rootSaga);

/**
 * 경로에 맞는 fetch action 수행
 * 위에서 보았던 예제로 치면 `getUserById`를 호출한다.
 **/
preload(path);

// END 액션을 Dispatch하여 channel을 닫는다. (Action을 기다리고 있는 watcher들을 종료시킨다)
store.dispatch(END);

// 참고로 이전 예제에서의 `.promises`는 과거 문법이고 아래 예제는 새로운 문법 `.toPromise()`를 사용했습니다.
await task.toPromise();

// Promise는  resolve된 

```
