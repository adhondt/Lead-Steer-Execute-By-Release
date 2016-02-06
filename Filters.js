Ext.define('Filters', {
    statics: {
        addLine: function(container, value) {
            container.add({
                xtype: 'component',
                html: value
            });
    }
    }
});

