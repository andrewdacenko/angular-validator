(function() {
    'use strict';

    angular
        .module('ngValidator.validation-translator')
        .value('validationTranslatorLang', {
            locale: 'en',
            fallback: 'en'
        })
        .factory('ValidationTranslator', ValidationTranslator);

    /*@ngInject*/
    function ValidationTranslator(validationTranslatorLang, validationTranslatorConfig) {
        return {
            trans: trans
        };

        function trans(key) {
            var message = null;

            // Here we will get the locale that should be used for the
            // language. If one was not passed, we will use the default
            // locale. Then, we can get the  message and return.
            var locales = [
                validationTranslatorLang.locale,
                validationTranslatorLang.fallback
            ];

            for (var i = 0; i < locales.length; i++) {
                message = getMessage(locales[i], key);

                if (message) break;
            }

            // If the message doesn't exist, we will return back the key
            // which was requested as that will be quick to spot in the UI
            // if language keys are wrong or missing from the translator's
            // language config. Otherwise we can return the message.
            if (!message) return key;

            return message;
        }

        function getMessage(locale, key) {
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
                }

                message = data;
            }

            return message;
        }
    }

})();
