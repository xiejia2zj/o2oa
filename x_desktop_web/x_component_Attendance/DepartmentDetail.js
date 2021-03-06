MWF.xDesktop.requireApp("Attendance", "Explorer", null, false);
MWF.xDesktop.requireApp("Organization", "Selector.package", null, false);

MWF.xApplication.Attendance.DepartmentDetail = new Class({
    Extends: MWF.widget.Common,
    Implements: [Options, Events],
    options: {
        "style": "default"
    },
    initialize: function(node, app, actions, options){
        this.setOptions(options);
        this.app = app;
        this.path = "/x_component_Attendance/$DepartmentDetail/";
        this.cssPath = "/x_component_Attendance/$DepartmentDetail/"+this.options.style+"/css.wcss";
        this._loadCss();

        this.actions = actions;
        this.node = $(node);
    },
    load: function(){
        this.loadTab();
    },
    loadTab : function(){

        this.tabNode = new Element("div",{"styles" : this.css.tabNode }).inject(this.node)
        this.detailArea = new Element("div",{"styles" : this.css.tabPageContainer }).inject(this.tabNode)
        //this.selfHolidayArea = new Element("div",{"styles" : this.css.tabPageContainer }).inject(this.tabNode)
        this.detailStaticArea = new Element("div",{"styles" : this.css.tabPageContainer }).inject(this.tabNode)
        //this.selfHolidayStaticArea = new Element("div",{"styles" : this.css.tabPageContainer }).inject(this.tabNode)

        MWF.require("MWF.widget.Tab", function(){

            this.tabs = new MWF.widget.Tab(this.tabNode, {"style": "attendance"});
            this.tabs.load();

            this.detailPage = this.tabs.addTab(this.detailArea, "部门出勤明细", false);
            this.detailPage.contentNodeArea.set("class","detailPage");
            this.detailPage.addEvent("show",function(){
                if( !this.detailExplorer ){
                    this.detailExplorer = new MWF.xApplication.Attendance.DepartmentDetail.Explorer( this.detailArea, this );
                    this.detailExplorer.load();
                }
            }.bind(this))


            this.detailStaticPage = this.tabs.addTab(this.detailStaticArea, "部门出勤率统计", false);
            this.detailStaticPage.contentNodeArea.set("class","detailStaticPage");
            this.detailStaticPage.addEvent("show",function(){
                if( !this.detailStaticExplorer ){
                    this.detailStaticExplorer = new MWF.xApplication.Attendance.DepartmentDetail.DetailStaticExplorer( this.detailStaticArea, this );
                    this.detailStaticExplorer.load();
                }
            }.bind(this))

            this.tabs.pages[0].showTab();
        }.bind(this));
    }
})

MWF.xApplication.Attendance.DepartmentDetail.Explorer = new Class({
    Extends: MWF.xApplication.Attendance.Explorer,
    Implements: [Options, Events],

    initialize: function(node, parent, options){
        this.setOptions(options);
        this.parent = parent;
        this.app = parent.app;
        this.lp = this.app.lp;
        this.css = parent.css;
        this.path = parent.path;

        this.actions = parent.actions;
        this.node = $(node);

        this.initData();
        if (!this.peopleActions) this.peopleActions = new MWF.xAction.org.express.RestActions();
    },
    initData: function(){
        this.toolItemNodes = [];
    },
    reload: function(){
        this.node.empty();
        this.load();
    },
    load: function(){
        this.loadFilter();
        this.loadContentNode();
        this.setNodeScroll();
    },
    loadFilter : function(){
         this.fileterNode = new Element("div.fileterNode", {
             "styles" : this.css.fileterNode
         }).inject(this.node)

        var table = new Element("table", {
            "width" : "100%", "border" : "0", "cellpadding" : "5", "cellspacing" : "0",  "styles" : this.css.filterTable, "class" : "filterTable"
        }).inject( this.fileterNode );
        var tr = new Element("tr").inject(table);

        this.createDepartmentTd( tr )
        this.createYearSelectTd( tr )
        this.createMonthSelectTd( tr )
        this.createDateSelectTd( tr )
        this.createIsAbsent(tr)
        this.createIsLate( tr )
        //this.createIsLeaveEarlier( tr )
        this.createLackOfTimeCount(tr)
        this.createActionTd( tr )
    },
    createTypeId : function(tr){
        var _self = this;
        var td = new Element("td", {  "styles" : this.css.filterTableTitle, "text" : this.lp.type  }).inject(tr);
        var td = new Element("td", {  "styles" : this.css.filterTableValue }).inject(tr);
        this.q_type = new MDomItem( td, {
            "name" : "q_type",
            "type" : "select",
            "selectValue": ["day","month"],
            "selectText": [this.lp.staticByDay,this.lp.staticByMonth],
        }, true, this.app );
        this.q_type.load();
    },
    createDepartmentTd : function(tr){
        var _self = this;
        var td = new Element("td", {  "styles" : this.css.filterTableTitle, "text" : "部门"  }).inject(tr);
        var td = new Element("td", {  "styles" : this.css.filterTableValue }).inject(tr);
        if( this.app.isAdmin() ){
            this.q_departmentName = new MDomItem( td, {
                "name" : "q_departmentName",
                "defaultValue" : this.app.manageDepartments.length > 0 ? this.app.manageDepartments[0] : "",
                "event" : {
                    "click" : function(el){ _self.selecePerson(); }
                }
            }, true, this.app );
            this.q_departmentName.load();
        }else{
            this.q_departmentName = new MDomItem( td, {
                "name" : "q_departmentName",
                "type" : "select",
                "selectValue": this.app.manageDepartments
            }, true, this.app );
            this.q_departmentName.load();
        }
    },
    createYearSelectTd : function( tr ){
        var _self = this;
        var td = new Element("td", {  "styles" : this.css.filterTableTitle, "text" : "年度"  }).inject(tr);
        var td = new Element("td", {  "styles" : this.css.filterTableValue }).inject(tr);
        this.cycleYear = new MDomItem( td, {
            "name" : "cycleYear",
            "type" : "select",
            "selectValue" : function(){
                var years = [];
                var year = new Date().getFullYear();
                for(var i=0; i<6; i++ ){
                    years.push( year-- );
                }
                return years;
            },
            "event" : {
                "change" : function(){ if(_self.dateSelecterTd)_self.createDateSelectTd() }
            }
        }, true, this.app );
        this.cycleYear.load();
    },
    createMonthSelectTd : function( tr ){
        var _self = this;
        var td = new Element("td", {  "styles" : this.css.filterTableTitle, "text" : "月份"  }).inject(tr);
        var td = new Element("td", {  "styles" : this.css.filterTableValue }).inject(tr);
        this.cycleMonth = new MDomItem( td, {
            "name" : "cycleMonth",
            "type" : "select",
            "defaultValue" : function(){
                var month = (new Date().getMonth() + 1 ).toString();
                return  month.length == 1 ? "0"+month : month;
            },
            "selectValue" :["","01","02","03","04","05","06","07","08","09","10","11","12"],
            "event" : {
                "change" : function(){ if(_self.dateSelecterTd)_self.createDateSelectTd() }
            }
        }, true, this.app );
        this.cycleMonth.load();
    },
    createDateSelectTd : function( tr ){
        var _self = this;
        if( tr ){
            var td = new Element("td", {  "styles" : this.css.filterTableTitle, "text" : "日期"  }).inject(tr);
            this.dateSelecterTd = new Element("td", {  "styles" : this.css.filterTableValue }).inject(tr);
        }
        if( this.q_date ){
            this.dateSelecterTd.empty();
        }
        this.q_date = new MDomItem( this.dateSelecterTd, {
            "name" : "q_date",
            "type" : "select",
            "selectValue" : function(){
                var year = parseInt(_self.cycleYear.getValue());
                var month = parseInt(_self.cycleMonth.getValue())-1;
                var date = new Date(year, month, 1);
                var days = [];
                days.push("");
                while (date.getMonth() === month) {
                    var d = date.getDate().toString();
                    if( d.length == 1 )d = "0"+d
                    days.push( d );
                    date.setDate(date.getDate() + 1);
                }
                return days;
            }
        }, true, this.app );
        this.q_date.load();
    },
    createIsAbsent: function(tr){
        var td = new Element("td", {  "styles" : this.css.filterTableTitle, "text" : "缺勤"  }).inject(tr);
        var td = new Element("td", {  "styles" : this.css.filterTableValue }).inject(tr);
        this.isAbsent = new MDomItem( td, {
            "name" : "isAbsent",
            "type" : "select",
            "selectValue" : ["","true","false"],
            "selectText" : ["","缺勤","未缺勤"],
        }, true, this.app );
        this.isAbsent.load();
    },
    //createIsLeaveEarlier: function(tr){
    //    var td = new Element("td", {  "styles" : this.css.filterTableTitle, "text" : "早退"  }).inject(tr);
    //    var td = new Element("td", {  "styles" : this.css.filterTableValue }).inject(tr);
    //    this.isLeaveEarlier = new MDomItem( td, {
    //        "name" : "isLeaveEarlier",
    //        "type" : "select",
    //        "selectValue" : ["-1","true","false"],
    //        "selectText" : ["","早退","未早退"],
    //    }, true, this.app );
    //    this.isLeaveEarlier.load();
    //},
    createLackOfTimeCount: function(tr){
        var td = new Element("td", {  "styles" : this.css.filterTableTitle, "text" : "工时不足"  }).inject(tr);
        var td = new Element("td", {  "styles" : this.css.filterTableValue }).inject(tr);
        this.isLackOfTime = new MDomItem( td, {
            "name" : "isLackOfTime",
            "type" : "select",
            "selectValue" : ["","true","false"],
            "selectText" : ["","是","否"],
        }, true, this.app );
        this.isLackOfTime.load();
    },
    createIsLate: function(tr){
        var td = new Element("td", {  "styles" : this.css.filterTableTitle, "text" : "迟到"  }).inject(tr);
        var td = new Element("td", {  "styles" : this.css.filterTableValue }).inject(tr);
        this.isLate  = new MDomItem( td, {
            "name" : "isLate",
            "type" : "select",
            "selectValue" : ["","true","false"],
            "selectText" : ["","迟到","未迟到"],
        }, true, this.app );
        this.isLate.load();
    },
    createActionTd : function( tr ){
        var td = new Element("td", {  "styles" : this.css.filterTableValue }).inject(tr);
        var input = new Element("button",{
            "text" : "查询",
            "styles" : this.css.filterButton
        }).inject(td);
        input.addEvent("click", function(){
            if( this.q_departmentName.getValue().trim() == "" ){
                this.app.notice( "请先选择部门", "error" );
                return;
            }
            var filterData = {
                q_departmentName : this.q_departmentName.getValue(),
                cycleYear : this.cycleYear.getValue(),
                cycleMonth : this.cycleMonth.getValue()
            }
            if( this.q_type ){
                filterData.q_type =  this.q_type.getValue();
            }
            if( this.isAbsent && this.isAbsent.getValue()!=""  ){
                filterData.isAbsent =  this.getBoolean(this.isAbsent.getValue());
            }
            if( this.isLeaveEarlier && this.isLeaveEarlier.getValue()!=""  ){
                filterData.isLeaveEarlier =  this.getBoolean(this.isLeaveEarlier.getValue());
            }
            if( this.isLate && this.isLate.getValue()!=""  ){
                filterData.isLate =  this.getBoolean(this.isLate.getValue());
            }
            if( this.isLackOfTime && this.isLackOfTime.getValue()!=""  ){
                filterData.isLackOfTime =  this.getBoolean( this.isLackOfTime.getValue() );
            }
            if( this.q_date && this.q_date.getValue()!="" ){
                filterData.q_day = this.q_date.getValue();
                filterData.q_date =  this.cycleYear.getValue() + "-" + this.cycleMonth.getValue() + "-" + this.q_date.getValue();
            }
            this.loadView( filterData );
        }.bind(this))
    },
    getBoolean : function( value ){
        if( value === "true" )return true;
        if( value === "false" )return false;
        return value;
    },
    selecePerson: function(){
        var options = {
            "type": "department",
            "title": "选择部门",
            "count" : "1",
            "onComplete": function(items){
                var names = [];
                items.each(function(item){
                    names.push(item.data.name);
                }.bind(this));
                this.q_departmentName.setValue( names.join(",") )
            }.bind(this)
        };
        //if( !this.app.isAdmin() && this.app.isDepartmentManager() ){
        //    options.departments = this.app.manageDepartments;
        //}
        var selector = new MWF.OrgSelector(this.app.content, options);
    },
    loadContentNode: function(){
        this.elementContentNode = new Element("div", {
            "styles": this.css.elementContentNode
        }).inject(this.node);
        this.app.addEvent("resize", function(){this.setContentSize();}.bind(this));

    },
    loadView : function( filterData ){
        this.elementContentNode.empty();
        if( this.view )delete this.view;
        this.view = new MWF.xApplication.Attendance.DepartmentDetail.View(this.elementContentNode, this.app,this );
        this.view.filterData = filterData
        this.view.load();
        this.setContentSize();
    },
    setContentSize: function(){
        var tabNodeSize = this.parent.tabs ? this.parent.tabs.tabNodeContainer.getSize() : {"x":0,"y":0};
        var fileterNodeSize = this.fileterNode ? this.fileterNode.getSize() : {"x":0,"y":0};
        var nodeSize = this.parent.node.getSize();

        var pt = this.elementContentNode.getStyle("padding-top").toFloat();
        var pb = this.elementContentNode.getStyle("padding-bottom").toFloat();
        //var filterSize = this.filterNode.getSize();

        var height = nodeSize.y-tabNodeSize.y-pt-pb-fileterNodeSize.y-20;
        this.elementContentNode.setStyle("height", ""+height+"px");

        this.pageCount = (height/40).toInt()+5;

        if (this.view && this.view.items.length<this.pageCount){
            this.view.loadElementList(this.pageCount-this.view.items.length);
        }
    }
});



MWF.xApplication.Attendance.DepartmentDetail.DetailStaticExplorer = new Class({
    Extends: MWF.xApplication.Attendance.DepartmentDetail.Explorer,

    loadFilter : function(){
        this.fileterNode = new Element("div.fileterNode", {
            "styles" : this.css.fileterNode
        }).inject(this.node)

        var table = new Element("table", {
            "width" : "100%", "border" : "0", "cellpadding" : "5", "cellspacing" : "0",  "styles" : this.css.filterTable, "class" : "filterTable"
        }).inject( this.fileterNode );
        table.setStyle("width","700px");
        var tr = new Element("tr").inject(table);

        //this.createTypeId(tr);
        this.createDepartmentTd( tr )
        this.createYearSelectTd( tr )
        this.createMonthSelectTd( tr )
        //this.createDateSelectTd( tr )
        this.createActionTd( tr )
    },
    createActionTd : function( tr ) {
        var td = new Element("td", {"styles": this.css.filterTableValue}).inject(tr);
        var input = new Element("button", {
            "text": "查询",
            "styles": this.css.filterButton
        }).inject(td);
        input.addEvent("click", function () {
            if (this.q_departmentName.getValue().trim() == "") {
                this.app.notice("请先选择部门", "error");
                return;
            }if (this.cycleMonth.getValue().trim() == "") {
                this.app.notice("请先选择月份", "error");
                return;
            }
            var filterData = {
                q_departmentName: this.q_departmentName.getValue(),
                cycleYear: this.cycleYear.getValue(),
                cycleMonth: this.cycleMonth.getValue()
            }
            if (this.q_type) {
                filterData.q_type = this.q_type.getValue();
            }
            if (this.isAbsent  && this.isAbsent.getValue()!="" ) {
                filterData.isAbsent = this.isAbsent.getValue();
            }
            if (this.isLeaveEarlier && this.isLeaveEarlier.getValue()!="" ) {
                filterData.isLeaveEarlier = this.isLeaveEarlier.getValue();
            }
            if (this.isLate && this.isLate.getValue()!="" ) {
                filterData.isLate = this.isLate.getValue();
            }
            if (this.q_date && this.q_date.getValue() != "") {
                filterData.q_day = this.q_date.getValue();
                filterData.q_date = this.cycleYear.getValue() + "-" + this.cycleMonth.getValue() + "-" + this.q_date.getValue();
            }
            this.loadView(filterData);
        }.bind(this))
    },
    loadView : function( filterData ){
        this.elementContentNode.empty();
        if( this.view )delete this.view;
        this.view = new MWF.xApplication.Attendance.DepartmentDetail.DetailStaticView(this.elementContentNode, this.app,this );
        this.view.filterData = filterData;
        this.view.listItemUrl = this.path+"listItem_detailStatic.json";
        this.view.load();
        this.setContentSize();
    }
})



MWF.xApplication.Attendance.DepartmentDetail.View = new Class({
    Extends: MWF.xApplication.Attendance.Explorer.View,
    _createItem: function(data){
        return new MWF.xApplication.Attendance.DepartmentDetail.Document(this.table, data, this.explorer, this);
    },

    _getCurrentPageData: function(callback, count){
        if(!count)count=20;
        var id = (this.items.length) ? this.items[this.items.length-1].data.id : "(0)";
        var filter = this.filterData || {};
        //filter.key = this.sortField || this.sortFieldDefault || "";
        //filter.order = this.sortType || this.sortTypeDefault || "";
        this.actions.listDetailFilterNext( id, count, filter, function(json){
            if( callback )callback(json);
        }.bind(this))
        //var filter = this.filterData || {};
        //this.actions.listDepartmentDetailFilter( filter, function(json){
        //    if( callback )callback(json);
        //}.bind(this))
    },
    _removeDocument: function(documentData, all){

    },
    _createDocument: function(){

    },
    _openDocument: function( documentData ){

    }

})




MWF.xApplication.Attendance.DepartmentDetail.DetailStaticView = new Class({
    Extends: MWF.xApplication.Attendance.Explorer.View,
    _createItem: function(data){
        return new MWF.xApplication.Attendance.DepartmentDetail.DetailStaticDocument(this.table, data, this.explorer, this);
    },

    _getCurrentPageData: function(callback, count){
        var filter = this.filterData || {};
        //if( !filter.cycleMonth || filter.cycleMonth == "" )filter.cycleMonth = "(0)";
        this.actions.listPersonMonthStaticByDepartment( filter.q_departmentName, filter.cycleYear, filter.cycleMonth, function(json){
            //var data = json.data;
            //data.sort( function( a, b ){
            //    return parseInt( b.statisticYear + b.statisticMonth ) - parseInt( a.statisticYear + a.statisticMonth )
            //})
            //json.data = data;
            if( callback )callback(json);
        }.bind(this))

        //if( filter.q_type == "day" ) {
        //    if( filter.q_date && filter.q_date != ""  ){
        //        this.actions.listStaticDateDepartment( filter.q_departmentName, filter.q_date  , function(json){
        //            if( callback )callback(json);
        //        }.bind(this))
        //    }else{
        //        this.actions.listStaticDayDepartment( filter.q_departmentName, filter.cycleYear, filter.cycleMonth, function(json){
        //            //var data = json.data;
        //            //data.sort( function( a, b ){
        //            //    return parseInt( b.statisticDate.replace(/-/g,"") ) -  parseInt( a.statisticDate.replace(/-/g,"") );
        //            //})
        //            //json.data = data;
        //            if( callback )callback(json);
        //        }.bind(this))
        //    }
        //}else{
        //    if( !filter.cycleMonth || filter.cycleMonth == "" )filter.cycleMonth = "(0)";
        //    this.actions.listStaticMonthDepartment( filter.q_departmentName, filter.cycleYear, filter.cycleMonth, function(json){
        //        //var data = json.data;
        //        //data.sort( function( a, b ){
        //        //    return parseInt( b.statisticYear + b.statisticMonth ) - parseInt( a.statisticYear + a.statisticMonth )
        //        //})
        //        //json.data = data;
        //        if( callback )callback(json);
        //    }.bind(this))
        //}

    },
    _removeDocument: function(documentData, all){

    },
    _createDocument: function(){

    },
    _openDocument: function( documentData ){

    }

})



MWF.xApplication.Attendance.DepartmentDetail.Document = new Class({
    Extends: MWF.xApplication.Attendance.Explorer.Document

})


MWF.xApplication.Attendance.DepartmentDetail.DetailStaticDocument = new Class({
    Extends: MWF.xApplication.Attendance.Explorer.Document

})

