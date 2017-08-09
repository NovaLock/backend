# NovaLock Server Web API

## Conventions

### API Calls

The API is in a form like RPC and transferred via HTTP. *POST* method is always required, the endpoint is `/` and parameters are passed in JSON. If called through local loop, no authentication is required, but when called outside, it is required to pass a token in request header like `Authorization: Bearer 02d69f48-5f39-4d5f-9758-5c39b9b09003`.

## Initialize Server

This API should be called by a lock, which can be executed only once.

### Request

```json
{
  "version": "Prometheus/1.0",
  "function": "init_server",
  "parameters": []
}
```

```http
POST /255 HTTP/1.1
Content-Type: application/json

{
  "version": "Prometheus/1.0",
  "function": "init_server",
  "parameters": []
}
```

 ### Response

```json
{
  "result": "02d69f48-5f39-4d5f-9758-5c39b9b09003"
}
```

```json
{
  "error": {
    "code": "UNKNOWN_ERROR",
    "message": "an error occured on the server"
  }
}
```

## Add User

This API should be called by a user. When added as a user, it is granted full write access to the system.

### Request

```json
{
  "version": "Prometheus/1.0",
  "function": "add_user",
  "parameters": []
}
```

### Response

```json
{
  "result": "02d69f48-5f39-4d5f-9758-5c39b9b09003"
}
```

```json
{
  "error": {
    "code": "UNKNOWN_ERROR",
    "message": "an error occured on the server"
  }
}
```

## Delete User

This API should be called by a user.

### Request

```json
{
  "version": "Prometheus/1.0",
  "function": "delete_user",
  "parameters": ["b68e88e2-7cad-448b-8e12-c173a0fa4ff0"]
}
```

### Response

```json
{
  "result": true
}
```

```json
{
  "error": {
    "code": "UNKNOWN_ERROR",
    "message": "an error occured on the server"
  }
}
```

## List Users

This API should be called by a lock.

### Request

```json
{
  "version": "Prometheus/1.0",
  "function": "get_accessors",
  "parameters": []
}
```

### Response

```json
[
  "02d69f48-5f39-4d5f-9758-5c39b9b09003",
  "b68e88e2-7cad-448b-8e12-c173a0fa4ff0"
]
```

```json
{
  "error": {
    "code": "UNKNOWN_ERROR",
    "message": "an error occured on the server"
  }
}
```
