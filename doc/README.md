#The Ishbilia (_Local server_ - _Middlware_ - _App_) Protocol

The protocol is based on Json messages.

***
**NOTE:**
All fields in the Json messages are: 
- in lowercase.
- Strings (text).
***

##Messages sent by the _local server_:

1. This is the first message to send by the _server_, it is used for Authenticating 
and registering the server in the _Middleware_ connections.
```js
{
  type    : 'auth',
  api_key : <"The server's api key">
}
```
2. This _request_ is sent to the _Middleware_ to ask for all available/connected _Apps_/Couriers.
```js
{
  type    : 'request',
  value : 'couriers-list'
}
```

##Messages sent by the __Middleware__:

1. This message is sent in case of a successful Authentication by the _Server_ and/or the _App_

```js
{
  type : 'reply',
  cmd  : 'auth',
  value: 'success'
}
```
2. This message is sent in case of a failed Authentication by the _Server_ and/or the _App_

```js
{
  type  : 'reply',
  cmd   : 'auth',
  value : 'failed',
  reason: 'Wrong api_key'
}
```
3. This message is sent in case of receiving an ill formed or non Json data from  the _Server_ and/or the _App_

```js
{
  type : 'error', 
  value: 'bad-data'
}
```
4. The message is sent:
    - to all connected _Apps_/couriers when the first _Server_ connects.
    - to the _App_/courier when it connects for the first time and there is at least one connected _Server_. 
```js
{
  type  : 'notification',
  value : 'server-up'
}
```
5. The message is sent:
    - to all connected _Apps_/couriers when the last _Server_ disconnects.
    - to the _App_/courier when it connects for the first time and there is no connected _Server_. 
```js
{
  type  : 'notification',
  value : 'server-down'
}
```

6. This message is sent to all _Servers_ when 
    - a data message (location update) is received from an _App_
    - or an _App_ disconnects.

    it is basically the _App_'s data message plus the status field that represents the connectivity state of the _App_/Courier.

```js
{
  status   : ['disconnected'|'connected'], 
  id       : <'the App/courier id'>,
  name     : <'the App user name'>,
  location : {
    latitude  : <'latitude'>,
    longitude : <'longitude'>,
    [accuracy  : <'The accuracy'>], //Optional
    [speed  : <'The speed'>] //Optional
  }
}
```

##Messages sent by the _App_:

1. The authentication message
```js
{
  type    : 'auth',
  api_key : <"The couriers's api key">,
  info    : {
    id       :  <'the App/courier id'>,
    name     :  <'the App user name'>,
    location : {
      latitude  : <'latitude'>,
      longitude : <'longitude'>,
      [accuracy  : <'The accuracy'>], //Optional
      [speed  : <'The speed'>] //Optional
    }
  }
}
```

2. The location update Message (The same as the info field in The authentication message):
```js
{
  id       :  <'the App/courier id'>,
  name     :  <'the App user name'>,
  location : {
    latitude  : <'latitude'>,
    longitude : <'longitude'>,
    [accuracy  : <'The accuracy'>], //Optional
    [speed  : <'The speed'>] //Optional
  }
}
```