(function() {
    'use strict';

    angular
        .module('ngValidator.validation-translator')
        .value('validationTranslatorConfig', {
            "en": {
                "accepted": "The :attribute must be accepted.",
                "between": {
                    "numeric": "The :attribute must be between :min and :max.",
                    "string": "The :attribute must be between :min and :max characters.",
                    "array": "The :attribute must have between :min and :max items."
                },
                "in": "The selected :attribute is invalid.",
                "integer": "The :attribute must be an integer.",
                "max": {
                    "numeric": "The :attribute may not be greater than :max.",
                    "string": "The :attribute may not be greater than :max characters.",
                    "array": "The :attribute may not have more than :max items."
                },
                "min": {
                    "numeric": "The :attribute must be at least :min.",
                    "string": "The :attribute must be at least :min characters.",
                    "array": "The :attribute must have at least :min items."
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
                        "rule-name": "custom-message"
                    }
                },

                // Developers can set displayable value for some attributes
                "attributes": {
                    "email": "Email address"
                },

                // As an example just set displayable value for colors attribute
                // and its values
                "values": {
                    "colors": {
                        "F00": "Red",
                        "0F0": "Green",
                        "00F": "Blue"
                    }
                }
            }
        });
})();