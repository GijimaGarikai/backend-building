/**
 * Validation middleware
 * Validates request body against a schema
 */

function validateRequest(schema) {
  return (req, res, next) => {
    const errors = [];
    const body = req.body;

    // Validate each field in schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];

      // Check required fields
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field '${field}' is required`);
        continue;
      }

      // Skip validation if field is not provided and not required
      if (value === undefined && !rules.required) {
        // Set default value if provided
        if (rules.default !== undefined) {
          body[field] = rules.default;
        }
        continue;
      }

      // Type validation
      if (rules.type) {
        const isValid = validateType(value, rules.type, field, errors);
        if (!isValid) continue;
      }

      // String validations
      if (rules.type === 'string' && typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`Field '${field}' must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`Field '${field}' must be at most ${rules.maxLength} characters`);
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`Field '${field}' has invalid format`);
        }
      }

      // Number validations
      if (rules.type === 'number' && typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`Field '${field}' must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`Field '${field}' must be at most ${rules.max}`);
        }
      }

      // Email validation
      if (rules.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`Field '${field}' must be a valid email address`);
        }
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`Field '${field}' must be one of: ${rules.enum.join(', ')}`);
      }

      // Array validation
      if (rules.type === 'array' && Array.isArray(value)) {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`Field '${field}' must have at least ${rules.minLength} items`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`Field '${field}' must have at most ${rules.maxLength} items`);
        }

        // Validate array items if schema provided
        if (rules.items) {
          value.forEach((item, index) => {
            for (const [itemField, itemRules] of Object.entries(rules.items)) {
              const itemValue = item[itemField];

              if (itemRules.required && (itemValue === undefined || itemValue === null)) {
                errors.push(`Field '${field}[${index}].${itemField}' is required`);
                continue;
              }

              if (itemValue !== undefined && itemRules.type) {
                validateType(itemValue, itemRules.type, `${field}[${index}].${itemField}`, errors);
              }

              // Number validations for array items
              if (itemRules.type === 'number' && typeof itemValue === 'number') {
                if (itemRules.min !== undefined && itemValue < itemRules.min) {
                  errors.push(`Field '${field}[${index}].${itemField}' must be at least ${itemRules.min}`);
                }
                if (itemRules.max !== undefined && itemValue > itemRules.max) {
                  errors.push(`Field '${field}[${index}].${itemField}' must be at most ${itemRules.max}`);
                }
              }
            }
          });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
}

function validateType(value, type, field, errors) {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push(`Field '${field}' must be a string`);
        return false;
      }
      break;
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push(`Field '${field}' must be a number`);
        return false;
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push(`Field '${field}' must be a boolean`);
        return false;
      }
      break;
    case 'array':
      if (!Array.isArray(value)) {
        errors.push(`Field '${field}' must be an array`);
        return false;
      }
      break;
    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors.push(`Field '${field}' must be an object`);
        return false;
      }
      break;
    case 'email':
      if (typeof value !== 'string') {
        errors.push(`Field '${field}' must be a string`);
        return false;
      }
      break;
  }
  return true;
}

module.exports = { validateRequest };
