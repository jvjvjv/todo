"use strict";
var app = angular.module('ToDo',['ngSanitize','angular-clipboard','mm.foundation']);

angular.element(document).ready(function(){

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(){
		if (this.readyState == 4 && this.status == 200) {
			var config = JSON.parse(this.response);

			window.dataLayer = window.dataLayer || [];
			window.gtag = function(){
				dataLayer.push(arguments);
			};
			gtag('js', new Date());
			gtag('config', config.ua);

			var script = document.createElement('script');
			script.setAttribute('async','');
			script.setAttribute('src','https://www.googletagmanager.com/gtag/js?id=' + config.ua);
			document.body.appendChild(script);
		}
		
		if (this.readyState == 4) {
			angular.bootstrap(document.body,["ToDo"]);
		}
	};

	xhr.open("GET","config.json", true);
	xhr.send();


});

app.controller('mainView',function($scope,$http,$sce){

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

		$http.get('versions.json')
		.then(function(response){
			vm.versions = response.data;
		});
	};

	$scope.close = function() {
		vm.json = '';
		vm.help = false;
		vm.import = false;
		vm.whatsNew = false;
	}
	$scope.open = function(modal) {
		$scope.close();
		switch (modal) {
			case 'import':
			case 'help':
			case 'whatsNew':
				vm[modal] = true;
				break;
		}
	}

	$scope.$on('keydown:27',function(key,evt){ // ESC
		if (evt.srcElement.tagName !== 'INPUT' && !vm.modalOpen) {
			$scope.close();
			$scope.$apply();
		}
	});

	$scope.$on('keydown:69',function(key,evt){ // E
		if (evt.srcElement.tagName !== 'INPUT' && !vm.modalOpen) {
			vm.spitOutJson();
			$scope.$apply();
			gtag('event','Export');
		}
	});

	$scope.$on('keydown:73',function(key,evt){ // I
		if (evt.srcElement.tagName !== 'INPUT' && !vm.modalOpen) {
			$scope.open('import');
			$scope.$apply();
			gtag('event','Import');
		}
	});

	$scope.$on('keydown:191',function(key,evt){ // ?
		if (evt.srcElement.tagName !== 'INPUT' && !vm.modalOpen) {
			$scope.open('help');
			$scope.$apply();
			gtag('event','Help');
		}
	});

	$scope.$watchGroup(['vm.import','vm.help','vm.json','vm.whatsNew'],function(v,i){
		var result = !vm.import && !vm.help && !vm.json && !vm.whatsNew;
		vm.modalOpen = !result;
	});

	vm.spitOutJson = function(){
		vm.json = angular.toJson(vm.todo);
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
		// We good
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
          $rootScope.$broadcast('keydown', e);
          $rootScope.$broadcast('keydown:' + e.which, e);
        });
      }
    };
  }
])
.filter('undone', function(){
	return function(input) {
		var length = 0;
		angular.forEach(input,function(i){
			length += (i.done == false);
		});
		return length;
	}
});