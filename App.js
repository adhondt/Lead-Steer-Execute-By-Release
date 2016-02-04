Ext.define('Rally.guide.ReleaseFilteredBoard', {
    extend: 'Rally.app.TimeboxScopedApp',
    scopeType: 'release',

    onScopeChange: function(scope) {
        if(!this.board) {
             this.board = this.add({
                xtype: 'rallycardboard',
                storeConfig: {
                    filters: [scope.getQueryFilter()]
                }
            });
        } else {
            this.board.refresh({
                storeConfig: {
                    filters: [scope.getQueryFilter()]
                }
            });
        }
    }
});