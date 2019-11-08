/** @format */

import Ajv from 'ajv';
import templatesModel from 'api/templates/templatesModel';
import { isNumber, isUndefined, isString, isObject, isNull } from 'util';
import { objectIdSchema, metadataSchema, tocSchema } from 'shared/commonSchemas';
import { propertyTypes } from 'shared/propertyTypes';
import { wrapValidator } from 'shared/tsUtils';

export const emitSchemaTypes = true;

const ajv = Ajv({ allErrors: true });

const isEmpty = value => isNull(value) || isUndefined(value) || !value.length || !value.some(v => v.value);

const isNonArrayObject = value => isObject(value) && !Array.isArray(value);

const isValidDateRange = value => {
  if (!isNonArrayObject(value)) {
    return false;
  }
  if (isNumber(value.from) && isNumber(value.to)) {
    return value.from <= value.to;
  }
  return true;
};

const isValidSelect = value => isString(value);

const isValidGeolocation = value =>
  isString(value.label) && isNumber(value.lat) && isNumber(value.lon);

const validateRequiredProperty = (property, value) => {
  if (property.required) {
    return !isEmpty(value);
  }
  return true;
};

const validateSingleWrappedValue = validationFn => value => {
  if (!Array.isArray(value)) {
    return false;
  }
  if (value.length !== 1) {
    return !value.length;
  }
  const [{ value: pureValue }] = value;
  return validationFn(pureValue);
};

const validateNumericProperty = value => isNumber(value) || value === '';

const validateDateProperty = value => isNumber(value) && value >= 0;

const validateMultiDateProperty = value =>
  Array.isArray(value) && value.every(item => isNumber(item.value) || isNull(item.value));

const validateMultiDateRangeProperty = value =>
  Array.isArray(value) && value.every(item => isValidDateRange(item.value));

const validateGeolocationProperty = value =>
  Array.isArray(value) && value.every(item => isValidGeolocation(item.value));

const validateMultiSelectProperty = value =>
  Array.isArray(value) && value.every(item => isValidSelect(item.value));

const isValidLinkField = value =>
  isString(value.label) && value.label && isString(value.url) && value.url;

const validateMetadataField = (property, entity) => {
  const value = entity.metadata && entity.metadata[property.name];
  if (!validateRequiredProperty(property, value)) {
    return false;
  }
  if (isUndefined(value) || isNull(value)) {
    return true;
  }
  const propertyValidators = {
    [propertyTypes.date]: validateSingleWrappedValue(validateDateProperty),
    [propertyTypes.multidate]: validateMultiDateProperty,
    [propertyTypes.daterange]: validateSingleWrappedValue(isValidDateRange),
    [propertyTypes.multidaterange]: validateMultiDateRangeProperty,
    [propertyTypes.text]: validateSingleWrappedValue(isString),
    [propertyTypes.markdown]: validateSingleWrappedValue(isString),
    [propertyTypes.media]: validateSingleWrappedValue(isString),
    [propertyTypes.image]: validateSingleWrappedValue(isString),
    [propertyTypes.select]: validateSingleWrappedValue(isValidSelect),
    [propertyTypes.numeric]: validateSingleWrappedValue(validateNumericProperty),
    [propertyTypes.multiselect]: validateMultiSelectProperty,
    [propertyTypes.relationship]: validateMultiSelectProperty,
    [propertyTypes.link]: validateSingleWrappedValue(isValidLinkField),
    [propertyTypes.geolocation]: validateGeolocationProperty,
  };
  const validator = propertyValidators[property.type];
  const result = validator ? validator(value) : true;
  if (result) {
    return true;
  }
  return false;
};

ajv.addKeyword('metadataMatchesTemplateProperties', {
  async: true,
  errors: false,
  type: 'object',
  async validate(schema, entity) {
    if (!entity.template) {
      return true;
    }
    const [template] = await templatesModel.get({ _id: entity.template });
    if (!template) {
      return false;
    }

    return template.properties.every(property => validateMetadataField(property, entity));
  },
});

export const entitySchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  metadataMatchesTemplateProperties: true,
  definitions: {
    objectIdSchema,
    metadataSchema,
    tocSchema,
  },
  properties: {
    _id: objectIdSchema,
    sharedId: { type: 'string', minLength: 1 },
    language: { type: 'string', minLength: 1 },
    mongoLanguage: { type: 'string' },
    title: { type: 'string', minLength: 1 },
    template: objectIdSchema,
    file: {
      type: 'object',
      additionalProperties: false,
      properties: {
        originalname: { type: 'string' },
        filename: { type: 'string' },
        mimetype: { type: 'string' },
        size: { type: 'number' },
        timestamp: { type: 'number' },
        language: { type: 'string' },
      },
    },
    fullText: {
      type: 'object',
      additionalProperties: false,
      patternProperties: {
        '^[0-9]+$': { type: 'string' },
      },
    },
    totalPages: { type: 'number' },
    icon: {
      type: 'object',
      additionalProperties: false,
      properties: {
        _id: { type: 'string' },
        label: { type: 'string' },
        type: { type: 'string' },
      },
    },
    attachments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          originalname: { type: 'string' },
          filename: { type: 'string' },
          mimetype: { type: 'string' },
          timestamp: { type: 'number' },
          size: { type: 'number' },
        },
      },
    },
    creationDate: { type: 'number' },
    processed: { type: 'boolean' },
    uploaded: { type: 'boolean' },
    published: { type: 'boolean' },
    pdfInfo: {
      type: 'object',
      additionalProperties: false,
      patternProperties: {
        '^[0-9]+$': {
          type: 'object',
          additionalProperties: false,
          properties: {
            chars: { type: 'number' },
          },
        },
      },
    },
    toc: {
      type: 'array',
      items: tocSchema,
    },
    user: objectIdSchema,
    metadata: metadataSchema,
  },
};

export const validateEntity = wrapValidator(ajv.compile(entitySchema));