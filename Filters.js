Ext.define('Filters', {
    statics: {
        addLine: function(container, value) {
            container.add({
                xtype: 'component',
                html: value
            });
    },
    
	filterByAttribute: function(attribute, attrValue, timeboxScope) {
        var filters = Ext.create('Rally.data.QueryFilter', {
            property: attribute,
            operator: '=',
            value: attrValue
            });
		if(timeboxScope) {            
			filters = filters.and(timeboxScope.getQueryFilter());
		}
		return filters;		
	},
	
	filterVerdictByTestFolder: function(attrValue, folder) {
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
	
	filterNoVerdictByTestFolder: function(folder) {
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
	
    filterEstimatedStoriesByRelease: function(value) {
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
    }

    }
});

