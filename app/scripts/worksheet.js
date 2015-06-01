'use strict';
angular.module('nWorkSheet', ['ngTable'])

	.controller('nworksheetCtrl', function()
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

				scope.dashboardData = {}; // 대시보드용 데이터
				scope.groupBy = 'category'; // 그룹화 시킬 필터 데이터
				scope.categoryName = '전체'; // 기본 카테고리

				/**
				 * http 웹 주소 규칙에 맞는지 테스트 한다.
				 * @param text {string}
				 * @returns http 양식 정규식에 맞는지 테스트 후 반환되는 값 {boolean}
				 */
				scope.httpreg = function(text){
					var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])/;
					return re.test(text);
				};

				// nwsDataUrl 가 undefined 이거나, worksheetParams 가 undefined 면 다음을 실행한다.
				if(scope.nwsDataUrl !== undefined && scope.worksheetParams === undefined)
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
				scope.$on('dataLoaded', function()
				{
					(scope.dashboardData = function(rawData)
					{
						var catInfo = [],
							totalInfo = {
								count : 0,
								done : 0,
								average : 0,
								undone : []
							};

						// count meta category and put data
						for(var i = 0 ; i < rawData.meta.category.length ; i ++)
						{

							var itemToPut = {
								name : rawData.meta.category[i]
							};

							var count = 0,
								done = 0,
								average = 0,
								undone = [];
							for(var j = 0 ; j < rawData.category.length; j ++)
							{
								for(var k = 0 ; k < rawData.category[j].data.length ; k++)
								{
									var item = rawData.category[j].data[k];
									if(item.category === itemToPut.name)
									{
										count ++;
										done += item.done;
										//for(var undones = 0 ; unodnes < item.data.length)
										if(item.state == '진행중')
											undone.push(item.name);
									}

									//if(item === )
								}
							}
							average = (done / (count));


							$.extend(itemToPut, {
								count : count,
								done :done,
								average : average,
								undone : undone
							});

							catInfo.push(itemToPut);

						}

						for(var c = 0; c < catInfo.length ; c ++ )
						{
							totalInfo.count += catInfo[c].count;
							totalInfo.done += catInfo[c].done;
							$.extend(totalInfo.undone, catInfo[c].undone) ;
						}
						console.log(catInfo.length);
						totalInfo.average = totalInfo.done/ totalInfo.count;

						return{
							totalInfo : totalInfo,
							categoryInfo : catInfo
						}
					}(scope.worksheetParams));
				});

			},
			controller : function()
			{
			}
		};
	})
	.directive('nwsMenu', function($filter)
	{
		return{
			template : '<div style="position:relative;">' +
							'<ul >' +
								'<li ng-click="changeCategory()"> <a>전체</a></li>' +
								'<li ng-click="changeCategory(item.name)" ng-repeat="item in worksheetParams.category"><a style="cursor:pointer;">{{ item.name }}</a></li>' +
							'</ul>' +
						'</div>',
			require : '^nws',
			link : function(scope, element){

				$(window).on('scroll', function(){
					var margin = 20;
					var target = $(element);
					var position = target.offset().top - $(window).scrollTop()  - margin;
					console.log(position);
					if(position <= 0 )
					{
						target.find('ul').css({
							position : 'fixed',
							top : margin
						});

					}else
					{

						target.find('ul').css({
							position : 'inherit',
							top : 'inherit'
						});
					}
				});

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
