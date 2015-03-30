/**
 * Angular validation helper class
 * @version v0.0.3
 * @link https://github.com/andrewdacenko/ng-validator
 * @license MIT
 */
;(function (window, angular, undefined) {
"use strict";
angular.module('ngValidator', ['ngValidator.message-bag', 'ngValidator.validation-translator', 'ngValidator.validator']);

angular
    .module('ngValidator.message-bag', [])
    .factory('MessageBag', function () {
        /**
         * Create a new MessageBag instance.
         *
         * @return Object  MessageBag
         */
        function MessageBag() {
            this.errors = {};
        };

        /**
         * Add new error on field validation.
         *
         * @param  string  field
         * @param  string  rule
         * @param  string  message
         * @return boolean
         */
        MessageBag.prototype.add = function (field, message) {
            if (!(this.errors[field] instanceof Array)) {
                this.errors[field] = [];
            };

            this.errors[field].push(message);
        };

        /**
         * Check if there are any errors.
         *
         * @return boolean
         */
        MessageBag.prototype.hasErrors = function () {
            for (var prop in this.errors) {
                if (this.errors.hasOwnProperty(prop))
                    return true;
            }

            return false;
        };

        /**
         * Get all messages after validation.
         *
         * @return Object
         */
        MessageBag.prototype.all = function () {
            return this.errors;
        };

        /**
         * Check if there are errors at field validation.
         *
         * @param  string  field
         * @return Object
         */
        MessageBag.prototype.has = function (field) {
            return this.errors[field] ? true : false;
        };

        /**
         * Get first error on field validation.
         *
         * @param  string  field
         * @return Object
         */
        MessageBag.prototype.first = function (field) {
            if (this.has(field)) {
                return this.errors[field][0];
            }

            return '';
        };

        /**
         * Get all the field validation errors.
         *
         * @param  string  field
         * @return Object
         */
        MessageBag.prototype.get = function (field) {
            if (this.has(field)) {
                return this.errors[field];
            };

            return [];
        };

        return MessageBag;
    });
angular
    .module('ngValidator.validation-translator', [])
    .constant('validationTranslatorLang', {
        locale: 'en',
        fallback: 'en'
    })
    .constant('validationTranslatorConfig', {
        "en": {
            "accepted": "The :field must be accepted.",
            "between": {
                "numeric": "The :field must be between :min and :max.",
                "string": "The :field must be between :min and :max characters.",
                "array": "The :field must have between :min and :max items.",
            },
            "max": {
                "numeric": "The :field may not be greater than :max.",
                "string": "The :field may not be greater than :max characters.",
                "array": "The :field may not have more than :max items.",
            },
            "min": {
                "numeric": "The :field must be at least :min.",
                "string": "The :field must be at least :min characters.",
                "array": "The :field must have at least :min items.",
            },
            "not_in": "The selected :field is invalid.",
            "numeric": "The :field must be a number.",
            "regex": "The :field format is invalid.",
            "required": "The :field field is required.",
            "required_if": "The :field field is required when :other is :value.",
            "required_with": "The :field field is required when :values is present.",
            "required_with_all": "The :field field is required when :values is present.",
            "required_without": "The :field field is required when :values is not present.",
            "required_without_all": "The :field field is required when none of :values are present.",

            "custom": {
                "terms": {
                    "accepted": "You need to accept Terms & Condition rules.",
                },
            },

            "fields": {
                "email": "Email address",
            },

            "values": {
                // As an example just set displayable value for colors field
                // and its values
                "colors": {
                    "F00": "Red",
                    "0F0": "Green",
                    "00F": "Blue",
                },
            },
        }
    })
    .service('ValidationTranslator', ['validationTranslatorLang', 'validationTranslatorConfig', '$parse',
        function ValidationTranslator(validationTranslatorLang, validationTranslatorConfig, $parse) {
            /**
             * Get the translation for a given key.
             *
             * @param  string  key
             * @param  Object  parameters
             * @param  string  locale
             * @return string
             */
            this.trans = function trans(key, parameters, locale) {
                parameters = parameters || {};
                locale = locale || null;

                return this.get(key, parameters, locale);
            };

            /**
             * Get the translation for the given key.
             *
             * @param  string  key
             * @param  Object  replace
             * @param  string  locale
             * @return string
             */
            this.get = function get(key, replace, locale) {
                // Here we will get the locale that should be used for the
                // language. If one was not passed, we will use the default
                // locale. Then, we can get the  message and return.
                var locales = this.parseLocale(locale);

                var message = null;
                for (var i = 0; i < locales.length; i++) {
                    var message = this.getMessage(locales[i], key, replace);

                    if (message) break;
                };

                // If the message doesn't exist, we will return back the key
                // which was requested as that will be quick to spot in the UI
                // if language keys are wrong or missing from the translator's
                // language config. Otherwise we can return the message.
                if (!message) return key;
                return message;
            };

            /**
             * Retrieve a language line out the loaded Object.
             *
             * @param  string  locale
             * @param  string  key
             * @param  Object  replace
             * @return string|undefined
             */
            this.getMessage = function getMessage(locale, key, replace) {
                message = $parse(locale + '.' + key)(validationTranslatorConfig);

                return message;
            };

            /**
             * Get the array of locales to be checked.
             *
             * @param  string|null  locale
             * @return Array
             */
            this.parseLocale = function parseLocale(locale) {
                if (locale !== null) {
                    return [locale, this.fallback].filter(function (l) {
                        return l;
                    });
                };

                return [validationTranslatorLang.locale, validationTranslatorLang.fallback].filter(function (l) {
                    return l;
                });
            };
        }
    ]);
angular
    .module('ngValidator.validator', ['ngValidator.message-bag', 'ngValidator.validation-translator'])
    .factory('Validator', ['MessageBag', 'ValidationTranslator',
        function (MessageBag, ValidationTranslator) {
            /**
             * Create a new Validator instance with `new Validator(...args)`.
             *
             * @param {Object} data           Data to be validated
             * @param {Object} rules          Set of rules
             * @param {Object} customMessages Custom messages
             * @param {Object} customFields   Custom messages
             * @return {Validator}            Validator
             */
            function Validator(data, rules, customMessages, customFields) {
                this.data = data;
                this.rules = this.explodeRules(rules);
                this.customMessages = customMessages || {};
                this.customFields = customFields || {};
            };

            /**
             * Or create new validator instance by calling
             * Validator.make(...args).
             *
             * @param {Object} data           Data to be validated
             * @param {Object} rules          Set of rules
             * @param {Object} customMessages Custom messages
             * @param {Object} customFields   Custom messages
             * @return {Validator}            Validator
             */
            Validator.make = function (data, rules, customMessages, customFields) {
                return new Validator(data, rules, customMessages, customFields);
            };

            /**
             * The size related validation rules.
             *
             * @field {Array}
             */
            Validator.prototype.sizeRules = ['Size', 'Between', 'Min', 'Max'];

            /**
             * The numeric related validation rules.
             *
             * @field {Array}
             */
            Validator.prototype.numericRules = ['Numeric', 'Integer'];

            /**
             * The validation rules that imply the field is required.
             *
             * @field {Array}
             */
            Validator.prototype.implicitRules = ['Required', 'RequiredWith', 'RequiredWithAll', 'RequiredWithout', 'RequiredWithoutAll', 'RequiredIf', 'Accepted'];

            /**
             * Fallback messages
             *
             * @field {Object}
             */
            Validator.prototype.fallbackMessages = {};

            /**
             * Explode the rules into an array of rules.
             *
             * @param  {Object}  rules
             * @return {Object}
             */
            Validator.prototype.explodeRules = function (rules) {
                for (var field in rules) {
                    rules[field] = (typeof rules[field] === 'string') ? rules[field].split('|') : rules[field];
                };

                return rules;
            };

            /**
             * Extract the rule name and parameters from a rule.
             *
             * @param  {Array|String}  rules
             * @return {Object}
             */
            Validator.prototype.parseRule = function (rules) {
                if (Array.isArray(rules)) {
                    return this.parseArrayRule(rules);
                };

                return this.parseStringRule(rules);
            };

            /**
             * Parse an array based rule.
             *
             * @param  {Array}  rules
             * @return {Object}
             */
            Validator.prototype.parseArrayRule = function (rules) {
                return {
                    rule: studlyCase(rules[0].trim()),
                    parameters: rules.slice(1)
                };
            };

            /**
             * Parse a string based rule.
             *
             * @param  string  rules
             * @return array
             */
            Validator.prototype.parseStringRule = function (rules) {
                var parameters = [];

                // The format for specifying validation rules and parameters follows an
                // easy {rule}:{parameters} formatting convention. For instance the
                if (rules.indexOf(':') !== -1) {
                    var list = rules.split(':');
                    rules = list[0];
                    var parameters = this.parseParameters(rules, list[1]);
                }

                return {
                    rule: studlyCase(rules.trim()),
                    parameters: parameters
                };
            };

            /**
             * Parse a parameter list.
             *
             * @param  string   rule
             * @param  string   parameter
             * @return array
             */
            Validator.prototype.parseParameters = function (rule, parameter) {
                if (rule.toLowerCase() == 'regex') return [parameter];
                return parameter.split(',');
            }

            /**
             * Validate a given field against a rule.
             *
             * @param  string   field
             * @param  string   rule
             * @return void
             */
            Validator.prototype.validate = function (field, rule) {
                var parsed = this.parseRule(rule);

                if (parsed.rule === '') return;

                var value = this.getValue(field);

                if (!this['validate' + parsed.rule](field, value, parsed.parameters)) {
                    this.addFailure(field, parsed.rule, parsed.parameters);
                };
            };

            /**
             * Determine if the data passes the validation rules.
             *
             * @return boolean
             */
            Validator.prototype.passes = function () {
                this.errors = new MessageBag;

                for (var field in this.rules) {
                    var fieldRules = this.rules[field];

                    for (var i = 0; i < fieldRules.length; i++) {
                        this.validate(field, fieldRules[i]);
                    }

                };

                return !this.errors.hasErrors();
            };

            /**
             * Determine if the data fails the validation rules.
             *
             * @return boolean
             */
            Validator.prototype.fails = function () {
                return !this.passes();
            };

            /**
             * Register a custom validator rule.
             *
             * @param  string    rule
             * @param  Function  fn
             * @param  string    message
             * @return void
             */
            Validator.extend = function (rule, fn, message) {
                rule = studlyCase(rule);
                Validator.prototype['validate' + rule] = fn;
                Validator.prototype.defaultMessages[rule] = message || '';
            };

            /**
             * Add a failed rule and error message to the collection.
             *
             * @param  string   field
             * @param  string   rule
             * @param  Array    parameters
             * @return void
             */
            Validator.prototype.addFailure = function (field, rule, parameters) {
                var message = this.getMessage(field, rule);

                message = this.doReplacements(message, field, rule, parameters);

                this.errors.add(field, message);
            };

            /**
             * Get the validation message for a field and rule.
             *
             * @param  string   field
             * @param  string   rule
             * @return string
             */
            Validator.prototype.getMessage = function (field, rule) {
                var lowerRule = snakeCase(rule);

                var inlineMessage = this.getInlineMessage(field, lowerRule);

                // First we will retrieve the custom message for the
                // validation rule if one exists. If a custom validation
                // message is being used we'll return the custom message,
                // otherwise we'll keep searching for a valid message.
                if (inlineMessage) {
                    return inlineMessage;
                };

                var customKey = ["custom.", field, '.', lowerRule].join('');

                var customMessage = ValidationTranslator.trans(customKey);

                // Than we check for a custom defined validation message for
                // the field and rule. This allows the developer to specify
                // specific messages for only some fields and rules that need
                // to get specially formed.
                if (customMessage !== customKey) {
                    return customMessage;
                }

                // If the rule being validated is a "size" rule, we will need to gather the
                // specific error message for the type of field being validated such
                // as a number, file or string which all have different message types.
                else if (this.sizeRules.indexOf(rule) !== -1) {
                    return this.getSizeMessage(field, rule);
                };

                // Than, if no developer specified messages have been set, and
                // no other special messages apply for this rule, we will just
                // pull the default
                var key = lowerRule;
                var value = ValidationTranslator.trans(key);

                if (key !== value) {
                    return value;
                };

                return this.getInlineMessage(field, lowerRule, this.fallbackMessages) || key;
            };

            /**
             * Get the inmessage message for a rule if it exists.
             *
             * @param  string   field
             * @param  string   lowerRule
             * @param  array    source
             * @return string
             */
            Validator.prototype.getInlineMessage = function (field, lowerRule, source) {
                var messages = source || this.customMessages;
                var keys = [field + '.' + lowerRule, studlyCase(lowerRule)];

                // First we will check for a custom message for an field
                // specific rule message for the fields, then we will check
                // for a general custom message that is not field specific. If
                // we find either we'll return it.
                for (var key in keys) {
                    if (messages[keys[key]] !== undefined) return messages[keys[key]];
                }
            };

            /**
             * Get the proper error message for an field and size rule.
             *
             * @param  string  field
             * @param  string  rule
             * @return string
             */
            Validator.prototype.getSizeMessage = function (field, rule) {
                var lowerRule = snakeCase(rule);
                // There are three different types of size validations. The
                // field may be either a number, file, or string so we will
                // check a few things to know which type of value it is and
                // return the correct line for that type.
                var type = this.getFieldType(field);

                var key = [lowerRule, '.', type].join('');

                return ValidationTranslator.trans(key);
            };

            /**
             * Replace all error message place-holders with actual values.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.doReplacements = function (message, field, rule, parameters) {
                var message = replace(message, {
                    field: field
                });

                if (this['replace' + rule] !== undefined){
                    message = this['replace' + rule](message, field, rule, parameters);
                };

                return message;
            };

            /**
             * Get the value of a given field.
             *
             * @param  string   field
             * @return mixed
             */
            Validator.prototype.getValue = function (field) {
                return this.data[field];
            };

            /**
             * Determine if all of the given fields fail the required test.
             *
             * @param  Array    fields
             * @return boolean
             */
            Validator.prototype.allRequiredFails = function (fields) {
                for (var i = 0; i < fields.length; i++) {
                    if (this.validateRequired(fields[i], this.getValue(fields[i]))) {
                        return false;
                    };
                };

                return true;
            };

            /**
             * Validate that a required field exists.
             *
             * @param  string   field
             * @param  mixed    value
             * @return boolean
             */
            Validator.prototype.validateRequired = function (field, value) {
                if (value === null || value === undefined) {
                    return false
                } else if (typeof value === 'string') {
                    if (value.trim() === '') {
                        return false;
                    };
                } else if (value instanceof Array) {
                    if (value.length < 1) {
                        return false
                    };
                } else if (value instanceof Object && !(value instanceof Date)) {
                    if (Object.getOwnPropertyNames(value).length === 0) {
                        return false;
                    };
                };

                return true;
            };

            /**
             * Validate that an field exists when any other field exists.
             *
             * @param  string   field
             * @param  mixed    value
             * @param  Array    parameters
             * @return boolean
             */
            Validator.prototype.validateRequiredWith = function (field, value, parameters) {
                if (!this.allRequiredFails(parameters)) {
                    return this.validateRequired(field, value);
                }
                return true;
            };

            /**
             * Validate that an field exists when other field has certain value.
             *
             * @param  string   field
             * @param  mixed    value
             * @param  Array    parameters
             * @return boolean
             */
            Validator.prototype.validateRequiredIf = function (field, value, parameters) {
                if (this.getValue(parameters[0]) === parameters[1]) {
                    return this.validateRequired(field, value);
                };

                return true;
            };

            /**
             * Validate that a field was "accepted".
             *
             * This validation rule implies the field is "required".
             *
             * @param  string   field
             * @param  mixed    value
             * @return bool
             */
            Validator.prototype.validateAccepted = function (field, value) {
                var acceptable = ['yes', 'on', '1', 1, true, 'true'];

                return (this.validateRequired(field, value) && acceptable.indexOf(value) !== -1);
            };

            /**
             * Validate that an field is numeric.
             *
             * @param  string   field
             * @param  mixed    value
             * @return bool
             */
            Validator.prototype.validateNumeric = function (field, value) {
                return !isNaN(value);
            };

            /**
             * Validate the size of an field is between a set of values.
             *
             * @param  string  field
             * @param  mixed   value
             * @param  array   parameters
             * @return bool
             */
            Validator.prototype.validateBetween = function (field, value, parameters) {
                this.requireParameterCount(2, parameters, 'between');
                
                var size = this.getSize(field, value);
                
                return size >= parameters[0] && size <= parameters[1];
            };

            /**
             * Require a certain number of parameters to be present.
             *
             * @param  int     count
             * @param  array   parameters
             * @param  string  rule
             * @return
             * @throws Error
             */
            Validator.prototype.requireParameterCount = function (count, parameters, rule) {
                if (parameters.length < count) {
                    throw new Error("Validation rule " + rule + " requires at least " + count + " parameters.");
                }
            };

            /**
             * Get the size of an field.
             *
             * @param  string  field
             * @param  mixed   value
             * @return mixed
             */
            Validator.prototype.getSize = function (field, value) {
                var hasNumeric = this.hasRule(field, this.numericRules);

                // This method will determine if the field is a number, string, or file and
                // return the proper size accordingly. If it is a number, then number itself
                // is the size. If it is a file, we take kilobytes, and for a string the
                // entire length of the string will be considered the field size.
                if (!isNaN(value) && hasNumeric) {
                    return this.data[field];
                } else if (Array.isArray(value)) {
                    return value.length > 0;
                }

                return this.getStringSize(value);
            };

            /**
             * Get the size of a string.
             *
             * @param  string  value
             * @return int
             */
            Validator.prototype.getStringSize = function (value) {
                if (value) {
                    return ('' + value).trim().length;
                };

                return 0; 
            };

            /**
             * Determine if the given field has a rule in the given set.
             *
             * @param  string          field
             * @param  string|object   rules
             * @return bool
             */
            Validator.prototype.hasRule = function (field, rules) {
                return !!this.getRule(field, rules);
            }

            /**
             * Get a rule and its parameters for a given field.
             *
             * @param  string         field
             * @param  string|object  rules
             * @return object|undefined
             */
            Validator.prototype.getRule = function (field, rules) {
                if (!this.rules[field]) {
                    return;
                }

                for (var rule in this.rules) {
                    var parsed = this.parseRule(this.rules[rule]);

                    if (rules.indexOf(parsed.rule) !== -1) {
                        return parsed;
                    };
                };
            };

            /**
             * Get the displayable name of the field.
             *
             * @param  string  field
             * @return string
             */
            Validator.prototype.getField = function (field) {
                // The developer may dynamically specify the array of custom fields
                // on this Validator instance. If the field exists in this array
                // it takes precedence over all other ways we can pull fields.
                if (this.customFields[field]) {
                    return this.customFields[field];
                }

                var key = 'fields.' + field;
                // We allow for the developer to specify language messages for each of the
                // fields allowing for more displayable counterparts of each of
                // the fields. This provides the ability for simple formats.

                var message = ValidationTranslator.trans(key)

                if (message !== key) {
                    return message;
                }

                // If no language message has been specified for the field all of the
                // underscores are removed from the field name and that will be
                // used as default versions of the field's displayable names.
                return snakeCase(field).replace(/_/g, ' ');
            };

            /**
             * Get the data type of the given field.
             *
             * @param  string  field
             * @return string
             */
            Validator.prototype.getFieldType = function (field) {
                if (this.hasRule(field, this.numericRules)) {
                    return 'numeric';
                } else if (this.hasRule(field, 'Array')) {
                    return 'array';
                }

                return 'string';
            };

            /**
             * Transform an array of fields to their displayable form.
             *
             * @param  array  values
             * @return array
             */
            Validator.prototype.getAttributeList = function (values) {
                var fields = [];

                // For each field in the list we will simply get its displayable form as
                // this is convenient when replacing lists of parameters like some of the
                // replacement functions do when formatting out the validation message.
                for (var i = 0; i < values.length; i++) {
                    fields.push(this.getField(values[i]));
                };

                return fields;
            };

            /**
             * Get the displayable name of the value.
             *
             * @param  string  field
             * @param  mixed   value
             * @return string
             */
            Validator.prototype.getDisplayableValue = function (field, value) {
                if (this.customValues[field][value]) {
                    return this.customValues[field][value];
                }

                var key = 'values.' + field + '.' + value;

                var message = ValidationTranslator.trans(key);

                if (message !== key) {
                    return message;
                };

                return value;
            };

            /**
             * Replace all place-holders for the between rule.
             *
             * @param  string   message
             * @param  string   field
             * @param  string   rule
             * @param  array    parameters
             * @return string
             */
            Validator.prototype.replaceBetween = function (message, field, rule, parameters) {
                return message.replace(':min', parameters[0]).replace(':max', parameters[1]);
            };

            /**
             * Replace all place-holders for the digits rule.
             *
             * @param  string   message
             * @param  string   field
             * @param  string   rule
             * @param  array    parameters
             * @return string
             */
            Validator.prototype.replaceDigits = function (message, field, rule, parameters) {
                return message.replace(':digits', parameters[0]);
            };

            /**
             * Replace all place-holders for the digits (between) rule.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.replaceDigitsBetween = function (message, field, rule, parameters) {
                return this.replaceBetween(message, field, rule, parameters);
            };

            /**
             * Replace all place-holders for the size rule.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.replaceSize = function (message, field, rule, parameters) {
                return message.replace(':size', parameters[0]);
            };

            /**
             * Replace all place-holders for the min rule.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.replaceMin = function (message, field, rule, parameters) {
                return message.replace(':min', parameters[0]);
            };

            /**
             * Replace all place-holders for the max rule.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.replaceMax = function (message, field, rule, parameters) {
                return message.replace(':max', parameters[0]);
            };

            /**
             * Replace all place-holders for the in rule.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.replaceIn = function (message, field, rule, parameters) {
                for (var i = 0; i < parameters.length; i++) {
                    parameters[i] = this.getDisplayableValue(field, parameters[i]);
                };

                return message.replace(':values', parameters.join(', '));
            };

            /**
             * Replace all place-holders for the not_in rule.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.replaceNotIn = function (message, field, rule, parameters) {
                return this.replaceIn(message, field, rule, parameters);
            };

            /**
             * Replace all place-holders for the mimes rule.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.replaceMimes = function (message, field, rule, parameters) {
                return message.replace(':values', parameters.join(', '));
            };

            /**
             * Replace all place-holders for the required_with rule.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.replaceRequiredWith = function (message, field, rule, parameters) {
                parameters = this.getFieldList(parameters);
                return message.replace(':values', parameters.join(' / '));
            };

            /**
             * Replace all place-holders for the required_without rule.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.replaceRequiredWithout = function (message, field, rule, parameters) {
                return this.replaceRequiredWith(message, field, rule, parameters);
            };

            /**
             * Replace all place-holders for the required_without_all rule.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.replaceRequiredWithoutAll = function (message, field, rule, parameters) {
                return this.replaceRequiredWith(message, field, rule, parameters);
            };

            /**
             * Replace all place-holders for the required_if rule.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.replaceRequiredIf = function (message, field, rule, parameters) {
                parameters[1] = this.getDisplayableValue(parameters[0], array_get(this.data, parameters[0]));
                parameters[0] = this.getField(parameters[0]);

                return message.replace(':other', parameters[0]).replace(':value', parameters[1]);
            };

            /**
             * Replace all place-holders for the same rule.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.replaceSame = function (message, field, rule, parameters) {
                return message.replace(':other', this.getField(parameters[0]));
            };

            /**
             * Replace all place-holders for the different rule.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.replaceDifferent = function (message, field, rule, parameters) {
                return this.replaceSame(message, field, rule, parameters);
            };

            /**
             * Replace all place-holders for the date_format rule.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.replaceDateFormat = function (message, field, rule, parameters) {
                return message.replace(':format', parameters[0]);
            };

            /**
             * Replace all place-holders for the before rule.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.replaceBefore = function (message, field, rule, parameters) {
                if (!Date.parse(parameters[0])) {
                    return message.replace(':date', this.getField(parameters[0]));
                }
                return message.replace(':date', parameters[0]);
            };

            /**
             * Replace all place-holders for the after rule.
             *
             * @param  string  message
             * @param  string  field
             * @param  string  rule
             * @param  array   parameters
             * @return string
             */
            Validator.prototype.replaceAfter = function (message, field, rule, parameters) {
                return this.replaceBefore(message, field, rule, parameters);
            };

            /**
             * Helper functions
             */

            /**
             * Function to convert each word`s first letter to upper case.
             *
             * @param  string  str
             * @return string
             */
            function ucwords(str) {
                //  discuss at: http://phpjs.org/functions/ucwords/
                // original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
                // improved by: Waldo Malqui Silva (http://waldo.malqui.info)
                // improved by: Robin
                // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
                // bugfixed by: Onno Marsman
                //    input by: James (http://www.james-bell.co.uk/)
                //   example 1: ucwords('kevin van  zonneveld');
                //   returns 1: 'Kevin Van  Zonneveld'
                //   example 2: ucwords('HELLO WORLD');
                //   returns 2: 'HELLO WORLD'

                return (str + '').replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function ($1) {
                    return $1.toUpperCase();
                });
            };

            /**
             * Function to convert text into studly case.
             *
             * @param  string  str
             * @return string
             */
            function studlyCase(str) {
                str = ucwords((str + '').replace(/[-_]/g, ' '));
                return str.replace(/[\s]/g, '');
            };

            /**
             * Function to convert text into snake case.
             *
             * @param  string  str
             * @return string
             */
            function snakeCase(str) {
                return (str + '').replace(/(.)([A-Z])/g, '$1_$2').toLowerCase();
            };

            function replace(str, data) {
                return str.replace(/:([A-z]*)/g,
                    function (a, b) {
                        var r = data[b];
                        return typeof r === 'string' || typeof r === 'number' ? r : a;
                    }
                );
            };

            return Validator;
        }
    ]);
})(window, angular);