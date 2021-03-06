/*!
 * Bright 0.0.5
 *
 * Copyright 2012, Sergiy Lavryk (jagermesh@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
  * http://brightfw.com
 *
 */

;(function ($, window) {

  window.br = window.br || {};

  window.br.showError = function(s) {
    alert(s);
  };

  window.br.growlError = function(s, image) {
    if (!br.isEmpty(s)) {
      if (typeof $.gritter != 'undefined') {
        $.gritter.add({
            title: 'Error'
          , text: s
          , class_name: 'gritter-red'
          , image: image
        });
      } else
      if (typeof window.humane != 'undefined') {
        humane.log(s, { addnCls     : 'humane-jackedup-error humane-original-error'
                      //, clickToClose: true
                      , timeout     : 5000
                      });
      } else {
        alert(s);
      }
    }
  };

  window.br.showMessage = function(s) {
    if (!br.isEmpty(s)) {
      alert(s);
    }
  };

  window.br.growlMessage = function(s, title, image) {
    if (!br.isEmpty(s)) {
      if (typeof $.gritter != 'undefined') {
        if (br.isEmpty(title)) {
          title = ' ';
        }
        $.gritter.add({
            title: title
          , text: s
          , class_name: 'gritter-light'
          , image: image
        });
      } else
      if (typeof window.humane != 'undefined') {
        humane.log(s);
      } else {
        alert(s);
      }
    }
  };

  window.br.panic = function(s) {
    $('.container').html('<div class="row"><div class="span12"><div class="alert alert-error"><h4>Error!</h4><p>' + s + '</p></div></div></div>');
    throw '';
  }

  window.br.confirm = function(title, message, buttons, callback, params) {
    if (typeof buttons == 'function') {
      params   = callback;
      callback = buttons;
      buttons  = null;
    }
    params = params || {};
    var s = '<div class="modal';
    if (params.cssClass) {
      s = s + ' ' + params.cssClass;
    }

    s = s + '">'+
            '<div class="modal-header"><h3>' + title + '</h3></div>' +
            '<div class="modal-body">' + message + '</div>' +
            '<div class="modal-footer">';
    if (params.showDontAskMeAgain) {
      var dontAskMeAgainTitle = (params.dontAskMeAgainTitle) ? params.dontAskMeAgainTitle : "Don't ask me again";
      s = s + ' <label style="text-align: left; float: left;" class="checkbox">' +
                '<input name="showDontAskMeAgain" type="checkbox" value="1"> ' + dontAskMeAgainTitle +
                '</label>';
    }
    if (br.isEmpty(buttons)) {
      s = s + '<a href="javascript:;" class="btn btn-primary action-confirm-close" rel="confirm">Yes</a>';
    } else {
      for(var i in buttons) {
        s = s + '<a href="javascript:;" class="btn action-confirm-close" rel="' + i + '">' + buttons[i] + '</a>';
      }
    }
    s = s + '<a href="javascript:;" class="btn action-confirm-cancel">&nbsp;Cancel&nbsp;</a>';
    s = s + '</div></div>';
    var dialog = $(s);
    $(dialog)
      .on('show', function(e) {
        $(this).find('.action-confirm-close').click(function() {
          if (params.showDontAskMeAgain) {
            callback.call(dialog, $(this).attr('rel'), $('input[name=showDontAskMeAgain]', $(dialog)).is(':checked'));
          } else {
            callback.call(dialog, $(this).attr('rel'));
          }
          $(dialog).modal('hide');
        });
        $(this).find('.action-confirm-cancel').click(function() {
          if (params.onCancel) {
            params.onCancel.call(dialog);
          }
          $(dialog).modal('hide');
        });
      })
      .on('hide', function(e) {
        dialog.remove();
      });
    $(dialog).modal();
  }

  window.br.error = function(title, message, callback) {
    var s = '<div class="modal">';
    if (title !== '') {
      s = s + '<div class="modal-header"><a class="close" data-dismiss="modal">×</a><h3>' + title + '</h3></div>';
    }
    s = s + '<div class="modal-body">' + message + '</div>' +
            '<div class="modal-footer" style="background-color:red;"><a href="javascript:;" class="btn" data-dismiss="modal">&nbsp;Dismiss&nbsp;</a></div></div>';
    var dialog = $(s);
    $(dialog)
      .on('hide', function(e) {
        if (callback) {
          callback.call(this);
        }
        dialog.remove();
      });
    $(dialog).modal();
  }

  window.br.inform = function(title, message, callback) {
    var s = '<div class="modal">';
    if (title !== '') {
      s = s + '<div class="modal-header"><a class="close" data-dismiss="modal">×</a><h3>' + title + '</h3></div>';
    }
    s = s + '<div class="modal-body">' + message + '</div>' +
            '<div class="modal-footer"><a href="javascript:;" class="btn" data-dismiss="modal">&nbsp;Dismiss&nbsp;</a></div></div>';
    var dialog = $(s);
    $(dialog)
      .on('hide', function(e) {
        if (callback) {
          callback.call(this);
        }
        dialog.remove();
      });
    $(dialog).modal();
  }

  window.br.prompt = function(title, fields, callback, options) {

    options = options || {};
    var s = '<div class="modal">'+
            '<div class="modal-header"><a class="close" data-dismiss="modal">×</a><h3>' + title + '</h3></div>' +
            '<div class="modal-body">';

    var inputs = {}

    if (br.isObject(fields)) {
      inputs = fields;
    } else {
      inputs[fields] = '';
    }

    for(var i in inputs) {
      if (br.isObject(inputs[i])) {
        s = s + '<label>' + i + '</label>'
              + '<input type="text" '
              + (inputs[i].id ? 'id="'+inputs[i].id+'"' : '')
              + ' class="span4 ' + (br.isEmpty(inputs[i]['class']) ? '' : inputs[i]['class']) + '"'
              + ' value="' + inputs[i].value + '"'
              + ' data-click-on-enter=".action-confirm-close" />';
      } else {
        s = s + '<label>' + i + '</label>' +
                '<input type="text" class="span4" value="' + inputs[i] + '" data-click-on-enter=".action-confirm-close" />';
      }
    }

    s = s + '</div>' +
            '<div class="modal-footer">';
    s = s + '<a href="javascript:;" class="btn btn-primary action-confirm-close" rel="confirm" >Ok</a>';
    s = s + '<a href="javascript:;" class="btn" data-dismiss="modal">&nbsp;Cancel&nbsp;</a>';
    s = s + '</div></div>';
    var dialog = $(s);
    $(dialog)
      .on('shown', function(e) {
        $(this).find('input[type=text]')[0].focus();
      })
      .on('show', function(e) {
        $(this).find('.action-confirm-close').click(function() {
          $(dialog).modal('hide');
          var results = [];
          $(this).closest('div.modal').find('input[type=text]').each(function() {
            results.push($(this).val());
          });
          callback.call(this, results);
        });
      })
      .on('hide', function(e) {
        dialog.remove();
        if (options.onhide) {
          options.onhide.call(this);
        }
      });
    $(dialog).modal();
  }

  var noTemplateEngine = false;

  window.br.fetch = function(template, data, tags) {
    data = data || {};
    if (template) {
      if (typeof window.Mustache == 'undefined') {
        if (typeof window.Handlebars == 'undefined') {
          if (!noTemplateEngine) {
            noTemplateEngine = true;
            this.showError('Template engine not found. Please link bright/3rdparty/mustache.js or bright/3rdparty/handlebars.js.');
          }
        } else {
          var t = Handlebars.compile(template);
          return t(data);
        }
      } else {
        return Mustache.render(template, data);
      }
    } else {
      return '';
    }
  };

  var progressCounter = 0;

  window.br.showAJAXProgress = function() {
    progressCounter++;
    $('.ajax-in-progress').css('visibility', 'visible');
  }

  window.br.hideAJAXProgress = function() {
    progressCounter--;
    if (progressCounter <= 0) {
      $('.ajax-in-progress').css('visibility', 'hidden');
      progressCounter = 0;
    }
  }

  window.br.jsonEncode = function(data) {
    return JSON.stringify(data);
  }
  window.br.jsonDecode = function(data) {
    try {
      return JSON.parse(data);
    } catch(ex) {
      return null;
    }
  }

  $(document).ready(function() {

    var notAuthorized = false;

    $('body').ajaxStart(function() {
      br.showAJAXProgress();
    });

    $('body').ajaxStop(function() {
      br.hideAJAXProgress();
    });

    $('body').ajaxError(function(event, jqXHR, ajaxSettings, thrownError) {
      if (jqXHR.status == 401) {
        if (!notAuthorized) {
          notAuthorized = true;
          br.growlError('You are trying to run operation which require authorization.');
        }
      }
    });

    $(document).on('keypress', 'input[data-click-on-enter]', function(e) {
      if (e.keyCode == 13) { $($(this).attr('data-click-on-enter')).trigger('click'); }
    });

    if ($('.focused').length > 0) {
      try { $('.focused')[0].focus(); } catch (ex) { }
    }

  });

})(jQuery, window);
