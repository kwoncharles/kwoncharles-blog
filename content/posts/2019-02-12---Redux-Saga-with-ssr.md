---
title: SSR과 redux-saga
date: "2019-12-21T01:19:02.169Z"
template: "post"
draft: false
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

최근 **SSR(Server Side Rendering, 이하 SSR)** 작업을 했습니다. 사실 React를 이용한 SSR은 개념만 알뿐 구현은 커녕 튜토리얼조차 해본 경험이 없었습니다. 

다행히 [여러가지](https://subicura.com/2016/06/20/server-side-rendering-with-react.html) [좋은](https://www.popit.kr/react-%EC%84%9C%EB%B2%84%EC%82%AC%EC%9D%B4%EB%93%9C-%EB%A0%8C%EB%8D%94%EB%A7%81/) [자료들이](https://velopert.com/3425) 있었고 이 자료들을 참고하여 개발을 진행할 수 있었습니다.

## 제너레이터, 잠시만 기다려 줄 수 없니?

그런데 문제가 있었습니다.

브라우저가 아닌 웹서버에서 API 호출을 해야하는 경우가 있었는데, 그렇게 하려면 웹서버가 API 호출의 **응답이 올 때까지 기다려줘야 했습니다.**

> **API 호출을 브라우저가 아닌 서버에서 미리 해야 하는 경우는 CORS 이슈, 보안이슈 혹은 user의 network throughput을 최소화해야 하는 상황 등이 있습니다.**

---

Promise를 이용해 API 호출을 한다면 기다린다는 것이 그리 어려운 일은 아닐 것입니다. 하지만 개발중인 프로젝트에서는 API 호출과 같은 side effect를 [redux-saga](https://redux-saga.js.org/)로 처리하고 있었습니다. redux-saga는 Promise가 아닌 **제너레이터** 기반으로 동작합니다 😢

redux-saga에서 API 호출 및 응답을 처리하는 코드는 대략 다음과 같은 모습을 갖습니다.

```javascript
// 제너레이터 함수(*)인 것을 주목하세요. 

function* getUser() {
  // 1. getUser API 호출
  const { user } = yield call(UserAPI.getUser);

/**
 * 2. API 호출 이후 context가 현재 함수를 호출한 곳으로 돌아간다.
 * 3. getUser API 응답이 오면 다시 context를 얻게 되고
 *    아래 코드를 마저 실행한다.
 */

  yield put({
    type: SET_USER,
    payload: {
      user,
    },
  });
}
```

주석 2~3번에 나와있듯이 제너레이터 함수는 API호출 이후 context를 반환합니다. (`yield` 키워드를 사용했기 때문)

그리고 API 응답이 오면 redux-saga가 다시 현재 함수를 호출하여 context를 얻고, 나머지 코드를 마저 실행합니다. 

그런데 이렇게 되면 서버렌더링을 할 때 웹서버가 API 호출 응답이 오기전에 HTML을 만들어버리게 됩니다. 

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

      // 2. 제너레이터 함수가 API 호출 이후 context를 돌려줬기 때문에
      //    API 응답이 오기 전에 return문이 실행되고 HTML 문서 생성
      return;
    }
  },
];

```

> *사실 이런 경우만 예외로 Promise를 사용하도록 한다면 쉽게 해결될 문제이긴 합니다만... saga스럽게 풀어봅시다*

## Generator -> Promise

redux-saga를 만드는 사람들은 [초창기부터](https://github.com/redux-saga/redux-saga/issues/13) 이러한 이슈를 예상했고, redux-saga [Task의 종료여부를 promise로 제공](https://github.com/redux-saga/redux-saga/issues/13#issuecomment-167006148)했습니다.

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
  // 모든 task가 종료되기 전까지 resolve되지 않는다.
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

일반적으로 redux에서 하나의 Action을 **한 번만 호출하지는 않습니다.** 같은 Action이라 하더라도 여러번 호출할 수 있도록 만드는 것이 일반적입니다.

redux-saga에서 Action을 여러번 호출할 수 있도록 하려면 다음과 같은 패턴으로 코드를 작성해야 합니다.


```javascript
function* watchGetUser() {
  while(true) {
    yield take(GET_USER);
    yield fork(getUser);
  }
}
```

`watchGetUser` 함수는 `GET_USER` Action을 기다리는 역할을 하는 ***watcher*** 함수입니다. 제너레이터 함수이며 동작 방식은 위에서 설명했던 `getUser`와 유사합니다. ( `yield`를 통해 어디까지 실행됐었는지 기억합니다)

다음과 같은 순서로 동작합니다.

- `take` operator는 파라미터로 전달된 `GET_USER` Action이 불려질 때까지 기다립니다.

- `GET_USER` Action이 불리면 `watchGetUser`가 실행 context를 얻게되어 두 번째 줄의 `yield fork(getUser)`를 실행합니다. 

- `fork` 작업이 끝나면 **while**에 의해 다시 Action을 기다리는 `take` 구문이 실행됩니다.

- 1 ~ 3을 반복합니다.


위에서 보았던 `task.done`은 redux-saga에서 실행중인 Task들이 모두 종료됐을때 resolve되는 Promise입니다.

watcher 함수도 하나의 Task입니다. 그런데 보시다시피 ***watcher*** 함수는 `while(true)`내부에 갇혀있습니다. (그리고 보통 여러 개의 watcher 함수를 사용합니다)

프로그램을 임의로 종료시키지 않는 이상 `task.done` 은 절대 resolve되지 않을 것입니다. 😢


## 종결자, END

2016년 4월, redux-saga 이슈 게시판에 [API Proposal](https://github.com/redux-saga/redux-saga/issues/255)이 하나 올라왔습니다. `END` 라는 **Action**을 프로젝트 내에 포함할 것을 제안하는 내용이었습니다. 

`END` 의 주용도는 **saga에게 Action을 전달해주는 통로**인 **channel**을 종료시키는 것입니다.

watcher함수에게 전달되는 액션은 모두 channel을 거치게 되는데, channel은 `END` Action을 받으면 더이상 watcher들에게 액션을 주지 않습니다.

결국 `take`하고 있는 Task들은 모두 종료된 것으로 처리됩니다. (resolve!)

참고로 `END` 로 인해 채널이 종료되더라도 `take`가 아닌 `fork`, `call` 등을 통해 실행중이었던 Task가 있다면 끝까지 실행됩니다. 따라서 우리가 `fork`를 통해 호출한 `getUser`는 끝까지 수행될 것입니다.

getUser의 작업이 끝이나면, `task.done`은 마침내 resolve 됩니다.


```jsx
import { END } from 'redux-saga'; // Default로 제공하는 Action

// createClientHTML.jsx

async function createClientHTML({ path, url }) {
  const { store, runSaga } = configure();
  const task = runSaga(rootSaga);
  
  perload(path);

  // END Action을 Dispatch하여 channel을 닫는다. (Action을 기다리고 있는 watcher들을 종료시킨다)
  store.dispatch(END)
  
  // END가 dispatch됐기 때문에 task 모두 종료. 
  // fork가 아닌 call, put등에 의해 실행된 task가 있다면 끝까지 실행되고 종료된다.
  await task.done;

  // task.done이 resolve 됐다는건 `SET_USER`까지 마무리 됐다는 뜻.
  // 필요한 정보가 있는 상태에서 HTML을 만들 수 있다
  const html = await renderToString(
    <Provider store={store}>
      <StaticRouter context={context} location={url}>
        <App />
      </StaticRouter>
    </Provider>
  );

  return html;
```

---

Redux Devtools로 명확한 플로우를 보여드리기 위해 `END`를 클라이언트에서 사용해보겠습니다.

결과는 대략 아래와 같습니다. `preload` 함수를 통해 `GET_USER` Action이 불리고, `END` Action이 뒤따라 불립니다.

`END` Action이 불린 이후엔 watcher들이 모두 종료됩니다. 하지만 기존에 실행중이었던 task는 끝까지 실행되기 때문에, `getUser` 제너레이터 함수는 `SET_USER` 까지 마무리를 짓습니다. 

![inspector.png](/saga-with-ssr/inspector.png)

---

redux-saga에는 `take` 역할을 하는 operator가 [여러 개 있습니다.](https://redux-saga.js.org/docs/api/)

그런데 그중에서 `END` Action이 통하지 않는 operator가 하나 있습니다. `takeMaybe` 라는 operator입니다. 함수형 프로그래밍에서 사용되는 Maybe [모나드](https://xtendo.org/ko/monad#1) 개념을 갖는 친구입니다.

사실 저는 사용해보지 않았고, 사용예시를 찾아보려고 했는데,,, **사용되는 경우가 거의 없는 듯합니다.** 하지만 [공식문서](https://redux-saga.js.org/docs/api#takemaybepattern) 에서 `END`와 함께 언급되고 있어 참고차 남깁니다.

## Wrapping up

redux-saga가 제너레이터로 동작하는 부분을 훌륭하게 추상화하긴 했지만, 이를 **제대로** 사용하기 위해선 제너레이터 패턴을 **확실하게** 이해하는 것이 중요합니다.(SSR뿐만 아니라 클라이언트에서도) 

특히 Task를 취소하거나 여러 개의 비동기 Task를 동시에 다룰 필요가 있는 경우 제너레이터에 대한 이해는 꼼꼼한 테스트, 빠른 디버깅을 도울 것입니다. 

> **P.S. Rx도 재밌지만... Saga도 재밌습니다.**