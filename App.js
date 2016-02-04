Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    scopeType: 'release',

    onScopeChange: function(scope) {
        //this._addLine(this,"scope changed " + scope.getQueryFilter());
        this._summarizeMetrics();
    },
    
    _addLine: function(container, value) {
        container.add({
            xtype: 'component',
            html: value
        });
    },
    _summarizeMetrics: function() {
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

        promises.push(me._getCount('PortfolioItem/Feature', 'Defined Features, Business', me._filterByAttribute('State.Name','Defined'), PROJECT_BUSINESS));

        Deft.Promise.all(promises).then({
            success: function(results) {
                Ext.Array.each(results, function(result) {
                    resultArray.push(result);
                    console.log(result);
                });
                // Create grid from summarized results
                me._makeGrid(resultArray);
            }
        });

    },

    _getCount: function(modelType, caption, filter, project) {
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
                        "ModelType": modelType,
                        "Caption": caption,
                        "Count": manualCount
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

            columnCfgs: [
                {
                    text: 'Artifact', dataIndex: 'ModelType'
                },
                {
                    text: 'Metric', dataIndex: 'Caption'
                },
                {
                    text: 'Count', dataIndex: 'Count'
                }
            ]
        });

        me.add(me._summaryGrid);
        me._summaryGrid.reconfigure(gridStore);
    }

});