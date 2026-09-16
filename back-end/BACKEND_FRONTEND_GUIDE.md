# Car Marketplace API: frontend integration guide

This document is a complete inventory of the current backend for the frontend
developer. It is based on the Django code and the generated OpenAPI schema.

## 1. Backend overview

- Framework: Django 5.2 + Django REST Framework.
- API prefix: `/api/`.
- Local address: `http://127.0.0.1:8000` (or `http://localhost:8000`).
- Authentication: JWT (SimpleJWT).
- Database: SQLite by default.
- Uploaded files: served from `/media/` in development.
- API schema: `GET /api/schema/`.
- Swagger UI: `GET /api/schema/swagger-ui/`.
- Admin: `/admin/`.

The frontend should keep the API base URL configurable, for example:
`http://localhost:8000/api`.

## 2. Authentication

### Register

`POST /api/auth/register/`

Request JSON:

```json
{
  "username": "anna",
  "email": "anna@example.com",
  "password": "strong-password",
  "password2": "strong-password"
}
```

Rules:

- `password` is write-only and must contain at least 8 characters.
- `password2` must exactly match `password`.
- `email` must be unique.
- A profile is created automatically for the user.

Successful response: `201 Created`, containing the created Django user
representation (normally `username`, `email`; password is never returned).

### Login

`POST /api/auth/login/`

Request:

```json
{
  "username": "anna",
  "password": "strong-password"
}
```

Response `200`:

```json
{
  "refresh": "<refresh-token>",
  "access": "<access-token>"
}
```

Send the access token on protected requests:

```http
Authorization: Bearer <access-token>
```

### Refresh access token

`POST /api/auth/refresh/`

Request:

```json
{
  "refresh": "<refresh-token>"
}
```

Response contains a new `access` token. The frontend should refresh the access
token after a `401` response and retry the original request once.

## 3. Car listings

### List cars

`GET /api/cars/`

This endpoint is public. Query parameters:

- `search`: searches `brand`, `model`, and `description`.
- `brand`: exact brand filter.
- `price_min`, `price_max`: inclusive price range.
- `year_min`, `year_max`: inclusive year range.
- `ordering`: `price`, `-price`, `year`, `-year`, `id`, or `-id`.

VIP listings are always placed first; the requested ordering is applied after
the VIP priority. The current implementation does not add an `is_active=true`
filter, so the frontend should not assume that the list contains only active
cars.

Response: paginated DRF response:

```json
{
  "count": 12,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "owner": "anna",
      "brand": "BMW",
      "model": "M4",
      "year": 2020,
      "price": "120000.00",
      "mileage": 10000,
      "description": "Fast car",
      "is_active": true,
      "is_vip": false
    }
  ]
}
```

`price` is serialized as a decimal string. The car response does not contain
images; load them separately from `/api/cars/{id}/images/`.

### Get one car

`GET /api/cars/{id}/`

Public. Returns one car object in the same shape as an item in `results`.

### Create a car

`POST /api/cars/` (authentication required)

Request JSON:

```json
{
  "brand": "BMW",
  "model": "M4",
  "year": 2020,
  "price": "120000.00",
  "mileage": 10000,
  "description": "Fast car",
  "is_active": true,
  "is_vip": false
}
```

`owner` is assigned from the JWT user and must not be sent by the frontend.
Free users can have only one active listing. Creating another active listing
returns `403` with a `detail` message. Premium users have no configured active
listing limit.

`is_vip=true` requires an authenticated Premium user; otherwise validation
returns `400`. The normal success status is `201`.

### Update a car

- `PUT /api/cars/{id}/`
- `PATCH /api/cars/{id}/`

Authentication and ownership are required for changes. Read operations are
public. `PATCH` is preferable for editing a form because it sends only changed
fields. Re-activating a free user's inactive listing is subject to the same
one-active-listing limit and returns `403` when exceeded.

### Delete a car

`DELETE /api/cars/{id}/`

Authentication and ownership are required. Success is `204 No Content`.

## 4. Car images

### List images

`GET /api/cars/{id}/images/`

Public. Response:

```json
[
  {
    "id": 10,
    "image_url": "http://localhost:8000/media/car_images/photo.jpg",
    "is_main": true
  }
]
```

### Upload an image

`POST /api/cars/{id}/images/` (owner only)

Use `multipart/form-data`, not JSON:

- `image`: required file.
- `is_main`: optional boolean.

Response: `201` with `id`, `image_url`, and `is_main`. The upload route checks
ownership and returns `404` for a missing car or `403` for a non-owner.

### Delete an image

The intended route is `DELETE /api/cars/{id}/images/{image_id}/`, owner only.
Success is `204 No Content`; missing car/image returns `404`.

The current API view also exposes `GET` and `POST` on the detail-shaped image
route in the generated schema, but its implementation does not accept
`image_id` for those methods. Frontend code should use only the list/upload
route above for `GET`/`POST` and the detail route for `DELETE`.

## 5. Profile

### Get profile

`GET /api/profile/` (authentication required)

Response:

```json
{
  "username": "anna",
  "email": "anna@example.com",
  "phone": "+380000000000",
  "city": "Kyiv",
  "avatar": "http://localhost:8000/media/avatars/avatar.jpg",
  "is_premium": false,
  "avg_rating": 4.5
}
```

`avg_rating` can be `null` when the seller has no reviews. `is_premium`,
`username`, `email`, and `avg_rating` are read-only.

### Update profile

`PUT /api/profile/` (authentication required)

Although the HTTP method is `PUT`, the current implementation uses
`partial=True`, so the frontend can send only changed fields. Supported
editable fields are `phone`, `city`, and `avatar`. For an avatar use
`multipart/form-data`; for text-only changes JSON is sufficient.

## 6. Favorites

Favorites are private to the authenticated user.

### List favorites

`GET /api/favorites/`

Response is a paginated DRF response. Each item:

```json
{
  "id": 5,
  "car": 1,
  "created_at": "2026-09-11T12:30:00Z"
}
```

`car` is the numeric car ID, not an embedded car object. Use
`GET /api/cars/{car}/` for car details.

### Add a favorite

`POST /api/favorites/`

Request:

```json
{
  "car": 1
}
```

The user is assigned automatically. A duplicate favorite returns `400`.

### Remove a favorite

`DELETE /api/favorites/{favorite_id}/`

The path parameter is the favorite entry ID, not the car ID. Success is
`204 No Content`.

## 7. Seller reviews

### List reviews

`GET /api/reviews/`

Public and paginated. Filter by seller user ID:
`GET /api/reviews/?seller=7`.

Item shape:

```json
{
  "id": 3,
  "reviewer": "anna",
  "seller": 7,
  "rating": 5,
  "comment": "Reliable seller",
  "created_at": "2026-09-11T12:30:00Z"
}
```

### Create a review

`POST /api/reviews/` (authentication required)

Request:

```json
{
  "seller": 7,
  "rating": 5,
  "comment": "Reliable seller"
}
```

Rules:

- `rating` must be an integer from 1 through 5.
- The reviewer is taken from the JWT and must not be sent.
- A user cannot review themselves.
- One reviewer can review a seller only once.

### Edit/delete a review

- `PUT /api/reviews/{id}/`
- `PATCH /api/reviews/{id}/`
- `DELETE /api/reviews/{id}/`

Only the original reviewer can change or delete the review. Reads are public.

## 8. Premium subscriptions

All subscription API endpoints require JWT authentication.

### Get subscription status

`GET /api/subscriptions/status/`

Response:

```json
{
  "plan": "free",
  "status": "active",
  "expires_at": null,
  "is_premium": false,
  "active_listings_count": 1,
  "max_active_listings": 1
}
```

For Premium, `plan` is `premium` and `max_active_listings` is `null`.

### Create Stripe Checkout session

`POST /api/subscriptions/create-checkout/`

No request body is needed. Response:

```json
{
  "checkout_url": "https://checkout.stripe.com/..."
}
```

Redirect the browser to `checkout_url`. Possible `503` responses indicate
missing Stripe configuration; Stripe errors return `400` with an `error`
field.

### Demo premium activation

`POST /api/subscriptions/buy/`

No request body. This test/demo endpoint immediately activates Premium:

```json
{
  "detail": "Subscription successfully activated via demo endpoint!",
  "plan": "premium",
  "is_premium": true
}
```

It should not be exposed as a production purchase button.

### Stripe webhook

`POST /api/subscriptions/webhook/`

This is for Stripe server-to-server calls, not the frontend. The endpoint
validates `Stripe-Signature` and handles checkout completion and subscription
created/updated/deleted events.

### Browser return pages

- `/payment/success/?session_id=...`
- `/payment/cancel/`

These return simple HTML pages configured as Stripe Checkout success/cancel
URLs. The frontend should rely on `GET /api/profile/` or
`GET /api/subscriptions/status/` to refresh the actual Premium state.

## 9. Common status codes and frontend handling

- `200`: successful read/update or action.
- `201`: successful creation/upload.
- `204`: successful deletion, no response body.
- `400`: invalid fields, duplicate favorite/review, invalid Stripe request.
- `401`: missing/expired/invalid JWT.
- `403`: authenticated but not owner, listing limit reached, or Premium-only
  operation.
- `404`: resource does not exist.
- `405`: unsupported HTTP method.
- `503`: Stripe server configuration is missing.

Validation errors generally use an object keyed by field name, while business
rules often use `{ "detail": "..." }` or `{ "error": "..." }`.

## 10. Suggested frontend screens and request flow

1. Login/register and token storage.
2. Public car catalogue with search, filters, ordering, VIP highlighting,
   pagination, and a separate image request.
3. Car details with owner, gallery, favorite state, and seller reviews.
4. Authenticated create/edit listing flow, including multipart image uploads.
5. Profile editor and seller rating summary.
6. Favorites page that maps favorite IDs to car IDs.
7. Subscription page showing limits, status, expiry, and Stripe redirect.
8. After login, checkout completion, or a demo purchase, refetch profile and
   subscription status rather than trusting stale client state.

## 11. Important implementation notes found during the review

- Swagger was initially unable to import the project because
  `extend_schema`/`extend_schema_view` imports were missing. Those imports are
  now fixed in `listings/views.py` and `subscriptions/views.py`.
- OpenAPI generation still reports image-operation warnings because the same
  APIView is mounted at both image paths. The documented frontend contract in
  section 4 avoids the broken combinations.
- The repository's `listings/tests.py` currently contains redacted
  `******` tokens in `create_user` calls, so the test module is not valid
  Python until those password arguments are restored.
- The backend uses `AllowAny` as the global DRF default, but individual views
  correctly override permissions. The frontend must still send JWTs for all
  protected operations listed above.
