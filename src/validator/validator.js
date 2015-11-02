(function() {
    'use strict';

    angular
        .module('ngValidator.validator')
        .factory('Validator', ValidatorFactory);

    /*@ngInject*/
    function ValidatorFactory(MessageBag, ValidationTranslator) {

        var factory = {
            make: makeValidator,
            extend: extendValidator
        };

        setValidationPrototype();

        return factory;

        /**
         * Create new Validator.
         *
         * @param   {Object} data
         * @param   {Object} rules
         * @param   {Object} customMessages
         * @param   {Object} customAttributes
         * @returns {Validator}
         */
        function makeValidator(data, rules, customMessages, customAttributes) {
            var validation = new Validation(data, rules, customMessages, customAttributes);

            return new Validator(validation);
        }

        /**
         * Extend validation set of rules.
         *
         * @param   {string}   rule
         * @param   {Function} fn
         * @param   {string}   message
         */
        function extendValidator(rule, fn, message) {
            rule = studlyCase(rule);
            Validation.prototype['validate' + rule] = fn;
            Validation.prototype.fallbackMessages[rule] = message || '';
        }

        /**
         * Create instance of Validation
         *
         * @param   {Validation} validation
         * @constructor
         */
        function Validator(validation) {
            angular.extend(this, {
                fails: validation.fails.bind(validation),
                passes: validation.passes.bind(validation),
                messages: validation.getMessages.bind(validation),
                errors: validation.getMessages.bind(validation)
            });
        }

        /**
         * Create new Validation instance.
         *
         * @param {Object} data
         * @param {Object} rules
         * @param {Object} customMessages
         * @param {Object} customAttributes
         * @constructor
         */
        function Validation(data, rules, customMessages, customAttributes) {
            this.data = data;
            this.rules = this.explodeRules(rules);
            this.customMessages = customMessages || {};
            this.customAttributes = customAttributes || {};
        }

        function setValidationPrototype() {

            /**
             * The size related validation rules.
             *
             * @attribute {Array}
             */
            Validation.prototype.sizeRules = ['Size', 'Between', 'Min', 'Max'];

            /**
             * The numeric related validation rules.
             *
             * @attribute {Array}
             */
            Validation.prototype.numericRules = ['Numeric', 'Integer'];

            /**
             * The validation rules that imply the attribute is required.
             *
             * @attribute {Array}
             */
            Validation.prototype.implicitRules = ['Required', 'RequiredWith', 'RequiredWithAll', 'RequiredWithout', 'RequiredWithoutAll', 'RequiredIf', 'Accepted'];

            /**
             * Fallback messages
             *
             * @attribute {Object}
             */
            Validation.prototype.fallbackMessages = {};

            /**
             * The array of custom attribute names.
             *
             * @attribute {Object}
             */
            Validation.prototype.customAttributes = {};

            /**
             * The array of custom displayable values.
             *
             * @attribute {Object}
             */
            Validation.prototype.customValues = {};

            /**
             * Explode the rules into an array of rules.
             *
             * @param   {Object} rules
             *
             * @returns {Object}
             */
            Validation.prototype.explodeRules = function(rules) {
                for (var attribute in rules) {
                    if (rules.hasOwnProperty(attribute)) {
                        rules[attribute] = (typeof rules[attribute] === 'string')
                            ? rules[attribute].split('|')
                            : rules[attribute];
                    }
                }

                return rules;
            };

            /**
             * Extract the rule name and parameters from a rule.
             *
             * @param   {Array|String} rules
             *
             * @returns {Object}
             */
            Validation.prototype.parseRule = function(rules) {
                if (Array.isArray(rules)) {
                    return this.parseArrayRule(rules);
                }

                return this.parseStringRule(rules);
            };

            /**
             * Parse an array based rule.
             *
             * @param   {Array} rules
             *
             * @returns {Object}
             */
            Validation.prototype.parseArrayRule = function(rules) {
                return {
                    rule: studlyCase(rules[0].trim()),
                    parameters: rules.slice(1)
                };
            };

            /**
             * Parse a string based rule.
             *
             * @param   {string} rules
             *
             * @returns {Array}
             */
            Validation.prototype.parseStringRule = function(rules) {
                var parameters = [];

                // The format for specifying validation rules and parameters
                // follows an easy {rule}:{parameters} formatting convention.
                if (rules.indexOf(':') !== -1) {
                    var list = rules.split(':');
                    rules = list[0];
                    parameters = this.parseParameters(rules, list[1]);
                }

                return {
                    rule: studlyCase(rules.trim()),
                    parameters: parameters
                };
            };

            /**
             * Parse a parameter list.
             *
             * @param   {string} rule
             * @param   {string} parameter
             *
             * @returns {Array}
             */
            Validation.prototype.parseParameters = function(rule, parameter) {
                if (rule.toLowerCase() == 'regex') return [parameter];
                return parameter.split(',');
            };

            /**
             * Validate a given attribute against a rule.
             *
             * @param   {string} attribute
             * @param   {string} rule
             */
            Validation.prototype.validate = function(attribute, rule) {
                var parsed = this.parseRule(rule);

                if (parsed.rule === '') return;

                var value = this.getValue(attribute);

                if (!this['validate' + parsed.rule](attribute, value, parsed.parameters)) {
                    this.addFailure(attribute, parsed.rule, parsed.parameters);
                }
            };

            /**
             * Determine if the data passes the validation rules.
             *
             * @returns {boolean}
             */
            Validation.prototype.passes = function() {
                return !this.fails();
            };

            /**
             * Determine if the data fails the validation rules.
             *
             * @returns {boolean}
             */
            Validation.prototype.fails = function() {
                this.messages = new MessageBag;

                for (var attribute in this.rules) {
                    var attributeRules = this.rules[attribute];

                    for (var i = 0; i < attributeRules.length; i++) {
                        this.validate(attribute, attributeRules[i]);
                    }
                }

                return this.messages.hasErrors();
            };

            Validation.prototype.getMessages = function() {
                return angular.copy(this.messages);
            };

            /**
             * Add a failed rule and error message to the collection.
             *
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             */
            Validation.prototype.addFailure = function(attribute, rule, parameters) {
                var message = this.getMessage(attribute, rule);

                message = this.doReplacements(message, attribute, rule, parameters);

                this.messages.add(attribute, message);
            };

            /**
             * Get the validation message for an attribute and rule.
             *
             * @param   {string} attribute
             * @param   {string} rule
             *
             * @returns {string}
             */
            Validation.prototype.getMessage = function(attribute, rule) {
                var lowerRule = snakeCase(rule);

                var inlineMessage = this.getInlineMessage(attribute, lowerRule);

                // First we will retrieve the custom message for the
                // validation rule if one exists. If a custom validation
                // message is being used we'll return the custom message,
                // otherwise we'll keep searching for a valid message.
                if (inlineMessage) {
                    return inlineMessage;
                }

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
                }

                // Than, if no developer specified messages have been set, and
                // no other special messages apply for this rule, we will just
                // pull the default
                var key = lowerRule;
                var value = ValidationTranslator.trans(key);

                if (key !== value) {
                    return value;
                }

                return this.getInlineMessage(attribute, lowerRule, this.fallbackMessages) || key;
            };

            /**
             * Get the inline message for a rule if it exists.
             *
             * @param   {string} attribute
             * @param   {string} lowerRule
             * @param   {Array}  source
             *
             * @return {string|undefined}
             */
            Validation.prototype.getInlineMessage = function(attribute, lowerRule, source) {
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
             * @param   {string} attribute
             * @param   {string} rule
             *
             * @returns {string}
             */
            Validation.prototype.getSizeMessage = function(attribute, rule) {
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
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.doReplacements = function(message, attribute, rule, parameters) {
                message = replace(message, {
                    attribute: attribute
                });

                if (this['replace' + rule] !== undefined) {
                    message = this['replace' + rule](message, attribute, rule, parameters);
                }

                return message;
            };

            /**
             * Get the value of a given attribute.
             *
             * @param   {string} attribute
             *
             * @returns {*}
             */
            Validation.prototype.getValue = function(attribute) {
                return this.data[attribute];
            };

            /**
             * Determine if any of the given attributes fail the required test.
             *
             * @param   {array} attributes
             *
             * @returns {boolean}
             */
            Validation.prototype.anyFailingRequired = function(attributes) {
                for (var key in attributes) {
                    if (!this.validateRequired(attributes[key], this.getValue(attributes[key]))) {
                        return true;
                    }
                }

                return false;
            };

            /**
             * Determine if all of the given attributes fail the required test.
             *
             * @param   {Array} attributes
             *
             * @returns {boolean}
             */
            Validation.prototype.allFailingRequired = function(attributes) {
                for (var key in attributes) {
                    if (this.validateRequired(attributes[key], this.getValue(attributes[key]))) {
                        return false;
                    }
                }

                return true;
            };

            /**
             * Validate that an attribute was "accepted".
             *
             * This validation rule implies the attribute is "required".
             *
             * @param   {string}  attribute
             * @param   {*}       value
             *
             * @return {boolean}
             */
            Validation.prototype.validateAccepted = function(attribute, value) {
                var acceptable = ['yes', 'on', '1', 1, true, 'true'];

                return (this.validateRequired(attribute, value) && acceptable.indexOf(value) !== -1);
            };

            /**
             * Validate that a required attribute exists.
             *
             * @param   {string} attribute
             * @param   {*}      value
             *
             * @return {boolean}
             */
            Validation.prototype.validateRequired = function(attribute, value) {
                if (value === null || value === undefined) {
                    return false
                } else if (typeof value === 'string') {
                    if (value.trim() === '') {
                        return false;
                    }
                } else if (value instanceof Array) {
                    if (value.length < 1) {
                        return false
                    }
                } else if (value instanceof Object && !(value instanceof Date)) {
                    if (Object.getOwnPropertyNames(value).length === 0) {
                        return false;
                    }
                }

                return true;
            };

            /**
             * Validate that an attribute exists when other attribute has
             * certain value.
             *
             * @param {string} attribute
             * @param {*}      value
             * @param {Array}  parameters
             *
             * @return {boolean}
             */
            Validation.prototype.validateRequiredIf = function(attribute, value, parameters) {
                if (this.getValue(parameters[0]) == parameters[1]) {
                    return this.validateRequired(attribute, value);
                }

                return true;
            };

            /**
             * Validate that an attribute exists when any other attribute
             * exists.
             *
             * @param   {string} attribute
             * @param   {*}      value
             * @param   {Array}  parameters
             *
             * @returns {boolean}
             */
            Validation.prototype.validateRequiredWith = function(attribute, value, parameters) {
                if (!this.allFailingRequired(parameters)) {
                    return this.validateRequired(attribute, value);
                }

                return true;
            };

            /**
             * Validate that an attribute exists when all other attributes
             * exists.
             *
             * @param   {string} attribute
             * @param   {*}      value
             * @param   {*}      parameters
             *
             * @returns {boolean}
             */
            Validation.prototype.validateRequiredWithAll = function(attribute, value, parameters) {
                if (!this.anyFailingRequired(parameters)) {
                    return this.validateRequired(attribute, value);
                }

                return true;
            };

            /**
             * Validate that an attribute exists when another attribute does
             * not.
             *
             * @param   {string} attribute
             * @param   {*}      value
             * @param   {*}      parameters
             *
             * @returns {boolean}
             */
            Validation.prototype.validateRequiredWithout = function(attribute, value, parameters) {
                if (this.anyFailingRequired(parameters)) {
                    return this.validateRequired(attribute, value);
                }

                return true;
            };

            /**
             * Validate that an attribute exists when all other attributes do
             * not.
             *
             * @param   {string} attribute
             * @param   {*}      value
             * @param   {*}      parameters
             *
             * @returns {boolean}
             */
            Validation.prototype.validateRequiredWithoutAll = function(attribute, value, parameters) {
                if (this.allFailingRequired(parameters)) {
                    return this.validateRequired(attribute, value);
                }

                return true;
            };

            /**
             * Validate an attribute is contained within a list of values.
             *
             * @param   {string} attribute
             * @param   {*}      value
             * @param   {Array}  parameters
             *
             * @returns {boolean}
             */
            Validation.prototype.validateIn = function(attribute, value, parameters) {
                return parameters.indexOf('' + value) !== -1;
            };

            /**
             * Validate an attribute is not contained within a list of values.
             *
             * @param   {string} attribute
             * @param   {*}      value
             * @param   {Array}  parameters
             *
             * @returns {boolean}
             */
            Validation.prototype.validateNotIn = function(attribute, value, parameters) {
                return !this.validateIn(attribute, value, parameters);
            };

            /**
             * Validate that an attribute is an integer.
             *
             * @param   {string} attribute
             * @param   {*}      value
             *
             * @returns {boolean}
             */
            Validation.prototype.validateInteger = function(attribute, value) {
                return !isNaN(value) && value === (value | 0);
            };

            /**
             * Validate that an attribute is numeric.
             *
             * @param   {string} attribute
             * @param   {*}      value
             *
             * @returns {boolean}
             */
            Validation.prototype.validateNumeric = function(attribute, value) {
                return !isNaN(value);
            };

            /**
             * Validate the size of an attribute is between a set of values.
             *
             * @param   {string}              attribute
             * @param   {string|number|Array} value
             * @param   {Array}               parameters
             *
             * @returns {boolean}
             */
            Validation.prototype.validateBetween = function(attribute, value, parameters) {
                this.requireParameterCount(2, parameters, 'between');

                var size = this.getSize(attribute, value);

                return size >= parameters[0] && size <= parameters[1];
            };

            /**
             * Require a certain number of parameters to be present.
             *
             * @param   {Integer} count
             * @param   {Array}   parameters
             * @param   {string}  rule
             *
             * @returns {undefined}
             *
             * @throws {Error}
             */
            Validation.prototype.requireParameterCount = function(count, parameters, rule) {
                if (parameters.length < count) {
                    throw new Error("Validation rule " + rule + " requires at least " + count + " parameters.");
                }
            };

            /**
             * Get the size of an attribute.
             *
             * @param   {string}              attribute
             * @param   {string|number|Array} value
             *
             * @returns {number}
             */
            Validation.prototype.getSize = function(attribute, value) {
                var hasNumeric = this.hasRule(attribute, this.numericRules);

                // This method will determine if the attribute is a number,
                // string, or array and return the proper size accordingly. If
                // it is a number, then number itself is the size. If it is an
                // array, we take length, and for a string the entire length
                // of the string will be considered the attribute size.
                if (!isNaN(value) && hasNumeric) {
                    return this.data[attribute];
                } else if (Array.isArray(value)) {
                    return value.length;
                }

                return this.getStringSize(value);
            };

            /**
             * Get the size of a string.
             *
             * @param   {string} value
             *
             * @returns {number}
             */
            Validation.prototype.getStringSize = function(value) {
                if (value) {
                    return ('' + value).trim().length;
                }

                return 0;
            };

            /**
             * Determine if the given attribute has a rule in the given set.
             *
             * @param   {string}        attribute
             * @param   {string|Object} rules
             *
             * @returns {boolean}
             */
            Validation.prototype.hasRule = function(attribute, rules) {
                return !!this.getRule(attribute, rules);
            };

            /**
             * Get a rule and its parameters for a given attribute.
             *
             * @param   {string}        attribute
             * @param   {string|Object} rules
             *
             * @returns {Object|undefined}
             */
            Validation.prototype.getRule = function(attribute, rules) {
                if (!this.rules[attribute]) {
                    return;
                }

                for (var rule in this.rules) {
                    var parsed = this.parseRule(this.rules[rule]);

                    if (rules.indexOf(parsed.rule) !== -1) {
                        return parsed;
                    }
                }
            };

            /**
             * Get the displayable name of the attribute.
             *
             * @param   {string} attribute
             *
             * @returns {string}
             */
            Validation.prototype.getAttribute = function(attribute) {
                // The developer may dynamically specify the array of custom
                // attributes on this Validation instance. If the attribute
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

                var message = ValidationTranslator.trans(key);

                if (message !== key) {
                    return message;
                }

                // If no language message has been specified for the attribute
                // all of the underscores are removed from the attribute name
                // and that will be used as default versions of the
                // attribute`s displayable names.
                return snakeCase(attribute).replace(/_/g, ' ');
            };

            /**
             * Get the data type of the given attribute.
             *
             * @param   {string} attribute
             *
             * @returns {string}
             */
            Validation.prototype.getAttributeType = function(attribute) {
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
             * @param   {Array} values
             *
             * @returns {Array}
             */
            Validation.prototype.getAttributeList = function(values) {
                var attributes = [];

                // For each attribute in the list we will simply get its
                // displayable form as this is convenient when replacing lists
                // of parameters like some of the replacement functions do
                // when formatting out the validation message.
                for (var i = 0; i < values.length; i++) {
                    attributes.push(this.getAttribute(values[i]));
                }

                return attributes;
            };

            /**
             * Get the displayable name of the value.
             *
             * @param   {string} attribute
             * @param   {*}      value
             *
             * @returns {string}
             */
            Validation.prototype.getDisplayableValue = function(attribute, value) {
                if (this.customValues[attribute] && this.customValues[attribute][value]) {
                    return this.customValues[attribute][value];
                }

                var key = 'values.' + attribute + '.' + value;

                var message = ValidationTranslator.trans(key);

                if (message !== key) {
                    return message;
                }

                return value;
            };

            /**
             * Replace all place-holders for the between rule.
             *
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.replaceBetween = function(message, attribute, rule, parameters) {
                return message.replace(':min', parameters[0]).replace(':max', parameters[1]);
            };

            /**
             * Replace all place-holders for the size rule.
             *
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.replaceSize = function(message, attribute, rule, parameters) {
                return message.replace(':size', parameters[0]);
            };

            /**
             * Replace all place-holders for the min rule.
             *
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.replaceMin = function(message, attribute, rule, parameters) {
                return message.replace(':min', parameters[0]);
            };

            /**
             * Replace all place-holders for the max rule.
             *
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.replaceMax = function(message, attribute, rule, parameters) {
                return message.replace(':max', parameters[0]);
            };

            /**
             * Replace all place-holders for the in rule.
             *
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.replaceIn = function(message, attribute, rule, parameters) {
                for (var i = 0; i < parameters.length; i++) {
                    parameters[i] = this.getDisplayableValue(attribute, parameters[i]);
                }

                return message.replace(':values', parameters.join(', '));
            };

            /**
             * Replace all place-holders for the not_in rule.
             *
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.replaceNotIn = function(message, attribute, rule, parameters) {
                return this.replaceIn(message, attribute, rule, parameters);
            };

            /**
             * Replace all place-holders for the required_if rule.
             *
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.replaceRequiredIf = function(message, attribute, rule, parameters) {
                parameters[1] = this.getDisplayableValue(parameters[0], this.getValue(parameters[0]));
                parameters[0] = this.getAttribute(parameters[0]);

                return replace(message, {other: parameters[0], value: parameters[1]});
            };

            /**
             * Replace all place-holders for the required_with rule.
             *
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.replaceRequiredWith = function(message, attribute, rule, parameters) {
                parameters = this.getAttributeList(parameters);
                return message.replace(':values', parameters.join(' / '));
            };

            /**
             * Replace all place-holders for the required_with_all rule.
             *
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.replaceRequiredWithAll = function(message, attribute, rule, parameters) {
                return this.replaceRequiredWith(message, attribute, rule, parameters);
            };

            /**
             * Replace all place-holders for the required_without rule.
             *
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.replaceRequiredWithout = function(message, attribute, rule, parameters) {
                return this.replaceRequiredWith(message, attribute, rule, parameters);
            };

            /**
             * Replace all place-holders for the required_without_all rule.
             *
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.replaceRequiredWithoutAll = function(message, attribute, rule, parameters) {
                return this.replaceRequiredWith(message, attribute, rule, parameters);
            };

            /**
             * Replace all place-holders for the same rule.
             *
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.replaceSame = function(message, attribute, rule, parameters) {
                return message.replace(':other', this.getAttribute(parameters[0]));
            };

            /**
             * Replace all place-holders for the different rule.
             *
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.replaceDifferent = function(message, attribute, rule, parameters) {
                return this.replaceSame(message, attribute, rule, parameters);
            };

            /**
             * Replace all place-holders for the date_format rule.
             *
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.replaceDateFormat = function(message, attribute, rule, parameters) {
                return message.replace(':format', parameters[0]);
            };

            /**
             * Replace all place-holders for the before rule.
             *
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.replaceBefore = function(message, attribute, rule, parameters) {
                if (!Date.parse(parameters[0])) {
                    return message.replace(':date', this.getAttribute(parameters[0]));
                }
                return message.replace(':date', parameters[0]);
            };

            /**
             * Replace all place-holders for the after rule.
             *
             * @param   {string} message
             * @param   {string} attribute
             * @param   {string} rule
             * @param   {Array}  parameters
             *
             * @returns {string}
             */
            Validation.prototype.replaceAfter = function(message, attribute, rule, parameters) {
                return this.replaceBefore(message, attribute, rule, parameters);
            };
        }

        /**
         * Helpers goes next
         */

        /**
         * Convert each word`s first letter to upper case.
         *
         * @param {String} str
         *
         * @return {String}
         */
        function upperCaseWords(str) {
            return (str + '').replace(/^([a-z])|\s+([a-z])/g, function($1) {
                return $1.toUpperCase();
            });
        }

        /**
         * Convert text into studly case.
         *
         * @param {String} str
         *
         * @return {String}
         */
        function studlyCase(str) {
            str = upperCaseWords((str + '').replace(/[-_]/g, ' '));
            return str.replace(/[\s]/g, '');
        }

        /**
         * Convert text into snake case.
         *
         * @param {String} str
         *
         * @return {String}
         */
        function snakeCase(str) {
            return (str + '').replace(/(.)([A-Z])/g, '$1_$2').toLowerCase();
        }

        /**
         * Replace placeholders with object keys
         *
         * @example
         * // returns 'Dear Andrew'
         * var str = ":greet :name"
         * var greet = {greet: 'Dear', name: 'Andrew'};
         * replace(str, greet);
         *
         * @param {String} str  String containing placeholders
         * @param {Object} data Object with corresponding keys
         *
         * @return {String} Final string with replaced placeholders
         */
        function replace(str, data) {
            return (str + '').replace(/:([A-z]*)/g,
                function(a, b) {
                    var r = data[b];
                    return typeof r === 'string' || typeof r === 'number' ? r : a;
                }
            );
        }
    }

})();
