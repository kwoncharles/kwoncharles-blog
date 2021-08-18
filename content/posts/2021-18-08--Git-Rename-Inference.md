---
title: "git이 폴더경로 변경을 알아내는 방법"
date: "2021-08-18T16:00:32.169Z"
template: "post"
draft: false
slug: "/posts/git-rename-inference"
category: "Tech"
tags:
  - "git"
description: ""
---

## 목차

- [들어가기 전에](#들어가기-전에)
- [폴더구조 개편, 그리고 제법 똑똑한 git](#폴더구조-개편-그리고-제법-똑똑한-git)
- [git의 넘겨짚기](#git의-넘겨짚기)
- [git의 `renamed` , `edit-renamed` 추론 과정](#git의-renamed--edit-renamed-추론-과정)
  - [너무 비싼 연산 아닌가요?](#너무-비싼-연산-아닌가요)
- [비하인드 삽질 스토리](#비하인드-삽질-스토리)
- [마무리](#마무리)

![thumnbnail](/git-rename-inference/thumbnail_thomas-kelley.jpg)

## 들어가기 전에

들어가기 전에 git의 내부 구조에 익숙하지 않으신 분들을 위해서 git의 세 가지 특성을 간략하게 소개드리겠습니다.

> 이미 아시는 분들도 계시겠지만 짧은 내용이니 후루룩 훑고 넘어가셔도 좋을 것 같습니다 :)

### 1. git은 파일을 hash 값으로 구분합니다

git 프로젝트에는 다양한 내용의 파일들이 저장됩니다. 이 때 git은 각 파일을 40글자의 hash 값을 이용해 구분합니다. 40글자의 hash 값은 파일 내용을 이용해 만들어 낸 값으로, **파일 내용이 동일하다면 만들어지는 hash값도 동일**합니다.

따라서 **git은 파일의 hash 값을 이용해 두 개의 파일이 같은 내용을 갖고 있는지 알아낼 수 있습니다.** 

### 2. git의 네 가지 데이터 타입

git에는 네 가지 데이터 타입이 존재합니다.

- `blob` 데이터는 파일의 내용입니다. blob은 **b**inary **l**arge **ob**ject의 약자입니다. 앞서 설명드린 hash된 파일내용이 `blob` 데이터입니다.

- `tree` 데이터는 프로젝트 내에 존재하는 파일들의 '경로', '접근권한', '용량', '파일명' 등을 포함하고 있습니다. git 프로젝트의 폴더구조가 `tree`라는 데이터들로 이루어져있다고 생각하시면 됩니다. (경로뿐만 아니라 파일명 또한 `tree`라는 것을 기억해주세요)

- `commit` 데이터는 여러분이 알고계신 그 commit 입니다. commit에는 작성자, 커밋 실행자, 로그 메세지, root `tree`, 부모 커밋 등의 데이터가 저장되어있습니다.

- `tag` 또한 여러분이 알고계신 그 tag 입니다. tag 이름, tag 생성자, tag 메세지 등이 저장되어있습니다.

### 3. 폴더경로 변경, 파일명 변경은 동일한 작업입니다

 git의 입장에서 폴더경로나 파일명이 변경되는 것은 동일한 작업입니다. 폴더경로, 파일명은 모두 앞서 보았던 `tree` 데이터에 저장되기 때문입니다.

---

 글을 읽으시는데 필요한 개념은 이 세 가지가 전부입니다. 글을 읽으시는 동안 **git에서 파일의 내용은 hash되어  `blob` 이라는 타입으로 관리되고, 파일명과 폴더 경로는 `tree` 라는 타입으로 관리된다는 것**만 기억해주세요!

이제 본론으로 들어가겠습니다!

## 폴더구조 개편, 그리고 제법 똑똑한 git

얼마전 팀에서 개발중인 프로젝트의 폴더구조 변경 작업을 진행했습니다. 많은 파일들이 새로운 폴더로 옮겨졌고 몇몇 파일은 참조하던 파일의 경로가 바뀜에 따라 파일 내용이 변경되기도 했습니다.

그런데 폴더구조 변경 작업을 마친 후에도 파일의 commit history가 남아있는 것을 보고 이에 의문을 품기 시작했습니다. 

폴더구조를 변경할 때 영향을 받는 파일은 크게 두 가지로 나눌 수 있습니다.

1. 폴더 경로만 변경되는 파일 → `renamed` 라고 부르겠습니다.

2. 폴더 경로와 코드가 함께 변경되는 파일 (참조하고 있는 파일이 폴더 이동 대상인 경우) → `edit-renamed` 라고 부르겠습니다.

`renamed` 의 경우는 commit history가 유지되는 것에 큰 의문을 품지는 않았습니다. 이에 대해서는 아래와 같은 추측을 했습니다.

1. git은 파일을 hash 값으로 관리한다.
2. 폴더 경로만 변경된 경우에는 파일의 hash 값이 변경되지 않는다. 경로(`tree`)만 변했을 뿐 파일 내용(`blob`)은 변하지 않았으니.
3. git은 하나의 commit 안에서 **hash 값이 같은** 파일의 추가와 제거가 함께 존재한다면 파일 경로가 변경되었다고 판단할 수 있을 것이다.

그런데 `edit-renamed` 의 경우에도 commit history가 남아있다는 것은 납득하기 어려웠습니다. `edit-renamed` 는 파일의 hash 값(`blob`)과 폴더 경로(`tree`)의 hash 값 모두 변경됩니다. 이렇게 되면 `renamed`의 경우처럼 생성, 제거를 정확하게 매칭하여 판단할 수 없게 됩니다. 

하지만 git은  `edit-renamed` 를 알아차리고 있었습니다. `edit-renamed` 된 파일에 대해서 `git log --follow -p -- <파일경로>`  명령어를 실행하면 폴더경로가 변경되기 이전의 변경사항들까지 모두 볼 수 있었습니다.

어떻게 된 걸까요?

## git의 넘겨짚기

다양한 자료들을 찾아보았고, git은 `renamed` , `edit-renamed` 를 **'추론'을 통해서 판단한다**는 것을 알게되었습니다. 그래서 저는 이에 대한 공식문서를 찾아보았습니다. 하지만 그 추론 방법에 대해서 공식적으로 이야기하는 문서는 [코드](https://github.com/git/git/blob/master/diffcore-rename.c) 외에는 찾아볼 수 없었습니다.

하지만 고맙게도 추론 과정에 대해 소개하는 여러가지 글이 있었습니다.

- [[Github blog] Commits are snapshots, not diffs](https://github.blog/2020-12-17-commits-are-snapshots-not-diffs/#since-commits-arent-diffs-how-does-git-track-renames)
- [[stackoverflow] Trying to understand `git diff` and `git mv` rename detection mechanism](https://stackoverflow.com/questions/46256139/trying-to-understand-git-diff-and-git-mv-rename-detection-mechanism)
- [How does git detect renames?](https://chelseatroy.com/2020/05/09/question-how-does-git-detect-renames/)
- [[stackoverflow] What's git's heuristic for assigning content modifications to file paths?](https://stackoverflow.com/questions/21292562/whats-gits-heuristic-for-assigning-content-modifications-to-file-paths/21292993)
- [[git-scm] git-diff Documentation](https://git-scm.com/docs/git-diff#Documentation/git-diff.txt---find-renamesltngt)

위 글로부터 배운 내용들을 바탕으로 git이 `renamed`, `edit-renamed` 를 추론하는 방법에 대해서 소개드리겠습니다.

## git의 `renamed` , `edit-renamed` 추론 과정

git의 `renamed`, `edit-renamed` 추론은 3단계로 이루어져있습니다. 하나씩 살펴보겠습니다.

### 1단계: 후보 선발

 먼저 프로젝트 내에 추가/삭제된 파일의 경로들을 수집합니다. 이 때 '새롭게 추가'되거나 '삭제'된 파일뿐만 아니라 경로를 변경한 파일도 후보에 포함됩니다. 예를 들어 `src/a` 폴더에 있던 `index.js` 가 `src/b` 폴더로 이동할 경우 `src/a/index.js` 는 '삭제'로, `src/b/index.js` 는 '추가'로 인식됩니다.

### 2단계: 파일 hash 비교 (`renamed` 찾기)

 추가/삭제된 파일 리스트 중에서 hash값이 같은 파일이 있는지 확인합니다. 만약 hash 값이 같은 파일이 한 경로(`src/a`)에서 삭제되고 다른 경로(`src/b`)에서 추가되었다면 git은 경로가 변경(`src/a` → `src/b`), 즉 `renamed`된 것으로 '판단'합니다.

### 3단계: 파일간의 유사도 비교 (`edit-renamed` 찾기)

 2단계에서 hash 값 비교를 마친 이후 여전히 생성/삭제된 파일이 남아있다면 이제부터 `edit-renamed` 를 찾기 위해 생성/삭제된 파일간의 유사도를 비교합니다. 유사도를 비교하는 과정은 다음과 같습니다.

#### <유사도 비교 과정>

1. 추가된 파일, 삭제된 파일을 각각 하나씩 선택한다.
2. 추가 파일을 규칙에 따라 chunk로 나눈다.
3. 삭제 파일을 규칙에 따라 chunk로 나눈다.
4. 두 파일의 chunk들을 비교하여 일정 비율([기본 값은 50%](https://git-scm.com/docs/git-format-patch#Documentation/git-format-patch.txt---find-renamesltngt)) 이상 동일한 경우 `edit-renamed` 로 판단한다. 
5. 추가/삭제된 파일간의 **모든 조합**에 대하여 1~4 과정을 진행한다.
6. 유사도 점수가 가장 높은 조합부터 차례대로 `edit-renamed` 로 선택된다. (하나의 파일이 여러 개와 매칭될 수 있으므로 유사도가 높은 조합부터 선택합니다)

파일을 chunk로 나누는 과정은 아래와 같습니다.

#### <유사도 계산을 위한 chunk 분리 과정>

1. 파일 시작점으로 이동한다. 
2. 64bytes를 읽어 하나의 chunk를 생성한다. 만약 64bytes를 읽는 중간에 개행문자(`\n`)를 만나면 64bytes가 되지 않았더라도 읽기를 멈추고 chunk를 생성한다.
3. 파일을 모두 읽을 때까지 2번을 반복한다.

> ***64bytes*** 라는 매직넘버는 git이 자체적으로 설정한 값으로 보입니다.(binary 파일에는 '개행'이라는 개념이 없기 때문)
> 
> (참고) [git diff —dirstat 옵션의 lines 파라미터](https://git-scm.com/docs/git-format-patch#Documentation/git-format-patch.txt-codelinescode)

### 너무 비싼 연산 아닌가요?

느끼셨겠지만 위 유사도 비교 과정은 상당히 '비싼' 연산입니다. 생성된 파일의 수를 `A` , 삭제된 파일의 수를 `D` 라고 할 경우  `A * D` 가지 조합에 대해서 유사도 비교 연산을 진행합니다. 그래서 git은 `A + D` 가 일정 숫자를 넘어가면 rename 찾기 과정을 생략하고 넘어갑니다. [`diff.renameLimit`](https://git-scm.com/docs/git-config#Documentation/git-config.txt-diffrenameLimit) 옵션을 통해 파일 개수 제한값을 변경할 수 있으며 [`diff.renames`](https://git-scm.com/docs/git-config#Documentation/git-config.txt-diffrenames) 옵션을 사용하여 rename 찾기 과정을 완전히 생략할 수도 있습니다.

## 비하인드 삽질 스토리

글을 마치기 전에 git의 rename에 대해 알아보던 중 제가 경험했던 삽질 스토리를 하나 공유드리겠습니다. 

github에서 아래와 같은 툴팁을 보신적이 있으신가요?

![newline 경고 툴팁](/git-rename-inference/newline-github.png)

툴팁 메세지에서 알 수 있듯 파일 끝에 개행(new line)이 존재하지 않는 경우 위와 같은 경고 툴팁을 볼 수 있습니다. 처음 제가 git의 `renamed` 추론에 대해서 알아볼 때, git의 추론과 파일 끝 개행문자 사이에 어떠한 연관관계가 있을 것이라고 추측했었습니다.

그 이유는 제가 수행했던 실험 결과 때문이었는데요. 그 실험은 아래와 같았습니다.

먼저 `folder-a` 라는 폴더를 만들고, 그 안에 `index.js` 라는 이름의 파일을 추가했습니다.

```java
/**
 *  folder-a
 *   ㄴ index.js
 */
const line1 = 1;
```

그리고 현재 상태를 commit 했습니다. 첫 번째 커밋입니다.

그 다음 `edit-renamed` 상황을 연출했습니다. `folder-a` 의 폴더명을 `folder-b` 로 변경하고, `index.js` 파일에 새로운 코드를 한 줄 추가했습니다.

```jsx
/**
 *  folder-b
 *   ㄴ index.js
 */
const line1 = 1;
const line2 = 2;
```

 `git add` 를 하고 `git status` 을 입력해 변경사항이 어떻게 처리되었는지를 확인해보았습니다. git은 `const line2 = 2;`  코드를 추가한 변경사항을 어떻게 인식했을까요?

실험 결과  `renamed` 가 되는 경우도 있었고 `new file` 이 되는 경우도 있었습니다 🤔

![renamed](/git-rename-inference/renamed-example.png)

![newfile](/git-rename-inference/newfile-example.png)

눈치채셨겠지만 위 차이는 마지막줄 개행의 존재 여부에 따라 발생하고 있었습니다. `new file`로 인식된 경우는 첫 번째 커밋에서 마지막줄 개행문자를 넣지않았습니다. 

그렇다면 git의 `renamed` 추론과정과 개행 사이에 연관관계가 있는 걸까요?

위 실험을 이전 단락에서 보았던 '유사도 비교'과정을 이용해 다시 한번 살펴보겠습니다.

#### <마지막줄 개행이 **없는** 경우>

먼저 개행이 없는 경우부터 살펴보겠습니다. git은 `edit-renamed` 를 추론하기 위해 추가/삭제된 파일을 매칭한다고 했으니 삭제된 파일과 추가된 파일을 함께 살펴보겠습니다. git이 파일을 읽어들이는 모양으로 보여드리면 대략 아래와 같습니다. 

```bash
# 삭제 파일 (folder-a/index.js) 
const line1 = 1;

# 추가 파일 (folder-b/index.js)
const line1 = 1;\nconst line2 = 2;
```

파일을 읽은 후 git은 각 파일을 여러 개의 chunk로 나눈다고 했습니다. 저희가 위에서 보았던 규칙대로 chunk를 나눈다면 아래와 같은 결과가 나옵니다.

```bash
# 삭제 파일 chunk (folder-a/index.js) 
['const line1 = 1;']

# 추가 파일 chunk (folder-b/index.js)
['const line1 = 1;\n', 'const line2 = 2;']
```

이제 추가/삭제 파일의 chunk들을 비교해볼 차례입니다. git은 추가/삭제된 파일의 chunk가 50%(기본값) 이상 같다면 `edit-renamed` 로 판단한다고 했는데 위 경우는 동일한 chunk가 한 개도 없습니다. IDE에서는 변경되지 않은 것처럼 보이는 첫 번째 라인의 코드도 `folder-b/index.js` 파일에서는 개행(\n)이 포함된 체로 chunk로 묶이기 때문에 변경된 라인으로 처리됩니다.

삭제된 파일( `folder-a/index.js` )과 추가된 파일(`folder-b/index.js`)의 유사도는 0%이므로 **git은 이 변경사항을 별도의 추가, 삭제로 판단합니다.**

#### <마지막줄 개행이 있는 경우>

마지막줄 개행이 있는 경우 git이 읽어들인 파일은 다음과 같습니다.

```bash
# 삭제 파일 (folder-a/index.js)
const line1 = 1;\n

# 추가 파일 (folder-b/index.js)
const line1 = 1;\nconst line2 = 2\n;
```

그리고 chunk로 나눈 모양은 아래와 같습니다.

```bash
# 삭제 파일 chunk (folder-a/index.js)
['const line1 = 1;\n']

# 추가 파일 chunk (folder-b/index.js)
['const line1 = 1;\n', 'const line2 = 2;\n']
```

보시다시피 첫 번째 chunk가 동일합니다. 추가된 파일의 chunk중 '50% 이상'의 chunk가 삭제된 파일의 chunk에 존재합니다. 따라서 **git은 이 변경사항을 `edit-renamed` 라고 판단합니다.**

---

위 실험을 line3, line4, line5... 이렇게 계속해서 진행할 경우 마지막줄 개행이 없는 경우도 3라인 → 4라인이 될 때부터는 `edit-renamed` 로 처리됩니다. 이 과정에 대한 검증은 여러분들께 숙제로 남겨드리겠습니다!

> 위 실험은 아래 repository에서 확인하실 수 있습니다.

1. [마지막줄 개행이 있는 경우](https://github.com/kwoncharles/git-heuristic-test-with-newline)
2. [마지막줄 개행이 없는 경우](https://github.com/kwoncharles/git-heuristic-test-without-newline)

## 마무리

글을 마무리하기 전에 한 가지 고백을 하겠습니다. 저는 이 글에서 'rename'이라는 주제에 집중하기 위해서 거짓말을 하나 했습니다. 바로 'git이 변경사항을 기억한다'는 표현인데요. 사실 git은 변경사항을 기억하지 않습니다. 

> **"네? 하지만 저희는 `git log` , `git diff` 를 통해서 어느 부분이 변경되었는지 볼 수 있잖아요!"**

네 그렇습니다. 하지만 그것이 git이 변경사항을 기억하기 때문은 아닙니다. git의 변경사항 관리에 대한 자세한 설명은 github 블로그 포스트, *[Commits are snapshots, not diffs](https://github.blog/2020-12-17-commits-are-snapshots-not-diffs)* 를 참조해주세요. 참고로 이 github 블로그 포스트에는 오늘 제가 이야기한 내용의 **대부분 + α** 가 담겨있습니다. 꼭 읽어보세요!

긴 글 읽어주셔서 감사합니다.

---

> git의 설계는 알면 알수록 멋지게 느껴집니다. 앞으로 git과 관련된 글을 더 쓰게 될 것 같은 느낌이...

git의 아름다운 내부 구조에 대해서 이야기해주신 [기계인간](https://johngrib.github.io/)님, [naraekn](https://naraekn.github.io/)님께 감사의 인사를 드립니다 🙇‍♂️

## 참고한 글

#### Stackoverflow

- [View the change history of a file using Git versioning](https://stackoverflow.com/questions/278192/view-the-change-history-of-a-file-using-git-versioning)
- [Trying to understand `git diff` and `git mv` rename detection mechanism](https://stackoverflow.com/questions/46256139/trying-to-understand-git-diff-and-git-mv-rename-detection-mechanism)
- [What's git's heuristic for assigning content modifications to file paths?](https://stackoverflow.com/questions/21292562/whats-gits-heuristic-for-assigning-content-modifications-to-file-paths/21292993)

#### Github Blog

- [Commits are snapshots, not diffs](https://github.blog/2020-12-17-commits-are-snapshots-not-diffs/#since-commits-arent-diffs-how-does-git-track-renames)

#### git-scm

- [git-diff Documentation](https://git-scm.com/docs/git-diff#Documentation/git-diff.txt---find-renamesltngt)

#### Others

- [How does git detect renames?](https://chelseatroy.com/2020/05/09/question-how-does-git-detect-renames/)
