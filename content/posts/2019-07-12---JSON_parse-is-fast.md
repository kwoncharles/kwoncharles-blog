---
title: JSON.parse가 Object literal보다 빠르다
date: "2019-12-07T00:00:02.169Z"
template: "post"
draft: false
slug: "/posts/json-parse-is-fast"
category: "Tech"
tags:
  - "JavaScript"
  - "json"
  - "performance"
description: "JSON.parse가 Object literal보다 빠른 이유와 얼마나 빠른지 알아보겠습니다."
---

----

JavaScript에서 Object타입 변수를 생성할 때, Object literal을 이용하는 것보다 `JSON.parse`를 이용하는 것이 **빠릅니다.**

```typescript
// slower
const literalObj = {
	key: 'value'
};

// faster
const jsObj = JSON.parse(`{
  "key": "value"
}`);
```

## 이유 🤔

이유는 간단합니다.

JSON parser는 자신이 parsing 해야 하는 값이 JSON 포맷인 것을 **이미 알고 있기 때문에** 코드를 scan하고 parse하는 과정이 매우 간단합니다. 읽어 들이는 문자가 valid인지 invalid인지만 판단하면 됩니다.

하지만 JS parser의 경우는 그렇지 않습니다. 코드를 어느 정도 읽기 전까지는 읽고 있는 값의 타입이 Object인지 다른 타입인지 **확신할 수 없습니다.**

----

다음과 같은 상황을 가정해봅시다.

JS parser가 코드를 읽고 있습니다. 현재까지 읽은 코드는 아래와 같습니다.

``` typescript
const x = 1;

const y = ({ x }
```

이 상황에서 `y`는

- `object`일 수도 있고

- `function`일 수도 있고

- object destruction을 통해 만들어진 새로운 x를 참조하는 `object`일 수도 있습니다.

```typescript
// case 1
const y = ({ x });

// case 2
const y = ({ x }) => ();

// case 3
const y = ({ x } : { x: 2 });

```

이렇듯 여러 가지 상황을 고려해야 하는 JS Parser는 JSON parser보다 느릴 수밖에 없습니다.

## 성능 비교 📊

구글에서 실행한 [벤치마크 결과](https://v8.dev/blog/cost-of-javascript-2019#json)에 따르면, V8에서 `JSON parse`가 **1.7배** 정도 빠르다고 합니다.  JavaScriptCore(Safari JS 엔진)에서는 **2배**까지 속도를 끌어 올릴 수 있습니다.

![benchmark](https://v8.dev/_img/cost-of-javascript-2019/json.svg)


## 개선하기 🔧

그렇다면 코드 안에 있는 모든 Object literal 형식을 `JSON.parse` 로 직접 바꿔줘야 할까요?

다행히 우리에겐 구세주 **webpack**과 **babel**이 있습니다.

- [webpack 설정](https://github.com/webpack/webpack/pull/9349)

- [babel-plugin-object-to-json-parse](https://github.com/nd-02110114/babel-plugin-object-to-json-parse)

> 🚨**주의할 점은 `babel-plugin-object-to-json-parse`이 아직 검증된 플러그인이 아닌 듯합니다.**

플러그인 개발자가 [Readme](https://github.com/nd-02110114/babel-plugin-object-to-json-parse/blob/master/README.md)에서 주의하라고 언급을 했으며, [create-react-app 이슈](https://github.com/facebook/create-react-app/issues/8036)에서도 그렇게 다뤄졌습니다.


## 참조한 컨텐츠 📹

[Chrome dev youtube clip](https://youtu.be/ff4fgQxPaO0)