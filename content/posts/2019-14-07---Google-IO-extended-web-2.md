---
title: Google I/O Extended 2019 Seoul WebTech 참관기 (2/2)
date: "2019-07-20T12:19:02.169Z"
template: "post"
draft: false
slug: "/posts/google-io-extended-web-2/"
category: "Tech"
tags:
  - "Web Development"
  - "Google"
description: "2019년 5월 7-9일에 열렸던 Google I/O 세션 중 Web 관련 기술을 집중 조명해 공유하는 자리를 가졌습니다."
---

![google_io_2.jpeg](/Google-IO-extended-web/google_io_2.jpeg)

지난 7월 13일에 열렸던 Google I/O extended WebTech 참관기 2편입니다.

> **1편을 읽고 싶으시다면? [저를 누르세요](https://kwoncheol.me/posts/google-io-extended-web-1/)**


- Puppeteer
- Portals
- New Capabilities of the Web
- [WebAssembly](#webassembly)
- [PWA](#pwa)
- [Lighthouse](#lighthouse)

----

## WebAssembly

> #### **[토스](http://toss.im)의 Frontend Engineer [이현섭](https://hyunseob.github.io/)님이 발표하신 [세션](https://www.slideshare.net/hyunseoblee7/webassembly-101)입니다.**
<br>

세션 시작에 앞서 현섭님께서 세 가지 질문을 던지셨습니다.

1. WebAssembly는 왜 생겼나요?
2. WebAssembly를 쓰려면 C/C++를 써야 하나요?
3. WebAssembly가 Javascript를 대체할까요?

특히 2,3번 질문은 WebAssembly를 처음 접한 분들이라면 많이들 궁금해하실 질문인 듯합니다. 

이 질문들에 대한 답으로 현섭님은 WebAssembly의 역사부터 현재까지 세션을 진행해 주셨습니다. 이를 간략하게 정리하여 소개 해드리겠습니다. 

### 태초에... 

 WebAssembly라는 개념이 나오기 한참 전인 2012년, [Emscripten](https://emscripten.org) 이란 녀석이 나왔습니다. Emscripten은 C/C++ 코드를 Javascrip 코드로 컴파일해주는 source to source 컴파일러입니다. C/C++로 작성한 코드를 웹페이지에서 재활용하기 위한 목적이었습니다. 이후 이러한 js 코드를 [asm.js](https://blog.outsider.ne.kr/927)라는 이름으로 부르기 시작했습니다. asm.js는 js의 부분집합으로 Object, Closure, String 등을 빼고 primitive 타입들과 while, if 등 C/C++ 에서 사용 가능한 기능들로 동일하게 구성돼있습니다.

![asm_js_example.jpg](/Google-IO-extended-web/asm_js_example.jpg)
> asm.js는 이렇게 생겼다!

이것을 계기로 "그냥 브라우저에서 쓰일 어셈블리어를 새로 정의하자" 라는 움직임이 일었고 2017년 3월, 마침내 [WebAssembly](https://developer.mozilla.org/ko/docs/WebAssembly) 라는 이름으로 등장하게 됩니다.

----

그런데 왜 어셈블리어로 작성해야 하는 걸까요? 세션에서는 속도와 재활용 두 가지를 이유로 들었습니다.

정적타입, 메모리를 직접관리 관리하는 언어들은 성능이 상당히 좋습니다.(like C, Rust) 또한 C/C++ 로 작성된 소프트웨어/라이브러리가 상당히 많기 때문에 웹에서 이를 재활용할 수 있다는 것은 상당한 advantage가 될 수 있습니다.
 
### WebAssembly

현재 WebAssembly는 매우 다양한 언어로 작성 가능합니다. 대표적으로 다음 세 가지 언어가 있습니다.

1. C/C++
2. Rust
3. Typescript

![wasm_example.jpg](/Google-IO-extended-web/wasm_example.jpg)


- **C/C++**는 위에서 얘기했던 Emscripten을 이용해 WebAssembly코드를 생성합니다. (Emscripten는 asm.js와 WebAssembly 두 가지 모두 변환이 가능한 것입니다.)

- **Rust**는 자체 컴파일러에서 WebAssembly 코드 생성을 지원합니다.

- 마지막으로 **Typescript**는 Binaryen이라는 컴파일러를 통해 WebAssembly 코드로 변환됩니다. 
*정적 타입변환을 해야 하므로 `any`나 `undefined`같은 타입은 사용할 수 없습니다.*

WebAssembly는 2017년 말부터 4개의 주요 브라우저에서 모두 지원하고 있기 때문에 나름 안정화된 단계로 접어들고 있다고 말할 수 있습니다.

#### Is it the end of JS?

그렇다면 자바스크립트는 더이상 쓰이지 않는 것일까요? 대답은 **No** 입니다.

JS가 WebAssembly보다 [더 빠른 경우](https://lemire.me/blog/2018/10/23/is-webassembly-faster-than-javascript/)도 있으며 가벼운 애플리케이션의 경우 WebAssembly로 얻는 이점이 미미하기 때문에 투자대비 효율이 좋지 않을 수 있습니다.

현재 WebAssembly는 이미지 처리, 게임, 복잡한 알고리즘 등 **무거운 동작**에 적합하며 바로 다음에 소개할 **PWA**와 결합되면 상당한 시너지 효과를 낼 수 있을 것으로 보입니다.

----

## PWA

> #### **[Peer](https://peer.com/)의 Frontend Engineer 장한보람님이 발표하신 [세션](https://www.slideshare.net/HanboramRobinJang/io-extended-2019-webtech-going-bigpwa)입니다.**
<br>

PWA(Progressive Web App)는 지난 글에서 이야기했던 [New capabilities of the Web](https://kwoncheol.me/posts/google-io-extended-web-1/#new-capabilities-of-the-web)와 맡닿아 있는 것이 많습니다.
둘 다 **Web**을 **Universal application platform**으로 만들자는 목표로 나오게 된 것들입니다.

PWA는 간단히 말하면 웹앱을 **모바일/데스크탑** 앱으로 쓸 수 있게 해주는 awesome한 녀석입니다! 이렇게만 들으면 더 이상 [리액트네이티브](https://facebook.github.io/react-native/), [일렉트론](https://electronjs.org)은 필요가 없어 보입니다. 물론 언젠가 그런 날이 올 수도 있지만 아직은 시기상조입니다.

우선 PWA의 주요 특징부터 살펴보겠습니다.

#### 1. UI
PWA는 브라우저에서 동작합니다. 하지만 **브라우저처럼 보이지 않는 브라우저**에서 동작합니다. 

PWA는 선택적으로 브라우저의 주소창이나 툴바를 보이지 않도록 할 수 있기 때문입니다. 이렇게 되면 일반 네이티브 애플리케이션과 똑같은 모습을 갖게 됩니다.

![pwa_toolbar.jpg](/Google-IO-extended-web/pwa_toolbar.jpg)

#### 2. 아이콘

PWA로 만든 웹앱은 모바일/데스크톱에서 다른 네이티브 앱처럼 아이콘을 가질 수 있습니다. 


#### 3. 시스템과의 결합

PWA 존재의 가장 큰 이유입니다. 일반적으로 웹앱은 인터넷 연결이 끊기면 그대로 앱이 종료됩니다. 

![no_connection.jpg](/Google-IO-extended-web/no_connection.jpg)
> 크롬에서 인터넷이 끊기면 게임을 할 수 있다

하지만 PWA 웹앱은 오프라인에서도 미리 만들어 둔 화면을 보여줄 수 있으며 인터넷 연결이 필요하지 않은 부분의 서비스는 **오프라인에서도 사용할 수 있습니다.**

또한 캐쉬기능도 지원하기 때문에 이전에 유저가 사용했던 데이터를 기반으로 오프라인에서도 최대한의 서비스를 제공할 수 있습니다.
 
그리고 **푸쉬알림** 또한 지원합니다 🎉 네이티브 앱과 마찬가지로 푸쉬알림 권한을 요청할 수 있으며 유저가 허용할 시 디바이스로 알림을 보낼 수 있습니다. 

다만 **IOS**는 아직 푸쉬알림을 지원하지 않습니다 😢

### Architecture

마무리하기 전에 PWA의 구조를 잠시 살펴보겠습니다.

![pwa_architecture.jpg](/Google-IO-extended-web/pwa_architecture.jpg)

위에서 주목할 것은 Web App Manifest와 Service Worker입니다
- **Web App Manifest**
 Manifest는 앱의 겉모습을 담당합니다. 앱 이름, 아이콘, 테마컬러, 화면모드 등을 설정할 수 있습니다.

- **Service Worker**
 서비스워커는 OS와의 결합을 관장합니다. 오프라인에서 제공할 기능이나 푸쉬알림을 여기서 설정할 수 있습니다.

 
----

## Lighthouse

> #### **[네이버](https://www.navercorp.com/) Frontend Engineer [조은](https://brunch.co.kr/@techhtml)님이 발표하신 세션입니다.**
<br/>

개인적으로 가장 흥미로웠던 세션입니다. [Lighthouse](https://developers.google.com/web/tools/lighthouse/?hl=ko)는 웹사이트의 품질을 측정해주는 도구입니다. [크롬 확장도구](https://chrome.google.com/webstore/detail/lighthouse/blipmdconlkpinefehnmjammfjpmpbjk)로 손쉽게 사용해 볼 수 있으며, 커맨드라인이나 노드 모듈로도 사용할 수 있습니다. 

크롬 확장도구 화면입니다. Lighthouse를 설치하고 Audit탭에서 사용할 수 있습니다.

![lighthouse_extension.png](/Google-IO-extended-web/lighthouse_extension.png)

Lighthouse는 측정결과를 크게 다섯 가지 카테고리로 나누어 보여줍니다.

#### 1. Performance

 네 가지 카테고리 중 가장 중요한 파트가 아닐까 싶습니다. 퍼포먼스는 다음 6가지 metric을 기준으로 평가합니다.

- [컨텐츠가 그려지기 시작하는 시간](https://developers.google.com/web/tools/lighthouse/audits/first-contentful-paint?utm_source=lighthouse&utm_medium=devtools)
- [의미있는 컨텐츠가 그려지기 시작하는 시간](https://developers.google.com/web/tools/lighthouse/audits/first-meaningful-paint?utm_source=lighthouse&utm_medium=devtools)
- [컨텐츠가 채워지는 데 걸리는 시간](https://developers.google.com/web/tools/lighthouse/audits/speed-index?utm_source=lighthouse&utm_medium=devtools)
- [CPU가 idle 상태로 진입하는 시간](https://developers.google.com/web/tools/lighthouse/audits/first-cpu-idle?utm_source=lighthouse&utm_medium=devtools)
- [유저가 웹사이트와 interact가 가능해지는 시간](https://developers.google.com/web/tools/lighthouse/audits/time-to-interactive?utm_source=lighthouse&utm_medium=devtools)
- [유저가 인풋의 지연시간](https://developers.google.com/web/tools/lighthouse/audits/estimated-input-latency?utm_source=lighthouse&utm_medium=devtools)

performance를 측정할 때 중요한 것은 측정을 시작하기 전에 **Throttling**을 설정해줄 필요가 있다는 것입니다. 우리는 서비스 항상 최적의 환경에서 실행될 것이라고 보장할 수 없습니다. 그러므로 서비스 제공자 입장에서는 최악의 상황을 기준으로 성능을 측정하는 것이 더 적합하다고 생각합니다. 

![throttling.png](/Google-IO-extended-web/throttling.png)

#### 2. Accessibility

접근성 항목은 사이트 내의 컨텐츠가 얼마나 잘 연결되어 있는지를 평가합니다. 전체적으로 **적절한 HTML 태그**가 사용되었는지, **계층관계**가 적절한지, **필요한 속성값**들이 들어있는지를 중심으로 평가합니다.
일례로 link 이동을 할 때 HTML a tag가 아닌 `onClick` method로 이동하면 접근성에서 좋지 않은 점수를 받습니다. 또한 img 태그에서 alt 속성을 사용하지 않는 것, html태그에 언어 속성을 넣지 않는 것 등도 마이너스 요인이 됩니다. 

#### 3. Best Practices

Best practice는 간단히 말해 **웹페이지의 잘 동작하는지**를 평가합니다. 캐쉬를 적절히 사용하는지, HTTPS를 지원하는지, 적절한 프로토콜을 사용하는지, deprecated된 API를 쓰지는 않는지 등 다양한 요소들을 검사합니다.

#### 4. SEO

SEO는 서비스를 제공하는 입장이라면 Performance 못지않게 중요합니다. SEO 점수는 meta 태그들이 잘 적용되었는지, canonical url이 설정되어 있는지 등 **접근성을 높여주는 요소**들과 더불어 **페이지 인덱싱을 방해하는 요소들이 있는지**를 중심으로 평가합니다.

[AMP](https://en.wikipedia.org/wiki/Accelerated_Mobile_Pages), [json-ld](https://ko.wikipedia.org/wiki/JSON-LD) 등 부가적인 요소는 평가항목에 들어가지 않는 것으로 보입니다.

#### 5. PWA

마지막으로 PWA는 위에서 이야기했던 PWA 기능을 얼마나 잘 제공하는지를 측정합니다. PWA는 점수로 측정을 하지는 않습니다. 점수보다는 어떤 기능들을 제공하고 있는지, 제공유무를 체크해서 보여줍니다.

----

## Wrapped up

모든 세션이 끝난 이후 간단한 네트워킹 시간이 주어졌습니다. 네트워킹보다는 세션이 주가 됐던 행사라 긴 시간을 함께 하지는 못했지만 행사를 정리하며 업계 분들과 인사도 나눌 수 있었던 귀중한 시간이었습니다.

내년에는 더 많은 I/O 행사에 참여하도록 해봐야겠습니다.