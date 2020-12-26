---
title: "단단한 컴포넌트 부수기"
date: "2020-12-26T01:35:00.169Z"
template: "post"
draft: false
slug: "/posts/break-the-component"
category: "Tech"
tags:
  - "component"
  - "react"
  - "composition"
  - "ioc"
  - "compound components"
  - "render props"
description: "feat. 조합, IoC"
---

 이번 글에서는 제가 경험 했던 '잘못된 추상화'와 개선을 위해 시도했던 것들을 공유하려고 합니다.

----

 리액트 개발을 하며 다양한 컴포넌트를 만들어 보았습니다. 그리고 ~~예상하셨듯~~ 대부분의 컴포넌트는 Deprecated (혹은 제거) 되었습니다.

제가 만든 컴포넌트가 제거된 이유는 크게 두 가지 였습니다.

1. **잘못된 추상화**: 추상화가 잘못된 컴포넌트는 시간이 지날수록 잘못된 방향으로 진화되고 결국 관리가 어려워져 쓰이지 않게되었습니다.

2. **해당 UI 혹은 기능이 더이상 필요하지 않다**: 이것은 비즈니스와 관련된 문제이기 때문에 여기서는 다루지 않겠습니다.

프론트엔드 개발자로서 개선을 할 수 있는 부분은 잘못된 추상화였습니다. 추상화가 잘못되어 제거된 컴포넌트의 생애주기(?)는 대부분 아래와 같았습니다. 

```jsx
/* 컴포넌트 탄생! 깔끔하다 ✨ */
<Dialogue
  title="안내"
  description="이것은 멋진 내용을 담고 있는 안내입니다."
  button={{
    label: '확인',
    onClick: doSomething,
  }}
/>

/**************************/
/********* 1주일 뒤 *********/
/**************************/

/**
 * "다이얼로그 버튼이 하단에 있던데, 상단에 있는 경우도 필요합니다!"
 *
 * -> props 추가 (buttonPosition)
 */
<Dialogue
  title="안내"
  description="이것은 멋진 내용을 담고 있는 안내입니다."
  button={{
    label: '확인',
    onClick: doSomething
  }}
  buttonPosition="top"
/>


/**************************/
/********* 2주일 뒤 *********/
/**************************/

/**
 * "두 개의 버튼이 있는 다이얼로그가 필요해요! 둘 중 하나는 Primary, 하나는 Secondary 타입으로요"
 *
 * -> props 변경 (button -> buttons, variant 추가)
 */
<Dialogue
  title="안내"
  description="이것은 멋진 내용을 담고 있는 안내입니다."
  buttonPosition="top"
  buttons={[
    {
      label: '확인',
      onClick: doSomething,
      variant: 'primary',
    }, {
      label: '취소',
      onClick: doSomethingElse,
      variant: 'secondary',
    },
  ]}
/>


/**************************/
/********* 1개월 뒤 *********/
/**************************/

/**
 * "버튼이 세로로 나열되어 있는 다이얼로그도 추가해주세요!"
 * "title 위에 아이콘도 하나 넣어주세요!"
 *
 * -> props 추가 (buttonAlign, iconAboveTitle)
 */
<Dialogue
  title="안내"
  description="이것은 멋진 내용을 담고 있는 안내입니다."
  buttonPosition="top"
  buttons={[
    {
      label: '확인',
      onClick: doSomething,
      variant: 'primary',
    }, {
      label: '취소',
      onClick: doSomethingElse,
      variant: 'secondary',
    },
  ]}
  buttonAlign="vertical"
  iconAboveTitle="fancy-icon"
/>


/**************************/
/********* 6개월 뒤 *********/
/**************************/

<Dialouge
  {...프많쓰않} // 프롭스가 많지만 쓰지 않는다
/>
```

![i-dont-feel-so-good](/break-the-components/i-dont-feel-so-good.gif)

컴포넌트 기반 UI 개발을 하시는 분들이라면 한번쯤은 위와 같은 경험이 있으실 겁니다. 이러한 형태의 (자이언트) 컴포넌트는 시간이 지나며 props의 개수가 계속해서 증가합니다. (~~[Apropcalypse](https://twitter.com/gurlcode/status/1002110517094371328)라고 부르기도 합니다.~~)
props가 많아지면 다음과 같은 문제들이 발생하기 시작합니다.

#### <props가 많아지는 경우 발생하는 문제>

1. 각 props가 어떤 역할을 하는지 **파악하기 어려워진다.**

2. 파악하기 어려운 props를 설명해주기 위한 **주석이나 문서 작성 및 관리 필요**

3. 요구사항이 복잡해질수록 기괴한 props명이 나올 확률 ↑ **작명 센스 필요**

4. 위와 같은 이유들로 인해 컴포넌트를 **변경하기가 어렵고 두려워진다.**

이와 같이 다양한 문제를 안고 있는 컴포넌트는 추상화가 잘 되었다고 말하기 어렵습니다.
위에 있는 `<Dialogue>` 컴포넌트는 재사용성은 갖추었지만 **유연성은 갖추지 못하였습니다**.

`<Dialogue>` 컴포넌트가 유연하지 않는 이유는 무엇일까요? 저는 다음과 같은 이유라고 생각합니다.

> ### 비즈니스 로직이 컴포넌트 안에 들어있다.

<br />

버튼 개수나 위치, 버튼의 배열, 일러스트의 위치, 이 모든 것들은 비즈니스 로직입니다. 이러한 규칙은 시간이 지나며 변경될 여지가 많습니다.

즉, 우리는 비즈니스 로직을 밖으로 꺼내어야 합니다! 어떻게 꺼낼 수 있을까요?

----


## 리액트는 상속보다는 조합

![compose-all-the-thing](/break-the-components/compose.jpeg)

리액트는 조합에 특화된 설계를 갖고 있습니다. 공식 홈페이지에도 [상속보다는 조합](https://reactjs.org/docs/composition-vs-inheritance.html) 이라는 내용의 글이 있습니다. '조합'이란 직역하면, 여러 개의 조각을 끼워 맞춘다는 의미죠.

그런데 우리가 위에서 보았던 `<Dialogue>` 컴포넌트는 조합을 사용하는 것 같지 않습니다. 여러 개의 조각을 쓰기 보다는 하나의 큰 덩어리를 사용하는 모습입니다. 따지자면 조합보다는 상속에 더 가까운 것 같네요.

그렇다면 저 자이언트 컴포넌트를 쪼개어 조합을 사용하도록 바꾸어 보겠습니다.

```jsx
function Page() {
  return (
    <Dialogue>
      <Dialogue.Title>
        안내
      </Dialogue.Title>
      <Dialogue.Description>
        이것은 멋진 내용을 담고 있는 안내입니다.
      </Dialogue.Description>
      <Dialogue.ButtonContainer align="vertical">
        <Dialogue.Button type="secondary" onClick={doSomethingElse}>
          취소
        </Dialogue.Button>
        <Dialogue.Button type="primary" onClick={doSomething}>
          확인
        </Dialogue.Button>
      </Dialogue.ButtonContainer>
    <Dialogue>
  )
}
```

음.. 너무 장황한 것 같기도 하네요. 

그렇다면 `<Title>` 과 `<Description>` 을 `<Content>` 라는 컴포넌트로 합치겠습니다.

```jsx
Dialogue.Content = ({ title, description }) => (
  <React.Fragment>
    <Dialogue.Title>
      {title}
    </Dialogue.Title>
    <Dialogue.Description>
      {description}
    </Dialogue.Description>
  </React.Fragment>
)

function Page() {
  return (
    <Dialogue>
      <Dialogue.Content
        title="안내"
        description="이것은 멋진 내용을 담고 있는 안내입니다."
      />
      <Dialogue.ButtonContainer align="vertical">
        <Dialogue.Button type="secondary" onClick={doSomethingElse}>
          취소
        </Dialogue.Button>
        <Dialogue.Button type="primary" onClick={doSomething}>
          취소
        </Dialogue.Button>
      </Dialogue.ButtonContainer>
    <Dialogue>
  )
}
```

전보다는 나아졌네요! 자 그러면 자이언트 컴포넌트와 한번 비교해보겠습니다.

```jsx
// 자이언트 컴포넌트
<Dialogue
  iconAboveTitle="fancy-icon"
  title="안내"
  description="이것은 멋진 내용을 담고 있는 안내입니다."
  buttonPosition="bottom"
  buttonAlign="vertical"
  buttons={[{
    label: '확인',
    onClick: doSomething,
    type: 'cta',
  }, {
    label: '취소',
    onClick: doSomethingElse,
    type: 'secondary',
  },]}
/>


// 조합기반 컴포넌트
<Dialogue>
  <Dialogue.Icon type="fancy" /> 
  <Dialogue.Content
    title="안내"
    description="이것은 멋진 내용을 담고 있는 안내입니다."
  />
  <Dialogue.ButtonContainer align="vertical">
    <Dialogue.Button type="secondary" onClick={doSomethingElse}>
      취소
    </Dialogue.Button>
    <Dialogue.Button type="primary" onClick={doSomething}>
      확인
    </Dialogue.Button>
  </Dialogue.ButtonContainer>
</Dialogue>
```

조합기반 컴포넌트가 코드양이 더 많고 더 지저분해 보이기도 하네요.

하지만 조합을 이용하게 되면서 앞서 이야기 했던 자이언트 컴포넌트의 **문제점은 더이상 존재하지 않는 것 같습니다.**

조합을 이용한 다이얼로그는 `onClick`, `align`, `title` 등 명확한 props만 남게 되기 때문에

1. 개발자가 각 props가 **어떤 역할을 하는지 파악하기 수월**하고

2. props가 명확하기 때문에 **별도의 문서화를 할 필요가 없으며**

3. 모호한 props가 없기 때문에 **작명 고민을 할 필요도 없습니다.**

4. 따라서 컴포넌트 명세를 **변경해야할 때 어디를 고쳐야할지도 명확**합니다.

우리는 조합을 사용함으로써 자이언트 컴포넌트의 문제를 어느정도 해결할 수 있게 되었습니다. 그렇다면 조합의 어떤 특징이 이러한 변화를 만들 수 있었던 걸까요?

조합의 특징은  `<Dialogue>` 컴포넌트가 담당하던 역할이 어떻게 바뀌었는지를 따져보면 힌트를 얻을 수 있습니다.

----

## 제어역전 (Inversion of Control)

`<Dialogue>` 컴포넌트의 역할이 조합을 사용하기 전과 후에 어떻게 달라졌을까요?

#### Before : 자이언트 컴포넌트일 때 담당하던 역할

1. 전달받은 props 값에 따라 내부 UI 컴포넌트 배치 
    (Title, Description, Button이 어떠한 순서와 조합으로 그려질지 결정)
2. **Title, Description, Button의 style결정**
    (글자크기, 색상, 간격 등..)

#### After : 조합 버전에서 담당하는 역할

1. **Title, Description, Button의 style결정**
    (글자크기, 색상, 간격 등..)


조합 버전에서 `<Dialogue>`의 역할이 줄어들었습니다! 기존의 '어떻게 배치할까'에 대한 역할을 `<Dialogue>` 가 더이상 담당하고 있지 않습니다. 해당 역할은 `<Dialogue>` 를 사용하는 개발자에게 넘어갔습니다! 조합 기반의 컴포넌트를 사용하면 페이지를 개발할 때 해야하는 일이 하나 더 늘어나게 되지만 그로 인해 유연성을 갖는다는 장점을 얻게 됩니다.

프로그래밍에서 **API를 사용하는 쪽으로 특정 역할을 넘기는 패턴을 제어역전(Inversion of Control, IoC)**라고 부르는데 위와 같이 페이지 개발 시 컴포넌트를 조합하여 만드는 것도 제어역전의 한 형태라고 볼 수 있습니다.

사실 이러한 제어역전 패턴은 우리 주변에서 이미 흔하게 사용되고 있습니다. JS Array의 `map`, `forEach`, `filter`, `reduce`가 대표적인 예입니다.

아래는 동물리스트에서 강아지를 골라내는 JS 코드입니다. 제어역전을 사용하지 않는 filter와 사용한 filter를 통해 그 차이를 다시한번 살펴보겠습니다.

```javascript
// 일반 filter
const dogs = filterDogs(animals)

// 제어역전 filter
const dogs = animals.filter(animal => animal.species === 'dog')
```

1. **일반 filter** 는 **강아지를 필터링한다**는 것을 명시함으로 선언적인 코드가 갖는 장점을 갖게 되지만 필터링 로직이 조금이라도 바뀔 경우 두 번째 파라미터로 option 객체를 받는 등 기존 로직을 변경해야합니다.

2. **제어역전 filter**는 필터링 기능만 제공하고 어떻게 필터링할지는 사용자에게 맡기고 있습니다. 따라서 필터링 로직에 어떠한 변화가 생기든 기존 filter 함수는 그대로 남아있을 수 있습니다.

리액트 컴포넌트 조합은 이와 같은 제어역전의 특징을 갖고 있습니다. 컴포넌트 조합이 유연성만 갖고 있는 것은 아닙니다. 조금 더 깔끔한 코드를 작성하는 데에도 도움이 됩니다.

----

## Compound Components

[react-router](https://reactrouter.com), [remix](https://remix.run) 개발자로 유명한 [라이언 플로런스](https://twitter.com/ryanflorence)씨가 자주 언급하는 패턴 중 하나인 [Compound Components](https://www.youtube.com/watch?v=hEGg-3pIHlE&feature=youtu.be)는 조합의 대표적인 사례입니다.

Compound Components는 단어 의미 그대로 '컴포넌트의 복합체' 라는 의미입니다. 위에서 보았던 `<Dialogue>` 의 조합 버전처럼 사용하는 쪽에서 여러 개의 컴포넌트를 조합하여 사용하는 것을 Compound Components라고 부릅니다.

하지만 위에서 보았던 `<Dialogue>` 컴포넌트는 Compound Components의 장점을 모두 보여주기에는 부족한 예시였습니다. Compound Components는 React hooks 나 다른 패턴과 함께 사용하면  State를 숨김으로써 더 깔끔한 추상화를 제공할 수 있다는 장점이 있습니다.

설명을 위해 Tab 컴포넌트를 만들어 보겠습니다. 먼저 Tab을 자이언트 컴포넌트로 만든다면 다음과 같이 사용될 것입니다.

```jsx
function Page() {
  const [tab, setTab] = React.useState(initialTab)

  return (
    <Tabs
      items={tabItems}
      onSelectTab={setTab}
      selectedTab={tab}
    />
  )
}
```

자 이제 조합으로 쪼개볼까요?

```jsx
function Page() {
  const [selectedTab, setTab] = React.useState(initialTab)

  return (
    <Tabs>
      {tabItems.map(tabItem => (
        <Tabs.Item
          value={tabItem}
          isSelected={selectedTab === tabItem}
          onSelect={setTab}
        >
          {tabItem}
        </Tabs.Item>
      ))}
    </Tabs>
  )
}
```

`<Dialogue>` 컴포넌트처럼 유연한 컴포넌트로 만들어졌습니다. alignment를 바꾸거나 탭 컴포넌트 안에 다른 컴포넌트를 삽입하는 요청도 무리 없이 수행할 수 있을 것 같습니다.

그런데 위에서 이야기했듯이 Compound Components는 State를 숨길 수 있다는 장점도 갖는다는 하였죠.

State를 숨기면 아마 다음과 같은 모습일 것 같네요.

```jsx
function Page() {
  return (
    <Tabs>
      {tabItems.map(tabItem => (
        <Tabs.Item value={tabItem}>
          {tabItem}
        </Tabs.Item>
      ))}
    </Tabs>
  )
}
```

State는 어디로 숨었을까요? State는 컴포넌트 트리의 가장 상위에 있는 컴포넌트인 `<Tabs>`가 가지고 있어야 합니다. `React.Children`, `React.cloneElement`를 사용하면 State를 숨긴 Tabs를 만들 수 있습니다.

```jsx
// Tabs.jsx
import React from 'react'

function Tabs({ children }) {
  const [selectedTab, setTab] = React.useState(initialTab)

  return (
    <ul className="tab-container">
      {React.Children.map(children, child => (
        React.cloneElement(child, {
          isSelected: child.props.value === selectedTab,
          onSelect: () => setTab(child.props.value),
        })
      ))}
    </ul>
  )
}

Tabs.Item = ({ isSelected, onSelect, children }) => (
  <li
    onClick={onSelect}
    className={`tab-item ${isSelected ? 'selected' : ''}`}
  >
    {children}
  </li>
)
```

그런데 State를 숨긴 Tab 컴포넌트를 보니 뭔가 떠오르시지 않나요? 사실 html 태그중에 이와 유사한 형태로 사용되는 태그가 있습니다.


```html
<select>
  <option>당근</option>
  <option>양파</option>
  <option>마늘</option>
  <option>배추</option>
  <option>오이</option>
</select>
```

`<select>` 태그도 상태는 감추고 조합의 형태로 사용되는 Compound Components의 모습을 하고 있습니다. (~~select도 조합의 민족이었어!~~)

----

그런데 Tabs 컴포넌트에는 한 가지 아쉬운 점이 있습니다. `<Tabs>` 에서 `cloneElement` 를 사용하고 있기 때문에 ***`<Tabs.Item>` 이 `<Tabs>` 의 바로 아래 자식으로 와야한다*** 라는 규칙이 생깁니다. 이렇게 되면 `children`의 구조를 유연하게 변경할 수 없게 됩니다. 우리는 `<Tabs.Item>`이 `<Tabs>`가 가진 state를 `children`의 구조와 상관 없이 사용할 수 있도록 해주어야 합니다.

다행히 우리에겐 또다른 방법이 있습니다.

### 1. Context를 이용한 개선

첫 번째 방법은 context 를 이용하는 것입니다. `<Tabs>` 에서 context에게 상태를 전달해주고 `<Tabs.Item>`은 context로부터 상태를 전달 받는 구조입니다. `<Tabs.Item>`은 컴포넌트 트리에서 `<Tabs>`보다 아래쪽에 있기만 한다면 `useContext` 를 통해 해당 값에 접근할 수 있기 때문에 `<Tabs>` 의 바로 아래 자식이어야한다는 제약이 사라집니다.

```jsx
// Tabs.jsx
import React from 'react'

const TabContext = React.createContext()

function Tabs({ children }) {
  const [selectedTab, setTab] = React.useState(initialTab)

  return (
    <TabContext.Provider value={{ selectedTab, setTab }}>
      <ul className="tab-container">
        {children}
      </ul>
    </TabContext.Provider>
  )
}

Tabs.Item = ({ value, children }) => {
  const ctx = React.useContext(TabContext)
  if (ctx === undefined) {
    throw new Error('<Tabs.Item> 컴포넌트는 <Tabs> 컴포넌트 아래에서만 사용될 수 있습니다.')
  }
  const { selectedTab, setTab } = ctx
  
  return (
    <li
      onClick={() => setTab(value)}
      className={`tab-item ${selectedTab === value ? 'selected' : ''}`}
    >
      {children}
    </li>
  )
}

// Page.jsx
function Page() {

  return (
    <Tabs>
      {/* 원하는 대로 children을 구성할 수 있습니다. */}
      <BetweenComponent>
        {tabItems.map(tabItem => (
          <Tabs.Item value={tabItem}>
            {tabItem}
          </Tabs.Item>
        ))}
      </BetweenComponent>
    </Tabs>
  )
}
```

**다만 context를 사용하게 되면 context의 value가 바뀌게 됐을 때 하위 컴포넌트들의 re-rendering이 발생하므로 `Context.Provider`를 가진 부모가 가능한 가까운 곳에 있는 것이 좋습니다.*

### 2. Render Props를 이용한 개선

[Render Props](https://reactjs.org/docs/render-props.html)가 생소하신 분들도 계실텐데요, Render Props는  Hooks가 나오기 이전에 리액트 컴포넌트의 상태관리 로직을 추상화하는 방법으로 자주 사용되던 패턴입니다. 

핵심만 말씀 드리면 컴포넌트의 `children`으로 함수를 전달하는 것인데, 그 함수는 리액트 엘리먼트를 반환하는 함수여야합니다.

```jsx
// 일반 컴포넌트
<Button>
  눌러주세요
</Button>

// Render Props 컴포넌트
<Button>
  {() => <>눌러주세요</>}
</Button>
```

왜 이렇게 할까요? 우리는 `children`으로 함수를 전달하고 있습니다. 그리고 함수는 parameter를 받을 수 있습니다. 컴포넌트가 parameter값을 넣어줄 수 있다면 페이지를 개발하는 단계에서 해당 parameter를 이용해 원하는대로 요리를 할 수 있습니다.

설명이 어려우셨나요? Render Props 패턴으로 구현된 Tab을 보겠습니다.

```jsx
// Tabs.jsx
import React from 'react'

function Tabs({ children }) {
  const [selectedTab, setTab] = React.useState(initialTab)

  return (
    <ul className="tab-container">
      {children(selectedTab, setTab)}
    </ul>
  )
}

Tabs.Item = ({ isSelected, onSelect, children }) => (
  <li
    onClick={onSelect}
    className={`tab-item ${isSelected ? 'selected' : ''}`}
  >
    {children}
  </li>
)

// Page.jsx
function Page() {

  return (
    <Tabs>
      {(selectedTab, setTab) => (
        tabItems.map(tabItem => (
          <Tabs.Item
            isSelected={tabItem === selectedTab}
            onSelect={() => setTab(tabItem)}
          >
            {tabItem}
          </Tabs.Item>
        ))
      )}
    </Tabs>
  )
}
```

주목하셔야하는 부분은 두 곳입니다.

1. `<Tabs>` 컴포넌트가 `children`을 함수로써 호출하고 있다.

2. `<Tabs>` 를 이용하는 Page 컴포넌트에서 `<Tabs>` 의 `children`으로 함수를 전달하고 있다.

`<Tabs>`가 `children`을 함수로 선언하고 return 문에서 state를 넣어 호출해주고 있기 때문에 `<Tabs>`를 사용하는 페이지에서 `<Tabs>` 내부에 있는 state를 쓸 수 있도록 만들어 주었습니다.

이렇게되면 `<Tabs>` 컴포넌트의 유연함은 더욱 증가하게 됩니다. `isSelected`, `onSelect` 까지 컴포넌트 사용자가 결정하게 바뀌었습니다. (더 유연하다고 더 좋은 추상화는 아니기 때문에 각 컴포넌트에게 맞는 적당한 추상화를 고민해 볼 필요가 있습니다.)

----

Render Props를 사용하니 Context나 `cloneElement`를 사용할 때보다 `<Tabs>`와 `<Tabs.Item>`의 코드 양이 줄었습니다. 대신 Tabs를 사용하는 Page 컴포넌트의 코드 양은 증가되었습니다. 컴포넌트를 조합하는 모습이 1단계 제어역전이었다면, 거기에 Render Props까지 적용하는 것이 2단계 제어역전이라고 볼 수 있습니다.

**다만 render props는 함수를 전달하기 때문에 rendering이 일어날 때마다 새로운 props로 인식됩니다. 최적화가 필요하면 useCallback을 사용하거나 render props를 사용을 다시 고민해봐야합니다.*


----

## 결론

다양한 사례(use-case)를 포용할 수 컴포넌트는 **재사용 가능한**, **유연한 컴포넌트**라고 할 수 있습니다. 조합과 제어역전은 비즈니스로직을 컴포넌트 바깥으로 끄집어내어 다양한 사례(use-case)를 포용할 수 컴포넌트를 만들 수 있게 해주었습니다.

하지만 제어역전은 코드양이 많아지고 한 눈에 들어오지 않는다는 **단점**도 갖고 있습니다. 변경될 여지가 있어 보이는 코드에 제어역전을 사용하는 것은 좋은 안전장치가 될 수 있지만 역할이 명확한 컴포넌트라면 제어역전이 오히려 개발 경험을 해칠 수도 있습니다.

비즈니스가 변화해온 양상을 지켜보고 어떻게 변화할지 예측하고 그 변화양상에 맞는 컴포넌트를 만드는 습관은 멋진 개발 경험을 만든는데 도움이 될 수 있다고 생각합니다.

### 참고한 컨텐츠

- Ryan Florence - [Compound Components](https://www.youtube.com/watch?v=hEGg-3pIHlE&feature=youtu.be) 
- Michael Jackson - [Never Write Another HoC](https://www.youtube.com/watch?v=BcVAq3YFiuc&feature=youtu.be)
- Kent C. Dodds - [Inversion of Control](https://kentcdodds.com/blog/inversion-of-control/)
- Jenn Creighton - [The how and why of flexible React components](https://speakerdeck.com/jenncreighton/the-how-and-why-of-flexible-react-components-289aa486-464a-4dea-b89a-6f92d0af6606)
