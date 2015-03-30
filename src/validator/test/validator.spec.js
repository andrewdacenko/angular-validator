'use strict';

describe('Validator factory', function () {
    var Validator;

    beforeEach(module('ngValidator.message-bag'));
    beforeEach(module('ngValidator.validator'));

    beforeEach(inject(function (_Validator_) {
        Validator = _Validator_;
    }));

    it('can get an instance of my factory', function () {
        expect(Validator).toBeDefined();
    });

    describe('new empty instance', function () {
        var validator;

        beforeEach(function () {
            validator = new Validator;
        });

        it('should be defined', function () {
            expect(validator).toBeDefined();
        });

        it('should have default messages', function () {
            expect(validator.fallbackMessages).toBeDefined();
        });

        it('should have no custom messages', function () {
            expect(validator.customMessages).toEqual({});
        })

        it('should have no data', function () {
            expect(validator.data).toBeUndefined();
        });

        it('should have no rules', function () {
            expect(validator.rules).toBeUndefined();
        });
    });

    describe('new instance with data only', function () {
        var data, validator;

        beforeEach(function () {
            data = {
                attribute: null
            };

            spyOn(Validator.prototype, 'explodeRules').and.callThrough();

            validator = new Validator(data);
        });

        it('should have initial data', function () {
            expect(validator.data).toEqual(data);
        });

        it('should explode rules on initial call', function () {
            expect(validator.explodeRules).toHaveBeenCalled();
            expect(validator.explodeRules).toHaveBeenCalledWith(undefined);
        });
    });

    describe('new instance with data and rules', function () {
        var data, rules, validator, fails, errors;

        beforeEach(function () {
            data = {
                attribute: null
            };

            rules = {
                attribute: 'required',
            };

            validator = new Validator(data, rules);
            fails = validator.fails();
            errors = validator.errors.all();
        });

        it('should have rules', function () {
            expect(validator.rules).toBeDefined();
        });

        it('should have fails', function () {
            expect(fails).toBeTruthy();
        });
    });

    describe('new instance with data, rules and custom messages', function () {
        var data, rules, messages, validator, fails, errors;

        beforeEach(function () {
            data = {
                attribute: null,
            };

            rules = {
                attribute: 'required'
            };

            messages = {
                'attribute.required': 'Please fill in attribute.'
            };

            validator = new Validator(data, rules, messages);
            fails = validator.fails();
            errors = validator.errors.all();
        });

        it('should replace with custom messages', function() {
            expect(errors.attribute.length).toEqual(1);
            expect(errors.attribute[0]).toEqual('Please fill in attribute.');
        });
    });

    describe('validation messages', function () {
        var data, rules, messages, validator, fails, errors;

        describe('accepted', function () {
            beforeEach(function () {
                data = {
                    attribute: null,
                };

                rules = {
                    attribute: 'accepted',
                };

                validator = new Validator(data, rules);
                fails = validator.fails();
                errors = validator.errors.all();
            });

            it('should have consistent message', function () {
                expect(errors.attribute.length).toEqual(1);
                expect(errors.attribute[0]).toEqual('The attribute must be accepted.');
            });
        });

        describe('between', function () {
            beforeEach(function () {
                data = {
                    attribute: 'as',
                };

                rules = {
                    attribute: 'between:3,10',
                };

                validator = new Validator(data, rules);
                fails = validator.fails();
                errors = validator.errors.all();
            });

            it('should have consistent message', function () {
                expect(errors.attribute.length).toEqual(1);
                expect(errors.attribute[0]).toEqual('The attribute must be between 3 and 10 characters.');
            });
        });

        describe('in', function () {
            beforeEach(function () {
                data = {
                    attribute: 3,
                };

                rules = {
                    attribute: 'in:3,10',
                };

                validator = new Validator(data, rules);
                fails = validator.fails();
                errors = validator.errors.all();
            });

            it('should have consistent message', function () {
                expect(errors.attribute.length).toEqual(1);
                expect(errors.attribute[0]).toEqual('The selected attribute is invalid.');
            });
        });

        describe('required', function () {
            beforeEach(function () {
                data = {
                    attribute: null,
                };

                rules = {
                    attribute: 'required',
                };

                validator = new Validator(data, rules);
                fails = validator.fails();
                errors = validator.errors.all();
            });

            it('should have consistent message', function () {
                expect(errors.attribute.length).toEqual(1);
                expect(errors.attribute[0]).toEqual('The attribute field is required.');
            });
        });

        describe('numeric', function () {
            beforeEach(function () {
                data = {
                    attribute: 'as',
                };

                rules = {
                    attribute: 'numeric',
                };

                validator = new Validator(data, rules);
                fails = validator.fails();
                errors = validator.errors.all();
            });

            it('should validate numeric', function () {
                expect(errors.attribute.length).toEqual(1);
                expect(errors.attribute[0]).toEqual('The attribute must be a number.');
            });
        });
    });
});