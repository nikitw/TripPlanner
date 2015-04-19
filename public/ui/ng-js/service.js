/**
 * Created by nikit on 3/14/15.
 */
var services = angular.module('TripPlanner.services', []);

var BASEURL = 'http://192.168.1.6:3000/';

services.factory('confService', function($http) {
    var vs = {};
    vs.conf = undefined;
    vs.loadConf = function(callback) {
        if(vs.conf && callback) {
            callback(vs.conf);
            return;
        }
        $http.get(BASEURL+'ng-js/conf.json')
            .success(function (data) {
                vs.conf = data;
                if(callback)
                    callback(data);
            });
    };
    return vs;
});

services.factory('sessService', function ($cookies) {
    var sess = {};

    sess.setSession = function (key, value) {
        $cookies[key] = JSON.stringify(value);
    };

    sess.getSession = function (key) {
        var value = $cookies[key];
        try {
            return JSON.parse(value);
        } catch(err) {
            return value;
        }
    };

    sess.deleteSession = function (key) {
        delete $cookies[key];
    };

    return sess;
});

services.factory('userService', function($http, $users, sessService) {
    var us = {};

    var user;
    us.createUser = function (request) {
        $http.post(BASEURL+"users", request.body)
            .success(function (response) {
                if(!response.err) {
                    var newuser = $users.getUser(response.body);
                    sessService.setSession('user', newuser);
                    request.success(newuser);
                } else {
                    request.error(response.err);
                }
            });
    };

    us.updateUser = function (request) {
        user = sessService.getSession('user');
        if(!user) {
            request.error(new Error('Session Expired!', 701));
            return;
        }
        $http.put(BASEURL+"users?apiKey="+user.apiKey, request.body)
            .success(function (response) {
                if(!response.err) {
                    var newuser = $users.getUser(response.body);
                    sessService.setSession('user', newuser);
                    request.success(newuser);
                } else {
                    request.error(response.err);
                }
            });
    };

    us.deleteUser = function (request) {
        user = sessService.getSession('user');
        if(!user) {
            request.error(new Error('Session Expired!', 701));
            return;
        }
        $http.delete(BASEURL+"users?apiKey="+user.apiKey)
            .success(function (response) {
                if(!response.err) {
                    request.success(response.body);
                } else {
                    request.error(response.err);
                }
            });
    };

    us.getUser = function (request) {
        user = sessService.getSession('user');
        if(!user) {
            request.error(new Error('Session Expired!', 701));
            return;
        }
        $http.jsonp(BASEURL+"users?callback=JSON_CALLBACK&apiKey="+user.apiKey)
            .success(function (response) {
                if(!response.err) {
                    request.success(response.body);
                } else {
                    request.error(response.err);
                }
            });
    };

    return us;
});

services.factory('authService', function ($http, $users, sessService) {
    var auth = {};
    var user;

    auth.getUser = function () {
        return sessService.getSession('user');
    };

    auth.login = function (request) {
        $http.post(BASEURL+'auth/login', request.body)
            .success(function (response) {
                if(!response.err) {
                    user = $users.getUser(response.body);
                    sessService.setSession('user', user);
                    request.success(user);
                } else
                    request.error(response.err);
            });
    };

    auth.logout = function () {
        sessService.deleteSession('user');
        sessService.deleteSession('page');
        user = undefined;
    };

    return auth;
});

services.factory('tripService', function ($http, $users, $trips, sessService) {
    var ts = {};
    var user;

    ts.createTrip = function (request) {
        user = sessService.getSession('user');
        if(!user) {
            request.error(new Error('Session Expired', 701));
            return;
        }
        request.body.apiKey = user.apiKey;
        $http.post(BASEURL+'trips', request.body)
            .success(function (response) {
                if(!response.err) {
                    request.success($trips.getTrip(response.body));
                } else {
                    request.error(response.err);
                }
            });
    };

    ts.updateTrip = function (request) {
        user = sessService.getSession('user');
        if(!user) {
            request.error(new Error('Session Expired', 701));
            return;
        }
        $http.put(BASEURL+'trips/'+request.body._id+'?apiKey='+user.apiKey, request.body)
            .success(function (response) {
                if(!response.err) {
                    request.success($trips.getTrip(response.body));
                } else {
                    request.error(response.err);
                }
            });
    };

    ts.deleteTrip = function (request) {
        user = sessService.getSession('user');
        if(!user) {
            request.error(new Error('Session Expired', 701));
            return;
        }
        $http.delete(BASEURL+'trips/'+request.body._id+'?apiKey='+user.apiKey)
            .success(function (response) {
                if(!response.err) {
                    request.success($trips.getTrip(response.body));
                } else {
                    request.error(response.err);
                }
            });
    };


    ts.getTrip = function (request) {
        user = sessService.getSession('user');
        if(!user) {
            request.error(new Error('Session Expired', 701));
            return;
        }
        $http.jsonp(BASEURL+'trips/'+request.body._id+'?callback=JSON_CALLBACK&apiKey='+user.apiKey)
            .success(function (response) {
                if(!response.err) {
                    request.success($trips.getTrip(response.body));
                } else {
                    request.error(response.err);
                }
            });
    };

    ts.getTrips = function (request) {
        user = sessService.getSession('user');
        if(!user) {
            request.error(new Error('Session Expired', 701));
            return;
        }
        var url = '';
        if(request.filter) {
            if(request.filter.keyword)url += '&keyword='+request.filter.keyword;
            if(request.filter.start)url += '&start='+request.filter.start;
            if(request.filter.end)url += '&end='+request.filter.end;
        }
        $http.jsonp(BASEURL+'trips?callback=JSON_CALLBACK&apiKey='+user.apiKey+url)
            .success(function (response) {
                if(!response.err) {
                    request.success($trips.getTrips(response.body));
                } else {
                    request.error(response.err);
                }
            });
    };

    return ts;
});

services.factory('interfaceService', function (confService, $http) {

    var ui = {};
    var conf;

    confService.loadConf(function(data) {
        conf = data.ui;
    });

    ui.loadDatePicker = function ($scope, start, trips) {
        var undates = getStartDates(trips);
        $('.'+conf.dateRangeClass).datepicker({
            autoClose: true,
            orientation: "top auto",
            startDate: start,
            beforeShowDay: function (date){
                for(var dt in trips) {
                    var dte = new Date(trips[dt].start);
                    if(date.getMonth() == dte.getMonth()) {
                        if(date.getDate() == dte.getDate()) {
                            return {
                                tooltip: trips[dt].dest,
                                classes: 'active'
                            };
                        }
                    }
                }
            },
            datesDisabled: undates
        });

        $('.'+conf.dateRangeClass).children('input').blur(function(e) {
            $(this).change();
            if($scope) {
                var parts = $(this).attr('ng-model').split('.');
                var model = $scope;
                var key;
                for(key = 0; key < parts.length - 1; key++) {
                    model = model[parts[key]];
                }
                model[parts[key]] = $(this).val();
            }
        });

        $('.month-cal').datepicker({
            minViewMode: 1,
            autoClose: true,
            orientation: "top auto",
            toggleActive: true
        }).on('changeMonth', function(e) {
            if($scope.startDate && $scope.startDate.getMonth() == e.date.getMonth() &&
                $scope.startDate.getYear() == e.date.getYear()){
                $scope.endDate = undefined;
                $scope.startDate = undefined;
            } else {
                var days = (new Date(e.date.getYear(), e.date.getMonth() + 1, 0)).getDate();
                $scope.endDate = e.date.addDays(days - 1);
                $scope.startDate = e.date;
            }
            $(this).find($('.month-cal-input')).click();
        });
    };

    ui.bubbleError = function () {
        $('.'+conf.errorViewClass).show();
        setTimeout(function() {
            $('.'+conf.errorViewClass).fadeOut();
        }, 5000);
    };

    ui.styleTable = function () {
        $('.'+conf.itemListClass).on('click', '.'+conf.itemClass, function (e) {
            $(this).toggleClass('item-open');
            $(this).children('.' + conf.itemDescClass).toggle();
            $(this).find($('.' + conf.itemEditClass)).toggle();
            $(this).find($('.' + conf.itemDeleteClass)).toggleClass('item-action-red');
        });

        $('.'+conf.itemListClass).on('click', '.item-action', function(e) {
            e.stopPropagation();
        });

        $('.'+conf.searchBarClass).on('click', '.toggle-all', function(e) {
            var self = this;
            $('.'+conf.itemClass).each(function (i, obj) {
                if($(self).hasClass('open')) {
                    if(!$(this).hasClass('item-open'))
                        $(this).click();
                } else {
                    if($(this).hasClass('item-open'))
                        $(this).click();
                }
            });
            $(this).toggleClass('open');
            $(this).toggleClass('glyphicon-resize-small');
        });


    };

    ui.setDropDown = function () {
        $(".dropdown-toggle").click(function() {
            $(this).find('.arrow').toggleClass("glyphicon-chevron-up");
            $(this).find('.arrow').toggleClass("glyphicon-chevron-down");
            if ($(this).data('toggle'))
                $('#'+$(this).data('toggle')).toggle();
        });
    };

    ui.setDestAutoComplete = function ($scope) {
        var timeout;
        $('.'+conf.destInputId).on('keyup', function(e) {
            if(timeout)
                clearTimeout(timeout);
            var text = $(this).val();
            var autoCompleteId = $(this).data('toggle');
            timeout = setTimeout(function () {
                $http.jsonp("http://gd.geobytes.com/AutoCompleteCity?callback=JSON_CALLBACK&q=" + text)
                    .success(function (data) {
                        if(!data || data.length == 0 || data[0] == '%s') {
                            $scope[autoCompleteId] = null;
                            $('#'+autoCompleteId).hide();
                        }
                        else {
                            $scope[autoCompleteId] = data;
                            $('#'+autoCompleteId).show();
                        }
                    });
            }, 1000);

        });

        $('.custom-drop-down').on('click', '.hideOnClick', function(e) {
            $(this).closest('.custom-drop-down').hide();
        });
    };

    ui.printTable = function() {
        $('.'+conf.itemListClass).printThis({
            loadCSS: "css/print.css"
        });
    };

    if(!$){
        throw new Error('Jquery not loaded');
    }

    return ui;
});

Date.prototype.addDays = function(days) {
    var dat = new Date(this.valueOf())
    dat.setDate(dat.getDate() + days);
    return dat;
};

function getStartDates(trips) {
    var dates = [];
    for(var d in trips) {
        getDates(new Date(trips[d].start), new Date(trips[d].end), dates);
    }

    return dates;
}

function getDates(startDate, stopDate, dateArray) {

    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push( new Date (currentDate) )
        currentDate = currentDate.addDays(1);
    }
}