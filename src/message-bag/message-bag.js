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