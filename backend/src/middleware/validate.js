/**
 * Request validation middleware using Zod.
 *
 * Usage:
 *   const { validate } = require('../middleware/validate');
 *   router.post('/path', validate(createRoomSchema), handler);
 *
 * On failure, returns 400 with the first Zod error message.
 */

const { errorResponse } = require('../configs/app.response');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const firstError = result.error.errors[0];
      const field = firstError.path.join('.');
      const message = firstError.message;
      return res.status(400).json(errorResponse(
        1,
        'VALIDATION FAILED',
        field ? `\`${field}\`: ${message}` : message
      ));
    }
    // Replace with parsed (coerced/transformed) data
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
