'use strict';
angular.module('nWorkSheet', ['ngTable'])

	.controller('nworksheetCtrl', function($scope, ngTableParams, $filter)
	{ })
	.directive('nws', function($http, ngTableParams){
		return{
			replace : false,
			templateUrl : 'views/nws.html',
			scope : {
				worksheetParams : '=',
				nwsDataUrl : '='
			},
			link : function(scope)
			{


				scope.selectedCategory = '';
				scope.groupBy = 'category';
				scope.categoryName = '전체';

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

						var concatedData = [];
						for(var i = 0 ; i < scope.worksheetParams.category.length ; i ++)
						{
							for(var j = 0 ; j < scope.worksheetParams.category[i].data.length ; j++)
							{
								concatedData.push(scope.worksheetParams.category[i].data[j]);
							}
						}
						scope.tableData = concatedData;

						scope.$broadcast('dataLoaded', {type : 'all'});
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
							'<ul >' +
								'<li ng-click="changeCategory()"> <a>전체</a></li>' +
								'<li ng-click="changeCategory(item.name)" ng-repeat="item in worksheetParams.category"><a style="cursor:pointer;">{{ item.name }}</a></li>' +
							'</ul>' +
						'</div>',
			require : '^nws',
			link : function(scope){
				scope.changeCategory = function(name)
				{

					if(name !== undefined)
					{
						console.log(name);
						var filter = $filter('filter')(scope.worksheetParams.category, {'name' : name})[0].data;
						scope.tableData = filter;
						console.log(name + ', ' + scope.tableData);
						scope.$broadcast('changed', {type : 'one'});
					}else{
						var concatedData = [];
						for(var i = 0 ; i < scope.worksheetParams.category.length ; i ++)
						{
							for(var j = 0 ; j < scope.worksheetParams.category[i].data.length ; j++)
							{
								concatedData.push(scope.worksheetParams.category[i].data[j]);
							}
							console.log(scope.tableData);
						}
						scope.tableData = concatedData;

						scope.$broadcast('changed', {type : 'all'});
					}
					scope.categoryName = name === undefined ? '전체' : name;

				};
			}
		};
	})
	.directive('nwsTable', function(ngTableParams, $filter)
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

				scope.getData = function(option)
				{
					if(option.type === 'one')
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
					}else{

						scope.tableParams = new ngTableParams({
							page: 1,            // show first page
							count: 50,          // count per pagefilter: {
							name: 'M'       // initial filter
						}, {
							groupBy: scope.groupBy,
							total: scope.tableData.length,
							getData: function($defer, params) {
								var orderedData = params.sorting() ?
									$filter('orderBy')(scope.tableData, scope.tableParams.orderBy()) :
									scope.tableData;

								$defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
							}
						});
					}
				};

				triggerRelink();

				scope.$on('dataLoaded', function(event, option){
					scope.getData(option);
					triggerRelink();
					scope.option = option;
				});
				scope.$on('changed', function(event, option){
					scope.getData(option);
					triggerRelink();
					scope.option = option;
				});
			}
		};
	});
