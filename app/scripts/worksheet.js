'use strict';
angular.module('nWorkSheet', ['ngTable'])

	.controller('nworksheetCtrl', function($scope, ngTableParams)
	{

		$scope.data = [
			{name: 'Moroni', age: 50},
			{name: 'Tiancum', age: 43},
			{name: 'Jacob', age: 27},
			{name: 'Nephi', age: 29},
			{name: 'Enos', age: 34},
			{name: 'Tiancum', age: 43},
			{name: 'Jacob', age: 27},
			{name: 'Nephi', age: 29},
			{name: 'Enos', age: 34},
			{name: 'Tiancum', age: 43},
			{name: 'Jacob', age: 27},
			{name: 'Nephi', age: 29},
			{name: 'Enos', age: 34},
			{name: 'Tiancum', age: 43},
			{name: 'Jacob', age: 27},
			{name: 'Nephi', age: 29},
			{name: 'Enos', age: 34}
		];

		$scope.tableParams = new ngTableParams({
			page: 1,            // show first page
			count: 10           // count per page
		}, {
			total: $scope.data.length, // length of data
			getData: function ($defer, params) {
				$defer.resolve($scope.data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
			}
		});
	})
	.directive('nws', function($http, ngTableParams){
		return{
			replace : false,
			templateUrl : '/views/nws.html',
			scope : {
				worksheetParams : '=',
				nwsDataUrl : '='
			},
			link : function(scope)
			{

				scope.selectedCategory = '';

				scope.tableParams = new ngTableParams({
					page: 1,            // show first page
					count: 10           // count per page
				});
				scope.httpreg = function(text){
					var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])/;
					return re.test(text);
				};

				if(scope.nwsDataUrl !== undefined)
				{
					$http.get(scope.nwsDataUrl).success(function(data)
					{
						scope.worksheetParams = data;
						scope.tableData = scope.worksheetParams.category[0].data;
						scope.$broadcast('dataLoaded');
					});
				}
			},
			controller : function()
			{
			}
		};
	})
	.directive('nwsMenu', function($filter)
	{
		return{
			template : '<div>' +
							'<ul ng-click="changeCategory(item.name)" ng-repeat="item in worksheetParams.category">' +
								'<li><a style="cursor:pointer;">{{ item.name }}</a></li>' +
							'</ul>' +
						'</div>',
			require : '^nws',
			link : function(scope){
				scope.changeCategory = function(name)
				{
					console.log(name);
					var filter = $filter('filter')(scope.worksheetParams.category, {'name' : name})[0].data;
					scope.tableData = filter;
					console.log(name + ', ' + scope.tableData);
					scope.$broadcast('changed');
				};
			}
		};
	})
	.directive('nwsTable', function(ngTableParams)
	{
		return{
			require : '^nws',
			transclude: 'element',
			link : function(scope, element, attr, ctrl, transclude)
			{
				var previousContent = null;

				var triggerRelink = function() {
					if (previousContent) {
						previousContent.remove();
						previousContent = null;
					}

					transclude(function (clone) {
						element.parent().append(clone);
						previousContent = clone;
					});
				};

				scope.getData = function()
				{
					scope.tableParams = new ngTableParams({
						page: 1,            // show first page
						count: 10           // count per page
					}, {
						total: scope.tableData.length, // length of data
						getData: function ($defer, params) {
							//console.log(scope.tableData);
							$defer.resolve(scope.tableData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
						}
					});
				};

				triggerRelink();

				scope.$on('dataLoaded', function(){
					scope.getData();
					triggerRelink();
				});
				scope.$on('changed', function(){
					scope.getData();
					triggerRelink();
				});
			}
		};
	});
