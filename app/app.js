"use strict";
var app = angular.module('ToDo',['ngSanitize','ui']);



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
		vm.description = $sce.trustAsHtml("<p>Quick To Do List.</p>");
		vm.todo = [];
		if (localStorage.toDo) {
			vm.todo = loadToDo();
		}
	};

	vm.toggle = function(item){
		item.done = !item.done;
		saveToDo()
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
	};

	vm.addNewTask = function($event){
		vm.todo.push({
			done:false,
			task:$scope.task,
			added:new Date
		});
		localStorage.toDo = angular.toJson(vm.todo);
		$scope.task = '';
	};
});