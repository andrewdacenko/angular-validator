angular
    .module('ngValidator.validator', ['ngValidator.message-bag', 'ngValidator.validation-translator'])
    .factory('Validator', ['MessageBag', 'ValidationTranslator',
        function (MessageBag, ValidationTranslator) {
            /**
             * Create a new Validator instance with `new Validator(...args)`.
             *
             * @param {Object} data             Data to be validated
             * @param {Object} rules            Set of rules
             * @param {Object} customMessages   Custom messages
             * @param {Object} customAttributes Custom messages
             *
             * @return {Validator} Validator
             */
            function Validator(data, rules, customMessages, customAttributes) {
                this.data = data;
                this.rules = this.explodeRules(rules);
                this.customMessages = customMessages || {};
                this.customAttributes = customAttributes || {};
            };

            /**
             * Or create new validator instance by calling
             * Validator.make(...args).
             *
             * @param {Object} data             Data to be validated
             * @param {Object} rules            Set of rules
             * @param {Object} customMessages   Custom messages
             * @param {Object} customAttributes Custom messages
             *
             * @return {Validator}            Validator
             */
            Validator.make = function (data, rules, customMessages, customAttributes) {
                return new Validator(data, rules, customMessages, customAttributes);
            };

            /**
             * The size related validation rules.
             *
             * @attribute {Array}
             */
            Validator.prototype.sizeRules = ['Size', 'Between', 'Min', 'Max'];

            /**
             * The numeric related validation rules.
             *
             * @attribute {Array}
             */
            Validator.prototype.numericRules = ['Numeric', 'Integer'];

            /**
             * The validation rules that imply the attribute is required.
             *
             * @attribute {Array}
             */
            Validator.prototype.implicitRules = ['Required', 'RequiredWith', 'RequiredWithAll', 'RequiredWithout', 'RequiredWithoutAll', 'RequiredIf', 'Accepted'];

            /**
             * Fallback messages
             *
             * @attribute {Object}
             */
            Validator.prototype.fallbackMessages = {};

            /**
             * The array of custom attribute names.
             *
             * @attribute {Object}
             */
            Validator.prototype.customAttributes = {};
            /**
             * The array of custom displayabled values.
             *
             * @attribute {Object}
             */
            Validator.prototype.customValues = {};

            /**
             * Explode the rules into an array of rules.
             *
             * @param {Object} rules
             *
             * @return {Object}
             */
            Validator.prototype.explodeRules = function (rules) {
                for (var attribute in rules) {
                    rules[attribute] = (typeof rules[attribute] === 'string') ? rules[attribute].split('|') : rules[attribute];
                };

                return rules;
            };

            /**
             * Extract the rule name and parameters from a rule.
             *
             * @param {Array|String} rules
             *
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
             * @param {Array} rules
             *
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
             * @param {String} rules
             *
             * @return {Array}
             */
            Validator.prototype.parseStringRule = function (rules) {
                var parameters = [];

                // The format for specifying validation rules and parameters
                // follows an easy {rule}:{parameters} formatting convention.
                // For instance the
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
             * @param {String} rule
             * @param {String} parameter
             *
             * @return {Array}
             */
            Validator.prototype.parseParameters = function (rule, parameter) {
                if (rule.toLowerCase() == 'regex') return [parameter];
                return parameter.split(',');
            }

            /**
             * Validate a given attribute against a rule.
             *
             * @param {String} attribute
             * @param {String} rule
             *
             * @return {undefined}
             */
            Validator.prototype.validate = function (attribute, rule) {
                var parsed = this.parseRule(rule);

                if (parsed.rule === '') return;

                var value = this.getValue(attribute);

                if (!this['validate' + parsed.rule](attribute, value, parsed.parameters)) {
                    this.addFailure(attribute, parsed.rule, parsed.parameters);
                };
            };

            /**
             * Determine if the data passes the validation rules.
             *
             * @return {Boolean}
             */
            Validator.prototype.passes = function () {
                this.errors = new MessageBag;

                for (var attribute in this.rules) {
                    var attributeRules = this.rules[attribute];

                    for (var i = 0; i < attributeRules.length; i++) {
                        this.validate(attribute, attributeRules[i]);
                    }

                };

                return !this.errors.hasErrors();
            };

            /**
             * Determine if the data fails the validation rules.
             *
             * @return {Boolean}
             */
            Validator.prototype.fails = function () {
                return !this.passes();
            };

            /**
             * Register a custom validator rule.
             *
             * @param {String}   rule
             * @param {Function} fn
             * @param {String}   message
             *
             * @return {Void}
             */
            Validator.extend = function (rule, fn, message) {
                rule = studlyCase(rule);
                Validator.prototype['validate' + rule] = fn;
                Validator.prototype.defaultMessages[rule] = message || '';
            };

            /**
             * Add a failed rule and error message to the collection.
             *
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {Void}
             */
            Validator.prototype.addFailure = function (attribute, rule, parameters) {
                var message = this.getMessage(attribute, rule);

                message = this.doReplacements(message, attribute, rule, parameters);

                this.errors.add(attribute, message);
            };

            /**
             * Get the validation message for an attribute and rule.
             *
             * @param {String} attribute
             * @param {String} rule
             *
             * @return {String}
             */
            Validator.prototype.getMessage = function (attribute, rule) {
                var lowerRule = snakeCase(rule);

                var inlineMessage = this.getInlineMessage(attribute, lowerRule);

                // First we will retrieve the custom message for the
                // validation rule if one exists. If a custom validation
                // message is being used we'll return the custom message,
                // otherwise we'll keep searching for a valid message.
                if (inlineMessage) {
                    return inlineMessage;
                };

                var customKey = ["custom.", attribute, '.', lowerRule].join('');

                var customMessage = ValidationTranslator.trans(customKey);

                // Than we check for a custom defined validation message for
                // the attribute and rule. This allows the developer to
                // specify specific messages for only some attributes and
                // rules that need to get specially formed.
                if (customMessage !== customKey) {
                    return customMessage;
                }

                // If the rule being validated is a "size" rule, we will need
                // to gather the specific error message for the type of
                // attribute being validated such as a number, file or string
                // which all have different message types.
                else if (this.sizeRules.indexOf(rule) !== -1) {
                    return this.getSizeMessage(attribute, rule);
                };

                // Than, if no developer specified messages have been set, and
                // no other special messages apply for this rule, we will just
                // pull the default
                var key = lowerRule;
                var value = ValidationTranslator.trans(key);

                if (key !== value) {
                    return value;
                };

                return this.getInlineMessage(attribute, lowerRule, this.fallbackMessages) || key;
            };

            /**
             * Get the inmessage message for a rule if it exists.
             *
             * @param {String} attribute
             * @param {String} lowerRule
             * @param {Array}  source
             *
             * @return {String}
             */
            Validator.prototype.getInlineMessage = function (attribute, lowerRule, source) {
                var messages = source || this.customMessages;
                var keys = [attribute + '.' + lowerRule, studlyCase(lowerRule)];

                // First we will check for a custom message for an attribute
                // specific rule message for the attributes, then we will
                // check for a general custom message that is not attribute
                // specific. If we find either we'll return it.
                for (var key in keys) {
                    if (messages[keys[key]] !== undefined) return messages[keys[key]];
                }
            };

            /**
             * Get the proper error message for an attribute and size rule.
             *
             * @param {String} attribute
             * @param {String} rule
             *
             * @return {String}
             */
            Validator.prototype.getSizeMessage = function (attribute, rule) {
                var lowerRule = snakeCase(rule);
                // There are three different types of size validations. The
                // attribute may be either a number, file, or string so we
                // will check a few things to know which type of value it is
                // and return the correct line for that type.
                var type = this.getAttributeType(attribute);

                var key = [lowerRule, '.', type].join('');

                return ValidationTranslator.trans(key);
            };

            /**
             * Replace all error message place-holders with actual values.
             *
             * @param {String} message
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {String}
             */
            Validator.prototype.doReplacements = function (message, attribute, rule, parameters) {
                var message = replace(message, {
                    attribute: attribute
                });

                if (this['replace' + rule] !== undefined) {
                    message = this['replace' + rule](message, attribute, rule, parameters);
                };

                return message;
            };

            /**
             * Get the value of a given attribute.
             *
             * @param {String} attribute
             *
             * @return {Mixed}
             */
            Validator.prototype.getValue = function (attribute) {
                return this.data[attribute];
            };

            /**
             * Determine if any of the given attributes fail the required test.
             *
             * @param {Array} attributes
             *
             * @return {Boolean}
             */
            Validator.prototype.anyFailingRequired = function (attributes) {
                for (var key in attributes) {
                    if (!this.validateRequired(key, this.getValue(key))) {
                        return true;
                    };
                };

                return false;
            };

            /**
             * Determine if all of the given attributes fail the required test.
             *
             * @param {Array} attributes
             *
             * @return {Boolean}
             */
            Validator.prototype.allRequiredFails = function (attributes) {
                for (var key in attributes) {
                    if (this.validateRequired(key, this.getValue(key))) {
                        return false;
                    };
                };

                return true;
            };

            /**
             * Validate that a required attribute exists.
             *
             * @param {String} attribute
             * @param {Mixed}  value
             *
             * @return {Boolean}
             */
            Validator.prototype.validateRequired = function (attribute, value) {
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
             * Validate that an attribute exists when any other attribute
             * exists.
             *
             * @param {String} attribute
             * @param {Mixed}  value
             * @param {Array}  parameters
             *
             * @return {Boolean}
             */
            Validator.prototype.validateRequiredWith = function (attribute, value, parameters) {
                if (!this.allRequiredFails(parameters)) {
                    return this.validateRequired(attribute, value);
                };

                return true;
            };

            /**
             * Validate that an attribute exists when all other attributes
             * exists.
             *
             * @param {String} attribute
             * @param {Mixed}  value
             * @param {Mixed}  parameters
             *
             * @return {Boolean}
             */
            Validator.prototype.validateRequiredWithAll = function (attribute, value, parameters) {
                if (!this.anyFailingRequired(parameters)) {
                    return this.validateRequired(attribute, value);
                };

                return true;
            };

            /**
             * Validate that an attribute exists when another attribute does
             * not.
             *
             * @param {String} attribute
             * @param {Mixed}  value
             * @param {Mixed}  parameters
             *
             * @return {Boolean}
             */
            Validator.prototype.validateRequiredWithout = function (attribute, value, parameters) {
                if (this.anyFailingRequired(parameters)) {
                    return this.validateRequired(attribute, value);
                };

                return true;
            };

            /**
             * Validate that an attribute exists when all other attributes do
             * not.
             *
             * @param {String} attribute
             * @param {Mixed}  value
             * @param {Mixed}  parameters
             *
             * @return {Boolean}
             */
            Validator.prototype.validateRequiredWithoutAll = function (attribute, value, parameters) {
                if (this.allFailingRequired(parameters)) {
                    return this.validateRequired(attribute, value);
                };

                return true;
            };

            /**
             * Validate that an attribute exists when other attribute has
             * certain value.
             *
             * @param {String} attribute
             * @param {Mixed}  value
             * @param {Array}  parameters
             *
             * @return {Boolean}
             */
            Validator.prototype.validateRequiredIf = function (attribute, value, parameters) {
                if (this.getValue(parameters[0]) === parameters[1]) {
                    return this.validateRequired(attribute, value);
                };

                return true;
            };

            /**
             * Validate that an attribute was "accepted".
             *
             * This validation rule implies the attribute is "required".
             *
             * @param {String} attribute
             * @param {Mixed}  value
             *
             * @return {Boolean}
             */
            Validator.prototype.validateAccepted = function (attribute, value) {
                var acceptable = ['yes', 'on', '1', 1, true, 'true'];

                return (this.validateRequired(attribute, value) && acceptable.indexOf(value) !== -1);
            };

            /**
             * Validate an attribute is contained within a list of values.
             *
             * @param {String} attribute
             * @param {Mixed}  value
             * @param {Array}  parameters
             *
             * @return {Boolean}
             */
            Validator.prototype.validateIn = function (attribute, value, parameters) {
                return parameters.indexOf('' + value);
            };

            /**
             * Validate an attribute is not contained within a list of values.
             *
             * @param {String} attribute
             * @param {Mixed}  value
             * @param {Array}  parameters
             *
             * @return {Boolean}
             */
            Validator.prototype.validateNotIn = function (attribute, value, parameters) {
                return !this.validateIn(attribute, value, parameters);
            };

            /**
             * Validate that an attribute is an integer.
             *
             * @param {String} attribute
             * @param {Mixed}  value
             *
             * @return {Boolean}
             */
            Validator.prototype.validateInteger = function (attribute, value) {
                return filter_var(value, FILTER_VALIDATE_INT) !== false;
            };

            /**
             * Validate that an attribute is numeric.
             *
             * @param {String} attribute
             * @param {Mixed}  value
             *
             * @return {Boolean}
             */
            Validator.prototype.validateNumeric = function (attribute, value) {
                return !isNaN(value);
            };

            /**
             * Validate the size of an attribute is between a set of values.
             *
             * @param {String} attribute
             * @param {Mixed}  value
             * @param {Array}  parameters
             *
             * @return {Boolean}
             */
            Validator.prototype.validateBetween = function (attribute, value, parameters) {
                this.requireParameterCount(2, parameters, 'between');

                var size = this.getSize(attribute, value);

                return size >= parameters[0] && size <= parameters[1];
            };

            /**
             * Require a certain number of parameters to be present.
             *
             * @param {Integer} count
             * @param {Array}   parameters
             * @param {String}  rule
             *
             * @return {undefined}
             *
             * @throws {Error}
             */
            Validator.prototype.requireParameterCount = function (count, parameters, rule) {
                if (parameters.length < count) {
                    throw new Error("Validation rule " + rule + " requires at least " + count + " parameters.");
                }
            };

            /**
             * Get the size of an attribute.
             *
             * @param {String} attribute
             * @param {Mixed}  value
             *
             * @return {Mixed}
             */
            Validator.prototype.getSize = function (attribute, value) {
                var hasNumeric = this.hasRule(attribute, this.numericRules);

                // This method will determine if the attribute is a number,
                // string, or file and return the proper size accordingly. If
                // it is a number, then number itself is the size. If it is a
                // file, we take kilobytes, and for a string the entire length
                // of the string will be considered the attribute size.
                if (!isNaN(value) && hasNumeric) {
                    return this.data[attribute];
                } else if (Array.isArray(value)) {
                    return value.length > 0;
                }

                return this.getStringSize(value);
            };

            /**
             * Get the size of a string.
             *
             * @param {String} value
             *
             * @return {Integer}
             */
            Validator.prototype.getStringSize = function (value) {
                if (value) {
                    return ('' + value).trim().length;
                };

                return 0;
            };

            /**
             * Determine if the given attribute has a rule in the given set.
             *
             * @param {String}        attribute
             * @param {String|Object} rules
             *
             * @return {Boolean}
             */
            Validator.prototype.hasRule = function (attribute, rules) {
                return !!this.getRule(attribute, rules);
            }

            /**
             * Get a rule and its parameters for a given attribute.
             *
             * @param {String}        attribute
             * @param {String|Object} rules
             *
             * @return {Object|undefined}
             */
            Validator.prototype.getRule = function (attribute, rules) {
                if (!this.rules[attribute]) {
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
             * Get the displayable name of the attribute.
             *
             * @param {String} attribute
             *
             * @return {String}
             */
            Validator.prototype.getAttribute = function (attribute) {
                // The developer may dynamically specify the array of custom
                // attributes on this Validator instance. If the attribute
                // exists in this array it takes precedence over all other
                // ways we can pull attributes.
                if (this.customAttributes[attribute]) {
                    return this.customAttributes[attribute];
                }

                var key = 'attributes.' + attribute;
                // We allow for the developer to specify language messages for
                // each of the attributes allowing for more displayable
                // counterparts of each of the attributes. This provides the
                // ability for simple formats.

                var message = ValidationTranslator.trans(key)

                if (message !== key) {
                    return message;
                }

                // If no language message has been specified for the attribute
                // all of the underscores are removed from the attribute name
                // and that will be used as default versions of the
                // attribute's displayable names.
                return snakeCase(attribute).replace(/_/g, ' ');
            };

            /**
             * Get the data type of the given attribute.
             *
             * @param {String} attribute
             *
             * @return {String}
             */
            Validator.prototype.getAttributeType = function (attribute) {
                if (this.hasRule(attribute, this.numericRules)) {
                    return 'numeric';
                } else if (this.hasRule(attribute, 'Array')) {
                    return 'array';
                }

                return 'string';
            };

            /**
             * Transform an array of attributes to their displayable form.
             *
             * @param {Array} values
             *
             * @return {Array}
             */
            Validator.prototype.getAttributeList = function (values) {
                var attributes = [];

                // For each attribute in the list we will simply get its
                // displayable form as this is convenient when replacing lists
                // of parameters like some of the replacement functions do
                // when formatting out the validation message.
                for (var i = 0; i < values.length; i++) {
                    attributes.push(this.getAttribute(values[i]));
                };

                return attributes;
            };

            /**
             * Get the displayable name of the value.
             *
             * @param {String} attribute
             * @param {Mixed}  value
             *
             * @return {String}
             */
            Validator.prototype.getDisplayableValue = function (attribute, value) {
                if (this.customValues[attribute] && this.customValues[attribute][value]) {
                    return this.customValues[attribute][value];
                }

                var key = 'values.' + attribute + '.' + value;

                var message = ValidationTranslator.trans(key);

                if (message !== key) {
                    return message;
                };

                return value;
            };

            /**
             * Replace all place-holders for the between rule.
             *
             * @param {String} message
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {String}
             */
            Validator.prototype.replaceBetween = function (message, attribute, rule, parameters) {
                return message.replace(':min', parameters[0]).replace(':max', parameters[1]);
            };

            /**
             * Replace all place-holders for the size rule.
             *
             * @param {String} message
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {String}
             */
            Validator.prototype.replaceSize = function (message, attribute, rule, parameters) {
                return message.replace(':size', parameters[0]);
            };

            /**
             * Replace all place-holders for the min rule.
             *
             * @param {String} message
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {String}
             */
            Validator.prototype.replaceMin = function (message, attribute, rule, parameters) {
                return message.replace(':min', parameters[0]);
            };

            /**
             * Replace all place-holders for the max rule.
             *
             * @param {String} message
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {String}
             */
            Validator.prototype.replaceMax = function (message, attribute, rule, parameters) {
                return message.replace(':max', parameters[0]);
            };

            /**
             * Replace all place-holders for the in rule.
             *
             * @param {String} message
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {String}
             */
            Validator.prototype.replaceIn = function (message, attribute, rule, parameters) {
                for (var i = 0; i < parameters.length; i++) {
                    parameters[i] = this.getDisplayableValue(attribute, parameters[i]);
                };

                return message.replace(':values', parameters.join(', '));
            };

            /**
             * Replace all place-holders for the not_in rule.
             *
             * @param {String} message
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {String}
             */
            Validator.prototype.replaceNotIn = function (message, attribute, rule, parameters) {
                return this.replaceIn(message, attribute, rule, parameters);
            };

            /**
             * Replace all place-holders for the required_with rule.
             *
             * @param {String} message
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {String}
             */
            Validator.prototype.replaceRequiredWith = function (message, attribute, rule, parameters) {
                parameters = this.getAttributeList(parameters);
                return message.replace(':values', parameters.join(' / '));
            };

            /**
             * Replace all place-holders for the required_without rule.
             *
             * @param {String} message
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {String}
             */
            Validator.prototype.replaceRequiredWithout = function (message, attribute, rule, parameters) {
                return this.replaceRequiredWith(message, attribute, rule, parameters);
            };

            /**
             * Replace all place-holders for the required_without_all rule.
             *
             * @param {String} message
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {String}
             */
            Validator.prototype.replaceRequiredWithoutAll = function (message, attribute, rule, parameters) {
                return this.replaceRequiredWith(message, attribute, rule, parameters);
            };

            /**
             * Replace all place-holders for the required_if rule.
             *
             * @param {String} message
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {String}
             */
            Validator.prototype.replaceRequiredIf = function (message, attribute, rule, parameters) {
                parameters[1] = this.getDisplayableValue(parameters[0], array_get(this.data, parameters[0]));
                parameters[0] = this.getAttribute(parameters[0]);

                return message.replace(':other', parameters[0]).replace(':value', parameters[1]);
            };

            /**
             * Replace all place-holders for the same rule.
             *
             * @param {String} message
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {String}
             */
            Validator.prototype.replaceSame = function (message, attribute, rule, parameters) {
                return message.replace(':other', this.getAttribute(parameters[0]));
            };

            /**
             * Replace all place-holders for the different rule.
             *
             * @param {String} message
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {String}
             */
            Validator.prototype.replaceDifferent = function (message, attribute, rule, parameters) {
                return this.replaceSame(message, attribute, rule, parameters);
            };

            /**
             * Replace all place-holders for the date_format rule.
             *
             * @param {String} message
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {String}
             */
            Validator.prototype.replaceDateFormat = function (message, attribute, rule, parameters) {
                return message.replace(':format', parameters[0]);
            };

            /**
             * Replace all place-holders for the before rule.
             *
             * @param {String} message
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {String}
             */
            Validator.prototype.replaceBefore = function (message, attribute, rule, parameters) {
                if (!Date.parse(parameters[0])) {
                    return message.replace(':date', this.getAttribute(parameters[0]));
                }
                return message.replace(':date', parameters[0]);
            };

            /**
             * Replace all place-holders for the after rule.
             *
             * @param {String} message
             * @param {String} attribute
             * @param {String} rule
             * @param {Array}  parameters
             *
             * @return {String}
             */
            Validator.prototype.replaceAfter = function (message, attribute, rule, parameters) {
                return this.replaceBefore(message, attribute, rule, parameters);
            };

            /**
             * Helper functions
             */

            /**
             * Convert each word`s first letter to upper case.
             *
             * @param {String} str
             *
             * @return {String}
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
             * Convert text into studly case.
             *
             * @param {String} str
             *
             * @return {String}
             */
            function studlyCase(str) {
                str = ucwords((str + '').replace(/[-_]/g, ' '));
                return str.replace(/[\s]/g, '');
            };

            /**
             * Convert text into snake case.
             *
             * @param {String} str
             *
             * @return {String}
             */
            function snakeCase(str) {
                return (str + '').replace(/(.)([A-Z])/g, '$1_$2').toLowerCase();
            };

            /**
             * Replace placeholders with object keys
             *
             * @example
             * // returns 'Dear Andrew'
             * var str = ":greet :name"
             * var greet = {greet: 'Dear', name: 'Andrew'};
             * replace(str, greet);
             *
             * @param {String} str  String contaiing placeholders
             * @param {Object} data Object with corresponding keys
             *
             * @return {String} Final string with replaced placeholders
             */
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