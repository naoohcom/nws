'use strict';
angular.module('nWorkSheet', ['ngTable'])

	.controller('nworksheetCtrl', function()
	{ })
	.directive('nws', function($http){
		return{
			replace : false,
			templateUrl : 'views/nws.html',
			scope : {
				worksheetParams : '=',
				nwsDataUrl : '='
			},
			link : function(scope, element)
			{
				scope.nwsElement =element;

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

				/**
				 * 링크 텍스트들이 여러개 일 경우를 대비하여 링크를 만든다.
				 * @param {String} text
				 * @returns {Array} 결과값
				 */
				scope.makeLinkText = function ( text )
				{
					if(typeof text === 'string'){
						var result = []; // 마지막에 리턴할 어레이

						var array = text.split(','); // 파라미터로 넘어온 텍스트를 ,으로 나눈다.

						$.each(array, function(index, value){ // 각 어레이 값들을 result 안에 넣어준다.
							result.push({
								isHref : scope.httpreg(value),
								text : value
							});
						});

						return result; // 결과값 리턴
					}else{
						return [{
							isHref : false,
							text : text
						}];
					}

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
					scope.dashboardData = getDashboardData(scope.worksheetParams);
				});
				function getDashboardData(rawData)
				{
					var catInfo = {},
						totalInfo = {
							count : 0,
							percent : 0,
							average : 0,
							//state : {}
						};

					// count meta category and put data
					for(var i = 0 ; i < rawData.meta.category.length ; i ++)
					{

						var itemToPut = {
							name : rawData.meta.category[i]
						};

						var count = 0,
							percent = 0,
							average = 0,
							undone = [],
							modifying = [],
							complete = [],
							del = [];
						for(var j = 0 ; j < rawData.category.length; j ++)
						{
							for(var k = 0 ; k < rawData.category[j].data.length ; k++)
							{
								var item = rawData.category[j].data[k];
								if(item.category === itemToPut.name)
								{
									count ++;
									percent += item.percent;

									if(item.state === '진행중')
									{undone.push(item.name);}
									else if(item.state === '수정중')
									{modifying.push(item.name);}
									else if(item.state === '완료')
									{complete.push(item.name);}
									else if(item.state === '삭제')
									{del.push(item.name);}
								}

							}
						}
						average = (percent / (count));

						$.extend(itemToPut, {
							count : count,
							percent :percent,
							average : Math.floor(average),
							state : {
								undone : undone,
								modifying : modifying,
								complete : complete,
								delete : del
							}

						});

						catInfo[itemToPut.name] = itemToPut;

					}
					for(var cati in catInfo)
					{
						totalInfo.count += catInfo[cati].count;
						totalInfo.percent += catInfo[cati].percent;
						//$.extend(totalInfo.state, catInfo[cati].state) ;
					}
					//for(var c = 0; c < catInfo.length ; c ++ )
					//{
					//	totalInfo.count += catInfo[c].count;
					//	totalInfo.done += catInfo[c].done;
					//	$.extend(totalInfo.n, catInfo[c].n) ;
					//}
					totalInfo.average =  totalInfo.percent/ totalInfo.count;
					totalInfo.average.toFixed(3);
					console.log(totalInfo.average);

					return{
						totalInfo : totalInfo,
						categoryInfo : catInfo
					};
				}

				scope.objectSize = function(obj) {
					var size = 0, key;
					for (key in obj) {
						if (obj.hasOwnProperty(key))
						{
							size++;
						}
					}
					return size;
				};


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
					if(position <= 0 )
					{
						target.find('ul').css({
							position : 'absolute',
							top : -position + margin,
							transition : '.5s top'
						});

					}else
					{

						target.find('ul').css({
							position : 'inherit',
							top : 'inherit',
							transition : '.5s top'
						});
					}
				});

				scope.changeCategory = function(name)
				{

					if(name !== undefined)
					{
						var filter = $filter('filter')(scope.worksheetParams.category, {'name' : name})[0].data;

						scope.tableData = filter;
						scope.$broadcast('changed', {type : 'one'});

					}else{

						var concatedData = [];
						for(var i = 0 ; i < scope.worksheetParams.category.length ; i ++)
						{
							for(var j = 0 ; j < scope.worksheetParams.category[i].data.length ; j++)
							{
								concatedData.push(scope.worksheetParams.category[i].data[j]);
							}
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
							count: 200,           // count per page
							//name: 'M'       // initial filter
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
							count: 200,          // count per pagefilter: {
							//name: 'M',      // initial filter
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

					scope.tableParams.reload();
				});
				scope.$on('changed', function(event, option){
					scope.getData(option);
					triggerRelink();
					scope.option = option;

					scope.tableParams.reload();

					$(window).scrollTop($(scope.nwsElement).offset().top);
				});
			}
		};
	});
