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
  cmd   : 'get-couriers-list'
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
  password_changed: ["true" | "false"],
  id   : <'Db id'>
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

6. A courier status update Sent to **Coordinators** or **Trackers** (To be removed)
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

7. All Couriers list with there status Sent to **Coordinators** or **Trackers** (To be removed)
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
- [x] Implemented
```js
{
  type : 'reply', 
  cmd  : 'change-password',
  value : 'success'
}
```

9. This message is sent in case of a failed password change.
- [x] Implemented.
```js
{
  type  : 'reply',
  cmd   : 'change-password',
  value : 'failed',
  reason: [ 'bad_data' | 'database_error']
}
```
10. This message is sent in case of a new "goto" task is inserted in the db.
- [x] Implemented.
```js
{
  type  : 'goto-update',
  cmd   : 'insert',
  'goto': {<goto object>} 
}
```

11. This message is sent in case of a new "goto" task is updated or replaced in the db.
- [x] Implemented.
```js
{
  type  : 'goto-update',
  cmd   : 'update',
  'goto': {<goto object>} 
}
```
12. This message is sent in case of a new "goto" task is deleted from the db.
- [x] Implemented. (At the moment this message is broadcasted to all couriers since we don't 
                    know the corresponding "courier id").
```js
{
  type  : 'goto-update',
  cmd   : 'delete',
  goto_id: <_id>
}
```
12. This message is sent when a courier connects, it contains a list of pending "gotos".
- [ ] Implemented.
```js
{
  type  : 'reply',
  cmd   : 'goto-list',
  'goto_list': [{<goto object>}, ...] 
}
```


##Messages sent by the _Courier's App_:
1. The login message
- [X] Implemented.
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
5. Isued to the **Server** to change status of the goto:
-[ ] implemented.
```js
{
  type    : 'goto-update',
  cmd     : 'status-update',
  goto_id : <'goto id'>
  value   : <"New status">
}
```

6. Isued to the **Server** to update the location of the goto:
-[ ] implemented.
```js
{
  type     : 'goto-update',
  cmd      : 'location-update',
  goto_id  : <'goto id'>
  latitude : <'latitude'>
  longitude: <'longitude'>
  accuracy : <'accuracy'>
}
```

7. Isued to the **Server** to change to get the available gotos list:
-[x] implemented.
```js
{
  type    : 'request',
  cmd     : 'goto-list'
}
```