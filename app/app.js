"use strict";
var app = angular.module('ToDo',['ngSanitize','angular-clipboard','mm.foundation']);

app.controller('mainView',function($scope,$sce){

	var vm = this;

	function saveToDo(){
		localStorage.toDo = angular.toJson(vm.todo);
	}
	function loadToDo(){
		return angular.fromJson(localStorage.toDo);
	}

	$scope.init = function(){
		vm.Title = "To Do";
		vm.description = $sce.trustAsHtml("<p>Here's my to do list. It only exists on this computer in this browser.</p><p>If you want, you can have different To Do lists in different browsers. But, I mean, who even does that?</p>");
		vm.todo = [];
		if (localStorage.toDo) {
			vm.todo = loadToDo();
		}
	};

	$scope.$on('keydown:27',function(key,evt){
		vm.json = '';
		vm.help = false;
		vm.import = false;
		vm.help = false;
		$scope.$apply();
	});

	$scope.$on('keydown:69',function(key,evt){
		if (evt.srcElement.tagName !== 'INPUT' && !vm.modalOpen) {
			vm.spitOutJson();
		}
	});

	$scope.$on('keydown:73',function(key,evt){
		if (evt.srcElement.tagName !== 'INPUT' && !vm.modalOpen) {
			vm.import = true;
			$scope.$apply();
		}
	});

	$scope.$on('keydown:191',function(key,evt){
		if (evt.srcElement.tagName !== 'INPUT' && !vm.modalOpen) {
			vm.help = true;
			$scope.$apply();
			gtag('event','Help');
		}
	});

	$scope.$watchGroup(['vm.import','vm.help','vm.json'],function(v,i){
		var result = !vm.import && !vm.help && !vm.json;
		console.log(!result);
		vm.modalOpen = !result;
	});

	vm.spitOutJson = function(){
		vm.json = angular.toJson(vm.todo);
		$scope.$apply();
		gtag('event','Exported Tasks', {
			'event_label': vm.json,
		});
	};

	vm.toggle = function(item){
		item.done = !item.done;
		gtag('event', (item.done ? 'Completed' : 'Un-completed') + ' a task',{
			'event_label':item.task
		});
		saveToDo();
	};

	vm.performImport = function(text){
		try {
			var obj = angular.fromJson(text);
			localStorage.todo = text;
			vm.todo = obj;
			vm.import = false;
			vm.importText = '';
			gtag('event','Imported Tasks', {
				'event_label': text,
			});
		} catch(e){
			gtag('event','exception',{
				'description':e,
				'fatal':false
			});
			alert("Invalid JSON");
			return;
		}

	};
	vm.jsonCopied = function(){
		alert("JSON successfully copied. This is such a jinkley way to handle export/import.");
	};

	vm.delete = function(item){
		var idx = vm.todo.indexOf(item);
		vm.todo.splice(idx,1);
		saveToDo();
	};

	vm.clearCompleted = function(){
		vm.todo = vm.todo.filter( function( item ){
			return !item.done;
		} );
		saveToDo();
		gtag('event','Cleared Completed Tasks');
	};

	vm.addNewTask = function($event){
		if ($scope.task == '') {
			gtag('event','exception',{
				'description':'Attempted to add blank task',
				'fatal':false
			});
			return;
		}
		vm.todo.push({
			done:false,
			task:$scope.task,
			added:new Date
		});
		gtag('event','Add Task', {
			'event_label': $scope.task,
		});
		localStorage.toDo = angular.toJson(vm.todo);
		$scope.task = '';
	};
})
.directive('keypressEvents', [
  '$document',
  '$rootScope',
  function($document, $rootScope) {
    return {
      restrict: 'A',
      link: function() {
        $document.bind('keydown', function(e) {
          // console.log('Got keydown:', e.which);
          $rootScope.$broadcast('keydown', e);
          $rootScope.$broadcast('keydown:' + e.which, e);
        });
      }
    };
  }
]);