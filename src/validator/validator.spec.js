describe('Validator factory', function() {
    var sut;

    var ValidationTranslator;

    var data;
    var rules;
    var customMessages;
    var customAttributes;

    var field;
    var error;
    var validation;

    beforeEach(function() {
        module('ngValidator.validator');

        inject(function(Validator, _ValidationTranslator_) {
            sut = Validator;
            ValidationTranslator = _ValidationTranslator_;
        });

        data = {};
        rules = {};
        customMessages = {};
        customAttributes = {};

        env.stub(ValidationTranslator, 'trans').returns('fake');
    });

    describe('accepted', function() {

        beforeEach(function() {
            field = 'foo';
            error = 'The foo must be accepted.';

            rules.foo = 'accepted';
        });

        it('should validate and return correct error message', function() {
            ValidationTranslator.trans
                .withArgs('custom.foo.accepted').returns('custom.foo.accepted')
                .withArgs('accepted').returns('The :attribute must be accepted.');

            ensureValidationFail({foo: false});

            validation.messages().first('foo').should.equal(error);
        });

        it('should return custom validation message', function() {
            error = 'Custom foo message.';

            ValidationTranslator.trans
                .withArgs('custom.foo.accepted').returns('Custom :attribute message.');

            ensureValidationFail({foo: 'no'});
            validation.errors().first('foo').should.equal(error);
        });

        it('should replace message with custom', function() {
            error = 'Field foo must be accepted.';
            customMessages['foo.accepted'] = 'Field :attribute must be accepted.';

            ensureValidationFail({foo: 'no'});

            validation.errors().first('foo').should.equal(error);
        });

        it('should pass with yes', function() {
            ensureValidationSuccess({foo: 'yes'});
        });

        it('should pass with on', function() {
            ensureValidationSuccess({foo: 'on'});
        });

        it('should pass with 1 as string', function() {
            ensureValidationSuccess({foo: '1'});
        });

        it('should pass with 1 as number', function() {
            ensureValidationSuccess({foo: 1});
        });

        it('should pass with true as string', function() {
            ensureValidationSuccess({foo: 'true'});
        });

        it('should pass with true as bool', function() {
            ensureValidationSuccess({foo: true});
        });
    });

    describe('required', function() {

        beforeEach(function() {
            field = 'foo';
            error = 'The foo field is required.';

            rules.foo = 'required';
        });

        it('should validate and return correct error message', function() {
            ValidationTranslator.trans
                .withArgs('custom.foo.required').returns('custom.foo.required')
                .withArgs('required').returns('The :attribute field is required.');

            ensureValidationFail({foo: undefined});

            validation.errors().first('foo').should.equal(error);
        });

        it('should return custom validation message', function() {
            error = 'Custom foo message.';

            ValidationTranslator.trans
                .withArgs('custom.foo.required').returns('Custom :attribute message.');

            ensureValidationFail({});
            validation.errors().first('foo').should.equal(error);
        });

        it('should fail with undefined', function() {
            ensureValidationFail({});
        });

        it('should fail with null', function() {
            ensureValidationFail({foo: null});
        });

        it('should fail with empty string or spaces', function() {
            ensureValidationFail({foo: ''});
            ensureValidationFail({foo: '    '});
        });

        it('should fail with empty array', function() {
            ensureValidationFail({foo: []});
        });

        it('should fail with empty object', function() {
            ensureValidationFail({foo: {}});
        });

        it('should pass with number', function() {
            ensureValidationSuccess({foo: 0});
        });

        it('should pass with string', function() {
            ensureValidationSuccess({foo: 'a'});
        });

        it('should pass with boolean', function() {
            ensureValidationSuccess({foo: false});
        });

        it('should pass with date', function() {
            ensureValidationSuccess({foo: new Date});
        });

        it('should pass with not empty array', function() {
            ensureValidationSuccess({foo: [1]});
        });

        it('should pass with not empty object', function() {
            ensureValidationSuccess({foo: {a: 1}});
        });
    });

    describe('required if', function() {

        beforeEach(function() {
            field = 'foo';
            error = 'The foo field is required when bar is 10.';

            rules.foo = 'required_if:bar,10';
        });

        it('should validate and return correct error message', function() {
            ValidationTranslator.trans
                .withArgs('custom.foo.required_if').returns('custom.foo.required_if')
                .withArgs('attributes.bar').returns('attributes.bar')
                .withArgs('values.bar.10').returns('values.bar.10')
                .withArgs('required_if').returns('The :attribute field is required when :other is :value.');

            ensureValidationFail({foo: undefined, bar: 10});
            ensureValidationFail({foo: undefined, bar: '10'});

            validation.errors().first('foo').should.equal(error);
        });

        it('should return custom validation message', function() {
            error = 'Custom foo message Bar Major';

            ValidationTranslator.trans
                .withArgs('custom.foo.required_if').returns('Custom :attribute message :other :value')
                .withArgs('attributes.bar').returns('Bar')
                .withArgs('values.bar.10').returns('Major');

            ensureValidationFail({foo: undefined, bar: '10'});

            validation.errors().first('foo').should.equal(error);
        });

        it('should pass with no dependency', function() {
            ensureValidationSuccess({});
        });

        it('should pass when dependency is different value', function() {
            ensureValidationSuccess({bar: 100});
        });
    });

    describe('required with', function() {

        context('one other field', function() {
            beforeEach(function() {
                field = 'foo';
                error = 'The foo field is required when bar is present.';

                rules.foo = 'required_with:bar';
            });

            it('should validate and return correct error message', function() {
                ValidationTranslator.trans
                    .withArgs('custom.foo.required_with').returns('custom.foo.required_with')
                    .withArgs('attributes.bar').returns('attributes.bar')
                    .withArgs('required_with').returns('The :attribute field is required when :values is present.');

                ensureValidationFail({bar: '1'});

                validation.errors().first('foo').should.equal(error);
            });

            it('should return custom validation message', function() {
                error = 'Custom foo message Bar present.';

                ValidationTranslator.trans
                    .withArgs('custom.foo.required_with').returns('Custom :attribute message :values present.')
                    .withArgs('attributes.bar').returns('Bar');

                ensureValidationFail({bar: true});

                validation.errors().first('foo').should.equal(error);
            });

            it('should pass with no dependency', function() {
                ensureValidationSuccess({});
            });
        });

        context('any of other fields', function() {
            beforeEach(function() {
                field = 'foo';
                error = 'The foo field is required when bar / baz is present.';

                rules.foo = 'required_with:bar,baz';
            });

            it('should validate and return correct error message', function() {
                ValidationTranslator.trans
                    .withArgs('custom.foo.required_with').returns('custom.foo.required_with')
                    .withArgs('attributes.bar').returns('attributes.bar')
                    .withArgs('attributes.baz').returns('attributes.baz')
                    .withArgs('required_with').returns('The :attribute field is required when :values is present.');

                ensureValidationFail({bar: '1'});

                validation.errors().first('foo').should.equal(error);
            });

            it('should return custom validation message', function() {
                error = 'Custom foo message Bar / Baz present.';

                ValidationTranslator.trans
                    .withArgs('custom.foo.required_with').returns('Custom :attribute message :values present.')
                    .withArgs('attributes.bar').returns('Bar')
                    .withArgs('attributes.baz').returns('Baz');

                ensureValidationFail({bar: '1'});

                validation.errors().first('foo').should.equal(error);
            });
        });
    });

    describe('required with all', function() {

        beforeEach(function() {
            field = 'foo';
            error = 'The foo field is required when bar / baz is present.';

            rules.foo = 'required_with_all:bar,baz';
        });

        it('should validate and return correct error message', function() {
            ValidationTranslator.trans
                .withArgs('custom.foo.required_with_all').returns('custom.foo.required_with_all')
                .withArgs('attributes.bar').returns('attributes.bar')
                .withArgs('attributes.baz').returns('attributes.baz')
                .withArgs('required_with_all').returns('The :attribute field is required when :values is present.');

            ensureValidationFail({bar: '1', baz: '2'});

            validation.errors().first('foo').should.equal(error);
        });

        it('should return custom validation message', function() {
            error = 'Custom foo message Bar / Baz present.';

            ValidationTranslator.trans
                .withArgs('custom.foo.required_with_all').returns('Custom :attribute message :values present.')
                .withArgs('attributes.bar').returns('Bar')
                .withArgs('attributes.baz').returns('Baz');

            ensureValidationFail({bar: '1', baz: '2'});

            validation.errors().first('foo').should.equal(error);
        });

        it('should pass when one of dependencies are not filled', function() {
            ensureValidationSuccess({bar:1});
        });

        it('should pass when filled', function() {
            ensureValidationSuccess({foo:1, bar:1, baz: 1});
        });
    });

    describe('required without', function() {

        context('one other field', function() {
            beforeEach(function() {
                field = 'foo';
                error = 'The foo field is required when bar is not present.';

                rules.foo = 'required_without:bar';
            });

            it('should validate and return correct error message', function() {
                ValidationTranslator.trans
                    .withArgs('custom.foo.required_without').returns('custom.foo.required_without')
                    .withArgs('attributes.bar').returns('attributes.bar')
                    .withArgs('required_without').returns('The :attribute field is required when :values is not present.');

                ensureValidationFail({});

                validation.errors().first('foo').should.equal(error);
            });

            it('should return custom validation message', function() {
                error = 'Custom foo message Bar present.';

                ValidationTranslator.trans
                    .withArgs('custom.foo.required_without').returns('Custom :attribute message :values present.')
                    .withArgs('attributes.bar').returns('Bar');

                ensureValidationFail({});

                validation.errors().first('foo').should.equal(error);
            });

            it('should pass with no dependency', function() {
                ensureValidationSuccess({bar: 1});
            });
        });

        context('any of other fields', function() {
            beforeEach(function() {
                field = 'foo';
                error = 'The foo field is required when bar / baz is not present.';

                rules.foo = 'required_without:bar,baz';
            });

            it('should validate and return correct error message', function() {
                ValidationTranslator.trans
                    .withArgs('custom.foo.required_without').returns('custom.foo.required_without')
                    .withArgs('attributes.bar').returns('attributes.bar')
                    .withArgs('attributes.baz').returns('attributes.baz')
                    .withArgs('required_without').returns('The :attribute field is required when :values is not present.');

                ensureValidationFail({bar: '1'});
                ensureValidationFail({baz: '1'});

                validation.errors().first('foo').should.equal(error);
            });

            it('should return custom validation message', function() {
                error = 'Custom foo message Bar / Baz present.';

                ValidationTranslator.trans
                    .withArgs('custom.foo.required_without').returns('Custom :attribute message :values present.')
                    .withArgs('attributes.bar').returns('Bar')
                    .withArgs('attributes.baz').returns('Baz');

                ensureValidationFail({bar: '1'});

                validation.errors().first('foo').should.equal(error);
            });
        });
    });

    describe('required without all', function() {

        beforeEach(function() {
            field = 'foo';
            error = 'The foo field is required when bar / baz is present.';

            rules.foo = 'required_without_all:bar,baz';
        });

        it('should fail when dependent fields are empty and do replacements', function() {
            ValidationTranslator.trans
                .withArgs('custom.foo.required_without_all').returns('custom.foo.required_without_all')
                .withArgs('attributes.bar').returns('attributes.bar')
                .withArgs('attributes.baz').returns('attributes.baz')
                .withArgs('required_without_all').returns('The :attribute field is required when :values is present.');

            ensureValidationFail({});

            validation.errors().first('foo').should.equal(error);
        });

        it('should pass when one of dependent fields is filled', function() {
            ensureValidationSuccess({bar:1});
        });

        it('should pass when filled and all others are empty', function() {
            ensureValidationSuccess({foo:1});
        });
    });

    function makeValidation() {
        return sut.make(data, rules, customMessages, customAttributes);
    }

    function ensureValidationFail(setData) {
        data = setData;

        validation = makeValidation();
        validation.fails().should.equal(true);
    }

    function ensureValidationSuccess(setData) {
        data = setData;

        validation = makeValidation();
        validation.passes().should.equal(true);
    }
});