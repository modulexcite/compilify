﻿
(function(Compilify) {
    var root = this,
        $ = root.jQuery,
        _ = root._,
        CodeMirror = root.CodeMirror,
        original, connection;
    
    function saveContent(value, callback) {
        $.ajax(window.location.pathname, {
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ content: { Code: value } }),
            success: function(msg) {
                root.history.pushState({ }, '', msg.data.url);
                original = value.toUpperCase();
                
                if (_.isFunction(callback)) {
                    callback(msg.data);
                }
            }
        });
    }
    
    function execute(value, callback) {
        connection.send(value);
    }
    
    var validate = _.debounce(function(sender) {
        $.ajax('/validate', {
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ code: sender.getValue() }),
            success: function (msg) {
                var $list = $('#errors ul').detach().empty(),
                    hasErrors = msg.data.length > 0;

                if (!hasErrors) {
                    $list.append('<li>Build completed successfully.</li>');
                }
                else {
                    for (var i in msg.data) {
                        var error = msg.data[i];
                        $list.append('<li>' + error.Message + '</li>');
                    }
                }
                
                $('#errors').append($list);
            }
        });
    }, 500);

    $(function() {
        var editor = $('#define .js-editor')[0];

        original = editor.innerHTML.trim().toUpperCase();

        // Set up editor
        Compilify.Editor = CodeMirror.fromTextArea(editor, {
            indentUnit: 4,
            lineNumbers: true,
            theme: 'neat',
            mode: 'text/x-csharp',
            onChange: validate
        });
        
  
        $('#define .js-save').on('click', function() {
            var currentValue = Compilify.Editor.getValue().trim();
            
            if (currentValue.toUpperCase() !== original) {
                saveContent(currentValue);
            }

            return false;
        });

        $('#define .js-execute').on('click', function() {
            var currentValue = Compilify.Editor.getValue().trim();

            // if (currentValue.toUpperCase() !== original) {
                saveContent(currentValue, function(data) {
                    execute(currentValue, function (msg) {
                        $('#results p').html(msg.data.Result);
                    });
                });
            // }

            return false;
        });
        
        connection = $.connection('/execute');
        connection.logging = true;
        
        connection.received(function(message) {
            if (message.status === "ok") {
                if (message.data && !_.isUndefined(message.data.result)) {
                    $('#results p').html(message.data.result.toString());
                }
            }
        });
        
        connection.error(function(e) {
            console.error(e);
        });

        connection.start({ transport: 'auto' });
    });
}).call(window, window.Compilify || {});
