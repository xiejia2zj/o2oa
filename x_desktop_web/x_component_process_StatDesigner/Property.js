MWF.require("MWF.widget.Common", null, false);
MWF.require("MWF.widget.JsonTemplate", null, false);
MWF.xApplication.process.StatDesigner.Property = MWF.FVProperty = new Class({
	Extends: MWF.widget.Common,
	Implements: [Options, Events],
	options: {
		"style": "default",
		"path": "/x_component_process_FormDesigner/property/property.html"
	},
	
	initialize: function(module, propertyNode, designer, options){
		this.setOptions(options);
		this.module = module;
		this.view = module.view;
		this.data = module.json;
		this.htmlPath = this.options.path;
		this.designer = designer;
		
		this.propertyNode = propertyNode;
	},
	load: function(){
		if (this.fireEvent("queryLoad")){
			MWF.getRequestText(this.htmlPath, function(responseText, responseXML){
				this.htmlString = responseText;
                this.fireEvent("postLoad");
			}.bind(this));
		}
        this.propertyNode.addEvent("keydown", function(e){e.stopPropagation();});
	},
	editProperty: function(td){
	},
    getHtmlString: function(callback){
        if (!this.htmlString){
            MWF.getRequestText(this.htmlPath, function(responseText, responseXML){
                this.htmlString = responseText;
                if (callback) callback();
            }.bind(this));
        }else{
            if (callback) callback();
        }
    },
	show: function(){
        if (!this.propertyContent){
            this.getHtmlString(function(){
                if (this.htmlString){
                    this.JsonTemplate = new MWF.widget.JsonTemplate(this.data, this.htmlString);
                    this.propertyContent = new Element("div", {"styles": {"overflow": "hidden"}}).inject(this.propertyNode);
                    this.propertyContent.set("html", this.JsonTemplate.load());

                    this.setEditNodeEvent();
                    this.setEditNodeStyles(this.propertyContent);
                    this.loadPropertyTab();
                    this.loadPersonInput();
                    this.loadViewSelect();
                    this.loadJSONArea();

                    this.view.changeViewSelected()
                }
            }.bind(this));
        }else{
            this.propertyContent.setStyle("display", "block");
        }
	},
	hide: function(){
		//this.JsonTemplate = null;
		//this.propertyNode.set("html", "");
        if (this.propertyContent) this.propertyContent.setStyle("display", "none");
	},

	loadJSONArea: function(){
		var jsonNode = this.propertyContent.getElement(".MWFJSONArea");

        if (jsonNode){
            this.propertyTab.pages.each(function(page){
                if (page.contentNode == jsonNode.parentElement){
                    page.setOptions({
                        "onShow": function(){
                            jsonNode.empty();
                            MWF.require("MWF.widget.JsonParse", function(){
                                this.json = new MWF.widget.JsonParse(this.module.json, jsonNode, null);
                                this.json.load();
                            }.bind(this));
                        }.bind(this)
                    });
                }
            }.bind(this));
        }
	},
	loadPropertyTab: function(){
		var tabNodes = this.propertyContent.getElements(".MWFTab");
		if (tabNodes.length){
			var tmpNode = this.propertyContent.getFirst();
			var tabAreaNode = new Element("div", {
				"styles": this.view.css.propertyTabNode
			}).inject(tmpNode, "before");
			
			MWF.require("MWF.widget.Tab", function(){
				var tab = new MWF.widget.Tab(tabAreaNode, {"style": "formPropertyList"});
				tab.load();
				var tabPages = [];
				tabNodes.each(function(node){
					var page = tab.addTab(node, node.get("title"), false);
					tabPages.push(page);
					this.setScrollBar(page.contentNodeArea, "small", null, null);
				}.bind(this));
				tabPages[0].showTab();
				
				this.propertyTab = tab;
				
				this.designer.resizeNode();
			}.bind(this), false);
		}
	},
	
	setEditNodeEvent: function(){
		var property = this;
	//	var inputs = this.process.propertyListNode.getElements(".editTableInput");
		var inputs = this.propertyContent.getElements("input");
		inputs.each(function(input){
			var jsondata = input.get("name");
            if (jsondata && jsondata.substr(0,1)!="_"){
                if (this.module){
                    var id = this.module.json.id;
                    input.set("name", id+jsondata);
                }

                if (jsondata){
                    var inputType = input.get("type").toLowerCase();
                    switch (inputType){
                        case "radio":
                            input.addEvent("change", function(e){
                                property.setRadioValue(jsondata, this);
                            });
                            //input.addEvent("blur", function(e){
                            //    property.setRadioValue(jsondata, this);
                            //});
                            input.addEvent("keydown", function(e){
                                e.stopPropagation();
                            });
                            property.setRadioValue(jsondata, input);
                            break;
                        case "checkbox":

                            input.addEvent("change", function(e){
                                property.setCheckboxValue(jsondata, this);
                            });
                            input.addEvent("click", function(e){
                                property.setCheckboxValue(jsondata, this);
                            });
                            input.addEvent("keydown", function(e){
                                e.stopPropagation();
                            });
                            break;
                        default:
                            input.addEvent("change", function(e){
                                property.setValue(jsondata, this.value, this);
                            });
                            input.addEvent("blur", function(e){
                                property.setValue(jsondata, this.value, this);
                            });
                            input.addEvent("keydown", function(e){
                                if (e.code==13){
                                    property.setValue(jsondata, this.value, this);
                                }
                                e.stopPropagation();
                            });
                            if (input.hasClass("editTableInputDate")){
                                this.loadCalendar(input);
                            }
                    }
                }
            }
		}.bind(this));
		
		var selects = this.propertyContent.getElements("select");
		selects.each(function(select){
			var jsondata = select.get("name");
			if (jsondata){
				select.addEvent("change", function(e){
					property.setSelectValue(jsondata, this);
				});
			}
		});
		
		var textareas = this.propertyContent.getElements("textarea");
		textareas.each(function(input){
			var jsondata = input.get("name");
			if (jsondata){
				input.addEvent("change", function(e){
					property.setValue(jsondata, this.value);
				});
				input.addEvent("blur", function(e){
					property.setValue(jsondata, this.value);
				});
                input.addEvent("keydown", function(e){
                    e.stopPropagation();
                });
			}
		}.bind(this));
		
	},
    loadCalendar: function(node){
        MWF.require("MWF.widget.Calendar", function(){
            this.calendar = new MWF.widget.Calendar(node, {
                "style": "xform",
                "isTime": false,
                "target": this.module.designer.content,
                "format": "%Y-%m-%d",
                "onComplate": function(){
                    //this.validationMode();
                    //this.validation();
                    //this.fireEvent("complete");
                }.bind(this)
            });
            //this.calendar.show();
        }.bind(this));
    },
    changeStyle: function(name){
        this.module.setPropertiesOrStyles(name);
    },
    changeData: function(name, input, oldValue){
        this.module._setEditStyle(name, input, oldValue);
    },
    changeJsonDate: function(key, value){
        if (typeOf(key)!="array") key = [key];
        var o = this.data;
        var len = key.length-1;
        key.each(function(n, i){
            if (!o[n]) o[n] = {};
            if (i<len) o = o[n];
        }.bind(this));
        o[key[len]] = value;
    },
	setRadioValue: function(name, input){
        debugger;
		if (input.checked){
            var i = name.indexOf("*");
            var names = (i==-1) ? name.split(".") : name.substr(i+1, name.length).split(".");

			var value = input.value;
			if (value=="false") value = false;
			if (value=="true") value = true;

            var oldValue = this.data;
            for (var idx = 0; idx<names.length; idx++){
                if (!oldValue[names[idx]]){
                    oldValue = null;
                    break;
                }else{
                    oldValue = oldValue[names[idx]];
                }
            }

			//var oldValue = this.data[name];
			this.changeJsonDate(names, value);
            this.changeData(name, input, oldValue);
		}
	},
	setCheckboxValue: function(name, input){
        var id = this.module.json.id;
        var checkboxList = $$("input[name='"+id+name+"']");
		var values = [];
		checkboxList.each(function(checkbox){
			if (checkbox.get("checked")){
				values.push(checkbox.value);
			}
		});
		var oldValue = this.data[name];
		//this.data[name] = values;
        this.changeJsonDate(name, values);
        this.changeData(name, input, oldValue);
	},
	setSelectValue: function(name, select){
		var idx = select.selectedIndex;
		var options = select.getElements("option");
		var value = "";
		if (options[idx]){
			value = options[idx].get("value");
		}
		var oldValue = this.data[name];
		//this.data[name] = value;
        this.changeJsonDate(name, value);
        this.changeData(name, select, oldValue);
	},
	
	setValue: function(name, value, obj){
        var names = name.split(".");
        var oldValue = this.data;
        for (var idx = 0; idx<names.length; idx++){
            if (!oldValue[names[idx]]){
                oldValue = null;
                break;
            }else{
                oldValue = oldValue[names[idx]];
            }
        }

		//var oldValue = this.data[name];
		//this.data[name] = value;
        this.changeJsonDate(names, value);
        this.changeData(name, obj, oldValue);
	},
	setEditNodeStyles: function(node){
		var nodes = node.getChildren();
		if (nodes.length){
			nodes.each(function(el){
				var cName = el.get("class");
				if (cName){
					if (this.view.css[cName]) el.setStyles(this.view.css[cName]);
				}
				this.setEditNodeStyles(el);
			}.bind(this));
		}
	},
    loadPersonInput: function(){
        var applicationNodes = this.propertyContent.getElements(".MWFSelectApplication");
        var processNodes = this.propertyContent.getElements(".MWFSelectProcess");
        var companyNodes = this.propertyContent.getElements(".MWFSelectCompany");
        var departmentNodes = this.propertyContent.getElements(".MWFSelectDepartment");
        var personNodes = this.propertyContent.getElements(".MWFSelectPerson");
        var identityNodes = this.propertyContent.getElements(".MWFSelectIdentity");

        MWF.xDesktop.requireApp("process.StatDesigner", "widget.PersonSelector", function(){
            applicationNodes.each(function(node){
                new MWF.xApplication.process.StatDesigner.widget.PersonSelector(node, this.view.designer, {
                    "type": "application",
                    "names": (this.data.data.restrictWhereEntry) ? this.data.data.restrictWhereEntry[node.get("name")] : [],
                    "onChange": function(ids){this.savePersonItem(node, ids);}.bind(this)
                });
            }.bind(this));
            processNodes.each(function(node){
                new MWF.xApplication.process.StatDesigner.widget.PersonSelector(node, this.view.designer, {
                    "type": "process",
                    "names": (this.data.data.restrictWhereEntry) ? this.data.data.restrictWhereEntry[node.get("name")] : [],
                    "onChange": function(ids){this.savePersonItem(node, ids);}.bind(this)
                });
            }.bind(this));

            companyNodes.each(function(node){
                new MWF.xApplication.process.StatDesigner.widget.PersonSelector(node, this.view.designer, {
                    "type": "company",
                    "names": (this.data.data.restrictWhereEntry) ? this.data.data.restrictWhereEntry[node.get("name")] : [],
                    "onChange": function(ids){this.savePersonItem(node, ids);}.bind(this)
                });
            }.bind(this));

            departmentNodes.each(function(node){
                new MWF.xApplication.process.StatDesigner.widget.PersonSelector(node, this.view.designer, {
                    "type": "department",
                    "names": (this.data.data.restrictWhereEntry) ? this.data.data.restrictWhereEntry[node.get("name")] : [],
                    "onChange": function(ids){this.savePersonItem(node, ids);}.bind(this)
                });
            }.bind(this));

            personNodes.each(function(node){
                new MWF.xApplication.process.StatDesigner.widget.PersonSelector(node, this.view.designer, {
                    "type": "person",
                    "names": (this.data.data.restrictWhereEntry) ? this.data.data.restrictWhereEntry[node.get("name")] : [],
                    "onChange": function(ids){this.savePersonItem(node, ids);}.bind(this)
                });
            }.bind(this));

            identityNodes.each(function(node){
                new MWF.xApplication.process.StatDesigner.widget.PersonSelector(node, this.view.designer, {
                    "type": "identity",
                    "names": (this.data.data.restrictWhereEntry) ? this.data.data.restrictWhereEntry[node.get("name")] : [],
                    "onChange": function(ids){this.savePersonItem(node, ids);}.bind(this)
                });
            }.bind(this));
        }.bind(this));
    },
    savePersonItem: function(node, ids){
        //this.initWhereEntryData();
        debugger;
        var values = [];
        ids.each(function(id){
            values.push({"name": id.data.name, "id": id.data.id});
        }.bind(this));
        var name = node.get("name");

        key = name.split(".");
        var o = this.data;
        var len = key.length-1;
        key.each(function(n, i){
            if (!o[n]) o[n] = {};
            if (i<len) o = o[n];
        }.bind(this));
        o[key[len]] = values;

        //this.data.data.restrictWhereEntry[node.get("name")] = values;
    },
    loadViewSelect: function(){
        var viewNodes = this.propertyContent.getElements(".MWFViewSelect");
        if (viewNodes.length){
            this.getViewList(function(){
                viewNodes.each(function(node){
                    var select = new Element("select").inject(node);
                    select.addEvent("change", function(e){
                        var viewId = e.target.options[e.target.selectedIndex].value;
                        var viewName = e.target.options[e.target.selectedIndex].get("text");
                        this.setValue(e.target.getParent("div").get("name"), viewId);
                        this.setValue(e.target.getParent("div").get("name")+"Name", viewName);
                    }.bind(this));
                    this.setViewSelectOptions(node, select);

                    var refreshNode = new Element("div", {"styles": this.view.css.propertyRefreshFormNode}).inject(node);
                    refreshNode.addEvent("click", function(e){
                        this.getViewList(function(){
                            this.setViewSelectOptions(node, select);
                        }.bind(this), true);
                    }.bind(this));
                    //select.addEvent("click", function(e){
                    //    this.setFormSelectOptions(node, select);
                    //}.bind(this));
                }.bind(this));
            }.bind(this));
        }
    },
    setViewSelectOptions: function(node, select){
        var name = node.get("name");
        select.empty();
        var option = new Element("option", {"text": "(none)"}).inject(select);
        this.views.each(function(view){
            var option = new Element("option", {
                "text": view.name,
                "value": view.id,
                "selected": (this.data[name]==view.id)
            }).inject(select);
        }.bind(this));
    },
    getViewList: function(callback, refresh){
        if (!this.views || refresh){
            this.view.designer.actions.listView(this.view.designer.application.id, function(json){
                this.views = json.data;
                if (callback) callback();
            }.bind(this));
        }else{
            if (callback) callback();
        }
    }
});