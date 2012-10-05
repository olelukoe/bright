!function ($, window, undefined) {

  window.br = window.br || {};

  window.br.dataBrowser = function (entity, options) {
    return new BrDataBrowser(entity, options);
  }

  function BrDataBrowser(entity, options) {

    var _this = this;

    var pagerSetuped = false;

    this.options = options || {};
    this.options.entity = entity;
    this.options.noun = this.options.noun || '';
    this.storageTag = document.location.toString();
    this.limit = this.options.limit || 20;
    this.skip = 0;
    this.cb = {};
    this.recordsAmount = 0;
    this.dataSource = br.dataSource(br.baseUrl + 'api/' + this.options.entity + '/');
    this.countDataSource = br.dataSource( br.baseUrl + 'api/' + this.options.entity + '/');
    this.dataGrid = br.dataGrid( '.data-table'
                               , '.data-row-template'
                               , this.dataSource
                               , { templates: { noData: '.data-empty-template' }
                                 , deleteSelector: '.action-delete' 
                                 }
                               );
    this.on = function(event, callback) {
      this.cb[event] = this.cb[event] || new Array();
      this.cb[event][this.cb[event].length] = callback;
    }

    function callEvent(event, context1, context2, context3) {

      _this.cb[event] = _this.cb[event] || new Array();

      for (i in _this.cb[event]) {
        _this.cb[event][i].call(_this, context1, context2, context3);
      }

    }

    this.before = function(operation, callback) {
      this.dataSource.before(operation, callback);
      this.countDataSource.before(operation, callback);
    }
    this.getOrder = function() {
      return br.storage.get(this.storageTag + 'order');
    }
    this.setOrder = function(order) {
      br.storage.set(this.storageTag + 'order', order);
    }
    this.setFilter = function(name, value) {
      br.storage.set(this.storageTag + 'filter:' + name, value);
    }
    this.getFilter = function(name) {
      return br.storage.get(this.storageTag + 'filter:' + name);
    }
    this.lockEditor = function() {
      $('.action-save').addClass('disabled');
    }
    this.unLockEditor = function() {
      $('.action-save').removeClass('disabled');
    }
    this.init = function() {
      // nav
      $('.nav-item[rel=' + _this.options.nav + ']').addClass('active');

      _this.dataSource.on('error', function(operation, error) {
        br.growlError(error);//, br.baseUrl + 'images/person_default_box.gif');
      });

      _this.dataSource.before('select', function(request, options) {
        options.order = _this.getOrder();
        if ($('input.data-filter[name=keyword]').length > 0) {
          request.keyword = $('input.data-filter[name=keyword]').val();
          _this.setFilter('keyword', request.keyword);
        }
      });

      _this.dataSource.after('remove', function(request, options) {
        _this.resetPager();
        _this.updatePager();
      });

      _this.dataSource.after('insert', function(request, options) {
        _this.resetPager();
        _this.updatePager();
      });

      _this.countDataSource.before('select', function(request) {
        if ($('input.data-filter[name=keyword]').length > 0) {
          request.keyword = $('input.data-filter[name=keyword]').val();
        }
      });

      var order = _this.getOrder();
      if (order) {
        for (i in order) {
          $('.sortable[data-field="' + i + '"].' + (order[i] == -1 ? 'order-desc' : (order[i] == 1 ? 'order-asc' : 'dummy'))).addClass('icon-white');
        }
      }

      $('.sortable').on('mouseover', function() { $(this).css('cursor', 'pointer'); });

      $('.sortable').on('mouseout' , function() { $(this).css('cursor', 'auto'); });

      $('.sortable').on('click', function() {
        if ($(this).hasClass('icon-white')) {
          $(this).removeClass('icon-white');
        } else {
          $(this).siblings('i').removeClass('icon-white'); $(this).addClass('icon-white');
        }
        _this.setOrder({});
        var tmp = {};
        $('.sortable').each(function() {
          if ($(this).hasClass('icon-white')) {
            if ($(this).hasClass('order-asc')) {
              tmp[$(this).attr('data-field')] = 1;
            }
            if ($(this).hasClass('order-desc')) {
              tmp[$(this).attr('data-field')] = -1;
            }
          }
        });
        if (tmp) {
          _this.setOrder(tmp);
        }
        _this.refresh({}, null, true);
      });

      // search
      br.modified('input.data-filter[name=keyword]', function() { 
        var _val = $(this).val();
        $('input.data-filter[name=keyword]').each(function() {
          if ($(this).val() != _val) {
            $(this).val(_val);
          }
        }); 
        _this.refreshDeferred(); 
      });

      br.modified('input.data-filter,select.data-filter', function() { 
        _this.resetPager();
      });
        
      if ($.datepicker) {
        $('.datepicker').each(function() {
          $(this).datepicker({ dateFormat: $(this).attr('data-format') });
        });
      }

      // actions
      $('.data-edit-form').each(function() {
        $('.action-create').show();
        $('.action-edit,.action-create,.action-copy').live('click', function() {
          var isCopy = $(this).hasClass('action-copy');
          var rowid = $(this).closest('[data-rowid]').attr('data-rowid');
          $('.data-edit-form').each(function() {
            var editForm = $(this);
            if (rowid) {
              if (isCopy) {
                editForm.find('.operation').text('Copy ' + _this.options.noun);
                editForm.removeData('rowid');
              } else {
                editForm.find('.operation').text('Edit ' + _this.options.noun);
                editForm.data('rowid', rowid);                
              }
            } else {
              editForm.find('.operation').text('Create ' + _this.options.noun);
              editForm.removeData('rowid');
            }
            editForm.find('input.data-field,select.data-field,textarea.data-field').val('');
            editForm.find('input.data-field[type=checkbox]').val('1');
            editForm.find('input.data-field[type=checkbox]').removeAttr('checked');

            editForm.find('div.data-field[data-toggle=buttons-radio]').find('button').removeClass('active');

            editForm.on('shown', function() {
              var firstInput = $(this).find('.data-field');
              if (firstInput.length > 0) {
                firstInput[0].focus();
              }
            });
            if (rowid) {
              _this.dataSource.selectOne(rowid, function(result, data) {
                if (result) {
                  for(i in data) {
                    editForm.find('div.data-field[data-toggle=buttons-radio][name=' + i + '],input.data-field[name=' + i + '],select.data-field[name=' + i + '],textarea.data-field[name=' + i + ']').each(function() {
                      if ($(this).attr('data-toggle') == 'buttons-radio') {
                        $(this).find('button[value=' + data[i] + ']').addClass('active');
                      } else
                      if ($(this).attr('type') == 'checkbox') {
                        if (data[i] == '1') {
                          $(this).attr('checked', 'checked');
                        }
                      } else {
                        $(this).val(data[i]);
                      }
                    });
                  }
                  callEvent('showEditor', data);
                  editForm.modal('show');
                }
              }, { disableEvents: true });
            } else {
              callEvent('showEditor');
              editForm.modal('show');        
            }
          });
        });

        $('.action-save').live('click', function() {
          if (!$(this).hasClass('disabled')) {
            $('.data-edit-form').each(function() {
              var editForm = $(this);
              var rowid = $(this).data('rowid');
              var data = { };
              var edit = $(this);
              var ok = true;
              editForm.find('div.data-field[data-toggle=buttons-radio],input.data-field,select.data-field,textarea.data-field').each(function() {
                if (ok) {
                  if ($(this).attr('data-toggle') == 'buttons-radio') {
                    var val = $(this).find('button.active').val();
                  } else {
                    var val = $(this).val();
                  }
                  if ($(this).hasClass('required') && br.isEmpty(val)) {
                    var title = $(this).attr('title');
                    if (br.isEmpty(title)) {
                      title = $(this).prev('label').text();
                    }
                    br.growlError(title + ' must be filled');
                    this.focus();
                    ok = false;
                  } else {
                    data[$(this).attr('name')] = val;
                  }
                }
              });
              if (ok) {
                if (rowid) {
                  _this.dataSource.update(rowid, data, function(result) {
                    if (result) {
                      editForm.modal('hide');
                    }
                  });
                } else {
                  _this.dataSource.insert(data, function(result) {
                    if (result) {
                      editForm.modal('hide');
                    }
                  });
                }
              }
            });
          }
        });
      });

      br.editable('.editable', function(content) {
        var $this = $(this); 
        var rowid = $this.closest('[data-rowid]').attr('data-rowid'); 
        var dataField = $this.attr('data-field');
        if (!br.isEmpty(rowid) && !br.isEmpty(dataField)) {
          var data = {};
          data[dataField] = content;
          _this.dataSource.update( rowid
                           , data
                           , function(result) {
                               if (result) {
                                 br.editable($this, 'apply', content);
                               }
                             }
                           );
        }
      });

      // pager
      $('.action-next').click(function() {
         
        _this.skip += _this.limit;
        _this.refresh({}, null, true);

      });

      $('.action-prior').click(function() {
         
        _this.skip -= _this.limit;
        if (_this.skip < 0) {
          _this.skip = 0;
        }
        _this.refresh({}, null, true);

      });

      $('.action-refresh').click(function() {
        _this.refresh();
      });

      $('.action-clear-one-filter').click(function() {
        $('.data-filter[name=' + $(this).attr('rel') + ']').val('');
        _this.refresh();
      });

      $('input.data-filter[name=keyword]').val(_this.getFilter('keyword'));

      function showFiltersDesc() {

        if ($('.filters-panel').is(':visible')) {
          $('.filters-switcher').find('span').text('Hide filters');
          $('.filter-description').text('');
        } else {
          $('.filters-switcher').find('span').text('Show filters');
          var s = '';
          $('.data-filter').each(function() {
            var val = $(this).val();
            var title = $(this).attr('title');
            if (val &&title) {
              s = s + '/ <strong>' + title + '</strong> ';
              if ($(this).is('select')) {
                s = s + $(this).find('option[value=' + val + ']').text() + ' ';
              } else {
                s = s + val + ' ';
              }

            }
          });
          $('.filter-description').html(s);
        }      

      }

      function setupFilters(initial) {

        function showHideFilters(initial) {

          if ($('.filters-panel').css('display') == 'none') {
            br.storage.set(_this.storageTag + ':filters-hidden', false);
            if (initial) {
              $('.filters-panel').show();
              showFiltersDesc();
            } else
            $('.filters-panel').slideDown(function() {
              showFiltersDesc();
            });
          } else {
            br.storage.set(document.location.toString() + ':filters-hidden', true);
            if (initial) {
              $('.filters-panel').hide();
              showFiltersDesc();
            } else
            $('.filters-panel').slideUp(function() {
              showFiltersDesc();
            });
          }      

        }

        $('.action-show-hide-filters,.filters-switcher').click(function() {
          showHideFilters();
        });  

        $('.action-reset-filters,.filters-reset').on('click', function () {
          _this.resetFilters();
        });

        if (br.storage.get(document.location.toString() + ':filters-hidden')) {
          showFiltersDesc();
        } else {
          showHideFilters(initial);
        }

      }

      setupFilters(true);

      _this.dataSource.after('select', function() {
        showFiltersDesc();
      });

      $('.action-select-all').live('click', function() {
        if ($(this).is(':checked')) {
          $('.action-select-row').each(function() {
            $(this).attr('checked', 'checked');
            $(this).closest('tr').addClass('row-selected');
          });
        } else {
          $('.action-select-row').each(function() {
            $(this).removeAttr('checked');
            $(this).closest('tr').removeClass('row-selected');
          });
        }
        callEvent('selectionChanged');
      });

      $('.action-select-row').live('click', function() {
        if ($(this).is(':checked')) {
          $(this).closest('tr').addClass('row-selected');
        } else {
          $(this).closest('tr').removeClass('row-selected');
        }
        callEvent('selectionChanged');
      });
      
      $('.action-delete-selected').live('click', function() {
        var selection = _this.getSelection();
        if (selection.length > 0) {
          br.confirm( 'Delete confirmation'
                    , 'Are you sure you want delete ' + selection.length + ' record(s)?'
                    , function() {
                        for(i in selection) {
                          _this.dataSource.remove(selection[i]);
                        }
                      }
                    );

        }
        // callEvent('selectionChanged');
      });

      _this.dataGrid.on('change', function() {
        $('.action-select-all').removeAttr('checked');
        callEvent('selectionChanged');
      });

      return this;
    }

    var slider = false;
    $('.pager-page-slider').each(function() {
      slider = true;
      $(this).slider({
          min: 1
        , value: 1
        , change: function(event, ui) { 
            var value = $('.pager-page-slider').slider('option', 'value');
            if (value > 0) {
              var newSkip = _this.limit * (value - 1);
              if (newSkip != _this.skip) {
                _this.skip = _this.limit * (value - 1);
                _this.refresh({}, null, true);
              }
            }
          }
      });
    });

    $('.pager-page-size-slider').each(function() {
      slider = true;
      $(this).slider({
          min: 20
        , value: 20
        , max: 200
        , step: 20
        , change: function(event, ui) { 
            var value = $('.pager-page-size-slider').slider('option', 'value');
            _this.limit = value;
            $('.pager-page-slider').slider('option', 'value', 1);
            $('.pager-page-slider').slider('option', 'max', Math.ceil(_this.recordsAmount / _this.limit));
            console.log(_this);
            _this.refresh({}, null, true);
          }        
      });
    });

    function internalUpdatePager() {

      if (slider) {
        $('.pager-page-slider').slider('option', 'max', Math.ceil(_this.recordsAmount / _this.limit));
        $('.pager-page-slider').slider('option', 'value', Math.ceil(_this.skip / _this.limit) + 1);
      }
      var min = (_this.skip + 1);
      var max = Math.min(_this.skip + _this.limit, _this.recordsAmount);
      if (_this.recordsAmount > 0) {
        $('.pager-control').show();
        if (_this.recordsAmount > max) {
          $('.action-next').show();
        } else {
          $('.action-next').hide();
        }
        if (_this.skip > 0) {
          $('.action-prior').show();
        } else {
          $('.action-prior').hide();
        }
      } else {
        $('.pager-control').hide();        
      }
      $('.pager-stat').text('Records ' + min + '-' + max + ' of ' + _this.recordsAmount);
      $('.pager-page-size').text(_this.limit + ' records per page');

      pagerSetuped = true;

    }

    this.getSelection = function() {
      var rowids = [];
      $('.action-select-row').each(function() {
        if ($(this).is(':checked')) {
          rowids.push($(this).val());
        }
      });
      return rowids;
    }

    this.updatePager = function() {

      if (!pagerSetuped) {

        filter = {};
        filter.__skip = _this.skip;
        filter.__limit = _this.limit;

        _this.countDataSource.selectCount(filter, function(success, result) {
          if (success) {
            _this.recordsAmount = result;
            internalUpdatePager();
          } else {
            $('.pager-control').hide();        
          }
        });

      } else {
        internalUpdatePager();
      }

    }  
          
    function internalRefresh(deferred, filter, callback) {

      filter = filter || {};
      filter.__skip = _this.skip;
      filter.__limit = _this.limit;

      if (deferred) {
        _this.dataSource.deferredSelect(filter, function() {
          _this.updatePager();
          if (typeof callback == 'function') {
            callback.call(this);
          }
        });        
      } else {
        _this.dataSource.select(filter, function() {
          _this.updatePager();
          if (typeof callback == 'function') {
            callback.call(this);
          }
        });     
      }

    }
    
    this.resetPager = function() {
      pagerSetuped = false;
      _this.skip = 0;
    }
    this.resetFilters = function() {
      $('select.data-filter option:selected').removeAttr('selected');
      $('select.data-filter').prop('selectedIndex', 0);
      $('input.data-filter').val('');
      br.storage.clear();
      br.refresh();
      // _this.refresh();
    }
    this.refreshDeferred = function(filter, callback, doNotResetPager) {
      if (!doNotResetPager) {
        _this.resetPager();
      }
      internalRefresh(true, filter, callback);      
    }

    this.refresh = function(filter, callback, doNotResetPager) {
      if (!doNotResetPager) {
        _this.resetPager();
      }
      internalRefresh(false, filter, callback);      
    }

    return this.init();

  }

}(jQuery, window);
