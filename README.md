# Thesis Judge

[![MIT License](https://img.shields.io/apm/l/atomic-design-ui.svg?)](https://github.com/tterb/atomic-design-ui/blob/master/LICENSEs)

API system to submit code to online judges.

## Authors

- [@akotadi](https://www.github.com/akotadi)
- [@Delciuxs](https://github.com/Delciuxs)

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Setup

To run the app you need to `npx ts-node ./API/server.ts` but first you need to create a file **appconfig.json** in the root folder, this file should contain the following keys:

#### appconfig.json

```json
{
  "port": 3000,
  "testUrl": "",
  "x-auth-token": "",
  "veredictTimeOut": 20,
  "actionsTimeOut": 10,
  "availableAccountTimeOut": 30,
  "onlineJudges": ["codeforces", "hackerrank", "kattis"],
  "judgeAccounts": {
    "user1": {
      "nickname": "YOUR NICKNAME FOR USER 1",
      "password": "YOUR PASSWORD FOR USER 1"
    },
    "user2": {
      "nickname": "YOUR NICKNAME FOR USER 2",
      "password": "YOUR PASSWORD FOR USER 2"
    }
  }
}
```

##### Explanation for **appconfig.json**

- **_port_**: _(number)_ The port in which the app is running.
- **_x-auth-token_**: _(string)_ If you want your API to be protected, type here a secret token. If that is the case, then you should provide _x-auth-token_ header field in **every** API request.
- **_veredictTimeOut_**: _(number)_ Timeout in **seconds** that the API should wait at most, to get a veredict _(AC, WA, CPE, RTE, TLE, MLE)_ of a problem sent to any online judge.
- **_actionsTimeOut_**: _(number)_ Since the API uses a bot to login and sent a specific problem to an online judge, the bot applies diferent actions such as click, wait for selectors, load page, etc. Specify a Timeout in **seconds** for this actions.
- **_onlineJudges_**: _(array<strings>)_: Specify here the online **judges** that are **supported**.
- **_judgeAccounts_**: _(object<objects>)_: Here is were you should specify the accounts that the bot can use to login and sent a problem to an online judge.  
  **_Important:_** _Add all the accounts you want using the example above, if you want to add another account, add a new object, example: **'user3: {nickname: "", password: ""}'** the **accounts must be created with anticipation in every online judge**, it is important that the **username and password is shared** within the online judges_

**One final note:**
The **nickname** that is specified in every judgeAccount, should be a unique identifier that appears when you login in the different platforms. The bot uses that nickname to know if he is logged in.
_Example:_

```json
{
  "judgeAccounts": {
    "user1": {
      "nickname": "delciuxs",
      "password": "123456"
    }
  }
}
```

- Codeforces:
  ![Codeforces Login](img/codeforcesLogin.PNG)
- Hackerrank:
  ![Hackerrank Login](img/hackerrankLogin.PNG)
- Kattis:
  ![Kattis Login](img/kattisLogin.PNG)

## API Usage

If in the configuration file the **_x-auth-token_** **is set** to something rather than empty string, then every request should provide that header with the token in order to get authorization to content.

```
x-auth-token: YOUR_CUSTOM_TOKEN
```

#### GET

- Get supported Languages

Endpoint

```
/languages
```

- Get supported Judges

Endpoint

```
/judges
```

#### POST

- Submit solution to an online judge

Endpoint

```
/submit:base64_encoded={true | false}
```

Headers

```
Content-Type: application/json
```

Body

```json
{
  "problemURL": "https://open.kattis.com/problems/hello",
  "langSolution": "python3",
  "solution": "print('Hello World')"
}
```

_Note_: If the parameter **base64_encoded** is set to true, then the solution in the body must be base64 encoded.
