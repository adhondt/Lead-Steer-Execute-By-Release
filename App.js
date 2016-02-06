Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    scopeType: 'release',

    onScopeChange: function(scope) {
        var me = this;

        me._calcBaselines(me).then(
                function(testFolderCases){
                    return me._runMetrics(me, me._defineMetrics(me, {testFolderCases: testFolderCases}));
            }
        );
    },
    
    _defineMetrics: function(me, baselines){
        var metrics = [];

        metrics.push(me._calcMetric('PortfolioItem/Feature', 40, 'Defined Business Features', me._filterByAttribute('State.Name','Defined'), Radian.PROJECT_BUSINESS));
        metrics.push(me._calcMetric('TestCase', baselines.testFolderCases, 'TF196 Failed Test Cases',me._filterVerdictByTestFolder('Fail','TF196'),Radian.PROJECT_RADIAN));
        metrics.push(me._calcMetric('TestCase', baselines.testFolderCases, 'TF196 Passing Test Cases',me._filterVerdictByTestFolder('Pass','TF196'),Radian.PROJECT_RADIAN));
        metrics.push(me._calcMetric('TestCase', baselines.testFolderCases, 'TF196 Other Test Cases',me._filterNoVerdictByTestFolder('TF196'),Radian.PROJECT_RADIAN));
        
        return metrics;        
    },
    
    _runMetrics: function(me, metrics){
        var resultArray = [];

        Deft.Promise.all(metrics).then({
            success: function(results) {
                Ext.Array.each(results, function(result) {
                    resultArray.push(result);
                });
                me._makeGrid(me, resultArray);
            }
        });
    },

    _calcBaselines: function(me) {

        return me._getBaseline('TestCase', 'TestFolder.FormattedID', 'TF196', Radian.PROJECT_RADIAN).then({
            success: function(result) {
                    return result;
                }
            }
        );
    },
    
    _getBaseline: function(modelType, attribute, attrValue, project) {
        var deferred = Ext.create('Deft.Deferred');

        var artifactStore = Ext.create('Rally.data.wsapi.Store', {
            model: modelType,
            pagesize: 1,
            autoLoad: true,
            filters: [
                {
                    property: attribute,
                    operator: '=',
                    value: attrValue
                }
            ],
            context: {project: '/project/' + project},
            sorters: [
                {
                    property: 'FormattedID',
                    direction: 'ASC'
                }
            ],
            listeners: {
                load: function(store, records) {
                    deferred.resolve(store.getTotalCount());
                }
            }
        });

        return deferred;
    },
    _calcMetric: function(modelType, baseline, caption, filter, project) {
        var deferred = Ext.create('Deft.Deferred');

        var artifactStore = Ext.create('Rally.data.wsapi.Store', {
            model: modelType,
            pagesize: 1,
            autoLoad: true,
            filters: filter,
            context: {project: '/project/' + project},
            sorters: [
                {
                    property: 'FormattedID',
                    direction: 'ASC'
                }
            ],
            listeners: {
                load: function(store, records) {
                    var manualCount = store.getTotalCount();
                    result = {
                        "Caption": caption,
                        "Count": manualCount,
                        "Metric": ((manualCount / baseline) * 100).toFixed(1) + "%"
                    };
                    deferred.resolve(result);
                }
            }
        });

        return deferred;
    },

	_filterByAttribute: function(attribute, attrValue) {
        var filters = Ext.create('Rally.data.QueryFilter', {
            property: attribute,
            operator: '=',
            value: attrValue
            });
		var timeboxScope = this.getContext().getTimeboxScope();
		if(timeboxScope) {            
			filters = filters.and(timeboxScope.getQueryFilter());
		}
		return filters;		
	},
	
	_filterVerdictByTestFolder: function(attrValue, folder) {
        var filters = Ext.create('Rally.data.QueryFilter', {
            property: 'LastVerdict',
            operator: '=',
            value: attrValue
            });
		filters = filters.and(Ext.create('Rally.data.QueryFilter', {
            property: 'TestFolder.FormattedID',
            operator: '=',
            value: folder
            }));
		return filters;		
	},
	
	_filterNoVerdictByTestFolder: function(folder) {
        var filters = Ext.create('Rally.data.QueryFilter', {
            property: 'LastVerdict',
            operator: '!=',
            value: 'Pass'
            });
		filters = filters.and(Ext.create('Rally.data.QueryFilter', {
            property: 'LastVerdict',
            operator: '!=',
            value: 'Fail'
            }));
		filters = filters.and(Ext.create('Rally.data.QueryFilter', {
            property: 'TestFolder.FormattedID',
            operator: '=',
            value: folder
            }));
		return filters;		
	},
	
    _filterEstimatedStoriesByRelease: function(value) {
        var filters = Ext.create('Rally.data.QueryFilter', {
            property: 'Release.Name',
            operator: '=',
            value: value
            });
        filters = filters.and(Ext.create('Rally.data.QueryFilter', {
            property: 'PlanEstimate',
            operator: '>',
            value: '0'
            }));
        return filters;
    },

    _makeGrid: function(me, results) {

        if (me._summaryGrid) {
            me._summaryGrid.destroy();
        }

        var gridStore = Ext.create('Rally.data.custom.Store', {
            data: results,
            pageSize: 25,
            remoteSort: false
        });

        me._summaryGrid = Ext.create('Rally.ui.grid.Grid', {
            itemId: 'artifactGrid',
            store: gridStore,
            columnWidth: 0.3,

            columnCfgs: [
                {text: 'Metric', dataIndex: 'Metric'},
                {text: 'Count', dataIndex: 'Count'},
                {text: 'Caption', dataIndex: 'Caption', flex: 1}
            ]
        });

        me.add(me._summaryGrid);
        me._summaryGrid.reconfigure(gridStore);
    }

});