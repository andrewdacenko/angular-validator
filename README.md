# ng-validator
Angular validation helper class

# How to install
```sh 
bower install ng-validator --save
```

# How to use

Include it as dependency 
```javascript
angular.module('myApp', ['ngValidator']);
```

Inject in Controller / Service / Whatever 
```javascript
AppController.$inject = ['Validator'];

function AppController (Validator) {
  var self = this;
  
  self.input = {
    title: '',
    description: '',
    agree: null,
    reason: ''
  };
  
  self.errors = {};
  
  self.submit = submit;
  
  var rules = {
    title: 'required',
    description: 'required_with:title',
    agree: 'required',
    reason: 'required_with:title|required_if:agree,0'
  }
  
  var customMessages = {
    'description.required_with': 'Field needs to be filled if title present',
    'reason.required_with': 'Please provide reason',
    'reason.required_if': 'Please provide reason',
  }

  function submit() {
    self.errors = {};
    
    var validator = new Validator(self.input, rules, customMessages);
    
    if (validator.fails()) {
      for (var field in validator.errors.all()) {
          self.errors[field] = validator.errors.first(field);
      };  
    }
  }
}
``` 

Show errors in template
```html
<div ng-controller="AppController as app">
  <form ng-submit="app.submit()">
    <div class="form-group" ng-class="{'has-error': app.errors.title}">
      <label class="form-label">Title</label>
      <input class="form-control" ng-model="app.input.title" />
      <span class="help-block" ng-if="app.errors.title" ng-bind="app.errors.title">
    </div>
    <button class="btn btn-primary">Submit</button>
  </form>
</div>
```

Or wrap it in simple directive
```javascript
angular
  .module('myApp')
  .directive('inputValidation', inputValidation);
  
function inputValidation() {
  return {
    restrict: 'E',
    scope: {
      field: '@',
      parent: '='
    },
    templateUrl: 'templates/inputValidation.html',
    link: function (scope, elem, attr) {}
  }
};
```

Create template
```html
<div class="form-group" ng-class="{'has-error': parent.errors[field]}">
  <label class="form-label">{{ field }}</label>
  <input class="form-control" ng-model="parent.input[field]" ng-change="parent.errors[field] = null" />
  <span class="help-block" ng-if="parent.errors[field]" ng-bind="parent.errors[field]">
</div>
```

And use as
```html
<input-validation parent="app" field="title"></input-validation>
```
