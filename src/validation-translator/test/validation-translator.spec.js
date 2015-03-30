'use strict';

describe('ValidationTranslator service', function () {
    var ValidationTranslator;

    beforeEach(module('ngValidator.validation-translator'));

    beforeEach(inject(function (_ValidationTranslator_) {
        ValidationTranslator = _ValidationTranslator_;
    }));

    it('can get an instance of my service', function () {
        expect(ValidationTranslator).toBeDefined();
    });

    it('should have all the prototypes', function () {
        expect(ValidationTranslator.trans).toBeDefined();
        expect(ValidationTranslator.get).toBeDefined();
        expect(ValidationTranslator.getMessage).toBeDefined();
        expect(ValidationTranslator.parseLocale).toBeDefined();
    });

    it('should find translation', function () {
        var simpleTrans = ValidationTranslator.trans('accepted');
        expect(simpleTrans).toEqual('The :attribute must be accepted.');

        var nestedTrans = ValidationTranslator.trans('between.numeric');
        expect(nestedTrans).toEqual("The :attribute must be between :min and :max.");
    });
});