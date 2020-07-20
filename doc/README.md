#The Ishbilia (_Coordinator App_ - _Middlware Server_ - _Courier App_) Protocol

The protocol is based on Json messages.

***
**NOTE:**
All fields in the Json messages are: 
- in lowercase.
- Strings (text).
***

##Messages sent by the __Coordinator App_:

1. This is the first message to send by the _Coordinator App_, it is used for Authenticating 
and registering the Coordinator in the _Middleware Server_ connections.
- [x] Implemented.
```js
{
  type    : 'login',
  api_key : <"The coordinator's api key">,
  username: <'username'>,
  password: <'password'>
}
```
2. This _request_ is sent to the _Middleware Server_ to ask for all available/connected _Apps_/Couriers.
- [x] Implemented.
```js
{
  type  : 'request',
  value : 'couriers-list'
}
```

##Messages sent by the __Middleware/Server__:

1. This message is sent in case of a successful Authentication/Login by the _Coordinator_ and/or the _App_
- [X] Implemented.
```js
{
  type : 'reply',
  cmd  : 'login',
  value: 'success',
  password_changed: ["true" | "false"]
}
```
2. This message is sent in case of a failed Authentication by the _Coordinator_ and/or the _App_
- [x] Implemented.
```js
{
  type  : 'reply',
  cmd   : 'login',
  value : 'failed',
  reason: ['wrong_api_key' | 'wrong_username_or_password' | 'bad_login' | 'database_error']
}
```
3. This message is sent in case of a success logout by the _Coordinator_ and/or the _Courier's App_.
- [ ] Implemented.
```js
{
  type  : 'reply',
  cmd   : 'logout',
  value : 'success',
}
```

4. This message is sent in case of receiving an ill formed or non Json data from  the _Coordinator_ and/or the _Courier's App_
- [x] Implemented (Not for every received message).
```js
{
  type : 'error', 
  value: 'bad-data'
}
```

5. This message is sent to all _Coordinator_ in case of a location update.
- [x] Implemented.
```js
{
  type: 'location-update',
  courier_id: <"courier's id">,
  latitude  : <'latitude'>,
  longitude : <'longitude'>,
  [accuracy  : <'The accuracy'>], //Optional
  [speed  : <'The speed'>] //Optional
}
```

6. A courier status update Sent to **Coordinators** or **Trackers** 
- [x] Implemented.
```js
{
  type: 'courier-status-update',
  courier_id: <"courier's id">,
  status: ['online' | 'offline'],
  [ //Optional only when status is online and the location update is less then 60sec
    latitude  : <'latitude'>,
    longitude : <'longitude'>,
    [accuracy  : <'The accuracy'>], //Optional
    [speed  : <'The speed'>] //Optional
  ]
}
```

7. All Couriers list with there status Sent to **Coordinators** or **Trackers** 
- [x] Implemented.
```js
{
  type: 'couriers-list',
  list: [
    {
      courier_id : <"courier's id">,
      username   : <"username">  
      status: ['online' | 'offline'],
      [ //Optional only when status is online and the location update is less then 60sec
        latitude  : <'latitude'>,
        longitude : <'longitude'>,
        [accuracy  : <'The accuracy'>], //Optional
        [speed  : <'The speed'>] //Optional
      ]
    },
    ...
  ]
  
}
```
8. This message is sent in case of a successful passord change.
- [ ] Implemented
```js
{
  type : 'reply', 
  cmd  : 'change-password',
  value : 'success'
}
```

9. This message is sent in case of a failed password change.
- [ ] Implemented.
```js
{
  type  : 'reply',
  cmd   : 'change-password',
  value : 'failed',
  reason: [ 'bad_data' | 'database_error']
}
```

##Messages sent by the _Courier's App_:
- [X] Implemented.
1. The login message
```js
{
  type    : 'login',
  api_key : <"The couriers's api key">,
  username: <'username'>,
  password: <'password'>
}
```
2. The logout message.
- [ ] Implemented.
```js
{
  type    : 'request',
  cmd     : 'logout'
}
```

3. The location update Message (The same as the info field in The authentication message):
- [ ] Implemented.
```js
{
  type      : 'location-update',
  latitude  : <'latitude'>,
  longitude : <'longitude'>,
  [accuracy : <'The accuracy'>], //Optional
  [speed    : <'The speed'>] //Optional
}
```
4. Isued to the **Server** to change the password to the new one:
-[ ] implemented.
```js
{
  type    : 'request',
  cmd     : 'change-password',
  value   : <"New password">
}
```
