---
title: "핀다에서 쓰는 React Custom Hooks"
date: "2020-03-02T01:30:00.169Z"
template: "post"
draft: false
slug: "/posts/custom-hooks-of-finda/"
category: "Tech"
tags:
  - "hooks"
  - "react"
description: "Custom Hooks로 적합한 것과 그렇지 않은 것"
---

> [핀다 기술블로그에 기고한 글](https://medium.com/finda-tech/%ED%95%80%EB%8B%A4%EC%97%90%EC%84%9C-%EC%93%B0%EB%8A%94-react-custom-hooks-1a732ce949a5)입니다.

이 글은 핀다 프론트엔드 팀에서 사용하는 **custom hooks** 몇 가지와 어떤 것을 custom hook으로 만들어야 하는지에 대해서 이야기합니다.

---

2019년 초, React Hooks가 정식으로 릴리즈 된 이후 많은 서비스들이 빠르게 hooks를 도입하였습니다. 핀다도 작년 4분기, 네이티브 웹뷰 개발 프로젝트를 시작으로 최근 런칭한 [웹 최저금리 조회 서비스](https://service.finda.co.kr/loan-application/web)까지 대부분의 프로젝트에서 hooks를 적극 도입하여 사용하고 있습니다.
일반적으로 hooks의 장점으로 꼽히는 것들은 다음과 같습니다.

1. 클래스 컴포넌트보다 적은 양의 코드로 동일한 로직을 구현할 수 있다.

2. 코드 양이 적지만 명료함을 잃지 않는다. (`useSomething`)

3. 상태관리 로직의 재활용이 가능하다.

특히 세 번째로 언급한 상태관리 로직의 재활용은 hooks의 꽃이라고 할 수 있으며 오늘 이야기할 custom hooks와 관련이 깊습니다.

## Rules of Hooks
Hooks가 위와 같은 매력적인 장점들을 얻기 위해서는 [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html) 라고 소개된 몇 가지 규칙들을 준수해야 합니다.

React에서 기본으로 제공하는 Hooks(`useState`, `useEffect`, `useReducer`···)는 Rules of Hooks만 지켜준다면 크게 문제될 것이 없습니다.

하지만 오늘 이야기할 custom hooks는 조금 다릅니다. 몇 가지 규칙을 더 고려해주어야 합니다. 만약 이를 고려하지 않고 custom hooks를 잘못 정의하여 사용한다면 **예측하지 못한 동작**들을 만들어 낼뿐만 아니라, **디버깅**까지 어렵게 만들 수 있습니다.

이 글 후반부에서는 Dan abramov씨가 [블로그 포스트](https://overreacted.io/ko/why-isnt-x-a-hook/)에서 제시한 관점을 기준으로 어떤 것이 custom hook으로 적합하고, 적합하지 않은지에 대해서 이야기 할 것입니다.


---

이제 핀다가 쓰고 있는 custom hooks를 몇 가지 살펴보겠습니다.

## usePrevious

```typescript
import { useEffect, useRef } from 'react';

function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]); 

  return ref.current;
}

export default usePrevious;
```


`usePrevious`는 이전 렌더링에서의 값을 기억해두어야 하는 경우에 사용할 수 있습니다. 현재 렌더링과 이전 렌더링의 값을 비교할 필요가 있을 때 사용합니다. 다음과 같이 말이죠.

```typescript
function MyComponent() {
  const [alphabet, set] = useState('A');
  const prevAlphabet = usePrevious(alphabet);
  
  useEffect(() => {
    if (alphabet === 'C' && prevAlphabet === 'B') {
       doSomething();
    }
  }, [alphabet]);
  // ..
}
```



위 컴포넌트는 *"`alphabet` 의 현재값이 `C`이고, 이전값이 `B` 라면 특정 액션을 수행해라"* 라는 로직을 수행하고 있습니다. 바로 이전 상태값을 저장하는 `usePrevious` 로직이 custom hook 내부로 들어가 컴포넌트는 깔끔한 상태를 유지하고 있습니다.


---

참고로 `usePrevious` 내부에서 값을 저장할 때 `useState` 가 아닌 `useRef` 를 쓴 이유는 불필요한 re-rendering을 방지하기 위해서입니다. `usePrevious` 가 반환하는 값은 바로 당장 UI를 그리는 데에는 영향을 주지 않기 때문에 `usePrevious` 내부에서의 값 변경이 re-rendering을 유발하게 두어서는 안됩니다.

> useState 의 값 변경은 re-rendering을 유발하지만 useRef의 값 변경은 그렇지 않습니다. ([관련링크](https://www.codebeast.dev/usestate-vs-useref-re-render-or-not/))

만약 `useState` 를 이용했다면 `alphabet` 값이 바뀔 때마다 렌더링이 두 번씩 일어날 것입니다. (`alphabet` 변경에 대한 re-rendering + `prevAlphabet` 변경에 대한 re-rendering)

## useInput

`useInput`은 핀다에서 가장 많이 사용하고 있는 custom hook입니다. 이름에서 알려주듯 input 컴포넌트와 함께 사용됩니다.

어떻게 사용하는지를 먼저 보여드리겠습니다.

```typescript
function SomeComponent() {
  const [value, onChangeInputValue, isValid] = useInput({
    type: 'number',
    maxValue: 10000,
    autoFix: false,
  });
  const onSubmit = () => {
    if (isValid) {
      submitValue(value);
    } else {
      setError();
    }
  }
  // ...
  return (
    <form onSubmit={onSubmit}>
      <input
        value={value}
        onChange={onChangeInputValue}
      />
      {/* ... */}
    </form>
  );
}
```

`useInput` 은 사용자 입력 값을 검증하는 event handler 로직을 추상화하기 위해서 만들어졌습니다. 사용자의 입력값은 숫자일 때도 있고 문자일 때도 있습니다. 숫자라면 최솟값이나 최댓값이 있을 수 있고, 문자인 경우 최대 길이가 있을 수 있습니다.

이러한 것들을 검증하는 로직이 컴포넌트 내부에 있을 필요는 없습니다. 또한 대부분의 검증 로직이 유사하기 때문에 이를 useInput 내부로 추상화시킬 수 있습니다.

이 hook을 사용하는 컴포넌트에서는 자신이 사용할 input 컴포넌트에 필요한 옵션만 명시해주면 됩니다.

자세한 로직이 궁금하신 분은 코드를 참고해 주시기 바랍니다!

```typescript
import { useState, useCallback, useRef } from 'react';
import { removeNonNumeric, parseNumWithMaxValue } from '@/utils/StringUtils';

interface Options {
  initialValue?: string;
  maxValue?: number;
  minValue?: number;
  maxLength?: number;
  minLength?: number;
  autoFix?: boolean;
  type?: 'number' | 'string';
}

type returnType = [string, (e: React.ChangeEvent<HTMLInputElement>) => void, boolean];

function useInput(options?: Options): returnType {
  const {
    maxValue,
    minValue,
    initialValue,
    maxLength,
    minLength = 0,
    autoFix = true,
    type = 'string',
  } = options || {};
  const [value, setValue] = useState<string>(initialValue || '');
  const isValid = useRef<boolean>(true);

  const handleNumber = useCallback((receivedValue: string) => {
    let result: string = receivedValue;

    if (maxLength) {
      result = result.substr(0, maxLength);
    }

    if (maxValue) {
      result = parseNumWithMaxValue(result, maxValue);
    }

    const returnValue: string = autoFix ? result : receivedValue;
    isValid.current = result === receivedValue
      && returnValue.length >= minLength
      && (minValue ? minValue <= parseInt(returnValue, 10) : true);
    setValue(returnValue);
  }, [maxLength, minLength, maxValue, minValue, autoFix]);

  const handleString = useCallback((receivedValue: string) => {
    let result: string = receivedValue;

    if (maxLength) {
      result = result.substr(0, maxLength);
    }

    const returnValue: string = autoFix ? result : receivedValue;
    isValid.current = result === receivedValue
      && returnValue.length >= minLength;
    setValue(returnValue);
  }, [maxLength, minLength, autoFix]);

  const onChangeInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const targetValue: string = e.target.value || '';
    if (type === 'number') {
      handleNumber(removeNonNumeric(targetValue));
    } else {
      handleString(targetValue);
    }
  }, [type, handleNumber, handleString]);

  return [value, onChangeInput, isValid.current];
}

export default useInput;
```

여기서도 `isValid` 상태값은 `useRef`로 선언하였습니다. 현재 렌더링에 영향을 주는 값이 아니기 때문입니다(re-rendering 방지). 반면 `value` 값은 당장 사용자에게 반영된 값을 보여줘야하기 때문에 `useState` 로 선언하였습니다.

`useInput`과 유사한 hook으로 `useDropdown`, `useCheckList`도 사용하고 있습니다.

## useDocumentOverflow

글 초반에 custom hooks로 적절하지 않은 것이라고 판단된 hook이 있었다고 이야기 했습니다. `useDocumentOverflow`가 대표적인 예입니다.

`useDocumentOverflow`의 정의와 사용법은 아래와 같습니다.

```typescript
// useDocumentOverflow.ts
import { useEffect } from 'react';

const defaultOverflow: string = 'auto';

function useDocumentOverflow(property: 'hidden' | 'scroll' | 'auto') {
  useEffect(() => {
    const bodyElement: HTMLBodyElement = document.getElementsByTagName('body')[0];
    const previousOverflow: string = bodyElement.style.overflow || defaultOverflow;
    bodyElement.style.overflow = property;
 
    return (() => {
      bodyElement.style.overflow = previousOverflow;
    })
  }, [property]);
}

// usage
function SomeComponent() {
  useDocumentOverflow('hidden');
  
  // ...
}
```

`useDocumentOverflow` 는 Modal을 위해서 정의했던 hook입니다. 전체화면을 덮는 modal이 활성화돼있는 동안에 기존 화면이 스크롤 되는 것을 막기 위해서 `<body>` 의 `overflow` 값을 변경해야 했습니다.

그래서 Modal 컴포넌트에서 이러한 로직을 수행하는 hook을 사용하도록 했고, `useDocumentOverflow`는 그 역할을 잘 수행해냈습니다.

![photo](/custom-hooks-of-finda/modal.png)
> #### 웹뷰에서 사용하는 드롭다운 Modal

<br/>

하지만 이 로직은 hook으로 만들기에는 **적합하지 않은 로직**이었습니다. 어떤 이유에서 그런 걸까요?

## 동시에 사용할 수 있는가?

`useDocumentOverflow`를 여러 컴포넌트에서 동시에 사용한다면 어떤 일이 일어날까요?

컴포넌트 트리가 아래와 같을 때, 만약A 컴포넌트와 C 컴포넌트가 동시에 `useDocumentOverflow`를 사용한다면, 그리고 파라미터로 전달하는 값이 다르다면, 어떤 값이 `overflow` 값으로 적용돼야 하는 걸까요?

```typescript
// 컴포넌트 트리
<A>
  <B>
    <C />
  </B>
</A>
// A 컴포넌트
function A() {
  useDocumentOverflow('auto');
 
  // ..
}
// C 컴포넌트
function C() {
  useDocumentOverflow('hidden');
  // ..
}
```

만약 규칙을 정하여, "최상단(혹은 최하단)에 있는 것이 우선권을 갖는다" 라고 하더라도 문제는 여전히 존재합니다.

## 디버깅하기 용이한가?

만약 바로 위에서 본 예제처럼, 컴포넌트에서 직접 `useDocumentOverflow`를 호출한다면 디버깅에 큰 문제가 없을 것입니다.

하지만 컴포넌트가 사용하는 custom hook 내부에서 `useDocumentOverflow`를 호출한다면, 아니 더 깊은 hooks tree에서 `useDocumentOverflow`를 사용한다면 현재 적용된 `overflow`값이 어느 곳에서 적용된 것인지 찾아내는 것은 쉽지 않을 것입니다.
A, B, C 컴포넌트 예제를 살짝 바꿔 각 컴포넌트가 아래 이미지와 같이 custom hooks를 사용하고 있다고 가정해보겠습니다. 붉은 색으로 표시한 custom hook은 `useDocumentOverflow`를 호출하는 custom hook입니다.
만약 `overflow`값이 예상과 다르게 적용됐다면 원인을 찾기 위해 **탐험**을 시작해야 합니다.

A 컴포넌트가 사용하는 hooks를 살펴본 후, 그 중 custom hooks가 있다면 모든 custom hooks의 내부를 살펴보고… 또 그 내부의 custom hooks를 살펴보고… B의 내부의 hooks를 (… 이하 생략)
> [디버깅과 시간복잡도에 관한 글](https://overreacted.io/ko/the-bug-o-notation/)

![photo](/custom-hooks-of-finda/custom-hooks-tree-example.png)
> ####  O(n²) ,O( n³)…

<br/>
<br/>

그렇다면 `useDocumentOverflow`는 어떻게 써야할까요?

애초에 모든로직을 hook으로 만들 필요는 없습니다. hooks가 주는 **명료함**에 매료되어 컴포넌트에서 사용하는 중복되는 모든 로직을 hook으로 만들고 싶은 마음이 들 수도 있습니다. 하지만 hook으로 만들었을 때의 장점과 단점을 고민해 보는 단계가 필요합니다.

---

글 초반에 소개한 Dan Abramov의 [블로그 포스트](https://overreacted.io/ko/why-isnt-x-a-hook/)에서는 **합성**과 **디버깅** 관점에서 바라보는 것을 제안했습니다.

`useDocumentOverflow`는 위에서 보았듯이 두 관점에서 적절하지 않은 모습을 보여주었습니다.
반면 앞서 소개한 `usePrevious`, `useInput`, `useDropdown`, `useCheckList`는 모두 여러 컴포넌트나 여러 hooks 내에서 사용된다 하더라도 문제가 없는 것들입니다.

이쯤되니까 어떤 것이 hook으로 적합한지, 그렇지 않은지가 어렴풋이 보이는 것 같습니다.

## 공통적으로 사용하는 값인가?
`useDocumentOverflow`는 다른 컴포넌트나 hook에서 공통적으로 접근할 수 있는 값을 다루고 있습니다. 이처럼 공통적으로 사용하는 값을 다루는 로직은 custom hook으로 만들기에 적합하지 않습니다

Dan Abramov씨의 글에서는 custom hook으로 적합하지 않은 것의 예로 `react.memo`를 언급했습니다. re-rendering 여부를 결정하는 로직을 hook으로 만든 것입니다.

re-rendering 여부 또한 (하나의 컴포넌트 내에서) 여러 hook들 간에 공통적으로 사용될 수 있는 값입니다.

결국 ***"공유될 수 있는 값을 다루는가"*** 는 어떤 것을 hook으로 만들어야 하는가에 대한 합리적인 답변이 될 수 있을 듯합니다.

## 글을 마치며

custom hooks는 리액트가 컴포넌트뿐만 아니라 상태관리 로직까지 재활용할 수 있도록 만들어 주었습니다. Hooks 덕분에 프론트엔드 개발이 더 재미있고 간편해진 것 같습니다.

하지만 그 간편함이 독이 될 수 있습니다. 멋모르고 만들어 낸 custom hooks가 참사를 불러올 수 있으며, 프로젝트가 커짐에 따라 변경이나 디버깅을 어렵게 만들 수도 있습니다.

반복되는 상태관리 로직이 보일 때, 그리고 그 로직을 Hook으로 만들어야겠다는 생각이 들었을 때, 한발짝 물러나 생각해보는 습관을 기르는 것은 충분히 값진 투자가 될 것이라고 생각합니다.

> ## ***"이걸 꼭 Hook으로 만들어야 할까?"***