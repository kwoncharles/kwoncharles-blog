---
title: Google I/O Extended 2019 Seoul WebTech 참관기 (1/2)
date: "2019-07-14T10:40:32.169Z"
template: "post"
draft: false
slug: "/posts/google-io-extended-web-1/"
category: "Tech"
tags:
  - "Web Development"
  - "Google"
description: "2019년 5월 7-9일에 열렸던 Google I/O 세션 중 Web 관련 기술을 집중 조명해 공유하는 자리를 가졌습니다."
---

![google_io.jpeg](/Google-IO-extended-web/google_io.jpeg)

어제 구글 스타트업 캠퍼스에서 열렸던 I/O extended에 다녀왔습니다. **Google I/O**는 구글에서 여는 가장 큰 규모의 개발자 중심 컨퍼런스입니다. [2008년](https://sites.google.com/site/io/)을 시작으로 10년 넘게 이어지고 있으며, 매년 5월 (가끔 6월) 구글 본사가 위치한 캘리포니아 마운틴뷰에서 열립니다.

**수많은** 사람들이 몰리며 행사 전후로 개발자 커뮤니티는 I/O 이야기로 가득찹니다. 하지만 시공간(?)의 제약으로 **수많은** 사람들이 참여하지 못하는 행사이기도 합니다. 

그래서 전 세계에 퍼져있는 구글 alumni들과 커뮤니티 회원들이 Google I/O extended를 열기 시작했습니다. 대한민국에서는 [GDG Korea](https://www.meetup.com/ko-KR/GDG-Seoul/)가 진행하고 있습니다.

로컬베이스로 개최되는 이 행사는 Google I/O에 있었던 수많은 세션 중 일부 세션을 다시 공유하는 자리입니다. 우리나라에서는 서울, 부산, 인천, 광주 등 다양한 곳에서 I/O extended가 개최되고 있습니다. 또한 지역 내에서도 한 번만 개최되는 것이 아니라 주제를 나누어 여러 번에 걸쳐서 개최됩니다.

어제 제가 참가한 행사는 Web 기술에 집중했던 자리였습니다. 프론트엔드 개발자 분들이 많이 오셨으며 학생분들도 많이 볼 수 있었습니다.

----

총 6개의 세션이 진행되었으며, 3명의 organizer분들이 두 세션씩 발표를 해주셨습니다. 


- [Puppeteer](#puppeteer)
- [Portals](#portals)
- [New Capabilities of the Web](#new-capabilities-of-the-web)

----

## Puppeteer

> #### **[토스](http://toss.im)의 Frontend Engineer [이현섭](https://hyunseob.github.io/)님이 발표하신 [세션](https://www.slideshare.net/hyunseoblee7/puppeteer-getting-started)입니다.**
<br>

[Puppeteer](https://pptr.dev/)는 Chrome 혹은 Chromium이 할 수 있는 일을 커맨드라인에서 실행할 수 있게 해주는 라이브러리입니다. 

공식문서에서는 _"which provides a high-level API to control **headless Chrome or Chromium** over the DevTools Protocol."_ 라고 설명하고 있습니다. 여기서 *headless* 란 GUI가 없다는 의미입니다.

쉽게 말해 우리는 Puppeteer를 이용해 크롬에서 할 수 있는 _거의 모든 작업을_ 코드로 만들어 **자동화**시킬 수 있습니다. 구글 Chrome 팀에서 개발했고 관리하고 있습니다.

세션에서는 다음 네 가지 예제로 데모를 진행했습니다. 

* e2e Testing ([무엇인지 모르시는 분 클릭](https://ropig.com/blog/end-end-tests-dont-suck-puppeteer/))
* SPA Prerendering
* Crawling
* Generating PDF

> 데모에서 사용된 모든 코드는 [여기](https://github.com/HyunSeob/puppeteer-getting-started)서 확인하실 수 있습니다.
>

여기서는 PDF를 만드는 예제만 살펴 보겠습니다.

``` js
const puppeteer = require("puppeteer");

(async () => {
	// 1. 브라우저를 시작하고 새로운 페이지를 생성한다.
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();

	// 2. 페이지 사이즈를 조정한다.
	await page.setViewport({
		width: 1200,
		height: 800
	});

	// 3. 원하는 페이지로 이동한다.
	await page.goto(
		"https://kwoncharles.netlify.com"
	);

	// 4. PDF 파일을 생성한다.
	await page.pdf({
		path: "Kwoncharles-blog.pdf",
		format: "A4"
	});

	// 5. 브라우저를 종료한다.
	await browser.close();
})();
```

주석을 달아 놓긴 했지만 주석이 없더라도 알아보기 쉽게 코드가 나오는 것을 볼 수 있습니다. 이와 비슷하게 sequential한 코드로 쉽게 자동화 할 수 있는 것들이 많아 보입니다.

예를 들어, 회원가입이나 예약 등의 form을 작성할 때 유용한 **자동완성** 기능도 puppeteer를 이용하면 직접 구현할 수 있습니다. 
<br>

**SPA prerendering** 같은 경우에는 크롤링에 큰 도움이 될 수 있는 기능입니다. 최근 개발된 대부분의 웹사이트는 React, Angular, Vue 등을 이용해 개발된 SPA(Single Page Application)입니다. SPA는 웹페이지가 실행될 때 JS를 이용해 DOM을 그리기 때문에 **일반적인 크롤러**는 SPA를 빈 페이지로 인식합니다.

하지만 Puppeteer를 이용하면 크롤러가 JS를 실행할 수 있게 되고 SPA 이더라도 모든 페이지를 정상적으로 읽어올 수 있게 됩니다.

<br>

Puppeteer와 함께라면 모든지 할 수 있을 것 같아 보입니다. 하지만 가장 큰 제약은 역시 [Captcha](https://www.pandasecurity.com/mediacenter/panda-security/what-is-captcha/)와 같은 Bot Detecting System 입니다. 이를 보완하기 위해 인간의 움직임을 흉내낼 수 있는 라이브러리도 있다고 합니다. 이는 주제를 벗어나므로 다루지 않겠습니다!

----

## Portals

> #### **[네이버](https://www.navercorp.com/) Frontend Engineer [조은](https://brunch.co.kr/@techhtml)님이 발표하신 세션입니다.**
<br>

어벤저스를 보셨거나 게임을 좋아하시는 분이라면 포탈이라는 단어를 들었을 때 떠오르는 무언가가 있을 것입니다. 네 맞습니다. 이번 세션에서 소개된 포탈도 그와 동일한 역할을 하는 포탈입니다. 

백문이 불여일견이니 [포탈이 동작하는 영상](https://web.dev/hands-on-portals)을 먼저 보시면 좋겠습니다.

 

  

영상에서는 유저가
1. 레시피를 살펴보고
2. 레시피를 'my recipe'에 추가하고
3. 레시피의 상세정보를 확인하고
4. 주문카트에 담긴 상품들을 확인합니다.

그리고 영상 왼쪽에는 현재 유저가 머무는 웹사이트의 주소가 나와 있습니다. (브라우저 주소창에서도 나와 있습니다) 
이를 주의 깊게 보셨더라면 위 네 가지 동작을 오갈 때 웹 주소가 바뀌는 것을 볼 수 있습니다. 웹페이지 내의 경로만 바뀌는 것이 아닌 URL 자체가 모두 변경됩니다.

포탈은 여러 웹사이트 간의 **이동**과 **데이터 전달**을 위한 차세대 웹 기술입니다. 

한마디로 [“A new webpage navigation system”](https://www.google.com/amp/s/www.zdnet.com/google-amp/article/google-launches-portals-a-new-web-page-navigation-system-for-chrome/) 라고 할 수 있습니다. 

일각에서는 iframe을 대체할 기술이라고도 말하는데 iframe이 갖는 장점도 있기 때문에 어떻게 될지는 더 지켜봐야 할 듯합니다.


#### Micro Frontend
그런데 포탈이 단순히 페이지 간의 이동을 자연스럽게 보여주기 위해서 나온 것은 아닙니다. 포탈이 등장하게 된 진짜 배경을 이해하기 위해서는 [Micro Frontend](https://micro-frontends.org/)를 이해할 필요가 있습니다. 

Micro Frontend는 쉽게 말해 [Microservice Architecture](https://www.slideshare.net/Byungwook/micro-service-architecture-52233912)의 프론트엔드 버전입니다. API를 분리하듯 프론트엔드 애플리케이션도 분리하여 독립적으로 관리하자는 것이죠. 

이렇게 되면
1. 규모가 큰 조직에서 서로 다른 팀이 개발한 프로덕트끼리 규격이 안맞음으로 발생하는 문제를 최소화할 수 있으며
2. 애플리케이션이 분리되기 때문에 하나의 기능이 장애를 일으키더라도 다른 기능은 정상적으로 사용할 수 있다는 점입니다.

포탈은 아쉬운 점은 대부분의 브라우저가 포탈을 아직 지원하지 않기 때문에 상용화(?)되려면 조금 더 기다려야 합니다.  

_**데모**를 원하시는 분은 [크롬 카나리아](https://www.google.com/intl/ko/chrome/canary/) 설치 후 [여기서](http://uskay-portals-demo.glitch.me/) 진행할 수 있습니다!_

![portals-html.png](/Google-IO-extended-web/portals-html.png)
*포탈이 무슨 프레임워크 같은 것인줄 알았는데 그냥 html 태그입니다..*

----

## New Capabilities of the Web
> #### **[Peer](https://peer.com/)의 Frontend Engineer 장한보람님이 발표하신 [세션](https://www.slideshare.net/HanboramRobinJang/io-extended-2019-webtech-new-capabilities-for-the-web)입니다.**

구글 크롬팀에서 진행중인 프로젝트 중에 [Project Fugu 🐡](https://www.chromium.org/teams/web-capabilities-fugu)라는 것이 있습니다. **"More capable web"**을 외치는 이 프로젝트는 Web이 Native App에 비해 제한된 기능을 갖고 있다는 일명 **'App Gap'** 문제를 해결하자는 취지에서 나오게 됐습니다.

_제한된 기능의 예로는, 로컬파일의 접근, OS 레벨 접근 등이 있습니다._

그리하여 현재 다음과 같은 기능들을 사용할 수 있습니다. (지원하는 브라우저가 아직 많지 않기 때문에 프로덕션에서 사용은 힘들 수 있습니다...)

#### 1. [Web share api](https://developers.google.com/web/updates/2016/09/navigator-share)

  웹에서도 OS나 로컬에 있는 애플리케이션들로 직접 공유할 수 있도록 해주는 기능입니다.

![web-share-api.png](/Google-IO-extended-web/web-share-api.png)


#### 2. [Media session api](https://developers.google.com/web/updates/2017/02/media-session)

  디바이스에서 실행중인 노래, 영상 등을 컨트롤 할 수 있는 API입니다.

  ![media-session.png](/Google-IO-extended-web/media-session.png)
  

#### 3. [Shape detection api](https://www.chromestatus.com/feature/4757990523535360)
  
  얼굴, 바코드, 글자 등을 인식할 수 있는 이미지 인식 기능을 갖고 있습니다.


이 외에 스크린 끄고 켜기, 디바이스 잠금해제 등 기능이 개발 중입니다!

----

*나머지 세 개의 세션은 다음 글에서 다루도록 하겠습니다* 👋
