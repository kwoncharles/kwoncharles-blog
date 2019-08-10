---
title: Bitbucket pipelines를 이용해 AWS Lambda 배포 자동화하기
date: "2019-08-10T11:19:02.169Z"
template: "post"
draft: false
slug: "/posts/bitbucket-pipelines-lambda-deploy-automate/"
category: "Tech"
tags:
  - "AWS"
  - "Lambda"
  - "Bitbucket"
description: "node-lambda 라이브러리를 이용해 AWS Lambda 배포를 간편하게 하는 방법을 알아봅니다."
---

AWS Lambda 함수는 [AWS 웹사이트](https://aws.amazon.com/ko/lambda/)에서 쉽게 만들고 수정할 수 있습니다. 

하지만 코드 관리를 위해 Git을 사용하게 된다면 CLI(터미널)에서 배포를 하는 것이 편리할 것입니다.

또한 배포 스크립트를 파일로 저장해 **한 번에** 실행시킬 수 있다면 더더욱 좋을 것입니다.

이번 글은 [Bitbucket](http://bitbucket.com)에서 Lambda Function 배포를 자동화하는 방법을 살펴보겠습니다.

---

먼저 CLI 환경에서 Lambda Function 생성, 수정 등을 하기 위해서는 AWS 인증 키가 필요합니다. 해당 키는 Lambda 생성,수정에 대한 권한이 있는 키여야 합니다.

생성된 키는 bitbucket 프로젝트의 환경변수로 저장할 것입니다. 환경변수로 저장할 값들은 다음과 같습니다

1. `AWS_ACCESS_KEY`

2. `AWS_SECRET_ACCESS_KEY`

3. `AWS_ROLE_ARN`

    - AWS Lambda에 접근 가능한 role의 ARN이어야 합니다. 사용자(user)가 아니고 **역할(role)**의 ARN입니다.
  
4. `AWS_DEFAULT_REGION`

    - 사용중인 region. 저는 ap-northeast-2입니다.
--- 

환경변수는 Bitbucket에서 해당 repository의 설정 메뉴에서 `repository variable` 메뉴에서 설정할 수 있습니다.

1. 환경변수를 설정하기 전에, 해당 프로젝트에서 pipeline 사용을 활성화 해줘야 합니다.
2. 프로젝트로 들어가 왼쪽 하단에 있는 톱니바퀴 버튼을 클릭합니다.

![setting_button-min.png](/lambda-deploy-automate/setting_button-min.png)

3. 왼쪽 메뉴의 PIPELINES 카테고리에서 `Settings` 를 클릭합니다

![pipeline_setting-min.png](/lambda-deploy-automate/pipeline_setting-min.png)

4. Enable Pipelines를 활성화시킵니다.

![enable_pipelines-min.png](/lambda-deploy-automate/enable_pipelines-min.png)

5. 이제 환경변수를 등록해야 합니다. 다시 왼쪽 메뉴에서 `Repository variables` 를 클릭합니다.

![repositry_variables-min.png](/lambda-deploy-automate/repositry_variables-min.png)

3. 여기에 위에서 말했던 값들을 Name/Value쌍을 등록합니다.

![set_repository_variables-min.png](/lambda-deploy-automate/set_repository_variables-min.png)

## bitbucket-pipelines.yml 파일 생성

환경변수 마쳤다면 bitbucket이 인식할 수 있는 배포 스크립트를 만들어줘야 합니다.

프로젝트 최상단 폴더에서`bitbucket-pipelines.yml` 라는 파일을 생성합니다.

파일명이 **pipelines** 인걸 보면 알 수 있 듯이 여러 개의 파이프라인을 정의할 수 있습니다.

이 파일에 배포 스크립트를 정의하면 bitbucket 프로젝트 페이지에서 이를 실행시킬 수 있습니다. 

예제에서는 두 개의 파이프라인을 만들어 보겠습니다.

![pipelines_code-min.png](/lambda-deploy-automate/pipelines_code-min.png)

``` script
image: node:10
options:
  max-time: 30

pipelines:
  branches:
    function-1:
      - step:
          script:
            - echo Deploy AWS Lambda Function1
            - cd function1
            - npm install
            - npm install node-lambda -g
            - node-lambda deploy -a $AWS_ACCESS_KEY_ID -o $AWS_ROLE_ARN -s $AWS_SECRET_ACCESS_KEY -r $AWS_DEFAULT_REGION -n function1
    function-2:
      - step:
          script:
            - echo Deploy AWS Lambda Function2
            - cd function2
            - npm install
            - npm install node-lambda -g
            - node-lambda deploy -a $AWS_ACCESS_KEY_ID -o $AWS_ROLE_ARN -s $AWS_SECRET_ACCESS_KEY -r $AWS_DEFAULT_REGION -n function2
```

`function1`과 `function2` , 두 개의 함수를 독립적으로 배포하는 스크립트입니다.

각 스크립트는 동일한 스텝으로 이루어져 있으며 함수 이름만 변경하여 진행합니다.

라인별로 살펴보면, 

1. `echo Deploy AWS Lambda Function1`

    echo는 프로그래밍 언어에서 print함수와 같습니다. `echo ~~` 하게 되면 echo 뒤에 따라오는 문장이 배포화면에서 출력됩니다. 

2. `cd function1` , `npm install`

    `function1` 폴더로 들어가 `package.json` 에 있는 모듈들을 설치합니다

3. `npm install node-lambda -g` 

    람다 배포를 진행해줄 `node-lambda` 라이브러리를 설치합니다

4. `node-lambda` 를 이용해 배포합니다.

    스크립트에서 각각의 옵션은 다음을 의미합니다.

    -a : $AWS_ACCESS_KEY (환경변수)

    -o : $AWS_ROLE_ARN (환경변수)

    -s : $AWS_SECRET_ACCESS_KEY (환경변수)

    -n : 배포할 Lambda Function 이름

설정에서 bitbucket pipelines를 활성화 시켰으며 `bitbucket-pipelines.yml` 을 생성했다면 이제 파이프라인을 이용한 배포를 할 수 있습니다.

--- 

배포는 간단합니다. 원하는 커밋번호를 클릭한 후 `Run pipelines` 를 클릭합니다.

1. bitbucket 해당 프로젝트페이지에서 commit 메뉴로 들어갑니다.

![commit_menu-min.png](/lambda-deploy-automate/commit_menu-min.png)

2. 원하는 commit 번호를 클릭합니다.

![commit_number-min.png](/lambda-deploy-automate/commit_number-min.png)

3. 오른쪽 메뉴의 `run pipelines` 버튼을 클릭합니다.

![run_pipelines-min.png](/lambda-deploy-automate/run_pipelines-min.png)

4. 원하는 파이프라인을 선택하고 `run` 버튼을 누릅니다.

![select_pipelines-min.png](/lambda-deploy-automate/select_pipelines-min.png)

5. 완료될 때까지 기다립니다.

![pipelines-ongoing-min.png](/lambda-deploy-automate/pipelines-ongoing-min.png)

---

이번 글에서는 node-labmda 라이브러리를 이용해 bitbucket에서 배포를 자동화할 수 있는 방법을 살펴봤습니다. 제가 소개한 방법 말고도 lambda를 배포하는 방법은 여러가지가 있습니다.

가장 대표적인 방법은 [serverless-framework](https://serverless.com)를 이용하는 것입니다. serverless는 [API Gateway](https://console.aws.amazon.com/apigateway/home)도 통합적으로 관리할 수 있게 해줘서 lambda를 이용한 REST API 설계에 최적화돼있습니다.

저의 경우는 기존에 사용중이던 Lambda Function에 배포만 덧입혀야 하는 상황이어서 Lambda만 독립적으로 사용할 수 있는 방법을 찾다보니 node-lambda를 이용하게 됐습니다. 

이 글에서 다룬 것은 Lambda 배포 자동화이지만 다른 AWS 서비스를 배포하는 법도 이와 유사한 프로세스를 갖고 있습니다. (AWS뿐만 아니라 다른 클라우드 서비스들도 그럴 것으로 보입니다)

 