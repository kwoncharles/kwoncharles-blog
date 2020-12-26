---
title: "Dotenv와 ES6 import 구문"
date: "2019-11-02T10:06:02.169Z"
template: "post"
draft: false
slug: "/posts/dotenv-and-module"
category: "Tech"
tags:
  - "javascript"
  - "es6"
  - "import"
description: "ES6 import 문을 사용했을 때 Dotenv가 늦게 적용되는 문제가 발생했습니다. 원인을 알아보고 import문이 어떻게 동작하는지 살펴보겠습니다."
---

----

## TL;DR

> ### es6의 import 구문은 **호이스팅**된다.

## 사건의 발단

얼마 전 회사에서 새로운 프로젝트를 시작했습니다. 저는 새롭게 개발된 API서버를 전달 받고 로컬에서 실행시킨 다음 클라이언트에서 요청을 보내봤습니다.
  
엥 그런데 시작부터 에러가 떴습니다.

```bash
UnhandledPromiseRejectionWarning: Error: ER_ACCESS_DENIED_ERROR:
Access denied for user ''@'localhost' (using password: NO)
```
> Error

에러 메세지는 *'**접근 제한 에러**가 일어났는데 서버에서 `Promise rejection` 처리를 제대로 안 해줬다'* 이런 내용이었습니다. 

----

## 원인을 찾아보자

접근 제한이 일어난 곳을 찾기 위해 에러 메세지를 좀 더 살펴봤습니다. 그리고 의심되는 부분을 하나 찾았습니다.

```bash
for user ''@'localhost'
```

 @ 앞에 유저 이름이 붙어있어야 했는데 빈 문자열이 들어가 있었습니다. 

아하, 환경변수가 제대로 처리되지 않았다는 것을 알게 됐습니다. 

서버에서는 환경변수 설정을 위해 [dotenv](https://github.com/motdotla/dotenv#readme) 라이브러리를 사용중이었습니다. `dotenv`가 적용되는 로직은 `express` 서버 생성 코드와 함께 있었으며 다음과 같은 모습이었습니다.

```typescript
require('dotenv').config();
import express from 'express';
import cors from 'cors';
// ...(후략)
```
> index.js

`dotenv.config()` 를 호출하는 코드가 최상단에 있었고 다른 모듈을 가져오는 import문이 뒤따랐습니다.

순서로만 봤을 땐 `require('dotenv').config()` 에 의해 `.env` 파일에 들어있는 환경변수들이 먼저 적용되고, 그 이후에 import를 한 모듈들이 로딩될 것만 같았습니다.

그러나 에러가 떴으니 무언가 잘못된 것은 분명합니다.

확실히 하기 위해 console에 환경변수를 찍어봤습니다.

```typescript
require('dotenv').config();

console.log(`DB_USER in index.js - ${process.env.DB_USER}`);

import express from 'express';
import cors from 'cors';
// ...
```
> index.js

```typescript
// config.js(에러가 발생한 모듈)
export function getDbConfig() {
  console.log(`DB_USER in config.js - ${process.env.DB_USER}`);

  //...
}
```
> config.js

결과는 다음과 같았습니다.

``` bash
DB_USER in config.js - undefined
DB_USER in index.js - username
Listening on port 3001 👂🏻
```

프로젝트 진입점 최상단에서 호출되는 `console.log` 보다 import구문을 통해서 로드된 모듈안에서 호출되는 `console.log`가 먼저 실행되고 있었습니다.

이것으로 원인은 ***"무엇인가 때문에 환경변수가 늦게 적용되고 있다"*** 라고 가정할 수 있게 됐습니다. 그리고 문제의 `dotenv`는 다른 모듈과는 다르게 require 구문을 통해 불려지고 있었습니다. **CommonJS**의 require 과 **ES6**의 import , 둘 사이의 차이를 살펴봐야 할 시간이었습니다. 

----

## import vs require

결론부터 말씀드리면 원인은 import 구문의 [호이스팅](https://developer.mozilla.org/ko/docs/Glossary/Hoisting)이었습니다.

import 구문은 같은 코드 블록 내에서는 위치에 상관 없이 require 구문보다 먼저 실행됩니다. [import 구문은 호이스팅되고](http://www.ecma-international.org/ecma-262/6.0#sec-moduledeclarationinstantiation) require 구문은 호이스팅되지 않기 때문입니다.

> *(생각해보니 require 구문은 변수에 할당이 가능한 표현식(Expression)이고 import는 할당이 아닌 선언문(statement)이므로 그렇게 동작하는 것이 맞는 듯합니다...)*


위에서 보았던 `index.js` 코드에서는 `require('dotenv')` 를 가장 먼저 호출했지만 import 구문의 호이스팅에 밀려 실제 코드가 실행될 때는 다른 모듈보다 더 늦게 불려진 것입니다.


추가로 import 구문이 불러온 모듈은 또 다른 모듈을 불러올 것이고 이렇게 자식 모듈들까지 모두 불려온 뒤에 그 다음 모듈이 불려지므로 `require('dotenv')` 는 상당히 늦은 시간에 호출되게 됩니다.

`index.js`에서 다음과 같이 모듈을 불러온다고 가정해봅시다. `UserDataController` 라는 모듈을 import로 불러오고 `UserDataController` 모듈은 `getDbConfig` 라는 모듈을 불러옵니다.

```typescript
require('dotenv').config();
// ...
import UserDataController from 'controllers/user';
```
> index.js

```typescript
import { getDbConfig } from './config';
// ...
```
> controllers/user.js

위 코드에서 모듈이 불려지는 순서는 다음과 같습니다.

#### 1.
```typescript
import UserDataController from 'controllers/user';
```
> index.js

#### 2.
```typescript
import { getDbConfig } from '/.config';
```
> controllers/user.js

#### 3.
```typescript
require('dotenv');
```
> index.js


이 상황에서 환경변수 설정 코드는 import 구문보다 항상 나중에 실행될 수밖에 없습니다.

----

### 여기서 잠깐

글을 읽으시면서 이상하다고 느끼신 분이 분명 계실겁니다. 제가 API서버 코드를 받아서 실행했다고 했습니다. 서버 개발자님께서는 잘 동작하는 API니까 저에게 전달해주셨을 것입니다.

서버 개발자님 환경에서 이 코드가 잘 동작했던 이유는 서버 개발자님 환경에 설치돼있던 [autoenv](https://beomi.github.io/2017/07/16/Use-Autoenv/) 라는 툴 때문입니다. `autoenv` 가 CLI 레벨에서 `.env` 파일을 자동으로 인식하고 환경변수를 주입해줬기 때문에 `dotenv` 라이브러리가 동작하지 않아도 환경변수가 잘 등록됐던 것입니다.

----

## 문제 해결

자 그럼 이 문제를 어떻게 해결했을까요? `dotenv` 를 CLI에서 적용하는 방법 말고, 코드 내에서 import 구문의 특성을 이용해서 해결하는 방법을 찾고 싶었습니다.

단순히 require 를 import 로 바꾸는 것은 해결방법이 아닙니다. 왜냐하면 `config()` 함수를 실행해야 최종적으로 환경변수가 적용되는데 함수호출은 표현식(Expression)이기 때문에 호이스팅되는 import 보다 나중에 실행되기 때문이죠. *(표현식은 호이스팅되지 않습니다)*

```typescript
import Dotenv from 'dotenv';
Dotenv.config(); // 표현식이기 때문에 import보다 늦게 실행됨
import UserDataController from 'controllers/user';
```
> index.js

`UserDataController` 를 동적으로 import 하는 것도 방법일 수 있지만 우선 그대로 두고 문제를 해결해보고자 합니다.

제가 선택한 방법은 `dotenv` 를 config하는 로직을 다른 파일에 두고 그 파일을 import로 가져오는 것입니다.

```typescript
require('dotenv').config();
```
> dotenv.js

```typescript
import './dotenv';
import UserDataController from 'controllers/user';
```
> index.js

호이스팅이 되는 선언문(statement)끼리는 순서가 유지되기 때문에 `import './dotenv'` 가 가장 먼저 실행되게 됩니다. 또한 위에서 보았듯 모듈을 'import' 하면 그 모듈의 자식 모듈까지 모두 불러온 뒤에 다음 'import'가 실행되므로 `UserDataController` 모듈이 불려올 때는 환경변수가 모두 설정되어있을 것입니다.

이제 다시 환경변수를 console에 출력해보겠습니다. 결과는 다음과 같습니다.
 
``` bash
DB_USER in config.js - username
DB_USER in index.js - username
Listening on port 3001 👂🏻
``` 

**환경변수가 정상적으로 등록돼있는 것을 볼 수 있습니다!**

(여전히 `config.js` 에서 실행한 출력이 먼저 실행된 이유는 `console.log` 는 표현식이기 때문이겠죠?)

----

이번 글에서는 ES6 import 구문의 특성이 야기한 환경변수 해프닝에 대해서 이야기해 봤습니다. 모듈은 자바스크립트의 중심이 되는 개념인 만큼 확실히 알아두고 가는 것이 좋을 것 같습니다. 

> ### import는 호이스팅된다.