angular
    .module('ngValidator')
    .factory('Validator', ['MessageBag',
        function (MessageBag) {
            /**
             * Create a new Validator instance.
             *
             * @param  Object  data
             * @param  Object  rules
             * @param  Object  messages
             * @return Object  Validator
             */
            function Validator(data, rules, messages) {
                this.messages = messages || {};
                this.data = data;
                this.rules = this.explodeRules(rules);
            };

            // Fallback messages
            Validator.prototype.defaultMessages = {
                Required: 'Field can\'t be blank',
                RequiredIf: 'Field can\'t be blank',
                RequiredWith: 'Field can\'t be blank'
            };

            /**
             * Explode the rules into an array of rules.
             *
             * @param  Object  rules
             * @return Object
             */
            Validator.prototype.explodeRules = function (rules) {
                for (var field in rules) {
                    rules[field] = (typeof rules[field] === 'string') ? rules[field].split('|') : rules[field];
                };

                return rules;
            };

            /**
             * Parse a string rule.
             *
             * @param  string  rules
             * @return {rule, parameters}
             */
            Validator.prototype.parseRules = function (rules) {
                parameters = [];
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
                var parsed = this.parseRules(rule);

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
            Validator.prototype.extend = function (rule, fn, message) {
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
                var message = this.messages[field + '.' + snakeCase(rule)] || this.defaultMessages[rule];

                this.errors.add(field, message);
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

            return Validator;
        }
    ]);
