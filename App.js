Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    scopeType: 'release',

    onScopeChange: function(scope) {
        var me = this;
        me._calcBaselines().then(
                function(testFolderCases){
                    return me._runMetrics(testFolderCases);
            }
        );
    },
    
    _runMetrics: function(testFolderCases){
        var PROJECT_RADIAN = '37192747640';
        var PROJECT_BUSINESS = '37637012809';
        var PROJECT_SPRINT_TEAMS = '37213611687';
        var PROJECT_SUPPORTING_TEAMS = '37192947515';
        var PROJECT_EXECUTION = '37192748545';
        var PROJECT_AWS_TEAMS = '35625370074';
        var PROJECT_ECMLDR_TEAMS = '35625373948';
        var PROJECT_PAS_TEAMS = '34799452294';
        var PROJECT_SFDC_TEAMS = '35625125755';

        var me = this;
        var promises = [];
        var resultArray = [];

        promises.push(me._getCount('PortfolioItem/Feature', 'Defined Business Features', me._filterByAttribute('State.Name','Defined'), PROJECT_BUSINESS, 40));
        promises.push(me._getCount('TestCase', 'TF196 Failed Test Cases',me._filterVerdictByTestFolder('Fail','TF196'),PROJECT_RADIAN,testFolderCases));
        promises.push(me._getCount('TestCase', 'TF196 Passing Test Cases',me._filterVerdictByTestFolder('Pass','TF196'),PROJECT_RADIAN,testFolderCases));
        promises.push(me._getCount('TestCase', 'TF196 Other Test Cases',me._filterNoVerdictByTestFolder('TF196'),PROJECT_RADIAN,testFolderCases));

        Deft.Promise.all(promises).then({
            success: function(results) {
                Ext.Array.each(results, function(result) {
                    resultArray.push(result);
                });
                me._makeGrid(resultArray);
            }
        });
    },

    _addLine: function(container, value) {
        container.add({
            xtype: 'component',
            html: value
        });
    },
    _calcBaselines: function() {
        var PROJECT_RADIAN = '37192747640';

        var me = this;

        return me._count('TestCase', 'TestFolder.FormattedID','TF196',PROJECT_RADIAN).then({
            success: function(results) {
                    return me._pullCount(results);
                }
            }
        );
    },
    
    _pullCount: function(results){
        var deferred = Ext.create('Deft.Deferred');
        Ext.Array.each(results, function(result) {
            deferred.resolve(result.Count);
        });
        return deferred;
    },

    _count: function(modelType, attribute, attrValue) {
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
                        "Caption": modelType,
                        "Count": manualCount
                    };
                    deferred.resolve(result);                }
            }
        });

        return deferred;
    },
    _getCount: function(modelType, caption, filter, project, baseline) {
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

    _makeGrid: function(results) {

        var me = this;

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
                {text: 'Caption', dataIndex: 'Caption', flex: 1},
                {text: 'Count', dataIndex: 'Count'}
            ]
        });

        me.add(me._summaryGrid);
        me._summaryGrid.reconfigure(gridStore);
    }

});