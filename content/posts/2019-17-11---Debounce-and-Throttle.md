---
title: Debounce와 Throttle의 차이
date: "2019-11-17T13:00:02.169Z"
template: "post"
draft: false
slug: "/posts/debounce-and-throttle"
category: "Tech"
tags:
  - "JavaScript"
  - "debounce"
  - "throttle"
  - "lazy"
  - "performance"
description: "Debounce와 Throttle의 차이점이 뭘까요? 간단한 예제로 알아보겠습니다."
---

# Intro

debounce와 throttle은 프로그래밍에서 요청이나 처리의 빈도를 제한하거나 지연시키고자 할 때 자주 사용됩니다. 둘은 위와 같은 상황에서 쓰인다는 것에서 비슷하지만 동작하는 방식은 조금 다릅니다. 

# 심플한 정의

debounce와 throttle을 한마디로 정의하면 다음과 같습니다.

## debounce

> 요청이 들어오고 일정 시간을 기다린 후 요청을 수행한다. 만약 일정 시간 안에 같은 요청이 추가로 들어오면 **이전 요청은 취소된다.**


## throttle

> 일정 시간 동안 요청이 **한 번만** 수행되도록 한다.


백문이 불여일견입니다. 예제코드를 살펴보겠습니다. 예제에서는 [lodash](https://lodash.com/)에서 제공하는 `debounce`, `throttle`을 사용하겠습니다.

두 함수 모두 첫 번째 파라미터로 debouncing, throttling할 함수를 받고, 두 번째 파라미터로 시간을 밀리초(ms)로 받습니다.

----

먼저 throttle입니다. 아래 코드는 화면의 버튼이 클릭되면 console에 현재시간(초, 밀리초)를 출력합니다. throttle time은 500ms로 설정했습니다.


```typescript
const throttle  = require('lodash/throttle');
const throttleButton = document.getElementById('throttle-button');

throttleButton.onclick = throttle((e) => {
  console.log('Throttled Button Clicked', moment().format('ss.SS'));
}, 500);
```

<br>

이제 5초동안 계속해서 버튼을 클릭해보겠습니다. 콘솔에 출력된 결과는 다음과 같습니다!

<br> 

![throttle예제](/debounce-and-throttle-image/throttle-console.png)
> throttle, 500ms

약간의 오차는 있지만 0.5초 간격으로 click 이벤트리스너가 실행되고 있습니다. 

이와 같이 throttle은 정해진 시간동안 요청이 **단 한번만** 처리되도록 해줍니다.

----

다음으로 debounce를 살펴보겠습니다. 코드는 throttle과 유사합니다.

버튼이 클릭되면 console에 현재시간(초, 밀리초)를 출력합니다. debounce 시간은 1000ms입니다.


```typescript
const debounce  = require('lodash/debounce');
const debounceButton = document.getElementById('debounce-button');

debounceButton.onclick = debounce((e) => {
  console.log('Debounce Button Clicked', moment().format('ss.SS'));
}, 1000);
```
<br>

아까와 같이 5초동안 버튼을 계속해서 클릭해보겠습니다.

<br>

![debounce예제](/debounce-and-throttle-image/debounce-console.png)
> debounce, 1000ms

throttle과는 다르게 이벤트리스너가 한 번만 실행됐습니다. 위에서 설명했듯이 debounce는 일정 시간 동안 요청이 추가로 들어오지 않는 경우에만 수행됩니다. 저는 10초 동안 계속해서 버튼을 클릭했기 때문에 마지막 클릭이 만들어낸 요청만 수행됐습니다.


# 사전적 의미

추가로 throttle과 debouce의 사전적 의미를 통해 그 동작을 확실하게 이해해보겠습니다. 

## throttle

아래는 *네이버 사전*에서 throttle을 검색한 결과입니다.

![throttle-dic](/debounce-and-throttle-image/throttle-dic.png)

***'목을 조르다'*** 라는 뜻이 가장 먼저 나옵니다. 이 의미에 비추어 보았을 때 throttle은 *"요청이 지나가는 통로를 목을 조르듯 조여서 요청의 개수를 조절한다"*라고 이해할 수 있습니다.

throttle time을 1000ms로 한다면 1000ms에 한 요청만 지나갈 수 있도록 통로를 조이는 것입니다. **병목현상**을 의도적으로 만드는 것으로 볼 수도 있겠네요. 

(물론 나머지 요청은 폐기하므로 메모리에 요청이 쌓여있거나 하지는 않습니다)

![쵸코슬램](/debounce-and-throttle-image/choke.png)
> throttle을 사용하고 있는 배우

## debounce

debounce는 전기공학에서 쓰이던 전문용어입니다. [네이버 지식백과](https://terms.naver.com/entry.nhn?docId=820206&cid=50376&categoryId=50376)에서는 *"기계식 스위치의 동작을 전기적 신호로 바꿀 때 생기는 진동 잡음을 제거하기 위하여 사용하는 하드웨어의 지연 회로"* 라고 소개하고 있습니다.


# Wrapping up

debounce와 throttle의 차이에 대해서 간단하게 살펴봤습니다. 이 둘은 유사하지만 다르기 때문에 적절하게 사용하지 않으면 오히려 사용성을 해칠 수 있습니다. 

예를 들어 SNS에서 자주 쓰이는 **무한 스크롤** 기능에서는 debounce보다 throttle이 적합합니다. 유저가 스크롤링을 멈출 때까지 기다렸다가 새로운 글을 불러오는 것보다는 유저의 스크롤이 어느 정도 내려왔을 때 미리 글을 불러오는 것이 좀 더 좋은 경험을 제공할 수 있을 것입니다.

반면 toggle 버튼의 이벤트 리스너에는 debounce가 더 적합합니다. 

저는 모바일에서 toggle 버튼이 있으면 항상 여러 번 눌러봅니다. 애니메이션을 보는 것이 재밌기도 하지만 앱이 죽나 안 죽나 보고 싶기도 합니다. 저와 같은 유저들의 횡포를 막기 위해서 toggle 이벤트 리스너에 어느 정도 debounce를 줘서 마지막으로 일어난 toggle의 요청만 처리하는 것이 좋을 것입니다.

![material-toggle](/debounce-and-throttle-image/material-toggle.png)
> I love toggle

## 참조

- https://css-tricks.com/debouncing-throttling-explained-examples/