/*global app, me, XMPP, client, Resample*/
"use strict";

var BasePage = require('./base');
var templates = require('../templates');


module.exports = BasePage.extend({
    template: templates.pages.main,
    classBindings: {
        shouldAskForAlertsPermission: '.enableAlerts'
    },
    srcBindings: {
        avatar: '#avatarChanger img'
    },
    events: {
        'click .enableAlerts': 'enableAlerts',
        'dragover': 'handleAvatarChangeDragOver',
        'drop': 'handleAvatarChange'
    },
    initialize: function (spec) {
        me.shouldAskForAlertsPermission = app.notifier.shouldAskPermission();
        this.renderAndBind();
    },
    enableAlerts: function () {
        app.notifier.askPermission(function () {
            var shouldAsk = app.notifier.shouldAskPermission();
            if (!shouldAsk) {
                app.notifier.show({
                    title: 'Ok, sweet!',
                    description: "You'll now be notified of stuff that happens."
                });
            }
        });
    },
    handleAvatarChangeDragOver: function (e) {
        e.preventDefault();
        return false;
    },
    handleAvatarChange: function (e) {
        e.preventDefault();
        var file = e.dataTransfer.files[0];
        if (file.type.match('image.*')) {
            console.log('Got an image file!', file.type);
            var fileTracker = new FileReader();
            fileTracker.onload = function () {
                var resampler = new Resample(this.result, 80, 80, function (data) {
                    var b64Data = data.split(',')[1];
                    var id = XMPP.crypto.createHash('sha1').update(atob(b64Data)).digest('hex');
                    console.log(id);
                    app.storage.avatars.add({id: id, uri: data});
                    client.publishAvatar(id, b64Data, function (err, res) {
                        if (err) return;
                        client.useAvatars([{
                            id: id,
                            width: 80,
                            height: 80,
                            type: 'image/png',
                            bytes: b64Data.length
                        }]);
                    });
                });
            };
            fileTracker.readAsDataURL(file);
        }
    }
});
