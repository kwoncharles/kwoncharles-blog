---
title: "Ref를 활용한 React Hooks 개선"
date: "2021-04-20T23:20:32.169Z"
template: "post"
draft: false
slug: "/posts/improve-your-hooks-with-ref"
category: "Tech"
tags:
  - "react"
  - "hooks"
  - "ref"
description: "Ref를 활용한 사용자(개발자) 경험 개선"
---

## 목차
- [이벤트 리스너를 위한 hooks 만들어보기](#이벤트-리스너를-위한-hooks-만들어보기)
- [`useCallback`을 써야하지 않나요?](#usecallback을-써야하지-않나요-1)
- [ref로 규칙 없애보기](#ref로-규칙-없애보기)
- [마무리](#마무리)

---

React 함수 컴포넌트에서 중복되는 로직은 custom hooks를 이용해 추상화시킬 수 있습니다.

custom hooks를 정의해 사용하다 보면 아래와 같이 함수를 전달받는 경우가 자주 생기죠.

```typescript

// 파라미터로 함수 전달
useExample(() => {
  /* do something... */
});
```

그런데 custom hooks 내부에서는 전달되는 함수가 `useCallback`으로 감싸져있길 기대하는 경우가 있습니다.

결국 사용하는 쪽에서 그것을 규칙으로 지켜줘야 하는 상황이 됩니다.

> **"이 Hooks를 사용할 때는 전달되는 함수가 불필요하게 변경되는지 꼭 확인해주세요~"**

이번 글에서는 ref를 이용해 규칙을 만들지 않으면서도 성능과 동작에 문제가 없는 custom hooks를 만드는 방법에 대해서 이야기해보겠습니다.

## 이벤트 리스너를 위한 hooks 만들어보기

예시로 브라우저 이벤트 리스너를 위한 custom hooks를 만들어보겠습니다. 대부분의 이벤트 리스너는 add와 remove가 항상 세트로 따라다니죠. 이러한 반복적인 동작은 추상화하기 좋은 로직입니다.

아래와 같이 사용할 수 있는 custom hooks를 만들어보겠습니다.

```tsx
function Page() {
  useBrowserEvent('keydown', (event) => {
    // 이벤트 리스너 로직
  });
}
```

우리가 추상화 하고싶은 로직은 반복되는 add, remove 로직입니다. 이는 `useEffect`만 추상화하면 되기 때문에 어렵지 않게 만들 수 있습니다.

```typescript
function useBrowserEvent(
  eventType,
  listener,
  options,
) {
  useEffect(() => {
    window.addEventListener(eventType, listener, options);

    return () => {
      window.removeEventListener(eventType, listener, options);
    };
  }, []);
}
```

아차 뭔가 빠뜨린게 있네요. 파라미터로 전달만은 `eventType` 값과 `listener` 함수는 변경될 수 있기 때문에 `useEffect`의 의존성 배열로 전달되어야 합니다.

```typescript
function useBrowserEvent(
  eventType,
  listener,
  options,
) {
  useEffect(() => {
    window.addEventListener(eventType, listener, options);

    return () => {
      window.removeEventListener(eventType, listener, options);
    };
  }, [eventType, listener]);
}
```

야호~ `useBrowserEvent` 덕분에 함수 컴포넌트에서 이벤트 리스너를 깔끔하고 명료하게 사용할 수 있게 됐습니다! 🥳

## `useCallback`을 써야하지 않나요?

그런데 위와 같이 정의된 `useBrowserEvent`를 사용할 때에는 조심해야할 것이 하나 있습니다. 해당 hooks 내부에서, `listener` 함수를 `useEffect`의 의존성 배열로 전달했기 때문에 `listener`로 전달하는 함수가 매 렌더링마다 불필요하게 변경되는지를 학인해줘야 합니다.

간단한 예제로 살펴보겠습니다. 
 
```tsx
function Page() {
  const [scrollProgress, setScrollProgress] = useState(
    window.pageYOffset / document.body.scrollHeight,
  );

  useBrowserEvent('scroll', () => {
    setScrollProgress(
      window.pageYOffset / document.body.scrollHeight,
    )
  });

  return (
    <p>
      {`현재 ${scrollProgress}% 읽으셨습니다.`}
    </p>
  );
}
```

위 컴포넌트는 페이지 스크롤 이벤트가 발생될 때마다 `scrollProgress` 값이 변경되기 때문에 컴포넌트가 다시 렌더링됩니다. 그리고 리스너로 전달된 함수는 `useCallback`으로 감싸지지 않았기 때문에 [매 렌더링마다 참조가 바뀝니다](https://reactjs.org/docs/hooks-reference.html#usecallback). 바뀔 필요가 없는데 말이죠.

함수의 참조가 바뀌면, `useBrowserEvent`의 `useEffect`는 의존성 배열에 전달된 함수가 바뀌었다는 것을 인식하고 effect 함수를 다시 실행될 것입니다. 결국 scroll 이벤트 리스너는 **등록하고 삭제하기를 수도 없이 반복하게 됩니다.**

이런 불필요한 연산을 방지하기 위해서는 이벤트 리스너를 `useCallback`으로 감싸주면 됩니다. 

```tsx
function Page() {
  // ...

  useBrowserEvent('scroll', useCallback(() => {
    setScrollProgress(
      window.pageYOffset / document.body.scrollHeight,
    )
  }, []));
  
  // ...
}
```

자, 이제 렌더링 이슈 없이 `useBrowserEvent`를 사용할 수 있게 되었습니다!

하지만 저희는 규칙을 하나 만들었습니다. 앞으로 `useBrowserEvent`를 사용할 때 두 번째 파라미터로 전달되는 `listener` 함수의 참조가 변경되는지를 잘 살펴봐주어야 하며, 우려가 될 때는 `useCallback`을 써주어야 한다는 규칙입니다. 이런 규칙은 많은 사람들이 함께 쓰는 경우 지켜지지 않을 수 있다는 리스크가 있습니다.

#### 이런 규칙 없이 사용할 수는 없을까요?

## ref로 규칙 없애보기

React 함수 컴포넌트에서 ref는 특별한 존재입니다. [컴포넌트 렌더링 플로우로부터 자유롭기 때문이죠.](https://overreacted.io/ko/a-complete-guide-to-useeffect/#%ED%9D%90%EB%A6%84%EC%9D%84-%EA%B1%B0%EC%8A%AC%EB%9F%AC-%EC%98%AC%EB%9D%BC%EA%B0%80%EA%B8%B0)

ref를 이용하면 위에서 언급한 문제를 해결할 수 있습니다.

### 1단계: 함수를 ref에 할당하기

먼저 우리가 사용해야 하는 `listener` 함수를 ref 변수인 `callbackRef`에 할당해줍니다. 그리고 이벤트 리스너는 `callbackRef` 저장된 함수를 이용하도록 만들어줍니다.

```typescript
import { useRef, useEffect } from 'react';

function useBrowserEvent(
  eventType,
  listener,
  options,
) {
  const callbackRef = useRef();
  // 항상 최신화된 listener가 필요하므로
  callbackRef.current = listener;

  useEffect(() => {
    window.addEventListener(eventType, callbackRef.current, options);

    return () => {
      window.removeEventListener(eventType, callbackRef.current, options);
    };
  }, [eventType]);
}
```

자 이렇게하면 다 된걸까요?

아쉽지만 위 Hooks는 올바르게 동작하지 않습니다. 

위 코드에서 이벤트 리스너로 전달되고 있는 함수는 `callbackRef.current` 입니다. 즉, `useEffect`가 실행될 당시의 `listener` 함수죠. 그런데 `listener` 함수는 다시 렌더링이 되는 과정에서 변경될 수 있는 녀석입니다.

만약 다시 렌더링되는 과정에서 `listener` 함수가 변경되고, 이후 페이지를 이동하게되어 `useBrowserEvent`를 사용하는 컴포넌트가 unmount된다면 어떻게 될까요? `useEffect`는 cleanup 로직을 실행할 것입니다. 그런데 `removeEventListener` 함수로 전달되는 `callbackRef.current` 함수는 `addEventListener`로 등록된 함수와 같은 함수일까요?

그렇지 않습니다. 현재 `callbackRef.current`에 할당된 함수는 렌더링 되는 과정에서 다시 선언된 새로운 함수이기 때문에 브라우저는 처음에 등록된 이벤트 리스너가 아닌 다른 함수(이벤트 리스너에 존재하지 않는 함수)를 찾게 됩니다.

결국 처음에 등록된 이벤트 리스너는 **제거되지 않고 계속 존재하게 됩니다.**

### 2단계: 변경되지 않는 함수 안에서 ref 사용하기

1단계의 문제는 `addEventListener`로 전달되는 함수와 `removeEventListener`로 전달되는 함수가 같지 않다는 것입니다. 그렇다면 우리는 두 함수가 같도록 만들어주면 됩니다. 

```typescript
import { useRef, useEffect } from 'react';

function useBrowserEvent(
  eventType,
  listener,
  options,
) {
  const callbackRef = useRef();
  callbackRef.current = listener;

  useEffect(() => {
    function onEvent(e) {
      callbackRef.current(e);
    }

    window.addEventListener(eventType, onEvent, options);
    return () => {
      window.removeEventListener(eventType, onEvent, options);
    };
  }, [eventType]);
}
```

앞서 보았던 이슈들이 해결되었는지 확인해볼까요?

#### 1. add, remove 함수가 다르다는 문제
방금 1단계에서 마주쳤던 문제는 더이상 존재하지 않습니다. 왜냐하면 add, remove 함수가 모두 같은 `onEvent` 함수를 참조하기 때문입니다.

`useEffect`의 의존성 배열에는 `eventType` 값만 전달하면 됩니다. `listener` 함수는 ref로 감싸져있기 때문에 의존성 배열에 들어가 필요가 없거든요!

#### 2. 규칙이 생기는 문제
첫 구현체에서 생겼던 **규칙**(*`listener`를 `useCallback`으로 감싸줘야한다*)**도 더이상 존재하지 않습니다.** `useCallback`으로 감싸주지 않아도 불필요한 add, remove가 발생하지 않으며, 항상 최신 함수를 참조한다는 것도 보장이 되었습니다.

다음과 같이 사용해도 문제가 되지 않는다는 뜻입니다!

```typescript
useBrowserEvent('scroll', () => {
  // 이벤트 리스너 로직
});
```

## 마무리


ref는 위에서 이야기한 것처럼 함수 컴포넌트의 렌더링에는 영향을 주지 않습니다. `useState`와 다르게 값이 변경되어도 리렌더링을 하지 않으며 항상 최신 값을 참조하기 때문에 hooks의 의존성 배열에 들어가지 않아도 좋습니다.

때문에 성능 최적화가 필요하거나 항상 최신 값을 필요로 하는 경우에 ref를 유용하게 사용할 수 있습니다.

> **물론 버그를 만들어 낼 수도 있습니다.**
