Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    scopeType: 'release',

    onScopeChange: function(scope) {
        var me = this;

        me._calcBaselines(me).then(
                function(baselines){
                    return me._runMetrics(me, me._defineMetrics(me, baselines));
            }
        );
    },
    
    _defineMetrics: function(me, baselines){
        var metrics = [];

        metrics.push(me._calcMetric('PortfolioItem/Feature', 40, 'Defined Business Features', Filters.filterByAttribute('State.Name','Defined', me.getContext().getTimeboxScope()), Radian.PROJECT_BUSINESS));
        metrics.push(me._calcMetric('TestCase', baselines.testFolderCases, 'TF196 Failed Test Cases',Filters.filterVerdictByTestFolder('Fail','TF196'),Radian.PROJECT_RADIAN));
        metrics.push(me._calcMetric('TestCase', baselines.testFolderCases, 'TF196 Passing Test Cases',Filters.filterVerdictByTestFolder('Pass','TF196'),Radian.PROJECT_RADIAN));
        metrics.push(me._calcMetric('TestCase', baselines.testFolderCases, 'TF196 Other Test Cases',Filters.filterNoVerdictByTestFolder('TF196'),Radian.PROJECT_RADIAN));
        
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
                    return {testFolderCases: result};
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