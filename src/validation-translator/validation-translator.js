angular
    .module('ngValidator.validation-translator', [])
    .constant('validationTranslatorLang', {
        locale: 'en',
        fallback: 'en'
    })
    .constant('validationTranslatorConfig', {
        "en": {
            "accepted": "The :attribute must be accepted.",
            "between": {
                "numeric": "The :attribute must be between :min and :max.",
                "string": "The :attribute must be between :min and :max characters.",
                "array": "The :attribute must have between :min and :max items.",
            },
            "in": "The selected :attribute is invalid.",
            "integer": "The :attribute must be an integer.",
            "max": {
                "numeric": "The :attribute may not be greater than :max.",
                "string": "The :attribute may not be greater than :max characters.",
                "array": "The :attribute may not have more than :max items.",
            },
            "min": {
                "numeric": "The :attribute must be at least :min.",
                "string": "The :attribute must be at least :min characters.",
                "array": "The :attribute must have at least :min items.",
            },
            "not_in": "The selected :attribute is invalid.",
            "numeric": "The :attribute must be a number.",
            "regex": "The :attribute format is invalid.",
            "required": "The :attribute field is required.",
            "required_if": "The :attribute field is required when :other is :value.",
            "required_with": "The :attribute field is required when :values is present.",
            "required_with_all": "The :attribute field is required when :values is present.",
            "required_without": "The :attribute field is required when :values is not present.",
            "required_without_all": "The :attribute field is required when none of :values are present.",

            // Developers can set custom validation messages on some
            // attributes validation rules
            "custom": {
                "attribute-name": {
                    "rule-name": "custom-message",
                },
            },

            // Developers can set displayable value for some attributes
            "attributes": {
                "email": "Email address",
            },

            // As an example just set displayable value for colors attribute
            // and its values
            "values": {
                "colors": {
                    "F00": "Red",
                    "0F0": "Green",
                    "00F": "Blue",
                },
            },
        }
    })
    .service('ValidationTranslator', ['validationTranslatorLang', 'validationTranslatorConfig',
        function ValidationTranslator(validationTranslatorLang, validationTranslatorConfig) {
            /**
             * Get the translation for a given key.
             *
             * @param  {String}  key
             * @param  {Object}  parameters
             * @param  {String}  locale
             *
             * @return {String}
             */
            this.trans = function trans(key, parameters, locale) {
                parameters = parameters || {};
                locale = locale || null;

                return this.get(key, parameters, locale);
            };

            /**
             * Get the translation for the given key.
             *
             * @param  {String}  key
             * @param  {Object}  replace
             * @param  {String}  locale
             *
             * @return {String}
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
             * @param  {String}  locale
             * @param  {String}  key
             * @param  {Object}  replace
             *
             * @return {String|undefined}
             */
            this.getMessage = function getMessage(locale, key, replace) {
                var message;

                var localeData = validationTranslatorConfig[locale];

                if (localeData) {
                    var data = localeData;
                    var keys = key.split('.');

                    for (var i = 0; i < keys.length; i++) {
                        if (data[keys[i]]) {
                            data = data[keys[i]];
                        } else {
                            return;                            
                        }
                    };

                    message = data;
                };

                return message;
            };

            /**
             * Get the array of locales to be checked.
             *
             * @param  {String|null}  locale
             *
             * @return {Array}
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